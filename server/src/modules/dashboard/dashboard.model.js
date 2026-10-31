import prisma from '../../config/db.js';

export const getAdminMetrics = async () => {
  const [
    totalCustomers,
    totalStaff,
    activeSubscriptions,
    closedSubscriptions,
    totalRevenueAgg,
    paymentsReceivedAgg,
    pendingInvoicesCount,
    overdueInvoicesCount
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.user.count({ where: { role: 'STAFF' } }),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.subscription.count({ where: { status: 'CLOSED' } }),
    prisma.invoice.aggregate({
      _sum: { total: true },
      where: { status: { not: 'CANCELLED' } }
    }),
    prisma.payment.aggregate({
      _sum: { amount: true }
    }),
    prisma.invoice.count({
      where: { status: { in: ['CONFIRMED', 'PARTIALLY_PAID'] } }
    }),
    prisma.invoice.count({
      where: {
        status: { in: ['CONFIRMED', 'PARTIALLY_PAID'] },
        dueDate: { lt: new Date() }
      }
    })
  ]);

  return {
    totalCustomers,
    totalStaff,
    activeSubscriptions,
    closedSubscriptions,
    totalRevenue: totalRevenueAgg._sum.total || 0,
    paymentsReceived: paymentsReceivedAgg._sum.amount || 0,
    pendingInvoices: pendingInvoicesCount,
    overdueInvoices: overdueInvoicesCount
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
    paymentsRecordedTotal: paymentsRecordedTotal._sum.amount || 0
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
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
        }
      },
      include: { plan: true }
    }),
    prisma.invoice.count({ where: { customerId } }),
    prisma.invoice.aggregate({
      _sum: { outstandingAmount: true },
      where: {
        customerId,
        status: { in: ['CONFIRMED', 'PARTIALLY_PAID'] }
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
    totalOutstanding: totalOutstandingAgg._sum.outstandingAmount || 0,
    totalPaid: totalPaidAgg._sum.amount || 0
  };
};

export const getRevenueReportData = async (startDate, endDate) => {
  const where = {
    paymentDate: {
      gte: startDate,
      lte: endDate
    }
  };

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

export const getSubscriptionReportData = async () => {
  const [byStatus, byPlan] = await Promise.all([
    prisma.subscription.groupBy({
      by: ['status'],
      _count: { id: true }
    }),
    prisma.subscription.groupBy({
      by: ['planId'],
      _count: { id: true }
    })
  ]);

  return { byStatus, byPlan };
};
