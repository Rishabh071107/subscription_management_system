import * as ProductsModel from './products.model.js';

export const listProducts = async ({ page = 1, limit = 10, search, isActive, productType }, currentUser) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  // Customers can only see active products
  let activeFilter = undefined;
  if (currentUser?.role === 'CUSTOMER') {
    activeFilter = true;
  } else {
    if (isActive === 'true' || isActive === true) activeFilter = true;
    if (isActive === 'false' || isActive === false) activeFilter = false;
  }

  const { total, products } = await ProductsModel.findProducts({
    skip,
    take: limitNum,
    search,
    isActive: activeFilter,
    productType
  });

  return {
    products,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

export const getProductById = async (id) => {
  const product = await ProductsModel.findProductById(id);
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }
  return product;
};

export const createProduct = async (productData) => {
  const { name, productType, salesPrice, costPrice, notes, variants } = productData;

  if (!name || name.trim() === '') {
    const error = new Error('Product name is required');
    error.statusCode = 400;
    throw error;
  }

  const sPrice = parseFloat(salesPrice);
  const cPrice = parseFloat(costPrice || 0);

  if (isNaN(sPrice) || sPrice < 0) {
    const error = new Error('Sales price must be a valid non-negative number');
    error.statusCode = 400;
    throw error;
  }

  if (isNaN(cPrice) || cPrice < 0) {
    const error = new Error('Cost price must be a valid non-negative number');
    error.statusCode = 400;
    throw error;
  }

  return ProductsModel.createProduct(
    {
      name: name.trim(),
      productType: productType ? productType.trim() : 'SOFTWARE',
      salesPrice: sPrice,
      costPrice: cPrice,
      notes: notes ? notes.trim() : null,
      isActive: true
    },
    Array.isArray(variants) ? variants : []
  );
};

export const updateProduct = async (id, productData) => {
  const existing = await ProductsModel.findProductById(id);
  if (!existing) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  const updatePayload = {};

  if (productData.name !== undefined) {
    if (!productData.name || productData.name.trim() === '') {
      const error = new Error('Product name cannot be empty');
      error.statusCode = 400;
      throw error;
    }
    updatePayload.name = productData.name.trim();
  }

  if (productData.productType !== undefined) {
    updatePayload.productType = productData.productType.trim();
  }

  if (productData.salesPrice !== undefined) {
    const sPrice = parseFloat(productData.salesPrice);
    if (isNaN(sPrice) || sPrice < 0) {
      const error = new Error('Sales price must be a non-negative number');
      error.statusCode = 400;
      throw error;
    }
    updatePayload.salesPrice = sPrice;
  }

  if (productData.costPrice !== undefined) {
    const cPrice = parseFloat(productData.costPrice);
    if (isNaN(cPrice) || cPrice < 0) {
      const error = new Error('Cost price must be a non-negative number');
      error.statusCode = 400;
      throw error;
    }
    updatePayload.costPrice = cPrice;
  }

  if (productData.notes !== undefined) {
    updatePayload.notes = productData.notes ? productData.notes.trim() : null;
  }

  if (productData.isActive !== undefined) {
    updatePayload.isActive = Boolean(productData.isActive);
  }

  return ProductsModel.updateProduct(id, updatePayload);
};

export const removeOrDeactivateProduct = async (id) => {
  const existing = await ProductsModel.findProductById(id);
  if (!existing) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  const hasUsage = (existing._count?.subscriptionLines > 0) || (existing._count?.invoiceLines > 0);

  if (hasUsage) {
    // Safely deactivate to prevent breaking historical invoices or active subscriptions
    const deactivated = await ProductsModel.updateProduct(id, { isActive: false });
    return {
      action: 'DEACTIVATED',
      message: 'Product has historical subscriptions/invoices and was safely deactivated instead of deleted.',
      product: deactivated
    };
  }

  await ProductsModel.deleteProduct(id);
  return {
    action: 'DELETED',
    message: 'Product permanently deleted successfully'
  };
};

export const addVariant = async (productId, variantData) => {
  const product = await ProductsModel.findProductById(productId);
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  if (!variantData.name || variantData.name.trim() === '') {
    const error = new Error('Variant name is required');
    error.statusCode = 400;
    throw error;
  }

  const addPrice = parseFloat(variantData.additionalPrice || 0);
  if (isNaN(addPrice) || addPrice < 0) {
    const error = new Error('Variant additional price must be a non-negative number');
    error.statusCode = 400;
    throw error;
  }

  return ProductsModel.createVariant(productId, {
    name: variantData.name.trim(),
    additionalPrice: addPrice,
    sku: variantData.sku ? variantData.sku.trim() : null
  });
};

export const removeVariant = async (variantId) => {
  return ProductsModel.deleteVariant(variantId);
};
