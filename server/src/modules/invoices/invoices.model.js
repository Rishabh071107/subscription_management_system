import prisma from '../../config/db.js';

export const findInvoices = async ({ skip = 0, take = 10, customerId, subscriptionId, status, search }) => {
  const where = {};

  if (customerId) {
    where.customerId = customerId;
  }

  if (subscriptionId) {
    where.subscriptionId = subscriptionId;
  }

  if (status) {
    where.status = status;
  }

  if (search && search.trim() !== '') {
    where.OR = [
      { invoiceNumber: { contains: search.trim(), mode: 'insensitive' } },
      { customer: { firstName: { contains: search.trim(), mode: 'insensitive' } } },
      { customer: { lastName: { contains: search.trim(), mode: 'insensitive' } } },
      { customer: { email: { contains: search.trim(), mode: 'insensitive' } } }
    ];
  }

  const [total, invoices] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      skip,
      take,
      orderBy: { issueDate: 'desc' },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        },
        subscription: {
          select: { id: true, subscriptionNumber: true, billingInterval: true }
        },
        lines: {
          include: {
            product: true,
            variant: true
          }
        },
        payments: true
      }
    })
  ]);

  return { total, invoices };
};

export const findInvoiceById = async (id) => {
  return prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true }
      },
      subscription: {
        include: {
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
        orderBy: { paymentDate: 'desc' },
        include: {
          recordedBy: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      }
    }
  });
};

export const countInvoicesForYear = async (year) => {
  const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
  const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);
  return prisma.invoice.count({
    where: {
      createdAt: {
        gte: startOfYear,
        lte: endOfYear
      }
    }
  });
};

export const findExistingInvoiceForPeriod = async (subscriptionId, periodStart, periodEnd) => {
  return prisma.invoice.findFirst({
    where: {
      subscriptionId,
      billingPeriodStart: periodStart,
      billingPeriodEnd: periodEnd
    }
  });
};

export const createInvoiceWithLines = async (invoiceData, lines) => {
  return prisma.invoice.create({
    data: {
      ...invoiceData,
      lines: {
        create: lines.map(line => ({
          productId: line.productId || null,
          variantId: line.variantId || null,
          description: line.description || '',
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
      subscription: true,
      lines: true
    }
  });
};

export const updateInvoice = async (id, data) => {
  return prisma.invoice.update({
    where: { id },
    data,
    include: {
      customer: true,
      lines: true,
      payments: true
    }
  });
};
