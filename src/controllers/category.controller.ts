// Category controller - handles category CRUD operations
import { Response } from 'express';
import { asyncHandler, ApiResponse } from '../utils';
import { categoryService } from '../services';
import { AuthenticatedRequest } from '../types';

export const getAll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { data, total } = await categoryService.getAll(req.companyId!, req.query);
    const { page = 1, limit = 20 } = req.query as { page?: number; limit?: number };
    ApiResponse.paginated(res, data, Number(page), Number(limit), total, 'Categories retrieved');
});

export const getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const category = await categoryService.getById(req.companyId!, req.params.id);
    ApiResponse.success(res, category, 'Category retrieved');
});

export const create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const category = await categoryService.create(req.companyId!, req.body);
    ApiResponse.created(res, category, 'Category created');
});

export const update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const category = await categoryService.update(req.companyId!, req.params.id, req.body);
    ApiResponse.success(res, category, 'Category updated');
});

export const remove = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await categoryService.remove(req.companyId!, req.params.id);
    ApiResponse.success(res, null, 'Category deleted');
});
