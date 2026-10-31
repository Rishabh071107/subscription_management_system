import * as PaymentsModel from './payments.model.js';
import { validateRecordPayment, validatePaymentQuery } from './payments.validation.js';
import prisma from '../../config/db.js';
import * as NotificationsService from '../notifications/notifications.service.js';

const VALID_METHODS = ['CASH', 'CARD', 'BANK_TRANSFER', 'UPI', 'OTHER'];

const generatePaymentNumber = async () => {
  const year = new Date().getFullYear();
  const count = await PaymentsModel.countPaymentsForYear(year);
  const nextNum = (count + 1).toString().padStart(4, '0');
  return `PAY-${year}-${nextNum}`;
};

export const listPayments = async (query = {}, currentUser) => {
  validatePaymentQuery(query);

  const {
    page = 1,
    limit = 10,
    customerId,
    invoiceId,
    paymentMethod,
    startDate,
    endDate
  } = query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  // Customer data isolation: customer can only ever see their own payments
  let filterCustomerId = customerId;
  if (currentUser.role === 'CUSTOMER') {
    filterCustomerId = currentUser.id;
  }

  const { total, payments } = await PaymentsModel.findPayments({
    skip,
    take: limitNum,
    customerId: filterCustomerId,
    invoiceId,
    paymentMethod,
    startDate,
    endDate
  });

  return {
    payments,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

export const getPaymentById = async (id, currentUser) => {
  const payment = await PaymentsModel.findPaymentById(id);
  if (!payment) {
    const error = new Error('Payment not found');
    error.statusCode = 404;
    throw error;
  }

  // Customer data isolation
  if (currentUser.role === 'CUSTOMER' && payment.customerId !== currentUser.id) {
    const error = new Error('Unauthorized to view this payment');
    error.statusCode = 403;
    throw error;
  }

  return payment;
};

export const getPaymentsByInvoiceId = async (invoiceId, currentUser) => {
  if (!invoiceId) {
    const error = new Error('Invoice ID is required');
    error.statusCode = 400;
    throw error;
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId }
  });

  if (!invoice) {
    const error = new Error('Invoice not found');
    error.statusCode = 404;
    throw error;
  }

  if (currentUser.role === 'CUSTOMER' && invoice.customerId !== currentUser.id) {
    const error = new Error('Unauthorized to view payments for this invoice');
    error.statusCode = 403;
    throw error;
  }

  return PaymentsModel.findPaymentsByInvoiceId(invoiceId);
};

export const recordPayment = async (paymentData, currentUser) => {
  validateRecordPayment(paymentData);

  const {
    invoiceId,
    amount,
    paymentMethod = 'BANK_TRANSFER',
    referenceNote,
    note,
    transactionId,
    paymentDate
  } = paymentData;

  const parsedAmount = Math.round(parseFloat(amount) * 100) / 100;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { customer: true }
  });

  if (!invoice) {
    const error = new Error('Invoice not found');
    error.statusCode = 404;
    throw error;
  }

  if (invoice.status === 'CANCELLED') {
    const error = new Error('Cannot record payments against a cancelled invoice');
    error.statusCode = 400;
    throw error;
  }

  if (invoice.status === 'PAID') {
    const error = new Error('This invoice is already fully paid');
    error.statusCode = 400;
    throw error;
  }

  const outstanding = Number(invoice.outstandingAmount);

  // CRITICAL RULE: Prevent payments greater than outstanding amount
  if (parsedAmount > outstanding) {
    const error = new Error(
      `Payment amount ($${parsedAmount.toFixed(2)}) cannot exceed the outstanding balance ($${outstanding.toFixed(2)})`
    );
    error.statusCode = 400;
    throw error;
  }

  const paymentNumber = await generatePaymentNumber();
  const currentPaid = Number(invoice.amountPaid);
  const newAmountPaid = Math.round((currentPaid + parsedAmount) * 100) / 100;
  const newOutstanding = Math.max(0, Math.round((outstanding - parsedAmount) * 100) / 100);
  const newStatus = newOutstanding <= 0.001 ? 'PAID' : 'PARTIALLY_PAID';

  const finalReferenceNote = (referenceNote || note || '').trim() || null;
  const finalTransactionId = transactionId ? transactionId.trim() : null;

  // Perform inside atomic database transaction
  const recordedPayment = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        paymentNumber,
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        recordedById: currentUser.id,
        paymentMethod,
        amount: parsedAmount,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        referenceNote: finalReferenceNote,
        transactionId: finalTransactionId
      },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        invoice: {
          select: { id: true, invoiceNumber: true, total: true, amountPaid: true, outstandingAmount: true, status: true }
        },
        recordedBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        amountPaid: newAmountPaid,
        outstandingAmount: newOutstanding,
        status: newStatus
      }
    });

    return payment;
  });

  // Dispatch payment confirmation notification via provider abstraction
  try {
    await NotificationsService.sendPaymentConfirmationNotification(recordedPayment, invoice, invoice.customer);
  } catch (notifErr) {
    console.warn('Payment confirmation notification delivery warning:', notifErr.message);
  }

  return recordedPayment;
};
