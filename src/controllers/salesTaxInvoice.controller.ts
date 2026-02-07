import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { asyncHandler, ApiResponse } from '../utils';
import * as salesTaxInvoiceService from '../services/salesTaxInvoice.service';

export const getAll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const filters = req.query;
    const result = await salesTaxInvoiceService.getAll(req.companyId!, filters);
    ApiResponse.success(res, result, 'Invoices retrieved successfully');
});

export const getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const result = await salesTaxInvoiceService.getById(req.companyId!, id);
    ApiResponse.success(res, result, 'Invoice retrieved successfully');
});

export const create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await salesTaxInvoiceService.create(req.companyId!, req.body);
    ApiResponse.created(res, result, 'Invoice created successfully');
});

export const update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const result = await salesTaxInvoiceService.update(req.companyId!, id, req.body);
    ApiResponse.success(res, result, 'Invoice updated successfully');
});

export const remove = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    await salesTaxInvoiceService.remove(req.companyId!, id);
    ApiResponse.success(res, null, 'Invoice deleted successfully');
});
