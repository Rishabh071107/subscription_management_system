import * as UsersService from './users.service.js';
import { successResponse } from '../../utils/response.js';

export const getUsers = async (req, res, next) => {
  try {
    const result = await UsersService.listUsers(req.query, req.user);
    return successResponse(res, 200, 'Users retrieved successfully', result.users, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await UsersService.getUserDetails(req.params.id, req.user);
    return successResponse(res, 200, 'User details retrieved successfully', { user });
  } catch (error) {
    next(error);
  }
};

export const createStaff = async (req, res, next) => {
  try {
    const staff = await UsersService.createStaff(req.body, req.user);
    return successResponse(res, 201, 'Staff account created successfully', { staff });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const updated = await UsersService.updateUser(req.params.id, req.body, req.user);
    return successResponse(res, 200, 'User updated successfully', { user: updated });
  } catch (error) {
    next(error);
  }
};

export const toggleUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const updated = await UsersService.toggleUserStatus(req.params.id, isActive, req.user);
    return successResponse(
      res,
      200,
      `User account ${updated.isActive ? 'activated' : 'deactivated'} successfully`,
      { user: updated }
    );
  } catch (error) {
    next(error);
  }
};
