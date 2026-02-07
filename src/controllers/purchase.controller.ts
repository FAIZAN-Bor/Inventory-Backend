import { Request, Response } from 'express';
import { asyncHandler, ApiResponse } from '../utils';
import { purchaseService } from '../services';
import { AuthenticatedRequest } from '../types/express.types';

export const getAll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const filters = req.query;
    console.log(`[PurchaseController] getAll called with companyId: ${req.companyId}`);
    const result = await purchaseService.getAll(req.companyId!, filters);
    ApiResponse.success(res, result, 'Purchases retrieved successfully');
});

export const getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const result = await purchaseService.getById(req.companyId!, id);
    ApiResponse.success(res, result, 'Purchase details retrieved successfully');
});

export const create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await purchaseService.create(req.companyId!, req.body);
    ApiResponse.created(res, result, 'Purchase created successfully');
});

export const remove = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    await purchaseService.remove(req.companyId!, id);
    ApiResponse.success(res, null, 'Purchase deleted successfully');
});

export const getNextNumber = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await purchaseService.getNextNumber(req.companyId!);
    ApiResponse.success(res, result, 'Next invoice number retrieved');
});
