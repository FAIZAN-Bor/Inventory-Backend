import { Response } from 'express';
import { asyncHandler, ApiResponse } from '../utils';
import * as quotationService from '../services/quotation.service';
import { AuthenticatedRequest } from '../types';

/**
 * Get all quotations
 */
export const getAll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { data, total } = await quotationService.getAll(req.companyId!, req.query);
    const { page = 1, limit = 20 } = req.query as { page?: number; limit?: number };
    ApiResponse.paginated(res, data, Number(page), Number(limit), total, 'Quotations retrieved successfully');
});

/**
 * Get quotation by ID
 */
export const getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const quotation = await quotationService.getById(req.companyId!, req.params.id);
    ApiResponse.success(res, quotation, 'Quotation retrieved successfully');
});

/**
 * Create quotation
 */
export const create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const quotation = await quotationService.create(req.companyId!, req.body);
    ApiResponse.created(res, quotation, 'Quotation created successfully');
});

/**
 * Update quotation
 */
export const update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const quotation = await quotationService.update(req.companyId!, req.params.id, req.body);
    ApiResponse.success(res, quotation, 'Quotation updated successfully');
});

/**
 * Delete quotation
 */
export const remove = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await quotationService.remove(req.companyId!, req.params.id);
    ApiResponse.success(res, null, 'Quotation deleted successfully');
});

/**
 * Get next quotation number
 */
export const getNextNumber = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const number = await quotationService.getNextNumber(req.companyId!);
    ApiResponse.success(res, { number }, 'Next quotation number retrieved');
});
