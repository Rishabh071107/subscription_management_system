import prisma from '../../config/db.js';

/**
 * Build Prisma filter criteria for overdue invoices
 * An invoice is overdue only if:
 * 1. its due date has passed (dueDate < now)
 * 2. it has a positive outstanding balance (outstandingAmount > 0)
 * 3. it is not cancelled and not paid
 */
const buildOverdueBaseWhere = (now = new Date()) => {
  return {
    dueDate: { lt: now },
    outstandingAmount: { gt: 0 },
    status: { notIn: ['CANCELLED', 'PAID'] }
  };
};

export const findOverdueInvoices = async ({
  skip = 0,
  take = 10,
  customerId,
  bucket,
  dueStartDate,
  dueEndDate
}) => {
  const now = new Date();
  const where = buildOverdueBaseWhere(now);

  if (customerId) {
    where.customerId = customerId;
  }

  // Handle due date range filters
  if (dueStartDate || dueEndDate) {
    where.dueDate = { ...where.dueDate };
    if (dueStartDate) {
      where.dueDate.gte = new Date(dueStartDate);
    }
    if (dueEndDate) {
      // Must still be in the past
      const endLimit = new Date(dueEndDate);
      where.dueDate.lte = endLimit < now ? endLimit : now;
    }
  }

  // Handle aging bucket date bounds
  if (bucket) {
    const msInDay = 86400000;
    if (bucket === '1-30') {
      where.dueDate = {
        gte: new Date(now.getTime() - 30 * msInDay),
        lt: now
      };
    } else if (bucket === '31-60') {
      where.dueDate = {
        gte: new Date(now.getTime() - 60 * msInDay),
        lt: new Date(now.getTime() - 30 * msInDay)
      };
    } else if (bucket === '61-90') {
      where.dueDate = {
        gte: new Date(now.getTime() - 90 * msInDay),
        lt: new Date(now.getTime() - 60 * msInDay)
      };
    } else if (bucket === '90+') {
      where.dueDate = {
        lt: new Date(now.getTime() - 90 * msInDay)
      };
    }
  }

  const [total, invoices] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      skip,
      take,
      orderBy: { dueDate: 'asc' }, // oldest due date first (highest collection priority)
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        },
        subscription: {
          select: { id: true, subscriptionNumber: true, status: true }
        },
        payments: {
          select: { id: true, paymentNumber: true, amount: true, paymentDate: true }
        }
      }
    })
  ]);

  // Enrich each invoice with daysOverdue and aging bucket
  const enrichedInvoices = invoices.map((inv) => {
    const diffTime = Math.max(0, now.getTime() - new Date(inv.dueDate).getTime());
    const daysOverdue = Math.floor(diffTime / 86400000);

    let calculatedBucket = '1-30';
    if (daysOverdue > 90) calculatedBucket = '90+';
    else if (daysOverdue > 60) calculatedBucket = '61-90';
    else if (daysOverdue > 30) calculatedBucket = '31-60';

    return {
      ...inv,
      daysOverdue,
      bucket: calculatedBucket
    };
  });

  return { total, invoices: enrichedInvoices };
};

export const getOverdueSummary = async (customerId = null) => {
  const now = new Date();
  const where = buildOverdueBaseWhere(now);
  if (customerId) {
    where.customerId = customerId;
  }

  const overdueInvoices = await prisma.invoice.findMany({
    where,
    select: {
      id: true,
      customerId: true,
      outstandingAmount: true,
      dueDate: true
    }
  });

  let totalOverdueAmount = 0;
  const customerSet = new Set();
  let criticalCount = 0;
  let criticalAmount = 0;

  const buckets = {
    '1-30': { count: 0, amount: 0 },
    '31-60': { count: 0, amount: 0 },
    '61-90': { count: 0, amount: 0 },
    '90+': { count: 0, amount: 0 }
  };

  const msInDay = 86400000;

  overdueInvoices.forEach((inv) => {
    const amount = Number(inv.outstandingAmount || 0);
    totalOverdueAmount += amount;
    customerSet.add(inv.customerId);

    const diff = Math.max(0, now.getTime() - new Date(inv.dueDate).getTime());
    const days = Math.floor(diff / msInDay);

    if (days > 60) {
      criticalCount += 1;
      criticalAmount += amount;
    }

    if (days <= 30) {
      buckets['1-30'].count += 1;
      buckets['1-30'].amount += amount;
    } else if (days <= 60) {
      buckets['31-60'].count += 1;
      buckets['31-60'].amount += amount;
    } else if (days <= 90) {
      buckets['61-90'].count += 1;
      buckets['61-90'].amount += amount;
    } else {
      buckets['90+'].count += 1;
      buckets['90+'].amount += amount;
    }
  });

  return {
    totalOverdueInvoices: overdueInvoices.length,
    totalOverdueAmount: Math.round(totalOverdueAmount * 100) / 100,
    affectedCustomersCount: customerSet.size,
    criticalOverdueCount: criticalCount,
    criticalOverdueAmount: Math.round(criticalAmount * 100) / 100,
    agingBuckets: {
      '1-30': { count: buckets['1-30'].count, amount: Math.round(buckets['1-30'].amount * 100) / 100 },
      '31-60': { count: buckets['31-60'].count, amount: Math.round(buckets['31-60'].amount * 100) / 100 },
      '61-90': { count: buckets['61-90'].count, amount: Math.round(buckets['61-90'].amount * 100) / 100 },
      '90+': { count: buckets['90+'].count, amount: Math.round(buckets['90+'].amount * 100) / 100 }
    }
  };
};

export const findOverdueInvoiceById = async (id) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true }
      },
      subscription: {
        select: { id: true, subscriptionNumber: true, status: true, startDate: true, expiryDate: true, nextBillingDate: true }
      },
      lines: true,
      payments: {
        orderBy: { paymentDate: 'desc' },
        include: {
          recordedBy: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      }
    }
  });

  if (!invoice) return null;

  // Retrieve follow-up / collection activity notes from AuditLog
  const followUpLogs = await prisma.auditLog.findMany({
    where: {
      entityType: 'INVOICE',
      entityId: id,
      action: 'COLLECTION_FOLLOW_UP'
    },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true }
      }
    }
  });

  const now = new Date();
  const diffTime = Math.max(0, now.getTime() - new Date(invoice.dueDate).getTime());
  const daysOverdue = Math.floor(diffTime / 86400000);
  const isOverdue = invoice.dueDate < now && Number(invoice.outstandingAmount) > 0 && invoice.status !== 'CANCELLED' && invoice.status !== 'PAID';

  return {
    ...invoice,
    isOverdue,
    daysOverdue,
    followUpLogs
  };
};

export const syncOverdueStatuses = async () => {
  const now = new Date();

  // Find all invoices that are past due, have positive outstanding amount, and are currently in CONFIRMED or PARTIALLY_PAID
  const result = await prisma.invoice.updateMany({
    where: {
      dueDate: { lt: now },
      outstandingAmount: { gt: 0 },
      status: { in: ['CONFIRMED', 'PARTIALLY_PAID'] }
    },
    data: {
      status: 'OVERDUE'
    }
  });

  return result.count;
};

export const addFollowUpLog = async (invoiceId, note, currentUser) => {
  return prisma.auditLog.create({
    data: {
      userId: currentUser.id,
      action: 'COLLECTION_FOLLOW_UP',
      entityType: 'INVOICE',
      entityId: invoiceId,
      details: note.trim()
    },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true }
      }
    }
  });
};
