import prisma from '../../config/db.js';

export const findPayments = async ({ skip = 0, take = 10, customerId, invoiceId, paymentMethod }) => {
  const where = {};

  if (customerId) {
    where.customerId = customerId;
  }

  if (invoiceId) {
    where.invoiceId = invoiceId;
  }

  if (paymentMethod) {
    where.paymentMethod = paymentMethod;
  }

  const [total, payments] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      skip,
      take,
      orderBy: { paymentDate: 'desc' },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        invoice: {
          select: { id: true, invoiceNumber: true, total: true, status: true }
        },
        recordedBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    })
  ]);

  return { total, payments };
};

export const findPaymentById = async (id) => {
  return prisma.payment.findUnique({
    where: { id },
    include: {
      customer: true,
      invoice: true,
      recordedBy: true
    }
  });
};

export const countPaymentsForYear = async (year) => {
  const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
  const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);
  return prisma.payment.count({
    where: {
      createdAt: {
        gte: startOfYear,
        lte: endOfYear
      }
    }
  });
};
