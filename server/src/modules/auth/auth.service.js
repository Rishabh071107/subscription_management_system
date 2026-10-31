import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { JWT_CONFIG } from '../../config/jwt.js';
import { isValidEmail, validatePassword } from '../../utils/validators.js';
import * as AuthModel from './auth.model.js';

/**
 * Generates JWT for a user
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    JWT_CONFIG.secret,
    { expiresIn: JWT_CONFIG.expiresIn }
  );
};

export const registerCustomer = async (data) => {
  const { email, password, phone } = data;
  let firstName = data.firstName;
  let lastName = data.lastName;

  if (!firstName && data.name) {
    const parts = data.name.trim().split(/\s+/);
    firstName = parts[0] || 'User';
    lastName = parts.slice(1).join(' ') || 'Customer';
  }

  if (!email || !password || !firstName) {
    const error = new Error('Email, password, and name are required');
    error.statusCode = 400;
    throw error;
  }

  if (!isValidEmail(email)) {
    const error = new Error('Please provide a valid email address');
    error.statusCode = 400;
    throw error;
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    const error = new Error(passwordValidation.message);
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await AuthModel.findUserByEmail(normalizedEmail);
  if (existingUser) {
    const error = new Error('An account with this email address already exists');
    error.statusCode = 409;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // CRITICAL REQUIREMENT: Public signup assigns CUSTOMER role only.
  // Any role passed by client (ADMIN, STAFF) is explicitly ignored.
  const newUser = await AuthModel.createUser({
    email: normalizedEmail,
    password: hashedPassword,
    firstName: firstName.trim(),
    lastName: (lastName || '').trim(),
    phone: phone ? phone.trim() : null,
    role: 'CUSTOMER'
  });

  const token = generateToken(newUser);

  await AuthModel.logUserAudit(newUser.id, 'CUSTOMER_SIGNUP', { email: newUser.email, role: 'CUSTOMER' });

  // Sanitize user object (never return password hash)
  const safeUser = {
    id: newUser.id,
    email: newUser.email,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    phone: newUser.phone,
    role: newUser.role,
    isActive: newUser.isActive,
    createdAt: newUser.createdAt
  };

  return {
    user: safeUser,
    token
  };
};

export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    const error = new Error('Email and password are required');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await AuthModel.findUserByEmail(normalizedEmail);

  // Return generic error to prevent email enumeration
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('This account has been deactivated. Please contact support.');
    error.statusCode = 403;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user);

  await AuthModel.logUserAudit(user.id, 'USER_LOGIN', { email: user.email, role: user.role });

  const safeUser = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt
  };

  return {
    user: safeUser,
    token
  };
};

export const getProfile = async (userId) => {
  const user = await AuthModel.findUserById(userId);
  if (!user) {
    const error = new Error('User profile not found');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

export const forgotPassword = async (email) => {
  if (!email || !isValidEmail(email)) {
    const error = new Error('Please provide a valid email address');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await AuthModel.findUserByEmail(normalizedEmail);

  if (!user) {
    // Return generic success to avoid leaking email existence
    return {
      message: 'If an account exists with this email, password reset instructions have been generated.'
    };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

  await AuthModel.createPasswordResetToken(user.id, resetToken, expiresAt);
  await AuthModel.logUserAudit(user.id, 'FORGOT_PASSWORD_REQUESTED', { email: user.email });

  return {
    message: 'If an account exists with this email, password reset instructions have been generated.',
    resetToken // Exposed for development/testing convenience
  };
};

export const resetPassword = async ({ token, newPassword }) => {
  if (!token || !newPassword) {
    const error = new Error('Token and new password are required');
    error.statusCode = 400;
    throw error;
  }

  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    const error = new Error(passwordValidation.message);
    error.statusCode = 400;
    throw error;
  }

  const record = await AuthModel.findPasswordResetToken(token);
  if (!record) {
    const error = new Error('Invalid or expired password reset token');
    error.statusCode = 400;
    throw error;
  }

  if (record.isUsed) {
    const error = new Error('This password reset token has already been used');
    error.statusCode = 400;
    throw error;
  }

  if (new Date() > new Date(record.expiresAt)) {
    const error = new Error('Password reset token has expired. Please request a new one.');
    error.statusCode = 400;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  await AuthModel.updateUserPassword(record.userId, hashedPassword);
  await AuthModel.markTokenAsUsed(record.id);
  await AuthModel.logUserAudit(record.userId, 'PASSWORD_RESET_COMPLETED', {});

  return {
    message: 'Password has been successfully reset. You may now log in with your new password.'
  };
};
