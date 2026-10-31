import * as ProductsService from './products.service.js';
import { successResponse } from '../../utils/response.js';

export const getProducts = async (req, res, next) => {
  try {
    const result = await ProductsService.listProducts(req.query, req.user);
    return successResponse(res, 200, 'Products retrieved successfully', result.products, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await ProductsService.getProductById(req.params.id);
    return successResponse(res, 200, 'Product details retrieved successfully', { product });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const product = await ProductsService.createProduct(req.body);
    return successResponse(res, 201, 'Product created successfully', { product });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await ProductsService.updateProduct(req.params.id, req.body);
    return successResponse(res, 200, 'Product updated successfully', { product });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const result = await ProductsService.removeOrDeactivateProduct(req.params.id);
    return successResponse(res, 200, result.message, result);
  } catch (error) {
    next(error);
  }
};

export const addVariant = async (req, res, next) => {
  try {
    const variant = await ProductsService.addVariant(req.params.id, req.body);
    return successResponse(res, 201, 'Product variant added successfully', { variant });
  } catch (error) {
    next(error);
  }
};

export const deleteVariant = async (req, res, next) => {
  try {
    await ProductsService.removeVariant(req.params.variantId);
    return successResponse(res, 200, 'Variant deleted successfully');
  } catch (error) {
    next(error);
  }
};
