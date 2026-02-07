// API response helper for consistent response formatting
import { Response } from 'express';

interface ApiResponseData<T> {
    success: boolean;
    message?: string;
    data?: T;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
}

export class ApiResponse<T = unknown> {
    static success<T>(
        res: Response,
        data: T,
        message = 'Success',
        statusCode = 200,
        meta?: ApiResponseData<T>['meta']
    ): Response {
        const response: ApiResponseData<T> = {
            success: true,
            message,
            data,
        };

        if (meta) {
            response.meta = meta;
        }

        return res.status(statusCode).json(response);
    }

    static created<T>(res: Response, data: T, message = 'Created successfully'): Response {
        return this.success(res, data, message, 201);
    }

    static noContent(res: Response): Response {
        return res.status(204).send();
    }

    static error(
        res: Response,
        message: string,
        statusCode = 500,
        errors?: Record<string, string>[]
    ): Response {
        const response: { success: boolean; message: string; errors?: Record<string, string>[] } = {
            success: false,
            message,
        };

        if (errors && errors.length > 0) {
            response.errors = errors;
        }

        return res.status(statusCode).json(response);
    }

    static paginated<T>(
        res: Response,
        data: T[],
        page: number,
        limit: number,
        total: number,
        message = 'Success'
    ): Response {
        return this.success(res, data, message, 200, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        });
    }
}

export default ApiResponse;
