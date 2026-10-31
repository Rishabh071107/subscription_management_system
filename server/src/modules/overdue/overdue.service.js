import * as OverdueModel from './overdue.model.js';
import { validateOverdueQuery, validateAddFollowUp } from './overdue.validation.js';
import prisma from '../../config/db.js';

export const listOverdueInvoices = async (query = {}, currentUser) => {
  validateOverdueQuery(query);

  const {
    page = 1,
    limit = 10,
    customerId,
    bucket,
    dueStartDate,
    dueEndDate
  } = query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  // Customer data isolation
  let filterCustomerId = customerId;
  if (currentUser.role === 'CUSTOMER') {
    filterCustomerId = currentUser.id;
  }

  const { total, invoices } = await OverdueModel.findOverdueInvoices({
    skip,
    take: limitNum,
    customerId: filterCustomerId,
    bucket,
    dueStartDate,
    dueEndDate
  });

  return {
    invoices,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

export const getOverdueSummary = async (query = {}, currentUser) => {
  let customerId = query.customerId || null;
  if (currentUser.role === 'CUSTOMER') {
    customerId = currentUser.id;
  }

  return OverdueModel.getOverdueSummary(customerId);
};

export const getOverdueInvoiceById = async (id, currentUser) => {
  const invoice = await OverdueModel.findOverdueInvoiceById(id);
  if (!invoice) {
    const error = new Error('Invoice not found');
    error.statusCode = 404;
    throw error;
  }

  // Customer data isolation
  if (currentUser.role === 'CUSTOMER' && invoice.customerId !== currentUser.id) {
    const error = new Error('Unauthorized to view this overdue invoice');
    error.statusCode = 403;
    throw error;
  }

  return invoice;
};

export const recordFollowUpNote = async (id, data, currentUser) => {
  validateAddFollowUp(data);

  const invoice = await prisma.invoice.findUnique({
    where: { id }
  });

  if (!invoice) {
    const error = new Error('Invoice not found');
    error.statusCode = 404;
    throw error;
  }

  const log = await OverdueModel.addFollowUpLog(id, data.note, currentUser);

  // Append note to invoice notes for persistence
  const timestamp = new Date().toISOString().split('T')[0];
  const author = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'Staff';
  const appendedNote = `[${timestamp} Follow-Up by ${author}]: ${data.note.trim()}`;
  const updatedNotes = invoice.notes ? `${invoice.notes}\n${appendedNote}` : appendedNote;

  await prisma.invoice.update({
    where: { id },
    data: { notes: updatedNotes }
  });

  return log;
};

export const syncOverdueStatuses = async () => {
  const count = await OverdueModel.syncOverdueStatuses();
  return { updatedCount: count };
};
