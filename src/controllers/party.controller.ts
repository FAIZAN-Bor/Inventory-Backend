// Party controller - handles party/customer CRUD operations
import { Response } from 'express';
import { asyncHandler, ApiResponse } from '../utils';
import { partyService } from '../services';
import { AuthenticatedRequest } from '../types';

export const getAll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { data, total } = await partyService.getAll(req.companyId!, req.query);
    const { page = 1, limit = 20 } = req.query as { page?: number; limit?: number };
    ApiResponse.paginated(res, data, Number(page), Number(limit), total, 'Parties retrieved');
});

export const getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const party = await partyService.getById(req.companyId!, req.params.id);
    ApiResponse.success(res, party, 'Party retrieved');
});

export const getLedger = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const ledger = await partyService.getLedger(req.companyId!, req.params.id);
    ApiResponse.success(res, ledger, 'Party ledger retrieved');
});

export const create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const party = await partyService.create(req.companyId!, req.body);
    ApiResponse.created(res, party, 'Party created');
});

export const update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const party = await partyService.update(req.companyId!, req.params.id, req.body);
    ApiResponse.success(res, party, 'Party updated');
});

export const remove = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await partyService.remove(req.companyId!, req.params.id);
    ApiResponse.success(res, null, 'Party deleted');
});

export const recordPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await partyService.recordPayment(req.companyId!, req.params.id, req.body);
    ApiResponse.success(res, result, 'Payment recorded');
});

export const updatePayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await partyService.updatePayment(req.companyId!, req.params.id, req.params.paymentId, req.body);
    ApiResponse.success(res, result, 'Payment updated');
});

export const deletePayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await partyService.deletePayment(req.companyId!, req.params.id, req.params.paymentId);
    ApiResponse.success(res, null, 'Payment deleted');
});
