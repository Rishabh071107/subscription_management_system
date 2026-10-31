import * as PlansService from './plans.service.js';
import { successResponse } from '../../utils/response.js';

export const getPlans = async (req, res, next) => {
  try {
    const result = await PlansService.listPlans(req.query, req.user);
    return successResponse(res, 200, 'Plans retrieved successfully', result.plans, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const getPlanById = async (req, res, next) => {
  try {
    const plan = await PlansService.getPlanById(req.params.id);
    return successResponse(res, 200, 'Plan details retrieved successfully', { plan });
  } catch (error) {
    next(error);
  }
};

export const createPlan = async (req, res, next) => {
  try {
    const plan = await PlansService.createPlan(req.body);
    return successResponse(res, 201, 'Plan created successfully', { plan });
  } catch (error) {
    next(error);
  }
};

export const updatePlan = async (req, res, next) => {
  try {
    const plan = await PlansService.updatePlan(req.params.id, req.body);
    return successResponse(res, 200, 'Plan updated successfully', { plan });
  } catch (error) {
    next(error);
  }
};

export const updatePlanStatus = async (req, res, next) => {
  try {
    const { action } = req.body;
    const plan = await PlansService.updatePlanLifecycleStatus(req.params.id, action);
    return successResponse(res, 200, `Plan status updated to ${plan.status}`, { plan });
  } catch (error) {
    next(error);
  }
};
