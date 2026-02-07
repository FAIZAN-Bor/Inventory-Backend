// Supplier controller
import { Response } from 'express';
import { asyncHandler, ApiResponse } from '../utils';
import { supplierService } from '../services';
import { AuthenticatedRequest } from '../types';

export const getAll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { data, total } = await supplierService.getAll(req.companyId!, req.query);
    const { page = 1, limit = 20 } = req.query as { page?: number; limit?: number };
    ApiResponse.paginated(res, data, Number(page), Number(limit), total, 'Suppliers retrieved');
});

export const getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const supplier = await supplierService.getById(req.companyId!, req.params.id);
    ApiResponse.success(res, supplier, 'Supplier retrieved');
});

export const getLedger = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const ledger = await supplierService.getLedger(req.companyId!, req.params.id);
    ApiResponse.success(res, ledger, 'Supplier ledger retrieved');
});

export const create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const supplier = await supplierService.create(req.companyId!, req.body);
    ApiResponse.created(res, supplier, 'Supplier created');
});

export const update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const supplier = await supplierService.update(req.companyId!, req.params.id, req.body);
    ApiResponse.success(res, supplier, 'Supplier updated');
});

export const remove = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await supplierService.remove(req.companyId!, req.params.id);
    ApiResponse.success(res, null, 'Supplier deleted');
});

export const recordPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await supplierService.recordPayment(req.companyId!, req.params.id, req.body);
    ApiResponse.success(res, result, 'Payment recorded');
});

export const deletePayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await supplierService.deletePayment(req.companyId!, req.params.id, req.params.transactionId);
    ApiResponse.success(res, null, 'Payment deleted');
});

export const updatePayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await supplierService.updatePayment(req.companyId!, req.params.id, req.params.transactionId, req.body);
    ApiResponse.success(res, result, 'Payment updated');
});
