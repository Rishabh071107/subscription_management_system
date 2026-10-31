import * as DashboardModel from './dashboard.model.js';
import prisma from '../../config/db.js';

export const getDashboardSummary = async (query = {}, currentUser) => {
  if (currentUser.role === 'ADMIN') {
    const metrics = await DashboardModel.getAdminMetrics(query);
    return { role: 'ADMIN', metrics, ...metrics };
  }

  if (currentUser.role === 'STAFF') {
    const metrics = await DashboardModel.getStaffMetrics(currentUser.id);
    return { role: 'STAFF', metrics, ...metrics };
  }

  // CUSTOMER
  const metrics = await DashboardModel.getCustomerMetrics(currentUser.id);
  return { role: 'CUSTOMER', metrics, ...metrics };
};

export const getRevenueReport = async (query = {}) => {
  const { fromDate, toDate, startDate, endDate } = query;
  const start = startDate || fromDate ? new Date(startDate || fromDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate || toDate ? new Date(endDate || toDate) : new Date();

  // If specific date boundary was passed as YYYY-MM-DD, set to start/end of day
  if (startDate || fromDate) {
    start.setHours(0, 0, 0, 0);
  }
  if (endDate || toDate) {
    end.setHours(23, 59, 59, 999);
  }

  const payments = await DashboardModel.getRevenueReportData(start, end);

  // Group payments by date
  const grouped = {};
  let totalRevenue = 0;

  payments.forEach((p) => {
    const dateKey = new Date(p.paymentDate).toISOString().slice(0, 10);
    const amt = Number(p.amount);
    totalRevenue += amt;
    grouped[dateKey] = (grouped[dateKey] || 0) + amt;
  });

  const timeline = Object.keys(grouped).sort().map((date) => ({
    date,
    amount: Math.round(grouped[date] * 100) / 100
  }));

  return {
    fromDate: start,
    toDate: end,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalTransactions: payments.length,
    timeline
  };
};

export const getSubscriptionReport = async () => {
  const { byStatus, byPlan, activeCount, estimatedMrr, estimatedArr } =
    await DashboardModel.getSubscriptionReportData();

  // Fetch plan names
  const plans = await prisma.plan.findMany({
    select: { id: true, name: true }
  });
  const planMap = {};
  plans.forEach((p) => {
    planMap[p.id] = p.name;
  });

  const statusDistribution = byStatus.map((s) => ({
    status: s.status,
    count: s._count.id
  }));

  const planDistribution = byPlan.map((p) => ({
    planId: p.planId,
    planName: planMap[p.planId] || 'Unknown Plan',
    count: p._count.id
  }));

  return {
    statusDistribution,
    planDistribution,
    activeCount,
    estimatedMrr,
    estimatedArr
  };
};

export const getPaymentsSummary = async (query = {}) => {
  return DashboardModel.getPaymentsSummaryData(query);
};

export const getOverdueReport = async () => {
  const now = new Date();
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: { notIn: ['CANCELLED', 'PAID'] },
      dueDate: { lt: now },
      outstandingAmount: { gt: 0 }
    },
    include: {
      customer: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true }
      }
    },
    orderBy: { dueDate: 'asc' }
  });

  let totalOverdue = 0;
  overdueInvoices.forEach((inv) => {
    totalOverdue += Number(inv.outstandingAmount || 0);
  });

  return {
    totalOverdueInvoices: overdueInvoices.length,
    totalOverdueAmount: Math.round(totalOverdue * 100) / 100,
    invoices: overdueInvoices
  };
};
