import prisma from '../../config/db.js';

export const createBillingRun = async (data) => {
  return prisma.billingRun.create({
    data: {
      status: 'RUNNING',
      processedCount: 0,
      successCount: 0,
      failureCount: 0,
      ...data
    }
  });
};

export const updateBillingRun = async (id, data) => {
  return prisma.billingRun.update({
    where: { id },
    data
  });
};

export const findBillingRuns = async ({ skip = 0, take = 10 }) => {
  const [total, runs] = await Promise.all([
    prisma.billingRun.count(),
    prisma.billingRun.findMany({
      skip,
      take,
      orderBy: { startedAt: 'desc' },
      include: {
        _count: {
          select: { items: true }
        }
      }
    })
  ]);

  return { total, runs };
};

export const findBillingRunById = async (id) => {
  return prisma.billingRun.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          subscription: {
            select: {
              id: true,
              subscriptionNumber: true,
              billingInterval: true,
              customer: {
                select: { id: true, firstName: true, lastName: true, email: true }
              }
            }
          },
          invoice: {
            select: { id: true, invoiceNumber: true, total: true, status: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  });
};

export const createBillingRunItem = async (data) => {
  return prisma.billingRunItem.create({
    data
  });
};

export const findDueSubscriptions = async (targetDate = new Date()) => {
  return prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      nextBillingDate: {
        lte: targetDate
      }
    },
    include: {
      customer: true,
      plan: true,
      lines: {
        include: {
          product: true,
          variant: true
        }
      }
    }
  });
};

