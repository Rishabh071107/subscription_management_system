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

export const registerCustomer = async ({ email, password, firstName, lastName, phone }) => {
  if (!email || !password || !firstName || !lastName) {
    const error = new Error('Email, password, first name, and last name are required');
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

  const existingUser = await AuthModel.findUserByEmail(email);
  if (existingUser) {
    const error = new Error('An account with this email address already exists');
    error.statusCode = 409;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = await AuthModel.createUser({
    email,
    password: hashedPassword,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    phone: phone ? phone.trim() : null,
    role: 'CUSTOMER'
  });

  const token = generateToken(newUser);

  await AuthModel.logUserAudit(newUser.id, 'CUSTOMER_SIGNUP', { email: newUser.email });

  return {
    user: newUser,
    token
  };
};

export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    const error = new Error('Email and password are required');
    error.statusCode = 400;
    throw error;
  }

  const user = await AuthModel.findUserByEmail(email);
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

  const user = await AuthModel.findUserByEmail(email);
  if (!user) {
    // For security, still return a success message so attackers cannot enumerate emails
    return {
      message: 'If an account exists with this email, password reset instructions have been generated.'
    };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

  await AuthModel.createPasswordResetToken(user.id, resetToken, expiresAt);
  await AuthModel.logUserAudit(user.id, 'FORGOT_PASSWORD_REQUESTED', { email: user.email });

  return {
    message: 'Password reset token generated successfully.',
    resetToken // Returned for development/demo workflow
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
