import prisma from '../../config/db.js';

export const findDiscounts = async ({ skip = 0, take = 10, isActive, search }) => {
  const where = {};

  if (typeof isActive === 'boolean') {
    where.isActive = isActive;
  }

  if (search && search.trim() !== '') {
    where.OR = [
      { code: { contains: search.trim(), mode: 'insensitive' } },
      { description: { contains: search.trim(), mode: 'insensitive' } }
    ];
  }

  const [total, discounts] = await Promise.all([
    prisma.discount.count({ where }),
    prisma.discount.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { id: true, name: true }
        },
        _count: {
          select: { usages: true }
        }
      }
    })
  ]);

  return { total, discounts };
};

export const findDiscountByCode = async (code) => {
  return prisma.discount.findUnique({
    where: { code: code.toUpperCase().trim() },
    include: {
      product: true,
      usages: true
    }
  });
};

export const findDiscountById = async (id) => {
  return prisma.discount.findUnique({
    where: { id },
    include: {
      product: true,
      usages: {
        include: {
          customer: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        }
      }
    }
  });
};

export const createDiscount = async (data) => {
  return prisma.discount.create({
    data: {
      ...data,
      code: data.code.toUpperCase().trim()
    }
  });
};

export const updateDiscount = async (id, data) => {
  return prisma.discount.update({
    where: { id },
    data
  });
};

export const recordDiscountUsage = async (usageData) => {
  return prisma.$transaction([
    prisma.discountUsage.create({
      data: usageData
    }),
    prisma.discount.update({
      where: { id: usageData.discountId },
      data: {
        timesUsed: { increment: 1 }
      }
    })
  ]);
};
