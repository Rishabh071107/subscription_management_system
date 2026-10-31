import { prisma } from '../../config/db.js';

/**
 * Get customer-specific portal dashboard metrics and recent items
 */
export const getCustomerDashboardMetrics = async (customerId) => {
  const [
    activeSubscriptionsCount,
    invoicesCount,
    invoices,
    paymentAgg,
    recentSubscriptions,
    recentInvoices,
    customer
  ] = await Promise.all([
    prisma.subscription.count({
      where: {
        customerId,
        status: { in: ['ACTIVE', 'CONFIRMED'] }
      }
    }),
    prisma.invoice.count({
      where: { customerId }
    }),
    prisma.invoice.findMany({
      where: {
        customerId,
        status: { in: ['DRAFT', 'CONFIRMED', 'PARTIALLY_PAID', 'OVERDUE'] }
      },
      select: {
        total: true,
        amountPaid: true,
        dueDate: true,
        status: true
      }
    }),
    prisma.payment.aggregate({
      where: { customerId },
      _sum: { amount: true }
    }),
    prisma.subscription.findMany({
      where: { customerId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
            billingInterval: true
          }
        }
      }
    }),
    prisma.invoice.findMany({
      where: { customerId },
      take: 5,
      orderBy: { issueDate: 'desc' },
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        amountPaid: true,
        status: true,
        dueDate: true,
        issueDate: true
      }
    }),
    prisma.user.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true
      }
    })
  ]);

  let totalOutstanding = 0;
  for (const inv of invoices) {
    const diff = Number(inv.total) - Number(inv.amountPaid);
    if (diff > 0) {
      totalOutstanding += diff;
    }
  }

  const totalPaid = Number(paymentAgg._sum.amount || 0);

  return {
    metrics: {
      activeSubscriptionsCount,
      invoicesCount,
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100
    },
    recentSubscriptions,
    recentInvoices,
    user: customer
  };
};

/**
 * Fetch subscriptions strictly owned by the customer
 */
export const findCustomerSubscriptions = async (customerId, { skip = 0, take = 10, status, search }) => {
  const where = { customerId };

  if (status) {
    where.status = status;
  }

  if (search && search.trim() !== '') {
    where.OR = [
      { subscriptionNumber: { contains: search.trim(), mode: 'insensitive' } },
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
        plan: true,
        lines: {
          include: {
            product: true,
            variant: true
          }
        }
      }
    })
  ]);

  return { total, subscriptions };
};

/**
 * Find a subscription by ID and verify ownership
 */
export const findCustomerSubscriptionById = async (id) => {
  return prisma.subscription.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true
        }
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
        select: {
          id: true,
          invoiceNumber: true,
          total: true,
          amountPaid: true,
          status: true,
          dueDate: true,
          issueDate: true
        }
      }
    }
  });
};

/**
 * Fetch invoices strictly owned by the customer
 */
export const findCustomerInvoices = async (customerId, { skip = 0, take = 10, status, search }) => {
  const where = { customerId };

  if (status) {
    where.status = status;
  }

  if (search && search.trim() !== '') {
    where.invoiceNumber = { contains: search.trim(), mode: 'insensitive' };
  }

  const [total, invoices] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      skip,
      take,
      orderBy: { issueDate: 'desc' },
      include: {
        subscription: {
          select: {
            id: true,
            subscriptionNumber: true,
            plan: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paymentDate: true,
            paymentMethod: true
          }
        }
      }
    })
  ]);

  return { total, invoices };
};

/**
 * Find an invoice by ID with all relations
 */
export const findCustomerInvoiceById = async (id) => {
  return prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true
        }
      },
      subscription: {
        select: {
          id: true,
          subscriptionNumber: true,
          plan: true
        }
      },
      lines: {
        include: {
          product: true,
          variant: true
        }
      },
      payments: {
        orderBy: { paymentDate: 'desc' }
      }
    }
  });
};

/**
 * Fetch customer profile
 */
export const findCustomerProfile = async (customerId) => {
  return prisma.user.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  });
};

/**
 * Update permitted customer profile fields
 */
export const updateCustomerProfile = async (customerId, data) => {
  return prisma.user.update({
    where: { id: customerId },
    data,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  });
};

