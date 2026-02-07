import { Response } from 'express';
import { asyncHandler, ApiResponse } from '../utils';
import { salesService } from '../services';
import { AuthenticatedRequest } from '../types';

export const getAll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { data, total } = await salesService.getAll(req.companyId!, req.query);
    const { page = 1, limit = 20 } = req.query as { page?: number; limit?: number };
    ApiResponse.paginated(res, data, Number(page), Number(limit), total, 'Sales retrieved successfully');
});

export const getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const sale = await salesService.getById(req.companyId!, req.params.id);
    ApiResponse.success(res, sale, 'Sale retrieved successfully');
});

export const create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const sale = await salesService.create(req.companyId!, req.body);
    ApiResponse.created(res, sale, 'Sale created successfully');
});

export const update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const sale = await salesService.update(req.companyId!, req.params.id, req.body);
    ApiResponse.success(res, sale, 'Sale updated successfully');
});

export const remove = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await salesService.remove(req.companyId!, req.params.id);
    ApiResponse.noContent(res);
});

export const getNextNumber = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const nextNumber = await salesService.getNextInvoiceNumber(req.companyId!);
    ApiResponse.success(res, { nextNumber }, 'Next invoice number retrieved successfully');
});

export const getLastPartyPrice = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { partyId, itemId, articleCode } = req.query as { partyId: string; itemId: string; articleCode?: string };
    if (!partyId || (!itemId && !articleCode)) {
        ApiResponse.success(res, { price: 0 }, 'Missing parameters, returning 0');
        return;
    }
    const price = await salesService.getLastPrice(req.companyId!, partyId, itemId, articleCode);
    ApiResponse.success(res, { price }, 'Last party price retrieved successfully');
});
