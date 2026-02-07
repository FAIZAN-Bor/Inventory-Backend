// Auth controller - handles authentication operations
import { Request, Response } from 'express';
import { asyncHandler, ApiResponse } from '../utils';
import { authService } from '../services';

export const login = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    ApiResponse.success(res, result, 'Login successful');
});

export const register = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    ApiResponse.created(res, result, 'Registration successful');
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    await authService.forgotPassword(req.body.email);
    ApiResponse.success(res, null, 'Password reset email sent');
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
    await authService.resetPassword(req.body.token, req.body.password);
    ApiResponse.success(res, null, 'Password reset successful');
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.refreshToken(req.body.refreshToken);
    ApiResponse.success(res, result, 'Token refreshed');
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
    ApiResponse.success(res, null, 'Logged out successfully');
});
