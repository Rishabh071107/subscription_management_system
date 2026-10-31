import prisma from '../../config/db.js';

export const findPayments = async ({
  skip = 0,
  take = 10,
  customerId,
  invoiceId,
  paymentMethod,
  startDate,
  endDate
}) => {
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

  if (startDate || endDate) {
    where.paymentDate = {};
    if (startDate) {
      where.paymentDate.gte = new Date(startDate);
    }
    if (endDate) {
      where.paymentDate.lte = new Date(endDate);
    }
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
          select: { id: true, invoiceNumber: true, total: true, amountPaid: true, outstandingAmount: true, status: true, dueDate: true }
        },
        recordedBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
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
      customer: {
        select: { id: true, firstName: true, lastName: true, email: true }
      },
      invoice: {
        select: { id: true, invoiceNumber: true, total: true, amountPaid: true, outstandingAmount: true, status: true, dueDate: true, issueDate: true }
      },
      recordedBy: {
        select: { id: true, firstName: true, lastName: true, email: true }
      }
    }
  });
};

export const findPaymentsByInvoiceId = async (invoiceId) => {
  return prisma.payment.findMany({
    where: { invoiceId },
    orderBy: { paymentDate: 'desc' },
    include: {
      customer: {
        select: { id: true, firstName: true, lastName: true, email: true }
      },
      invoice: {
        select: { id: true, invoiceNumber: true, total: true, amountPaid: true, outstandingAmount: true, status: true }
      },
      recordedBy: {
        select: { id: true, firstName: true, lastName: true, email: true }
      }
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
