import prisma from '../../config/db.js';

export const findUsers = async ({ skip = 0, take = 10, role, isActive, search }) => {
  const where = {};

  if (role) {
    where.role = role;
  }

  if (typeof isActive === 'boolean') {
    where.isActive = isActive;
  }

  if (search && search.trim() !== '') {
    const query = search.trim();
    where.OR = [
      { firstName: { contains: query, mode: 'insensitive' } },
      { lastName: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
      { phone: { contains: query, mode: 'insensitive' } }
    ];
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            customerSubscriptions: true,
            customerInvoices: true
          }
        }
      }
    })
  ]);

  return { total, users };
};

export const findUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  });
};

export const findUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() }
  });
};

export const createStaffUser = async (data) => {
  return prisma.user.create({
    data: {
      ...data,
      email: data.email.toLowerCase().trim()
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  });
};

export const updateUser = async (id, data) => {
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      isActive: true,
      updatedAt: true
    }
  });
};

export const updateUserStatus = async (id, isActive) => {
  return prisma.user.update({
    where: { id },
    data: { isActive },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true
    }
  });
};
