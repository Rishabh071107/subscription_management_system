import bcrypt from 'bcryptjs';
import * as UsersModel from './users.model.js';
import { isValidEmail, validatePassword } from '../../utils/validators.js';

export const listUsers = async ({ page = 1, limit = 10, role, isActive, search }, currentUser) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  // If currentUser is STAFF, staff can view customers (or other staff if permitted), but cannot manage admins
  let queryRole = role;
  if (currentUser.role === 'STAFF' && !role) {
    queryRole = 'CUSTOMER'; // By default, staff searches customer records
  }

  let activeFilter = undefined;
  if (isActive === 'true' || isActive === true) activeFilter = true;
  if (isActive === 'false' || isActive === false) activeFilter = false;

  const { total, users } = await UsersModel.findUsers({
    skip,
    take: limitNum,
    role: queryRole,
    isActive: activeFilter,
    search
  });

  return {
    users,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

export const getUserDetails = async (id, currentUser) => {
  const user = await UsersModel.findUserById(id);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // Customer isolation
  if (currentUser.role === 'CUSTOMER' && currentUser.id !== id) {
    const error = new Error('Unauthorized to view this user profile');
    error.statusCode = 403;
    throw error;
  }

  // Staff cannot inspect Admin accounts
  if (currentUser.role === 'STAFF' && user.role === 'ADMIN') {
    const error = new Error('Staff are not authorized to access admin account details');
    error.statusCode = 403;
    throw error;
  }

  return user;
};

export const createStaff = async ({ email, password, firstName, lastName, phone, role = 'STAFF' }, currentUser) => {
  if (currentUser.role !== 'ADMIN') {
    const error = new Error('Only administrators can create staff or admin accounts');
    error.statusCode = 403;
    throw error;
  }

  if (!email || !password || !firstName || !lastName) {
    const error = new Error('Email, password, first name, and last name are required');
    error.statusCode = 400;
    throw error;
  }

  if (!isValidEmail(email)) {
    const error = new Error('Invalid email address format');
    error.statusCode = 400;
    throw error;
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    const error = new Error(passwordValidation.message);
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await UsersModel.findUserByEmail(email);
  if (existingUser) {
    const error = new Error('A user with this email address already exists');
    error.statusCode = 409;
    throw error;
  }

  const targetRole = role === 'ADMIN' ? 'ADMIN' : 'STAFF';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  return UsersModel.createStaffUser({
    email,
    password: hashedPassword,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    phone: phone ? phone.trim() : null,
    role: targetRole,
    isActive: true
  });
};

export const updateUser = async (id, updateData, currentUser) => {
  const existing = await UsersModel.findUserById(id);
  if (!existing) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // Customer can only update their own non-role info
  if (currentUser.role === 'CUSTOMER') {
    if (currentUser.id !== id) {
      const error = new Error('Forbidden: You can only update your own profile');
      error.statusCode = 403;
      throw error;
    }
  }

  // Staff cannot update admin profiles
  if (currentUser.role === 'STAFF' && existing.role === 'ADMIN') {
    const error = new Error('Staff are not permitted to modify admin profiles');
    error.statusCode = 403;
    throw error;
  }

  const sanitizedData = {};
  if (updateData.firstName) sanitizedData.firstName = updateData.firstName.trim();
  if (updateData.lastName) sanitizedData.lastName = updateData.lastName.trim();
  if (updateData.phone !== undefined) sanitizedData.phone = updateData.phone ? updateData.phone.trim() : null;

  // Only Admin can change roles
  if (updateData.role && currentUser.role === 'ADMIN') {
    if (['ADMIN', 'STAFF', 'CUSTOMER'].includes(updateData.role)) {
      sanitizedData.role = updateData.role;
    }
  }

  return UsersModel.updateUser(id, sanitizedData);
};

export const toggleUserStatus = async (id, isActive, currentUser) => {
  if (currentUser.role !== 'ADMIN') {
    const error = new Error('Only administrators can activate or deactivate accounts');
    error.statusCode = 403;
    throw error;
  }

  if (currentUser.id === id && isActive === false) {
    const error = new Error('You cannot deactivate your own administrative account');
    error.statusCode = 400;
    throw error;
  }

  const existing = await UsersModel.findUserById(id);
  if (!existing) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return UsersModel.updateUserStatus(id, Boolean(isActive));
};
