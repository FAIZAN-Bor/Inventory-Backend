// Delivery Challan controller - handles delivery challan operations
import { Response } from 'express';
import { asyncHandler, ApiResponse } from '../utils';
import { deliveryChallanService } from '../services';
import { AuthenticatedRequest } from '../types';

export const getAll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { data, total } = await deliveryChallanService.getAll(req.companyId!, req.query);
    const { page = 1, limit = 20 } = req.query as { page?: number; limit?: number };
    ApiResponse.paginated(res, data, Number(page), Number(limit), total, 'Delivery challans retrieved');
});

export const getHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { data, total } = await deliveryChallanService.getHistory(req.companyId!, req.query);
    const { page = 1, limit = 20 } = req.query as { page?: number; limit?: number };
    ApiResponse.paginated(res, data, Number(page), Number(limit), total, 'Delivery challan history retrieved');
});

export const getNextNumber = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await deliveryChallanService.getNextNumber(req.companyId!);
    ApiResponse.success(res, result, 'Next delivery challan number retrieved');
});

export const getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const challan = await deliveryChallanService.getById(req.companyId!, req.params.id);
    ApiResponse.success(res, challan, 'Delivery challan retrieved');
});

export const create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const challan = await deliveryChallanService.create(req.companyId!, req.body);
    ApiResponse.created(res, challan, 'Delivery challan created');
});

export const update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const challan = await deliveryChallanService.update(req.companyId!, req.params.id, req.body);
    ApiResponse.success(res, challan, 'Delivery challan updated');
});

export const markDelivered = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const challan = await deliveryChallanService.markDelivered(req.companyId!, req.params.id, req.body);
    ApiResponse.success(res, challan, 'Delivery challan marked as delivered');
});

export const cancel = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await deliveryChallanService.cancel(req.companyId!, req.params.id);
    ApiResponse.success(res, null, 'Delivery challan cancelled');
});

export const deleteChallan = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await deliveryChallanService.deleteChallan(req.companyId!, req.params.id);
    ApiResponse.success(res, null, 'Delivery challan deleted');
});
