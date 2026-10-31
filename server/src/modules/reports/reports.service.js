import * as ReportsModel from './reports.model.js';
import { validateReportQuery } from './reports.validation.js';

const escapeCsvField = (field) => {
  if (field === null || field === undefined) return '';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const getSubscriptionReport = async (query = {}, currentUser) => {
  validateReportQuery(query, 'subscription');

  const {
    page = 1,
    limit = 10,
    customerId,
    status,
    planId,
    startDate,
    endDate,
    export: exportType
  } = query;

  const isExport = exportType === 'csv';
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  // Customer data isolation
  let filterCustomerId = customerId;
  if (currentUser.role === 'CUSTOMER') {
    filterCustomerId = currentUser.id;
  }

  const result = await ReportsModel.getSubscriptionReportData({
    skip,
    take: limitNum,
    customerId: filterCustomerId,
    status,
    planId,
    startDate: startDate || query.fromDate,
    endDate: endDate || query.toDate,
    all: isExport
  });

  if (isExport) {
    const headers = ['Subscription #', 'Customer Name', 'Customer Email', 'Plan', 'Billing Interval', 'Amount', 'Status', 'Start Date', 'Expiry Date'];
    const rows = result.subscriptions.map((s) => [
      s.subscriptionNumber,
      `${s.customer?.firstName || ''} ${s.customer?.lastName || ''}`.trim(),
      s.customer?.email || '',
      s.plan?.name || '',
      s.billingInterval || '',
      Number(s.totalAmount || 0).toFixed(2),
      s.status,
      s.startDate ? new Date(s.startDate).toISOString().slice(0, 10) : '',
      s.expiryDate ? new Date(s.expiryDate).toISOString().slice(0, 10) : ''
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.map(escapeCsvField).join(','))].join('\n');
    return { isCsv: true, filename: `subscription-report-${Date.now()}.csv`, content: csvContent };
  }

  return {
    subscriptions: result.subscriptions,
    summary: result.summary,
    pagination: {
      total: result.total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(result.total / limitNum)
    }
  };
};

export const getInvoiceReport = async (query = {}, currentUser) => {
  validateReportQuery(query, 'invoice');

  const {
    page = 1,
    limit = 10,
    customerId,
    status,
    startDate,
    endDate,
    export: exportType
  } = query;

  const isExport = exportType === 'csv';
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  let filterCustomerId = customerId;
  if (currentUser.role === 'CUSTOMER') {
    filterCustomerId = currentUser.id;
  }

  const result = await ReportsModel.getInvoiceReportData({
    skip,
    take: limitNum,
    customerId: filterCustomerId,
    status,
    startDate: startDate || query.fromDate,
    endDate: endDate || query.toDate,
    all: isExport
  });

  if (isExport) {
    const headers = ['Invoice #', 'Customer Name', 'Customer Email', 'Issue Date', 'Due Date', 'Total', 'Amount Paid', 'Outstanding', 'Status'];
    const rows = result.invoices.map((inv) => [
      inv.invoiceNumber,
      `${inv.customer?.firstName || ''} ${inv.customer?.lastName || ''}`.trim(),
      inv.customer?.email || '',
      new Date(inv.issueDate).toISOString().slice(0, 10),
      new Date(inv.dueDate).toISOString().slice(0, 10),
      Number(inv.total || 0).toFixed(2),
      Number(inv.amountPaid || 0).toFixed(2),
      Number(inv.outstandingAmount || 0).toFixed(2),
      inv.status
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.map(escapeCsvField).join(','))].join('\n');
    return { isCsv: true, filename: `invoice-report-${Date.now()}.csv`, content: csvContent };
  }

  return {
    invoices: result.invoices,
    summary: result.summary,
    pagination: {
      total: result.total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(result.total / limitNum)
    }
  };
};

export const getPaymentReport = async (query = {}, currentUser) => {
  validateReportQuery(query, 'payment');

  const {
    page = 1,
    limit = 10,
    customerId,
    paymentMethod,
    startDate,
    endDate,
    export: exportType
  } = query;

  const isExport = exportType === 'csv';
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  let filterCustomerId = customerId;
  if (currentUser.role === 'CUSTOMER') {
    filterCustomerId = currentUser.id;
  }

  const result = await ReportsModel.getPaymentReportData({
    skip,
    take: limitNum,
    customerId: filterCustomerId,
    paymentMethod,
    startDate: startDate || query.fromDate,
    endDate: endDate || query.toDate,
    all: isExport
  });

  if (isExport) {
    const headers = ['Payment #', 'Invoice #', 'Customer Name', 'Payment Date', 'Method', 'Amount', 'Recorded By'];
    const rows = result.payments.map((p) => [
      p.paymentNumber,
      p.invoice?.invoiceNumber || '',
      `${p.customer?.firstName || ''} ${p.customer?.lastName || ''}`.trim(),
      new Date(p.paymentDate).toISOString().slice(0, 10),
      p.paymentMethod,
      Number(p.amount || 0).toFixed(2),
      p.recordedBy ? `${p.recordedBy.firstName} ${p.recordedBy.lastName}` : 'System'
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.map(escapeCsvField).join(','))].join('\n');
    return { isCsv: true, filename: `payment-report-${Date.now()}.csv`, content: csvContent };
  }

  return {
    payments: result.payments,
    summary: result.summary,
    pagination: {
      total: result.total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(result.total / limitNum)
    }
  };
};

export const getRevenueReport = async (query = {}, currentUser) => {
  validateReportQuery(query, 'general');

  let filterCustomerId = query.customerId;
  if (currentUser.role === 'CUSTOMER') {
    filterCustomerId = currentUser.id;
  }

  const result = await ReportsModel.getRevenueReportData({
    startDate: query.startDate || query.fromDate,
    endDate: query.endDate || query.toDate,
    customerId: filterCustomerId
  });

  if (query.export === 'csv') {
    const headers = ['Date', 'Revenue ($)', 'Transactions Count'];
    const rows = result.timeline.map((t) => [
      t.date,
      Number(t.revenue || 0).toFixed(2),
      t.transactions
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.map(escapeCsvField).join(','))].join('\n');
    return { isCsv: true, filename: `revenue-report-${Date.now()}.csv`, content: csvContent };
  }

  return result;
};

