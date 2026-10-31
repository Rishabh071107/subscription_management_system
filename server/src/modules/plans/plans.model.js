import prisma from '../../config/db.js';

export const findPlans = async ({ skip = 0, take = 10, status, billingInterval, search }) => {
  const where = {};

  if (status) {
    where.status = status;
  }

  if (billingInterval) {
    where.billingInterval = billingInterval;
  }

  if (search && search.trim() !== '') {
    where.OR = [
      { name: { contains: search.trim(), mode: 'insensitive' } },
      { code: { contains: search.trim(), mode: 'insensitive' } },
      { description: { contains: search.trim(), mode: 'insensitive' } }
    ];
  }

  const [total, plans] = await Promise.all([
    prisma.plan.count({ where }),
    prisma.plan.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            subscriptions: true
          }
        }
      }
    })
  ]);

  return { total, plans };
};

export const findPlanById = async (id) => {
  return prisma.plan.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          subscriptions: true
        }
      }
    }
  });
};

export const findPlanByCode = async (code) => {
  return prisma.plan.findUnique({
    where: { code: code.toUpperCase().trim() }
  });
};

export const createPlan = async (data) => {
  return prisma.plan.create({
    data: {
      ...data,
      code: data.code.toUpperCase().trim()
    }
  });
};

export const updatePlan = async (id, data) => {
  return prisma.plan.update({
    where: { id },
    data
  });
};

export const updatePlanStatus = async (id, status) => {
  return prisma.plan.update({
    where: { id },
    data: { status }
  });
};

export const deletePlan = async (id) => {
  return prisma.plan.delete({
    where: { id }
  });
};
