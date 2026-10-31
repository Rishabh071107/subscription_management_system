import * as InvoicesModel from './invoices.model.js';
import prisma from '../../config/db.js';

const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const count = await InvoicesModel.countInvoicesForYear(year);
  const nextNum = (count + 1).toString().padStart(4, '0');
  return `INV-${year}-${nextNum}`;
};

export const listInvoices = async ({ page = 1, limit = 10, customerId, subscriptionId, status, search }, currentUser) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  // Customer data isolation
  let filterCustomerId = customerId;
  if (currentUser.role === 'CUSTOMER') {
    filterCustomerId = currentUser.id;
  }

  const { total, invoices } = await InvoicesModel.findInvoices({
    skip,
    take: limitNum,
    customerId: filterCustomerId,
    subscriptionId,
    status,
    search
  });

  // Dynamically flag overdue status if past due date and unpaid
  const now = new Date();
  const processed = invoices.map(inv => {
    let currentStatus = inv.status;
    if (['DRAFT', 'CONFIRMED', 'PARTIALLY_PAID'].includes(inv.status) && new Date(inv.dueDate) < now) {
      currentStatus = 'OVERDUE';
    }
    return {
      ...inv,
      displayStatus: currentStatus
    };
  });

  return {
    invoices: processed,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

export const getInvoiceById = async (id, currentUser) => {
  const invoice = await InvoicesModel.findInvoiceById(id);
  if (!invoice) {
    const error = new Error('Invoice not found');
    error.statusCode = 404;
    throw error;
  }

  if (currentUser.role === 'CUSTOMER' && invoice.customerId !== currentUser.id) {
    const error = new Error('Unauthorized to view this invoice');
    error.statusCode = 403;
    throw error;
  }

  // Check overdue
  let currentStatus = invoice.status;
  if (['DRAFT', 'CONFIRMED', 'PARTIALLY_PAID'].includes(invoice.status) && new Date(invoice.dueDate) < new Date()) {
    currentStatus = 'OVERDUE';
  }

  return {
    ...invoice,
    displayStatus: currentStatus
  };
};

/**
 * Generates an invoice for a specific subscription and billing period
 * Enforces transaction safety and strict idempotency checks
 */
export const generateSubscriptionInvoice = async (subscriptionId, options = {}) => {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      customer: true,
      plan: true,
      lines: {
        include: {
          product: true,
          variant: true
        }
      }
    }
  });

  if (!subscription) {
    const error = new Error('Subscription not found');
    error.statusCode = 404;
    throw error;
  }

  // Business Rule: Do not generate invoices for paused or closed subscriptions
  if (['PAUSED', 'CLOSED', 'DRAFT'].includes(subscription.status)) {
    const error = new Error(`Cannot generate invoice for subscription in '${subscription.status}' state`);
    error.statusCode = 400;
    throw error;
  }

  // Determine period boundaries
  const periodStart = options.billingPeriodStart
    ? new Date(options.billingPeriodStart)
    : (subscription.nextBillingDate ? new Date(subscription.nextBillingDate) : new Date(subscription.startDate));

  const periodEnd = new Date(periodStart);
  if (subscription.billingInterval === 'DAILY') {
    periodEnd.setDate(periodEnd.getDate() + 1);
  } else if (subscription.billingInterval === 'WEEKLY') {
    periodEnd.setDate(periodEnd.getDate() + 7);
  } else if (subscription.billingInterval === 'MONTHLY') {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else if (subscription.billingInterval === 'YEARLY') {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }

  // IDEMPOTENCY RULE: Check if an invoice for this exact subscription & billing period already exists
  const existingInvoice = await InvoicesModel.findExistingInvoiceForPeriod(
    subscription.id,
    periodStart,
    periodEnd
  );

  if (existingInvoice) {
    const error = new Error(
      `An invoice (${existingInvoice.invoiceNumber}) already exists for this subscription and billing period`
    );
    error.statusCode = 409;
    throw error;
  }

  // Set issue date & due date
  const issueDate = new Date();
  const dueDate = new Date(issueDate);
  if (subscription.paymentTerms === 'Net 15') {
    dueDate.setDate(dueDate.getDate() + 15);
  } else if (subscription.paymentTerms === 'Net 30') {
    dueDate.setDate(dueDate.getDate() + 30);
  } else {
    dueDate.setDate(dueDate.getDate() + 7); // Default 7 days
  }

  // Calculate line items
  let overallSubtotal = 0;
  let overallTax = 0;

  const invoiceLines = subscription.lines.map(line => {
    const subtotal = Number(line.subtotal);
    const tax = Math.round(subtotal * (Number(line.taxRate) / 100) * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    overallSubtotal += subtotal;
    overallTax += tax;

    const desc = `${line.product?.name || 'Service'}${line.variant ? ` (${line.variant.name})` : ''} - Subscription Period`;

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

  // Atomically create invoice and advance nextBillingDate on subscription
  return prisma.$transaction(async (tx) => {
    const createdInvoice = await tx.invoice.create({
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
        notes: `Automated recurring invoice for period ${periodStart.toISOString().slice(0, 10)} to ${periodEnd.toISOString().slice(0, 10)}`,
        lines: {
          create: invoiceLines
        }
      },
      include: {
        customer: true,
        lines: true
      }
    });

    // Advance subscription nextBillingDate
    await tx.subscription.update({
      where: { id: subscription.id },
      data: {
        nextBillingDate: periodEnd
      }
    });

    return createdInvoice;
  });
};

/**
 * Scan active subscriptions and generate all due recurring invoices
 */
export const runBillingCycle = async () => {
  const now = new Date();
  const dueSubscriptions = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      nextBillingDate: {
        lte: now
      }
    }
  });

  const results = {
    totalEvaluated: dueSubscriptions.length,
    generated: [],
    errors: []
  };

  for (const sub of dueSubscriptions) {
    try {
      const invoice = await generateSubscriptionInvoice(sub.id);
      results.generated.push({
        subscriptionId: sub.id,
        invoiceNumber: invoice.invoiceNumber
      });
    } catch (err) {
      results.errors.push({
        subscriptionId: sub.id,
        error: err.message
      });
    }
  }

  return results;
};

export const updateInvoiceStatus = async (id, status) => {
  const existing = await InvoicesModel.findInvoiceById(id);
  if (!existing) {
    const error = new Error('Invoice not found');
    error.statusCode = 404;
    throw error;
  }

  return InvoicesModel.updateInvoice(id, { status });
};

/**
 * Generate printable HTML invoice representation
 */
export const generateInvoiceHtml = async (id, currentUser) => {
  const invoice = await getInvoiceById(id, currentUser);
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e1b4b; margin: 40px; background: #fff; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #7c3aed; padding-bottom: 20px; }
        .logo { font-size: 24px; font-weight: 800; color: #7c3aed; }
        .inv-details { text-align: right; }
        .section { margin: 25px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f5f3ff; color: #6d28d9; }
        .total-box { margin-left: auto; width: 300px; padding: 15px; background: #fdf4ff; border-radius: 8px; margin-top: 20px; }
        .total-row { display: flex; justify-content: space-between; margin: 8px 0; }
        .total-bold { font-weight: 800; font-size: 18px; color: #7c3aed; border-top: 1px solid #ddd; padding-top: 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">Brightloop Software</div>
          <p>Subscription Billing Services<br>billing@brightloop.io</p>
        </div>
        <div class="inv-details">
          <h2>INVOICE</h2>
          <p><strong># ${invoice.invoiceNumber}</strong><br>
          Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}<br>
          Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}<br>
          Status: <strong>${invoice.status}</strong></p>
        </div>
      </div>
      <div class="section">
        <h3>Billed To:</h3>
        <p><strong>${invoice.customer.firstName} ${invoice.customer.lastName}</strong><br>
        ${invoice.customer.email}<br>
        ${invoice.customer.phone || ''}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Tax</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.lines.map(line => `
            <tr>
              <td>${line.description}</td>
              <td>${line.quantity}</td>
              <td>$${Number(line.unitPrice).toFixed(2)}</td>
              <td>${Number(line.taxRate).toFixed(1)}%</td>
              <td>$${Number(line.total).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="total-box">
        <div class="total-row"><span>Subtotal:</span><span>$${Number(invoice.subtotal).toFixed(2)}</span></div>
        <div class="total-row"><span>Tax (${Number(invoice.taxRate)}%):</span><span>$${Number(invoice.taxAmount).toFixed(2)}</span></div>
        <div class="total-row"><span>Discount:</span><span>-$${Number(invoice.discountAmount).toFixed(2)}</span></div>
        <div class="total-row total-bold"><span>Total Due:</span><span>$${Number(invoice.total).toFixed(2)}</span></div>
        <div class="total-row"><span>Paid:</span><span>$${Number(invoice.amountPaid).toFixed(2)}</span></div>
        <div class="total-row"><span>Outstanding:</span><span>$${Number(invoice.outstandingAmount).toFixed(2)}</span></div>
      </div>
    </body>
    </html>
  `;
};
