import { Response } from 'express';
import { asyncHandler, ApiResponse } from '../utils';
import * as hsCodeService from '../services/hsCode.service'; // Direct import from file since index might not be updated yet
import { AuthenticatedRequest } from '../types';

export const getAll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { data, total } = await hsCodeService.getAll(req.companyId, req.query);
    const { page = 1, limit = 100 } = req.query as any;
    ApiResponse.paginated(res, data, Number(page), Number(limit), total, 'HS Codes retrieved');
});

export const getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const hsCode = await hsCodeService.getById(req.companyId, req.params.id);
    ApiResponse.success(res, hsCode, 'HS Code retrieved');
});

export const create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const hsCode = await hsCodeService.create(req.companyId, req.body);
    ApiResponse.created(res, hsCode, 'HS Code created');
});

export const update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const hsCode = await hsCodeService.update(req.companyId, req.params.id, req.body);
    ApiResponse.success(res, hsCode, 'HS Code updated');
});

export const remove = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await hsCodeService.remove(req.companyId, req.params.id);
    ApiResponse.success(res, null, 'HS Code deleted');
});
