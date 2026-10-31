import * as QuotationsModel from './quotations.model.js';
import prisma from '../../config/db.js';

/**
 * Generate unique quotation reference number
 */
const generateQuotationNumber = async () => {
  const year = new Date().getFullYear();
  const count = await QuotationsModel.countQuotationsForYear(year);
  const nextNum = (count + 1).toString().padStart(4, '0');
  return `QT-${year}-${nextNum}`;
};

/**
 * Calculate totals for quotation lines
 */
const processLines = (rawLines, defaultTaxRate = 18.0) => {
  if (!Array.isArray(rawLines) || rawLines.length === 0) {
    const error = new Error('Quotation must contain at least one product line item');
    error.statusCode = 400;
    throw error;
  }

  let overallSubtotal = 0;
  let overallTax = 0;

  const processed = rawLines.map(line => {
    const qty = parseInt(line.quantity, 10);
    const uPrice = parseFloat(line.unitPrice);
    const tRate = line.taxRate !== undefined ? parseFloat(line.taxRate) : defaultTaxRate;

    if (isNaN(qty) || qty <= 0) {
      throw new Error(`Invalid line quantity: ${line.quantity}`);
    }
    if (isNaN(uPrice) || uPrice < 0) {
      throw new Error(`Invalid unit price: ${line.unitPrice}`);
    }

    const subtotal = Math.round(qty * uPrice * 100) / 100;
    const tax = Math.round(subtotal * (tRate / 100) * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    overallSubtotal += subtotal;
    overallTax += tax;

    return {
      productId: line.productId,
      variantId: line.variantId || null,
      description: line.description || '',
      quantity: qty,
      unitPrice: uPrice,
      taxRate: tRate,
      subtotal,
      total
    };
  });

  return {
    processedLines: processed,
    subtotal: Math.round(overallSubtotal * 100) / 100,
    taxAmount: Math.round(overallTax * 100) / 100
  };
};

export const listQuotations = async ({ page = 1, limit = 10, customerId, status, isTemplate, search }, currentUser) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  // Customer data isolation: Customers can ONLY see their own quotations
  let filterCustomerId = customerId;
  if (currentUser.role === 'CUSTOMER') {
    filterCustomerId = currentUser.id;
  }

  let templateFilter = undefined;
  if (isTemplate === 'true' || isTemplate === true) templateFilter = true;
  if (isTemplate === 'false' || isTemplate === false) templateFilter = false;

  const { total, quotations } = await QuotationsModel.findQuotations({
    skip,
    take: limitNum,
    customerId: filterCustomerId,
    status,
    isTemplate: templateFilter,
    search
  });

  return {
    quotations,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

export const getQuotationById = async (id, currentUser) => {
  const quotation = await QuotationsModel.findQuotationById(id);
  if (!quotation) {
    const error = new Error('Quotation not found');
    error.statusCode = 404;
    throw error;
  }

  // Customer data isolation
  if (currentUser.role === 'CUSTOMER' && quotation.customerId !== currentUser.id) {
    const error = new Error('Unauthorized to view this quotation');
    error.statusCode = 403;
    throw error;
  }

  return quotation;
};

export const createQuotation = async (quotationData, currentUser) => {
  const {
    customerId,
    lines,
    taxRate = 18.0,
    discountAmount = 0,
    validUntil,
    notes,
    termsAndConditions,
    isTemplate = false,
    templateName
  } = quotationData;

  const targetCustomerId = currentUser.role === 'CUSTOMER' ? currentUser.id : customerId;

  if (!targetCustomerId) {
    const error = new Error('A customer must be specified for the quotation');
    error.statusCode = 400;
    throw error;
  }

  const { processedLines, subtotal, taxAmount } = processLines(lines, parseFloat(taxRate) || 18.0);

  const discount = Math.max(0, parseFloat(discountAmount) || 0);
  const totalAmount = Math.max(0, Math.round((subtotal + taxAmount - discount) * 100) / 100);

  const quotationNumber = await generateQuotationNumber();

  return QuotationsModel.createQuotation(
    {
      quotationNumber,
      customerId: targetCustomerId,
      createdById: currentUser.id,
      status: 'DRAFT',
      isTemplate: Boolean(isTemplate),
      templateName: templateName ? templateName.trim() : null,
      subtotal,
      taxRate: parseFloat(taxRate) || 18.0,
      taxAmount,
      discountAmount: discount,
      totalAmount,
      validUntil: validUntil ? new Date(validUntil) : null,
      notes: notes ? notes.trim() : null,
      termsAndConditions: termsAndConditions ? termsAndConditions.trim() : null
    },
    processedLines
  );
};

export const updateQuotation = async (id, quotationData, currentUser) => {
  const existing = await QuotationsModel.findQuotationById(id);
  if (!existing) {
    const error = new Error('Quotation not found');
    error.statusCode = 404;
    throw error;
  }

  if (['CONVERTED', 'CANCELLED'].includes(existing.status)) {
    const error = new Error(`Cannot modify a quotation that has already been ${existing.status.toLowerCase()}`);
    error.statusCode = 400;
    throw error;
  }

  const updateFields = {};

  if (quotationData.notes !== undefined) updateFields.notes = quotationData.notes;
  if (quotationData.termsAndConditions !== undefined) updateFields.termsAndConditions = quotationData.termsAndConditions;
  if (quotationData.validUntil !== undefined) updateFields.validUntil = quotationData.validUntil ? new Date(quotationData.validUntil) : null;
  if (quotationData.status !== undefined) updateFields.status = quotationData.status;

  let newLines = null;
  if (Array.isArray(quotationData.lines)) {
    const { processedLines, subtotal, taxAmount } = processLines(
      quotationData.lines,
      parseFloat(quotationData.taxRate || existing.taxRate)
    );
    const discount = quotationData.discountAmount !== undefined
      ? parseFloat(quotationData.discountAmount)
      : parseFloat(existing.discountAmount);
    const totalAmount = Math.max(0, Math.round((subtotal + taxAmount - discount) * 100) / 100);

    updateFields.subtotal = subtotal;
    updateFields.taxAmount = taxAmount;
    updateFields.discountAmount = discount;
    updateFields.totalAmount = totalAmount;
    newLines = processedLines;
  }

  return QuotationsModel.updateQuotation(id, updateFields, newLines);
};

export const updateQuotationStatus = async (id, status, currentUser) => {
  const existing = await QuotationsModel.findQuotationById(id);
  if (!existing) {
    const error = new Error('Quotation not found');
    error.statusCode = 404;
    throw error;
  }

  if (!['DRAFT', 'SENT', 'CONFIRMED', 'CANCELLED'].includes(status)) {
    const error = new Error(`Invalid quotation status: ${status}`);
    error.statusCode = 400;
    throw error;
  }

  return QuotationsModel.updateQuotation(id, { status });
};

/**
 * Converts confirmed quotation into an active or confirmed subscription
 */
export const convertToSubscription = async (id, { planId, paymentTerms = 'Net 15', autoRenew = true }, currentUser) => {
  const quotation = await QuotationsModel.findQuotationById(id);
  if (!quotation) {
    const error = new Error('Quotation not found');
    error.statusCode = 404;
    throw error;
  }

  if (quotation.status === 'CONVERTED') {
    const error = new Error('This quotation has already been converted to a subscription');
    error.statusCode = 400;
    throw error;
  }

  if (quotation.status === 'CANCELLED') {
    const error = new Error('Cancelled quotations cannot be converted to subscriptions');
    error.statusCode = 400;
    throw error;
  }

  const plan = await prisma.plan.findUnique({
    where: { id: planId }
  });

  if (!plan) {
    const error = new Error('Specified subscription plan does not exist');
    error.statusCode = 404;
    throw error;
  }

  // Generate subscription number
  const year = new Date().getFullYear();
  const subCount = await prisma.subscription.count({
    where: {
      createdAt: {
        gte: new Date(`${year}-01-01T00:00:00.000Z`),
        lte: new Date(`${year}-12-31T23:59:59.999Z`)
      }
    }
  });
  const subscriptionNumber = `SUB-${year}-${(subCount + 1).toString().padStart(4, '0')}`;

  const startDate = new Date();
  let nextBillingDate = new Date();

  // Calculate next billing date based on plan interval
  if (plan.billingInterval === 'DAILY') {
    nextBillingDate.setDate(nextBillingDate.getDate() + 1);
  } else if (plan.billingInterval === 'WEEKLY') {
    nextBillingDate.setDate(nextBillingDate.getDate() + 7);
  } else if (plan.billingInterval === 'MONTHLY') {
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
  } else if (plan.billingInterval === 'YEARLY') {
    nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
  }

  return prisma.$transaction(async (tx) => {
    // 1. Create subscription with lines copied from quotation
    const subscription = await tx.subscription.create({
      data: {
        subscriptionNumber,
        customerId: quotation.customerId,
        planId: plan.id,
        quotationId: quotation.id,
        status: 'CONFIRMED',
        startDate,
        nextBillingDate,
        paymentTerms,
        billingInterval: plan.billingInterval,
        subtotal: quotation.subtotal,
        taxRate: quotation.taxRate,
        taxAmount: quotation.taxAmount,
        discountAmount: quotation.discountAmount,
        totalAmount: quotation.totalAmount,
        autoRenew: Boolean(autoRenew),
        lines: {
          create: quotation.lines.map(line => ({
            productId: line.productId,
            variantId: line.variantId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            taxRate: line.taxRate,
            subtotal: line.subtotal,
            total: line.total
          }))
        }
      },
      include: {
        customer: true,
        plan: true,
        lines: {
          include: {
            product: true,
            variant: true
          }
        }
      }
    });

    // 2. Mark quotation as CONVERTED
    await tx.quotation.update({
      where: { id: quotation.id },
      data: { status: 'CONVERTED' }
    });

    return subscription;
  });
};
