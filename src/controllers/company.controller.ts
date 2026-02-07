// Company controller
import { Request, Response, NextFunction } from 'express';
import * as companyService from '../services/company.service';

export const getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const result = await companyService.getAll();
        res.json({
            success: true,
            data: result.data,
            total: result.total
        });
    } catch (error) {
        next(error);
    }
};

export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const company = await companyService.getById(req.params.id);
        if (!company) {
            res.status(404).json({ success: false, message: 'Company not found' });
            return;
        }
        res.json({
            success: true,
            data: company
        });
    } catch (error) {
        next(error);
    }
};
