import * as NotificationsModel from './notifications.model.js';
import { defaultEmailProvider } from './emailProvider.js';
import { validateNotificationsQuery } from './notifications.validation.js';

/**
 * Dispatch an email notification and maintain audit trail
 */
export const dispatchNotification = async ({
  userId = null,
  recipient,
  type,
  subject,
  body,
  metadata = {}
}) => {
  // 1. Create Pending Notification Record
  let notificationRecord;
  try {
    notificationRecord = await NotificationsModel.createNotification({
      userId,
      recipient,
      type,
      subject,
      body,
      status: 'PENDING',
      metadata
    });
  } catch (dbErr) {
    console.error('Failed to create notification audit record:', dbErr.message);
    return { success: false, error: dbErr.message };
  }

  // 2. Dispatch Email via Provider Abstraction
  try {
    const result = await defaultEmailProvider.sendMail({
      to: recipient,
      subject,
      html: body,
      text: body
    });

    if (result.success) {
      const updated = await NotificationsModel.updateNotificationStatus(notificationRecord.id, {
        status: 'SENT',
        sentAt: new Date(),
        metadata: { ...metadata, messageId: result.messageId, provider: result.provider }
      });
      return { success: true, notification: updated };
    } else {
      const failed = await NotificationsModel.updateNotificationStatus(notificationRecord.id, {
        status: 'FAILED',
        sentAt: null,
        metadata: { ...metadata, error: result.error, provider: result.provider }
      });
      return { success: false, notification: failed, error: result.error };
    }
  } catch (dispatchErr) {
    console.error('Email dispatch failure:', dispatchErr.message);
    const failed = await NotificationsModel.updateNotificationStatus(notificationRecord.id, {
      status: 'FAILED',
      sentAt: null,
      metadata: { ...metadata, error: dispatchErr.message }
    });
    return { success: false, notification: failed, error: dispatchErr.message };
  }
};

/**
 * Send an invoice email notification
 */
export const sendInvoiceNotification = async (invoice, currentUser) => {
  if (!invoice || !invoice.customer?.email) return null;

  const recipient = invoice.customer.email;
  const subject = `Invoice ${invoice.invoiceNumber} from Brightloop`;
  const formattedTotal = Number(invoice.total).toFixed(2);
  const formattedDueDate = new Date(invoice.dueDate).toLocaleDateString();

  const body = `
Dear ${invoice.customer.firstName || 'Valued Customer'},

Your invoice statement ${invoice.invoiceNumber} has been generated.

Invoice Details:
- Invoice Number: ${invoice.invoiceNumber}
- Due Date: ${formattedDueDate}
- Total Amount: $${formattedTotal}
- Status: ${invoice.status}

You can view and settle this statement directly through your Brightloop Customer Portal.

Thank you,
Brightloop Billing Team
  `.trim();

  return dispatchNotification({
    userId: invoice.customerId,
    recipient,
    type: 'INVOICE_SENT',
    subject,
    body,
    metadata: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      total: invoice.total,
      sentBy: currentUser?.id || 'system'
    }
  });
};

/**
 * Send payment confirmation notification
 */
export const sendPaymentConfirmationNotification = async (payment, invoice, customer) => {
  const recipient = customer?.email || invoice?.customer?.email;
  if (!recipient) return null;

  const subject = `Payment Confirmation: ${payment.paymentNumber} for Invoice ${invoice.invoiceNumber}`;
  const amountPaid = Number(payment.amount).toFixed(2);
  const remainingDue = Math.max(0, Number(invoice.total) - (Number(invoice.amountPaid) + Number(payment.amount))).toFixed(2);

  const body = `
Dear ${customer?.firstName || 'Valued Customer'},

We have successfully recorded your payment of $${amountPaid} for invoice ${invoice.invoiceNumber}.

Payment Summary:
- Receipt / Payment Number: ${payment.paymentNumber}
- Invoice Number: ${invoice.invoiceNumber}
- Amount Paid: $${amountPaid}
- Payment Method: ${payment.paymentMethod}
- Date: ${new Date(payment.paymentDate || Date.now()).toLocaleDateString()}
- Remaining Balance: $${remainingDue}

Thank you for your prompt payment!

Sincerely,
Brightloop Finance
  `.trim();

  return dispatchNotification({
    userId: customer?.id || invoice?.customerId,
    recipient,
    type: 'PAYMENT_CONFIRMED',
    subject,
    body,
    metadata: {
      paymentId: payment.id,
      paymentNumber: payment.paymentNumber,
      invoiceId: invoice.id,
      amount: payment.amount
    }
  });
};

/**
 * Send overdue collection reminder notification
 */
export const sendOverdueReminderNotification = async (invoice, customer) => {
  const recipient = customer?.email || invoice?.customer?.email;
  if (!recipient) return null;

  const subject = `Urgent Reminder: Invoice ${invoice.invoiceNumber} is Overdue`;
  const formattedTotal = Number(invoice.total).toFixed(2);
  const formattedDueDate = new Date(invoice.dueDate).toLocaleDateString();

  const body = `
Dear ${customer?.firstName || 'Valued Customer'},

This is a reminder that invoice ${invoice.invoiceNumber} for the amount of $${formattedTotal} was due on ${formattedDueDate} and remains unpaid.

Please log in to your Brightloop Customer Portal to review and settle this invoice to avoid service interruption.

If you have already submitted payment, please disregard this notice.

Sincerely,
Brightloop Collections Department
  `.trim();

  return dispatchNotification({
    userId: customer?.id || invoice?.customerId,
    recipient,
    type: 'OVERDUE_NOTICE',
    subject,
    body,
    metadata: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      dueDate: invoice.dueDate,
      total: invoice.total
    }
  });
};

/**
 * List notifications with strict role-based isolation
 */
export const listNotifications = async (query = {}, currentUser) => {
  validateNotificationsQuery(query);

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  // Strict Customer Isolation: Customers only see their own notifications
  let filterUserId = query.userId;
  if (currentUser.role === 'CUSTOMER') {
    filterUserId = currentUser.id;
  }

  const { total, notifications } = await NotificationsModel.findNotifications({
    skip,
    take: limit,
    userId: filterUserId,
    recipient: currentUser.role === 'CUSTOMER' ? currentUser.email : query.recipient,
    type: query.type,
    status: query.status,
    search: query.search
  });

  return {
    notifications,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
};

/**
 * Get notification details with strict ownership verification
 */
export const getNotificationById = async (id, currentUser) => {
  const notification = await NotificationsModel.findNotificationById(id);

  if (!notification) {
    const error = new Error('Notification not found');
    error.statusCode = 404;
    throw error;
  }

  // Strict Ownership check for Customers
  if (currentUser.role === 'CUSTOMER') {
    const isOwner = notification.userId === currentUser.id || notification.recipient === currentUser.email;
    if (!isOwner) {
      const error = new Error('Forbidden: You do not have permission to view this notification');
      error.statusCode = 403;
      throw error;
    }
  }

  return notification;
};

