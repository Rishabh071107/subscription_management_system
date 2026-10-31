import * as ReportsService from './reports.service.js';
import { successResponse } from '../../utils/response.js';

export const getSubscriptionReport = async (req, res, next) => {
  try {
    const result = await ReportsService.getSubscriptionReport(req.query, req.user);
    if (result.isCsv) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      return res.status(200).send(result.content);
    }
    return res.status(200).json({
      success: true,
      message: 'Subscription report generated successfully',
      data: result.subscriptions,
      summary: result.summary,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

export const getInvoiceReport = async (req, res, next) => {
  try {
    const result = await ReportsService.getInvoiceReport(req.query, req.user);
    if (result.isCsv) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      return res.status(200).send(result.content);
    }
    return res.status(200).json({
      success: true,
      message: 'Invoice report generated successfully',
      data: result.invoices,
      summary: result.summary,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentReport = async (req, res, next) => {
  try {
    const result = await ReportsService.getPaymentReport(req.query, req.user);
    if (result.isCsv) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      return res.status(200).send(result.content);
    }
    return res.status(200).json({
      success: true,
      message: 'Payment report generated successfully',
      data: result.payments,
      summary: result.summary,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

export const getRevenueReport = async (req, res, next) => {
  try {
    const result = await ReportsService.getRevenueReport(req.query, req.user);
    if (result.isCsv) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      return res.status(200).send(result.content);
    }
    return successResponse(res, 200, 'Revenue report generated successfully', result);
  } catch (error) {
    next(error);
  }
};
