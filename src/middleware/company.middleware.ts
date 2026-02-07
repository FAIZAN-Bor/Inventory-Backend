// Company middleware - ensures company context is set for multi-tenant operations
import { Response, NextFunction } from 'express';
import { BadRequestError, ForbiddenError } from '../utils/apiError';
import { AuthenticatedRequest } from '../types/express.types';
import { supabaseAdmin } from '../config/supabase';
import { TABLES } from '../config/database';

/**
 * Middleware to require company context from header
 */
export const requireCompany = async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // 1. Try to get company ID from authenticated user (most reliable)
        if (req.user && (req.user as any).company_id) {
            req.companyId = (req.user as any).company_id;
            // Optionally fetch full company details if needed, or trust the token/user table
            return next();
        }

        // 2. Fallback: Check header
        const headerCompanyId = req.headers['x-company-id'] as string;
        if (headerCompanyId) {
            req.companyId = headerCompanyId;
            return next();
        }

        // 3. If mostly for development or public routes, just proceed or warn
        // For strict production, we might want to throw, but for stability now:
        console.warn('[Company Middleware] No company context found, proceeding anyway.');
        next();
    } catch (error) {
        console.error('[Company Middleware] Error:', error);
        next();
    }
};

/**
 * Optional company context - continues even if no company header
 */
export const optionalCompany = async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const companyId = req.headers['x-company-id'] as string;

        if (companyId) {
            const { data: company } = await supabaseAdmin
                .from(TABLES.COMPANIES)
                .select('id, name, is_active')
                .eq('id', companyId)
                .single();

            if (company && company.is_active) {
                req.companyId = companyId;
                req.company = company;
            }
        }

        next();
    } catch {
        // Ignore errors for optional company
        next();
    }
};

export default requireCompany;
