// Category types - TypeScript interfaces for category
import { BaseEntity } from './common.types';

export interface Category extends BaseEntity {
    name: string;
    description?: string;
    item_count: number;
    is_active: boolean;
}

export interface CreateCategoryDTO {
    name: string;
    description?: string;
}

export interface UpdateCategoryDTO {
    name?: string;
    description?: string;
    is_active?: boolean;
}

export interface CategoryFilter {
    page?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
}
