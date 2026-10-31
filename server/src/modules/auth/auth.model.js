import prisma from '../../config/db.js';

/**
 * Auth Data Access Model
 */
export const findUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() }
  });
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

export const createUser = async (userData) => {
  return prisma.user.create({
    data: {
      ...userData,
      email: userData.email.toLowerCase().trim()
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

export const updateUserPassword = async (userId, hashedPassword) => {
  return prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });
};

export const createPasswordResetToken = async (userId, token, expiresAt) => {
  return prisma.passwordResetToken.create({
    data: {
      userId,
      token,
      expiresAt,
      isUsed: false
    }
  });
};

export const findPasswordResetToken = async (token) => {
  return prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true }
  });
};

export const markTokenAsUsed = async (tokenId) => {
  return prisma.passwordResetToken.update({
    where: { id: tokenId },
    data: { isUsed: true }
  });
};

export const logUserAudit = async (userId, action, details) => {
  return prisma.auditLog.create({
    data: {
      userId,
      action,
      entityType: 'User',
      entityId: userId,
      details: typeof details === 'string' ? details : JSON.stringify(details)
    }
  });
};
