import * as BillingModel from './billing.model.js';
import * as InvoicesModel from '../invoices/invoices.model.js';
import { generateInvoiceNumber } from '../invoices/invoices.service.js';
import prisma from '../../config/db.js';

export const calculatePeriodEnd = (periodStart, interval) => {
  const end = new Date(periodStart);
  switch (interval) {
    case 'DAILY':
      end.setDate(end.getDate() + 1);
      break;
    case 'WEEKLY':
      end.setDate(end.getDate() + 7);
      break;
    case 'MONTHLY':
      end.setMonth(end.getMonth() + 1);
      break;
    case 'YEARLY':
      end.setFullYear(end.getFullYear() + 1);
      break;
    default:
      end.setMonth(end.getMonth() + 1);
  }
  return end;
};

export const executeBillingRun = async (currentUser, targetDate = new Date()) => {
  const billingRun = await BillingModel.createBillingRun();

  const dueSubscriptions = await BillingModel.findDueSubscriptions(targetDate);

  let successCount = 0;
  let failureCount = 0;
  const errors = [];

  for (const subscription of dueSubscriptions) {
    // 1. Business Safeguard: Do not generate invoices for paused, closed or draft subscriptions
    if (['PAUSED', 'CLOSED', 'DRAFT'].includes(subscription.status)) {
      await BillingModel.createBillingRunItem({
        billingRunId: billingRun.id,
        subscriptionId: subscription.id,
        status: 'SKIPPED',
        errorMessage: `Subscription is in ${subscription.status} status`
      });
      continue;
    }

    // 2. Calculate period boundaries
    const periodStart = subscription.nextBillingDate
      ? new Date(subscription.nextBillingDate)
      : new Date(subscription.startDate);

    const periodEnd = calculatePeriodEnd(periodStart, subscription.billingInterval);

    // 3. Idempotency Check: Prevent duplicate invoice for the same subscription and billing period
    const existingInvoice = await InvoicesModel.findExistingInvoiceForPeriod(
      subscription.id,
      periodStart,
      periodEnd
    );

    if (existingInvoice) {
      await BillingModel.createBillingRunItem({
        billingRunId: billingRun.id,
        subscriptionId: subscription.id,
        invoiceId: existingInvoice.id,
        status: 'SKIPPED',
        errorMessage: `Invoice ${existingInvoice.invoiceNumber} already exists for this billing period`
      });
      continue;
    }

    // 4. Atomic Execution inside Transaction
    try {
      const createdInvoice = await prisma.$transaction(async (tx) => {
        const issueDate = new Date();
        const dueDate = new Date(issueDate);
        if (subscription.paymentTerms === 'Net 30') {
          dueDate.setDate(dueDate.getDate() + 30);
        } else if (subscription.paymentTerms === 'Net 15') {
          dueDate.setDate(dueDate.getDate() + 15);
        } else {
          dueDate.setDate(dueDate.getDate() + 7);
        }

        let overallSubtotal = 0;
        let overallTax = 0;

        const invoiceLines = subscription.lines.map((line) => {
          const subtotal = Number(line.subtotal);
          const tax = Math.round(subtotal * (Number(line.taxRate) / 100) * 100) / 100;
          const total = Math.round((subtotal + tax) * 100) / 100;

          overallSubtotal += subtotal;
          overallTax += tax;

          const desc = `${line.product?.name || 'Service'}${line.variant ? ` (${line.variant.name})` : ''} - Recurring Period`;

          return {
            productId: line.productId,
            variantId: line.variantId,
            description: desc,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            taxRate: line.taxRate,
            subtotal,
            total
          };
        });

        const discountAmount = Number(subscription.discountAmount) || 0;
        const total = Math.max(0, Math.round((overallSubtotal + overallTax - discountAmount) * 100) / 100);

        const invoiceNumber = await generateInvoiceNumber();

        const inv = await tx.invoice.create({
          data: {
            invoiceNumber,
            customerId: subscription.customerId,
            subscriptionId: subscription.id,
            billingPeriodStart: periodStart,
            billingPeriodEnd: periodEnd,
            issueDate,
            dueDate,
            status: 'CONFIRMED',
            subtotal: overallSubtotal,
            taxRate: subscription.taxRate,
            taxAmount: overallTax,
            discountAmount,
            total,
            amountPaid: 0,
            outstandingAmount: total,
            notes: `Automated recurring billing run ${billingRun.id.slice(0, 8)}`,
            lines: {
              create: invoiceLines
            }
          }
        });

        // Advance subscription nextBillingDate
        await tx.subscription.update({
          where: { id: subscription.id },
          data: {
            nextBillingDate: periodEnd
          }
        });

        return inv;
      });

      // Record successful item
      await BillingModel.createBillingRunItem({
        billingRunId: billingRun.id,
        subscriptionId: subscription.id,
        invoiceId: createdInvoice.id,
        status: 'SUCCESS'
      });

      successCount++;
    } catch (err) {
      failureCount++;
      errors.push(`Sub ${subscription.subscriptionNumber}: ${err.message}`);

      // Record failure for this specific subscription
      await BillingModel.createBillingRunItem({
        billingRunId: billingRun.id,
        subscriptionId: subscription.id,
        status: 'FAILED',
        errorMessage: err.message
      });
    }
  }

  // 5. Complete Billing Run
  const finalStatus = failureCount === 0 ? 'COMPLETED' : (successCount > 0 ? 'COMPLETED' : 'FAILED');

  const updatedRun = await BillingModel.updateBillingRun(billingRun.id, {
    status: finalStatus,
    completedAt: new Date(),
    processedCount: dueSubscriptions.length,
    successCount,
    failureCount,
    errorSummary: errors.length > 0 ? errors.slice(0, 5).join('; ') : null
  });

  if (currentUser?.id) {
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'BILLING_CYCLE_EXECUTED',
        entityType: 'BillingRun',
        entityId: billingRun.id,
        details: `Billing run executed. Evaluated: ${dueSubscriptions.length}, Success: ${successCount}, Failed: ${failureCount}`
      }
    });
  }

  return {
    billingRun: updatedRun,
    totalEvaluated: dueSubscriptions.length,
    generated: successCount,
    failed: failureCount,
    errors
  };
};

export const listBillingRuns = async ({ page = 1, limit = 10 }) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const { total, runs } = await BillingModel.findBillingRuns({ skip, take: limitNum });

  return {
    runs,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

export const getBillingRunById = async (id) => {
  const run = await BillingModel.findBillingRunById(id);
  if (!run) {
    const error = new Error('Billing run not found');
    error.statusCode = 404;
    throw error;
  }
  return run;
};

export const retryFailedItems = async (runId, currentUser) => {
  const run = await BillingModel.findBillingRunById(runId);
  if (!run) {
    const error = new Error('Billing run not found');
    error.statusCode = 404;
    throw error;
  }

  const failedItems = run.items.filter(item => item.status === 'FAILED');
  if (failedItems.length === 0) {
    return {
      message: 'No failed items to retry in this billing run',
      retriedCount: 0,
      successCount: 0
    };
  }

  let retriedSuccess = 0;
  for (const item of failedItems) {
    try {
      const sub = await prisma.subscription.findUnique({
        where: { id: item.subscriptionId },
        include: {
          customer: true,
          plan: true,
          lines: { include: { product: true, variant: true } }
        }
      });

      if (!sub || sub.status !== 'ACTIVE') continue;

      const periodStart = sub.nextBillingDate ? new Date(sub.nextBillingDate) : new Date(sub.startDate);
      const periodEnd = calculatePeriodEnd(periodStart, sub.billingInterval);

      // Check idempotency
      const existing = await InvoicesModel.findExistingInvoiceForPeriod(sub.id, periodStart, periodEnd);
      if (existing) {
        await prisma.billingRunItem.update({
          where: { id: item.id },
          data: { status: 'SKIPPED', invoiceId: existing.id, errorMessage: 'Invoice already exists' }
        });
        continue;
      }

      // Generate invoice
      const invoice = await prisma.$transaction(async (tx) => {
        const issueDate = new Date();
        const dueDate = new Date(issueDate);
        dueDate.setDate(dueDate.getDate() + 7);

        let overallSubtotal = 0;
        let overallTax = 0;

        const lines = sub.lines.map(line => {
          const subtotal = Number(line.subtotal);
          const tax = Math.round(subtotal * (Number(line.taxRate) / 100) * 100) / 100;
          overallSubtotal += subtotal;
          overallTax += tax;
          return {
            productId: line.productId,
            variantId: line.variantId,
            description: `${line.product?.name || 'Service'} - Retry Billing`,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            taxRate: line.taxRate,
            subtotal,
            total: subtotal + tax
          };
        });

        const discountAmount = Number(sub.discountAmount) || 0;
        const total = Math.max(0, Math.round((overallSubtotal + overallTax - discountAmount) * 100) / 100);
        const invoiceNumber = await generateInvoiceNumber();

        const inv = await tx.invoice.create({
          data: {
            invoiceNumber,
            customerId: sub.customerId,
            subscriptionId: sub.id,
            billingPeriodStart: periodStart,
            billingPeriodEnd: periodEnd,
            issueDate,
            dueDate,
            status: 'CONFIRMED',
            subtotal: overallSubtotal,
            taxRate: sub.taxRate,
            taxAmount: overallTax,
            discountAmount,
            total,
            amountPaid: 0,
            outstandingAmount: total,
            notes: `Retry billing run ${runId.slice(0, 8)}`,
            lines: { create: lines }
          }
        });

        await tx.subscription.update({
          where: { id: sub.id },
          data: { nextBillingDate: periodEnd }
        });

        return inv;
      });

      await prisma.billingRunItem.update({
        where: { id: item.id },
        data: {
          status: 'SUCCESS',
          invoiceId: invoice.id,
          errorMessage: null
        }
      });

      retriedSuccess++;
    } catch {
      // Retried item remains failed
    }
  }

  // Update run stats
  await BillingModel.updateBillingRun(runId, {
    successCount: run.successCount + retriedSuccess,
    failureCount: Math.max(0, run.failureCount - retriedSuccess)
  });

  return {
    message: `Retried ${failedItems.length} items. Successfully processed: ${retriedSuccess}`,
    retriedCount: failedItems.length,
    successCount: retriedSuccess
  };
};

