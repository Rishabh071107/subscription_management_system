import * as InvoicesModel from './invoices.model.js';
import prisma from '../../config/db.js';

export const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const count = await InvoicesModel.countInvoicesForYear(year);
  const nextNum = (count + 1).toString().padStart(4, '0');
  return `INV-${year}-${nextNum}`;
};

export const listInvoices = async ({ page = 1, limit = 10, customerId, subscriptionId, status, search }, currentUser) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  // Strict Customer data isolation
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

  // Dynamically flag overdue status if past due date, unpaid, and not cancelled
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

  // Strict customer isolation check
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

  const periodEnd = options.billingPeriodEnd
    ? new Date(options.billingPeriodEnd)
    : new Date(periodStart);

  if (!options.billingPeriodEnd) {
    if (subscription.billingInterval === 'DAILY') {
      periodEnd.setDate(periodEnd.getDate() + 1);
    } else if (subscription.billingInterval === 'WEEKLY') {
      periodEnd.setDate(periodEnd.getDate() + 7);
    } else if (subscription.billingInterval === 'MONTHLY') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else if (subscription.billingInterval === 'YEARLY') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }
  }

  // IDEMPOTENCY RULE: Prevent duplicate invoices for the same subscription & billing period
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
 * Create a manual invoice with custom line items
 */
export const createManualInvoice = async (data, currentUser) => {
  const customer = await prisma.user.findUnique({
    where: { id: data.customerId }
  });

  if (!customer) {
    const error = new Error('Customer not found');
    error.statusCode = 404;
    throw error;
  }

  const invoiceNumber = await generateInvoiceNumber();
  const issueDate = data.issueDate ? new Date(data.issueDate) : new Date();
  const dueDate = new Date(data.dueDate);
  const periodStart = data.billingPeriodStart ? new Date(data.billingPeriodStart) : issueDate;
  const periodEnd = data.billingPeriodEnd ? new Date(data.billingPeriodEnd) : dueDate;

  let overallSubtotal = 0;
  let overallTax = 0;

  const invoiceLines = data.lines.map(line => {
    const quantity = parseInt(line.quantity, 10) || 1;
    const unitPrice = parseFloat(line.unitPrice) || 0;
    const taxRate = parseFloat(line.taxRate !== undefined ? line.taxRate : 18.00);
    const subtotal = Math.round(quantity * unitPrice * 100) / 100;
    const tax = Math.round(subtotal * (taxRate / 100) * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    overallSubtotal += subtotal;
    overallTax += tax;

    return {
      productId: line.productId || null,
      variantId: line.variantId || null,
      description: line.description,
      quantity,
      unitPrice,
      taxRate,
      subtotal,
      total
    };
  });

  const discountAmount = parseFloat(data.discountAmount) || 0;
  const total = Math.max(0, Math.round((overallSubtotal + overallTax - discountAmount) * 100) / 100);

  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        customerId: data.customerId,
        subscriptionId: data.subscriptionId || null,
        billingPeriodStart: periodStart,
        billingPeriodEnd: periodEnd,
        issueDate,
        dueDate,
        status: data.status || 'DRAFT',
        subtotal: overallSubtotal,
        taxRate: data.taxRate !== undefined ? parseFloat(data.taxRate) : 18.00,
        taxAmount: overallTax,
        discountAmount,
        total,
        amountPaid: 0,
        outstandingAmount: total,
        notes: data.notes || null,
        lines: {
          create: invoiceLines
        }
      },
      include: {
        customer: true,
        lines: true
      }
    });

    if (currentUser?.id) {
      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'INVOICE_CREATED',
          entityType: 'Invoice',
          entityId: invoice.id,
          details: `Manual invoice ${invoiceNumber} created for ${customer.email} total: $${total}`
        }
      });
    }

    return invoice;
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

export const updateInvoiceStatus = async (id, status, currentUser) => {
  const existing = await InvoicesModel.findInvoiceById(id);
  if (!existing) {
    const error = new Error('Invoice not found');
    error.statusCode = 404;
    throw error;
  }

  const updated = await InvoicesModel.updateInvoice(id, { status });

  if (currentUser?.id) {
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'INVOICE_STATUS_UPDATED',
        entityType: 'Invoice',
        entityId: id,
        details: `Invoice ${existing.invoiceNumber} status updated from ${existing.status} to ${status}`
      }
    });
  }

  return updated;
};

export const confirmInvoice = async (id, currentUser) => {
  const existing = await InvoicesModel.findInvoiceById(id);
  if (!existing) {
    const error = new Error('Invoice not found');
    error.statusCode = 404;
    throw error;
  }

  if (existing.status === 'CONFIRMED') {
    return existing;
  }

  if (existing.status === 'CANCELLED') {
    const error = new Error('Cannot confirm a cancelled invoice');
    error.statusCode = 400;
    throw error;
  }

  if (existing.status === 'PAID') {
    const error = new Error('Invoice is already fully paid');
    error.statusCode = 400;
    throw error;
  }

  return updateInvoiceStatus(id, 'CONFIRMED', currentUser);
};

export const cancelInvoice = async (id, currentUser) => {
  const existing = await InvoicesModel.findInvoiceById(id);
  if (!existing) {
    const error = new Error('Invoice not found');
    error.statusCode = 404;
    throw error;
  }

  if (existing.status === 'CANCELLED') {
    return existing;
  }

  if (existing.status === 'PAID' || Number(existing.amountPaid) > 0) {
    const error = new Error('Cannot cancel an invoice with recorded payments. Please issue a credit note or refund.');
    error.statusCode = 400;
    throw error;
  }

  return updateInvoiceStatus(id, 'CANCELLED', currentUser);
};

export const sendInvoice = async (id, currentUser) => {
  const existing = await InvoicesModel.findInvoiceById(id);
  if (!existing) {
    const error = new Error('Invoice not found');
    error.statusCode = 404;
    throw error;
  }

  if (currentUser?.id) {
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'INVOICE_SENT',
        entityType: 'Invoice',
        entityId: id,
        details: `Invoice ${existing.invoiceNumber} marked as sent to customer ${existing.customer?.email}`
      }
    });
  }

  return { success: true, message: `Invoice ${existing.invoiceNumber} sent successfully.` };
};

/**
 * Generate printable HTML invoice representation following DealFlow360 design tokens
 */
export const generateInvoiceHtml = async (id, currentUser) => {
  const invoice = await getInvoiceById(id, currentUser);
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice ${invoice.invoiceNumber} | Brightloop</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Inter:wght@400;500;600&family=Outfit:wght@600;700;800&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #212529;
          margin: 0;
          padding: 40px;
          background: #FFFFFF;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #714B67;
          padding-bottom: 24px;
        }
        .logo-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo-title {
          font-family: 'Outfit', sans-serif;
          font-size: 24px;
          font-weight: 800;
          color: #714B67;
        }
        .inv-details {
          text-align: right;
        }
        .inv-details h1 {
          font-family: 'Outfit', sans-serif;
          font-size: 26px;
          margin: 0 0 6px 0;
          color: #714B67;
        }
        .inv-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 9999px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          background-color: #F3E9F1;
          color: #714B67;
        }
        .addresses {
          display: flex;
          justify-content: space-between;
          margin: 32px 0;
          gap: 24px;
        }
        .address-box {
          flex: 1;
          background-color: #F8F9FA;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 18px;
        }
        .address-box h3 {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          text-transform: uppercase;
          color: #6C757D;
          letter-spacing: 0.5px;
          margin-top: 0;
          margin-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 24px;
        }
        th, td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #E5E7EB;
          font-size: 14px;
        }
        th {
          font-family: 'DM Sans', sans-serif;
          background-color: #F8F9FA;
          color: #374151;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 0.5px;
        }
        td.numeric, th.numeric {
          text-align: right;
          font-family: 'Space Grotesk', monospace;
          font-variant-numeric: tabular-nums;
        }
        .totals-section {
          margin-top: 24px;
          display: flex;
          justify-content: flex-end;
        }
        .totals-box {
          width: 320px;
          background: #FDFBFC;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 18px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
          font-size: 14px;
        }
        .total-row span:last-child {
          font-family: 'Space Grotesk', monospace;
          font-variant-numeric: tabular-nums;
          font-weight: 600;
        }
        .total-bold {
          font-weight: 700;
          font-size: 18px;
          color: #714B67;
          border-top: 2px solid #714B67;
          padding-top: 10px;
          margin-top: 10px;
        }
        .footer {
          margin-top: 50px;
          border-top: 1px solid #E5E7EB;
          padding-top: 16px;
          font-size: 12px;
          color: #6C757D;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-wrap">
          <svg width="34" height="34" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="10" fill="#714B67" />
            <circle cx="24" cy="24" r="14" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="22 8" />
            <circle cx="24" cy="24" r="6" fill="#FFFFFF" />
          </svg>
          <div>
            <div class="logo-title">Brightloop Software</div>
            <p style="margin: 2px 0 0; color: #6C757D; font-size: 12px;">Enterprise Recurring Billing Platform</p>
          </div>
        </div>
        <div class="inv-details">
          <h1>INVOICE</h1>
          <p style="margin: 0; font-family: 'Space Grotesk', monospace; font-size: 15px; font-weight: 700;"># ${invoice.invoiceNumber}</p>
          <div style="margin-top: 6px;">
            <span class="inv-badge">${invoice.displayStatus || invoice.status}</span>
          </div>
        </div>
      </div>

      <div class="addresses">
        <div class="address-box">
          <h3>Billed To:</h3>
          <p style="margin: 0; font-size: 15px; font-weight: 600;">${invoice.customer.firstName} ${invoice.customer.lastName}</p>
          <p style="margin: 4px 0 0; color: #6C757D; font-size: 13px;">${invoice.customer.email}</p>
          <p style="margin: 2px 0 0; color: #6C757D; font-size: 13px;">${invoice.customer.phone || 'Phone: Not provided'}</p>
        </div>

        <div class="address-box">
          <h3>Billing Details:</h3>
          <p style="margin: 0; font-size: 13px;"><strong>Issue Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</p>
          <p style="margin: 4px 0 0; font-size: 13px;"><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
          <p style="margin: 4px 0 0; font-size: 13px;"><strong>Billing Period:</strong> ${new Date(invoice.billingPeriodStart).toLocaleDateString()} &ndash; ${new Date(invoice.billingPeriodEnd).toLocaleDateString()}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th class="numeric">Qty</th>
            <th class="numeric">Unit Price</th>
            <th class="numeric">Tax Rate</th>
            <th class="numeric">Total</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.lines.map(line => `
            <tr>
              <td>${line.description}</td>
              <td class="numeric">${line.quantity}</td>
              <td class="numeric">$${Number(line.unitPrice).toFixed(2)}</td>
              <td class="numeric">${Number(line.taxRate).toFixed(1)}%</td>
              <td class="numeric">$${Number(line.total).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals-section">
        <div class="totals-box">
          <div class="total-row"><span>Subtotal:</span><span>$${Number(invoice.subtotal).toFixed(2)}</span></div>
          <div class="total-row"><span>Tax Amount:</span><span>$${Number(invoice.taxAmount).toFixed(2)}</span></div>
          <div class="total-row"><span>Discount:</span><span>-$${Number(invoice.discountAmount).toFixed(2)}</span></div>
          <div class="total-row total-bold"><span>Total Due:</span><span>$${Number(invoice.total).toFixed(2)}</span></div>
          <div class="total-row"><span>Amount Paid:</span><span style="color: #059669;">$${Number(invoice.amountPaid).toFixed(2)}</span></div>
          <div class="total-row" style="font-weight: 700; color: ${Number(invoice.outstandingAmount) > 0 ? '#DC2626' : '#059669'};">
            <span>Outstanding Balance:</span><span>$${Number(invoice.outstandingAmount).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>Thank you for doing business with Brightloop. For billing questions, contact billing@brightloop.io.</p>
      </div>
    </body>
    </html>
  `;
};
