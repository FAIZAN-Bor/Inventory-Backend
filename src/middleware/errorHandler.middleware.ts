// Error handler middleware - centralized error handling
import { Request, Response, NextFunction } from 'express';
import { ApiError, ValidationError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';
import { config } from '../config';

/**
 * Global error handler middleware
 */
export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    // Log the error
    logger.error(err.message, {
        stack: err.stack,
        name: err.name,
    });

    // Handle ApiError instances
    if (err instanceof ApiError) {
        if (err instanceof ValidationError) {
            ApiResponse.error(res, err.message, err.statusCode, err.errors);
            return;
        }

        ApiResponse.error(res, err.message, err.statusCode);
        return;
    }

    // Handle Supabase errors
    if (err.message.includes('duplicate key') || err.message.includes('unique constraint')) {
        ApiResponse.error(res, 'A record with this value already exists', 409);
        return;
    }

    if (err.message.includes('foreign key constraint')) {
        ApiResponse.error(res, 'Referenced record does not exist', 400);
        return;
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        ApiResponse.error(res, 'Invalid token', 401);
        return;
    }

    if (err.name === 'TokenExpiredError') {
        ApiResponse.error(res, 'Token expired', 401);
        return;
    }

    // Default to 500 for unknown errors
    const message = config.nodeEnv === 'development'
        ? err.message
        : 'Internal Server Error';

    ApiResponse.error(res, message, 500);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    ApiResponse.error(res, `Route ${req.method} ${req.path} not found`, 404);
};

export default errorHandler;
