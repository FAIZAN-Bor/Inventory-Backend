// Dashboard controller - handles dashboard statistics
import { Response } from 'express';
import { asyncHandler, ApiResponse } from '../utils';
import { dashboardService } from '../services';
import { AuthenticatedRequest } from '../types';

export const getStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const stats = await dashboardService.getStats(req.companyId!);
    ApiResponse.success(res, stats, 'Dashboard stats retrieved');
});

export const getLowStock = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const items = await dashboardService.getLowStock(req.companyId!);
    ApiResponse.success(res, items, 'Low stock items retrieved');
});

export const getRecentTransactions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const transactions = await dashboardService.getRecentTransactions(req.companyId!);
    ApiResponse.success(res, transactions, 'Recent transactions retrieved');
});

export const getSalesChart = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const chartData = await dashboardService.getSalesChart(req.companyId!);
    ApiResponse.success(res, chartData, 'Sales chart data retrieved');
});
