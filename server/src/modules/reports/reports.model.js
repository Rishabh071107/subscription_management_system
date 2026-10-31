import prisma from '../../config/db.js';

/**
 * 1. Subscription Report Data
 */
export const getSubscriptionReportData = async ({
  skip = 0,
  take = 10,
  customerId,
  status,
  planId,
  startDate,
  endDate,
  all = false
}) => {
  const where = {};

  if (customerId) where.customerId = customerId;
  if (status) where.status = status;
  if (planId) where.planId = planId;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [total, byStatus, byPlan, activeSubs, subscriptions] = await Promise.all([
    prisma.subscription.count({ where }),
    prisma.subscription.groupBy({
      by: ['status'],
      where,
      _count: { id: true }
    }),
    prisma.subscription.groupBy({
      by: ['planId'],
      where,
      _count: { id: true }
    }),
    prisma.subscription.findMany({
      where: { ...where, status: 'ACTIVE' },
      select: { totalAmount: true, billingInterval: true }
    }),
    prisma.subscription.findMany({
      where,
      skip: all ? undefined : skip,
      take: all ? undefined : take,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        },
        plan: {
          select: { id: true, name: true, billingInterval: true, price: true }
        }
      }
    })
  ]);

  // Calculate MRR
  let mrr = 0;
  activeSubs.forEach((sub) => {
    const amt = Number(sub.totalAmount || 0);
    if (sub.billingInterval === 'MONTHLY') mrr += amt;
    else if (sub.billingInterval === 'YEARLY') mrr += amt / 12;
    else if (sub.billingInterval === 'WEEKLY') mrr += amt * 4.33;
    else if (sub.billingInterval === 'DAILY') mrr += amt * 30;
  });

  return {
    total,
    subscriptions,
    summary: {
      totalSubscriptions: total,
      activeSubscriptions: activeSubs.length,
      estimatedMrr: Math.round(mrr * 100) / 100,
      estimatedArr: Math.round(mrr * 12 * 100) / 100,
      statusDistribution: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
      planDistribution: byPlan.map((p) => ({ planId: p.planId, count: p._count.id }))
    }
  };
};

/**
 * 2. Invoice Report Data
 */
export const getInvoiceReportData = async ({
  skip = 0,
  take = 10,
  customerId,
  status,
  startDate,
  endDate,
  all = false
}) => {
  const where = {};

  if (customerId) where.customerId = customerId;
  if (status) where.status = status;

  if (startDate || endDate) {
    where.issueDate = {};
    if (startDate) where.issueDate.gte = new Date(startDate);
    if (endDate) where.issueDate.lte = new Date(endDate);
  }

  const [total, totalsAgg, byStatus, invoices] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.aggregate({
      where,
      _sum: {
        total: true,
        amountPaid: true,
        outstandingAmount: true,
        taxAmount: true,
        discountAmount: true
      }
    }),
    prisma.invoice.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
      _sum: { total: true }
    }),
    prisma.invoice.findMany({
      where,
      skip: all ? undefined : skip,
      take: all ? undefined : take,
      orderBy: { issueDate: 'desc' },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        }
      }
    })
  ]);

  const totalBilled = Number(totalsAgg._sum.total || 0);
  const totalPaid = Number(totalsAgg._sum.amountPaid || 0);
  const totalOutstanding = Number(totalsAgg._sum.outstandingAmount || 0);
  const totalTax = Number(totalsAgg._sum.taxAmount || 0);
  const totalDiscount = Number(totalsAgg._sum.discountAmount || 0);

  return {
    total,
    invoices,
    summary: {
      totalInvoices: total,
      totalBilled: Math.round(totalBilled * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      collectionRate: totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 1000) / 10 : 0,
      statusDistribution: byStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
        total: Math.round(Number(s._sum.total || 0) * 100) / 100
      }))
    }
  };
};

/**
 * 3. Payment Report Data
 */
export const getPaymentReportData = async ({
  skip = 0,
  take = 10,
  customerId,
  paymentMethod,
  startDate,
  endDate,
  all = false
}) => {
  const where = {};

  if (customerId) where.customerId = customerId;
  if (paymentMethod) where.paymentMethod = paymentMethod;

  if (startDate || endDate) {
    where.paymentDate = {};
    if (startDate) where.paymentDate.gte = new Date(startDate);
    if (endDate) where.paymentDate.lte = new Date(endDate);
  }

  const [total, totalsAgg, byMethod, payments] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.aggregate({
      where,
      _sum: { amount: true },
      _avg: { amount: true }
    }),
    prisma.payment.groupBy({
      by: ['paymentMethod'],
      where,
      _count: { id: true },
      _sum: { amount: true }
    }),
    prisma.payment.findMany({
      where,
      skip: all ? undefined : skip,
      take: all ? undefined : take,
      orderBy: { paymentDate: 'desc' },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        invoice: {
          select: { id: true, invoiceNumber: true, total: true }
        },
        recordedBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    })
  ]);

  const totalCollected = Number(totalsAgg._sum.amount || 0);
  const avgAmount = Number(totalsAgg._avg.amount || 0);

  return {
    total,
    payments,
    summary: {
      totalPayments: total,
      totalCollected: Math.round(totalCollected * 100) / 100,
      averagePayment: Math.round(avgAmount * 100) / 100,
      methodDistribution: byMethod.map((m) => ({
        method: m.paymentMethod,
        count: m._count.id,
        amount: Math.round(Number(m._sum.amount || 0) * 100) / 100
      }))
    }
  };
};

/**
 * 4. Revenue Report Data
 */
export const getRevenueReportData = async ({
  startDate,
  endDate,
  customerId
}) => {
  const where = {};

  if (customerId) where.customerId = customerId;

  if (startDate || endDate) {
    where.paymentDate = {};
    if (startDate) where.paymentDate.gte = new Date(startDate);
    if (endDate) where.paymentDate.lte = new Date(endDate);
  }

  const payments = await prisma.payment.findMany({
    where,
    orderBy: { paymentDate: 'asc' },
    select: {
      id: true,
      amount: true,
      paymentMethod: true,
      paymentDate: true
    }
  });

  const timelineMap = {};
  let totalRevenue = 0;

  payments.forEach((p) => {
    const dKey = new Date(p.paymentDate).toISOString().slice(0, 10);
    const amt = Number(p.amount);
    totalRevenue += amt;

    if (!timelineMap[dKey]) {
      timelineMap[dKey] = { date: dKey, revenue: 0, transactions: 0 };
    }
    timelineMap[dKey].revenue += amt;
    timelineMap[dKey].transactions += 1;
  });

  const timeline = Object.values(timelineMap).map((t) => ({
    date: t.date,
    revenue: Math.round(t.revenue * 100) / 100,
    transactions: t.transactions
  }));

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalTransactions: payments.length,
    averageTransaction: payments.length > 0 ? Math.round((totalRevenue / payments.length) * 100) / 100 : 0,
    timeline
  };
};
