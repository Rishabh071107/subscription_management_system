import * as AuthService from './auth.service.js';
import { successResponse, errorResponse } from '../../utils/response.js';

export const register = async (req, res, next) => {
  try {
    const result = await AuthService.registerCustomer(req.body);
    return successResponse(res, 201, 'Customer registration successful', result);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await AuthService.loginUser(req.body);
    return successResponse(res, 200, 'Login successful', result);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await AuthService.getProfile(req.user.id);
    return successResponse(res, 200, 'User profile retrieved successfully', { user });
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
  // Stateless JWT logout - frontend clears token from local storage / memory
  return successResponse(res, 200, 'Logout successful');
};
