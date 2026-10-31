import * as DashboardModel from './dashboard.model.js';
import prisma from '../../config/db.js';

export const getDashboardSummary = async (currentUser) => {
  if (currentUser.role === 'ADMIN') {
    const metrics = await DashboardModel.getAdminMetrics();
    return { role: 'ADMIN', metrics };
  }

  if (currentUser.role === 'STAFF') {
    const metrics = await DashboardModel.getStaffMetrics(currentUser.id);
    return { role: 'STAFF', metrics };
  }

  // CUSTOMER
  const metrics = await DashboardModel.getCustomerMetrics(currentUser.id);
  return { role: 'CUSTOMER', metrics };
};

export const getRevenueReport = async ({ fromDate, toDate }) => {
  const start = fromDate ? new Date(fromDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = toDate ? new Date(toDate) : new Date();

  const payments = await DashboardModel.getRevenueReportData(start, end);

  // Group payments by date
  const grouped = {};
  let totalRevenue = 0;

  payments.forEach(p => {
    const dateKey = new Date(p.paymentDate).toISOString().slice(0, 10);
    const amt = Number(p.amount);
    totalRevenue += amt;
    grouped[dateKey] = (grouped[dateKey] || 0) + amt;
  });

  const timeline = Object.keys(grouped).sort().map(date => ({
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
  const { byStatus, byPlan } = await DashboardModel.getSubscriptionReportData();

  // Fetch plan names
  const plans = await prisma.plan.findMany({
    select: { id: true, name: true }
  });
  const planMap = {};
  plans.forEach(p => { planMap[p.id] = p.name; });

  const statusDistribution = byStatus.map(s => ({
    status: s.status,
    count: s._count.id
  }));

  const planDistribution = byPlan.map(p => ({
    planId: p.planId,
    planName: planMap[p.planId] || 'Unknown Plan',
    count: p._count.id
  }));

  return {
    statusDistribution,
    planDistribution
  };
};

export const getOverdueReport = async () => {
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: { in: ['CONFIRMED', 'PARTIALLY_PAID'] },
      dueDate: { lt: new Date() }
    },
    include: {
      customer: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true }
      }
    },
    orderBy: { dueDate: 'asc' }
  });

  let totalOverdue = 0;
  overdueInvoices.forEach(inv => {
    totalOverdue += Number(inv.outstandingAmount);
  });

  return {
    totalOverdueInvoices: overdueInvoices.length,
    totalOverdueAmount: Math.round(totalOverdue * 100) / 100,
    invoices: overdueInvoices
  };
};
