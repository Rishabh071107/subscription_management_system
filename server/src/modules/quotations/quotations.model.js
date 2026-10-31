import prisma from '../../config/db.js';

export const findQuotations = async ({ skip = 0, take = 10, customerId, status, isTemplate, search }) => {
  const where = {};

  if (customerId) {
    where.customerId = customerId;
  }

  if (status) {
    where.status = status;
  }

  if (typeof isTemplate === 'boolean') {
    where.isTemplate = isTemplate;
  }

  if (search && search.trim() !== '') {
    where.OR = [
      { quotationNumber: { contains: search.trim(), mode: 'insensitive' } },
      { templateName: { contains: search.trim(), mode: 'insensitive' } },
      { customer: { firstName: { contains: search.trim(), mode: 'insensitive' } } },
      { customer: { lastName: { contains: search.trim(), mode: 'insensitive' } } },
      { customer: { email: { contains: search.trim(), mode: 'insensitive' } } }
    ];
  }

  const [total, quotations] = await Promise.all([
    prisma.quotation.count({ where }),
    prisma.quotation.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        lines: {
          include: {
            product: true,
            variant: true
          }
        }
      }
    })
  ]);

  return { total, quotations };
};

export const findQuotationById = async (id) => {
  return prisma.quotation.findUnique({
    where: { id },
    include: {
      customer: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true }
      },
      createdBy: {
        select: { id: true, firstName: true, lastName: true, email: true }
      },
      lines: {
        include: {
          product: true,
          variant: true
        }
      },
      subscriptions: true
    }
  });
};

export const countQuotationsForYear = async (year) => {
  const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
  const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);
  return prisma.quotation.count({
    where: {
      createdAt: {
        gte: startOfYear,
        lte: endOfYear
      }
    }
  });
};

export const createQuotation = async (quotationData, lines) => {
  return prisma.quotation.create({
    data: {
      ...quotationData,
      lines: {
        create: lines.map(line => ({
          productId: line.productId,
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
      lines: {
        include: {
          product: true,
          variant: true
        }
      }
    }
  });
};

export const updateQuotation = async (id, quotationData, lines = null) => {
  if (lines !== null) {
    // Delete existing lines and re-create updated lines in a transaction
    return prisma.$transaction(async (tx) => {
      await tx.quotationLine.deleteMany({
        where: { quotationId: id }
      });

      return tx.quotation.update({
        where: { id },
        data: {
          ...quotationData,
          lines: {
            create: lines.map(line => ({
              productId: line.productId,
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
          lines: {
            include: {
              product: true,
              variant: true
            }
          }
        }
      });
    });
  }

  return prisma.quotation.update({
    where: { id },
    data: quotationData,
    include: {
      customer: true,
      lines: true
    }
  });
};
