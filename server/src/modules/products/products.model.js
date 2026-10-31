import prisma from '../../config/db.js';

export const findProducts = async ({ skip = 0, take = 10, search, isActive, productType }) => {
  const where = {};

  if (typeof isActive === 'boolean') {
    where.isActive = isActive;
  }

  if (productType) {
    where.productType = productType;
  }

  if (search && search.trim() !== '') {
    where.OR = [
      { name: { contains: search.trim(), mode: 'insensitive' } },
      { productType: { contains: search.trim(), mode: 'insensitive' } },
      { notes: { contains: search.trim(), mode: 'insensitive' } }
    ];
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        variants: {
          where: { isActive: true }
        }
      }
    })
  ]);

  return { total, products };
};

export const findVariantBySku = async (sku) => {
  return prisma.productVariant.findUnique({
    where: { sku }
  });
};

export const findProductById = async (id) => {
  return prisma.product.findUnique({
    where: { id },
    include: {
      variants: true,
      _count: {
        select: {
          subscriptionLines: true,
          invoiceLines: true,
          quotationLines: true
        }
      }
    }
  });
};

export const createProduct = async (data, variants = []) => {
  return prisma.product.create({
    data: {
      name: data.name,
      productType: data.productType || 'SOFTWARE',
      salesPrice: data.salesPrice,
      costPrice: data.costPrice,
      notes: data.notes,
      isActive: data.isActive !== undefined ? data.isActive : true,
      variants: {
        create: variants.map(v => ({
          name: v.name,
          additionalPrice: v.additionalPrice || 0,
          sku: v.sku || null,
          isActive: true
        }))
      }
    },
    include: {
      variants: true
    }
  });
};

export const updateProduct = async (id, data) => {
  return prisma.product.update({
    where: { id },
    data,
    include: {
      variants: true
    }
  });
};

export const deleteProduct = async (id) => {
  return prisma.product.delete({
    where: { id }
  });
};

export const createVariant = async (productId, variantData) => {
  return prisma.productVariant.create({
    data: {
      productId,
      name: variantData.name,
      additionalPrice: variantData.additionalPrice || 0,
      sku: variantData.sku || null,
      isActive: true
    }
  });
};

export const updateVariant = async (variantId, variantData) => {
  return prisma.productVariant.update({
    where: { id: variantId },
    data: variantData
  });
};

export const deleteVariant = async (variantId) => {
  return prisma.productVariant.delete({
    where: { id: variantId }
  });
};
