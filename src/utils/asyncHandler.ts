// Async handler wrapper for Express route handlers
import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncFunction = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<unknown>;

/**
 * Wraps async route handlers to automatically catch errors
 * and pass them to the error handling middleware
 */
export const asyncHandler = (fn: AsyncFunction): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export default asyncHandler;
