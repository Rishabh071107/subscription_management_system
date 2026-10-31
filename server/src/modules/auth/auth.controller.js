import * as AuthService from './auth.service.js';
import { successResponse } from '../../utils/response.js';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});

export const signup = async (req, res, next) => {
  try {
    const result = await AuthService.registerCustomer(req.body);
    res.cookie('token', result.token, getCookieOptions());
    return successResponse(res, 201, 'Customer registration successful', result);
  } catch (error) {
    next(error);
  }
};

export const register = signup; // Alias for backward compatibility

export const login = async (req, res, next) => {
  try {
    const result = await AuthService.loginUser(req.body);
    res.cookie('token', result.token, getCookieOptions());
    return successResponse(res, 200, 'Login successful', result);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    return successResponse(res, 200, 'User profile retrieved successfully', { user: req.user });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const result = await AuthService.forgotPassword(req.body.email);
    return successResponse(res, 200, result.message, result);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const result = await AuthService.resetPassword(req.body);
    return successResponse(res, 200, result.message);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  res.clearCookie('token', getCookieOptions());
  return successResponse(res, 200, 'Logout successful');
};
