import prisma from '../../config/db.js';

export const findSubscriptions = async ({ skip = 0, take = 10, customerId, status, planId, search }) => {
  const where = {};

  if (customerId) {
    where.customerId = customerId;
  }

  if (status) {
    where.status = status;
  }

  if (planId) {
    where.planId = planId;
  }

  if (search && search.trim() !== '') {
    where.OR = [
      { subscriptionNumber: { contains: search.trim(), mode: 'insensitive' } },
      { customer: { firstName: { contains: search.trim(), mode: 'insensitive' } } },
      { customer: { lastName: { contains: search.trim(), mode: 'insensitive' } } },
      { customer: { email: { contains: search.trim(), mode: 'insensitive' } } },
      { plan: { name: { contains: search.trim(), mode: 'insensitive' } } }
    ];
  }

  const [total, subscriptions] = await Promise.all([
    prisma.subscription.count({ where }),
    prisma.subscription.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        },
        plan: true,
        lines: {
          include: {
            product: true,
            variant: true
          }
        },
        _count: {
          select: {
            invoices: true
          }
        }
      }
    })
  ]);

  return { total, subscriptions };
};

export const findSubscriptionById = async (id) => {
  return prisma.subscription.findUnique({
    where: { id },
    include: {
      customer: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true }
      },
      plan: true,
      quotation: true,
      lines: {
        include: {
          product: true,
          variant: true
        }
      },
      invoices: {
        orderBy: { issueDate: 'desc' },
        include: {
          payments: true
        }
      }
    }
  });
};

export const countSubscriptionsForYear = async (year) => {
  const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
  const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);
  return prisma.subscription.count({
    where: {
      createdAt: {
        gte: startOfYear,
        lte: endOfYear
      }
    }
  });
};

export const createSubscription = async (subscriptionData, lines) => {
  return prisma.subscription.create({
    data: {
      ...subscriptionData,
      lines: {
        create: lines.map(line => ({
          productId: line.productId,
          variantId: line.variantId || null,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          taxRate: line.taxRate,
          subtotal: line.subtotal,
          total: line.total
        }))
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

export const updateSubscription = async (id, data) => {
  return prisma.subscription.update({
    where: { id },
    data,
    include: {
      customer: true,
      plan: true,
      lines: true
    }
  });
};
