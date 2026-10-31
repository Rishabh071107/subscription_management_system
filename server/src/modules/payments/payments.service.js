import * as PaymentsModel from './payments.model.js';
import prisma from '../../config/db.js';

const VALID_METHODS = ['CASH', 'CARD', 'BANK_TRANSFER', 'UPI', 'OTHER'];

const generatePaymentNumber = async () => {
  const year = new Date().getFullYear();
  const count = await PaymentsModel.countPaymentsForYear(year);
  const nextNum = (count + 1).toString().padStart(4, '0');
  return `PAY-${year}-${nextNum}`;
};

export const listPayments = async ({ page = 1, limit = 10, customerId, invoiceId, paymentMethod }, currentUser) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  // Customer data isolation
  let filterCustomerId = customerId;
  if (currentUser.role === 'CUSTOMER') {
    filterCustomerId = currentUser.id;
  }

  const { total, payments } = await PaymentsModel.findPayments({
    skip,
    take: limitNum,
    customerId: filterCustomerId,
    invoiceId,
    paymentMethod
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

  if (currentUser.role === 'CUSTOMER' && payment.customerId !== currentUser.id) {
    const error = new Error('Unauthorized to view this payment');
    error.statusCode = 403;
    throw error;
  }

  return payment;
};

export const recordPayment = async (paymentData, currentUser) => {
  const { invoiceId, amount, paymentMethod = 'BANK_TRANSFER', referenceNote, transactionId, paymentDate } = paymentData;

  if (!invoiceId) {
    const error = new Error('Invoice ID is required');
    error.statusCode = 400;
    throw error;
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    const error = new Error('Payment amount must be a positive number');
    error.statusCode = 400;
    throw error;
  }

  if (!VALID_METHODS.includes(paymentMethod)) {
    const error = new Error(`Payment method must be one of: ${VALID_METHODS.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

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
  const newAmountPaid = Math.round((Number(invoice.amountPaid) + parsedAmount) * 100) / 100;
  const newOutstanding = Math.max(0, Math.round((outstanding - parsedAmount) * 100) / 100);
  const newStatus = newOutstanding <= 0 ? 'PAID' : 'PARTIALLY_PAID';

  // Perform inside database transaction
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        paymentNumber,
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        recordedById: currentUser.id,
        paymentMethod,
        amount: parsedAmount,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        referenceNote: referenceNote ? referenceNote.trim() : null,
        transactionId: transactionId ? transactionId.trim() : null
      },
      include: {
        customer: true,
        invoice: true
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
};
