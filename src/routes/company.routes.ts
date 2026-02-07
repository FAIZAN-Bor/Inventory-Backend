// Company routes - public endpoint for getting company list

import { Router } from 'express';
import * as companyController from '../controllers/company.controller';

const router = Router();

// Get all companies (public - for signup/login dropdown)
router.get('/', companyController.getAll);

// Get company by ID
router.get('/:id', companyController.getById);

export default router;
