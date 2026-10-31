import prisma from '../../config/db.js';

export const getAdminMetrics = async (filters = {}) => {
  const { startDate, endDate } = filters;
  const now = new Date();

  const paymentWhere = {};
  if (startDate || endDate) {
    paymentWhere.paymentDate = {};
    if (startDate) paymentWhere.paymentDate.gte = new Date(startDate);
    if (endDate) paymentWhere.paymentDate.lte = new Date(endDate);
  }

  const invoiceWhere = { status: { not: 'CANCELLED' } };
  if (startDate || endDate) {
    invoiceWhere.createdAt = {};
    if (startDate) invoiceWhere.createdAt.gte = new Date(startDate);
    if (endDate) invoiceWhere.createdAt.lte = new Date(endDate);
  }

  const [
    totalCustomers,
    totalStaff,
    activeSubscriptions,
    closedSubscriptions,
    totalRevenueAgg,
    paymentsReceivedAgg,
    pendingInvoicesCount,
    outstandingAgg,
    overdueInvoicesCount,
    overdueAgg
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.user.count({ where: { role: 'STAFF' } }),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.subscription.count({ where: { status: 'CLOSED' } }),
    prisma.invoice.aggregate({
      _sum: { total: true },
      where: invoiceWhere
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: paymentWhere
    }),
    prisma.invoice.count({
      where: { status: { in: ['CONFIRMED', 'PARTIALLY_PAID'] } }
    }),
    prisma.invoice.aggregate({
      _sum: { outstandingAmount: true },
      where: { status: { notIn: ['CANCELLED', 'PAID'] } }
    }),
    prisma.invoice.count({
      where: {
        status: { notIn: ['CANCELLED', 'PAID'] },
        dueDate: { lt: now },
        outstandingAmount: { gt: 0 }
      }
    }),
    prisma.invoice.aggregate({
      _sum: { outstandingAmount: true },
      where: {
        status: { notIn: ['CANCELLED', 'PAID'] },
        dueDate: { lt: now },
        outstandingAmount: { gt: 0 }
      }
    })
  ]);

  const revenueReceived = Number(paymentsReceivedAgg._sum.amount || 0);
  const totalInvoiced = Number(totalRevenueAgg._sum.total || 0);
  const outstandingAmount = Number(outstandingAgg._sum.outstandingAmount || 0);
  const overdueAmount = Number(overdueAgg._sum.outstandingAmount || 0);

  return {
    activeSubscriptions,
    revenueReceived: Math.round(revenueReceived * 100) / 100,
    outstandingAmount: Math.round(outstandingAmount * 100) / 100,
    overdueInvoices: overdueInvoicesCount,
    overdueAmount: Math.round(overdueAmount * 100) / 100,
    totalInvoiced: Math.round(totalInvoiced * 100) / 100,
    totalRevenue: Math.round(totalInvoiced * 100) / 100, // alias for backwards compatibility
    paymentsReceived: Math.round(revenueReceived * 100) / 100, // alias
    totalCustomers,
    totalStaff,
    closedSubscriptions,
    pendingInvoices: pendingInvoicesCount
  };
};

export const getStaffMetrics = async (staffId) => {
  const [
    totalCustomers,
    activeSubscriptions,
    pendingInvoices,
    paymentsRecordedCount,
    paymentsRecordedTotal
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.invoice.count({ where: { status: { in: ['CONFIRMED', 'PARTIALLY_PAID'] } } }),
    prisma.payment.count({ where: { recordedById: staffId } }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { recordedById: staffId }
    })
  ]);

  return {
    totalCustomers,
    activeSubscriptions,
    pendingInvoices,
    paymentsRecordedCount,
    paymentsRecordedTotal: Number(paymentsRecordedTotal._sum.amount || 0)
  };
};

export const getCustomerMetrics = async (customerId) => {
  const [
    activeSubscriptions,
    upcomingRenewals,
    invoicesCount,
    totalOutstandingAgg,
    totalPaidAgg
  ] = await Promise.all([
    prisma.subscription.findMany({
      where: { customerId, status: 'ACTIVE' },
      include: { plan: true }
    }),
    prisma.subscription.findMany({
      where: {
        customerId,
        status: 'ACTIVE',
        expiryDate: {
          not: null,
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      },
      include: { plan: true }
    }),
    prisma.invoice.count({ where: { customerId } }),
    prisma.invoice.aggregate({
      _sum: { outstandingAmount: true },
      where: {
        customerId,
        status: { in: ['CONFIRMED', 'PARTIALLY_PAID', 'OVERDUE'] }
      }
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { customerId }
    })
  ]);

  return {
    activeSubscriptionsCount: activeSubscriptions.length,
    activeSubscriptions,
    upcomingRenewals,
    invoicesCount,
    totalOutstanding: Number(totalOutstandingAgg._sum.outstandingAmount || 0),
    totalPaid: Number(totalPaidAgg._sum.amount || 0)
  };
};

export const getRevenueReportData = async (startDate, endDate) => {
  const where = {};
  if (startDate || endDate) {
    where.paymentDate = {};
    if (startDate) where.paymentDate.gte = startDate;
    if (endDate) where.paymentDate.lte = endDate;
  }

  return prisma.payment.findMany({
    where,
    orderBy: { paymentDate: 'asc' },
    select: {
      id: true,
      amount: true,
      paymentMethod: true,
      paymentDate: true
    }
  });
};

export const getPaymentsSummaryData = async (filters = {}) => {
  const { startDate, endDate } = filters;
  const where = {};
  if (startDate || endDate) {
    where.paymentDate = {};
    if (startDate) where.paymentDate.gte = new Date(startDate);
    if (endDate) where.paymentDate.lte = new Date(endDate);
  }

  const [byMethod, totalAgg, recentPayments] = await Promise.all([
    prisma.payment.groupBy({
      by: ['paymentMethod'],
      where,
      _sum: { amount: true },
      _count: { id: true }
    }),
    prisma.payment.aggregate({
      where,
      _sum: { amount: true },
      _count: { id: true }
    }),
    prisma.payment.findMany({
      where,
      take: 6,
      orderBy: { paymentDate: 'desc' },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true } },
        invoice: { select: { id: true, invoiceNumber: true } }
      }
    })
  ]);

  return {
    totalPayments: totalAgg._count.id || 0,
    totalAmount: Math.round(Number(totalAgg._sum.amount || 0) * 100) / 100,
    byMethod: byMethod.map((m) => ({
      method: m.paymentMethod,
      count: m._count.id,
      amount: Math.round(Number(m._sum.amount || 0) * 100) / 100
    })),
    recentPayments
  };
};

export const getSubscriptionReportData = async () => {
  const [byStatus, byPlan, activeSubscriptions] = await Promise.all([
    prisma.subscription.groupBy({
      by: ['status'],
      _count: { id: true }
    }),
    prisma.subscription.groupBy({
      by: ['planId'],
      _count: { id: true }
    }),
    prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        totalAmount: true,
        billingInterval: true
      }
    })
  ]);

  let mrr = 0;
  activeSubscriptions.forEach((sub) => {
    const amt = Number(sub.totalAmount || 0);
    if (sub.billingInterval === 'MONTHLY') mrr += amt;
    else if (sub.billingInterval === 'YEARLY') mrr += amt / 12;
    else if (sub.billingInterval === 'WEEKLY') mrr += amt * 4.33;
    else if (sub.billingInterval === 'DAILY') mrr += amt * 30;
  });

  return {
    byStatus,
    byPlan,
    activeCount: activeSubscriptions.length,
    estimatedMrr: Math.round(mrr * 100) / 100,
    estimatedArr: Math.round(mrr * 12 * 100) / 100
  };
};
