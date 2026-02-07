// Category service - business logic for category operations
import { supabaseAdmin } from '../config/supabase';
import { TABLES } from '../config/database';
import { Category, CreateCategoryDTO, UpdateCategoryDTO, CategoryFilter } from '../types';
import { NotFoundError, ConflictError, BadRequestError } from '../utils';

// Default company ID for development when no auth context
const getDefaultCompanyId = async (): Promise<string> => {
    const { data } = await supabaseAdmin
        .from(TABLES.COMPANIES)
        .select('id')
        .eq('is_active', true)
        .limit(1)
        .single();

    if (!data) {
        throw new BadRequestError('No company available. Please create a company first.');
    }
    return data.id;
};

export const getAll = async (companyId: string | undefined, filter: CategoryFilter) => {
    const { page = 1, limit = 20, search, is_active } = filter;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
        .from(TABLES.CATEGORIES)
        .select('*', { count: 'exact' });

    // Shared: Do NOT filter by companyId
    // if (companyId) {
    //     query = query.eq('company_id', companyId);
    // }

    if (search) {
        query = query.ilike('name', `%${search}%`);
    }

    if (typeof is_active === 'boolean') {
        query = query.eq('is_active', is_active);
    } else {
        // Default to active categories for public queries
        query = query.eq('is_active', true);
    }

    const { data, count, error } = await query
        .order('name', { ascending: true })
        .range(offset, offset + limit - 1);

    if (error) throw error;

    return { data: data || [], total: count || 0 };
};

export const getById = async (companyId: string | undefined, id: string): Promise<Category> => {
    let query = supabaseAdmin
        .from(TABLES.CATEGORIES)
        .select('*')
        .eq('id', id);

    const { data, error } = await query;

    if (error) throw error;
    if (!data || data.length === 0) {
        throw new NotFoundError('Category not found');
    }

    return data[0];
};

export const create = async (companyId: string | undefined, dto: CreateCategoryDTO): Promise<Category> => {
    // Use provided companyId or get default
    const effectiveCompanyId = companyId || await getDefaultCompanyId();

    // Check if category already exists (globally unique name for shared system)
    const { data: existing } = await supabaseAdmin
        .from(TABLES.CATEGORIES)
        .select('id')
        .eq('name', dto.name); // Check globally, not just per company

    if (existing && existing.length > 0) {
        throw new ConflictError('Category with this name already exists');
    }

    const { data, error } = await supabaseAdmin
        .from(TABLES.CATEGORIES)
        .insert({
            company_id: effectiveCompanyId,
            name: dto.name,
            description: dto.description,
            item_count: 0,
            is_active: true,
        })
        .select()
        .single();

    if (error) throw error;

    return data;
};

export const update = async (companyId: string | undefined, id: string, dto: UpdateCategoryDTO): Promise<Category> => {
    // Shared: Allow update by any company
    // Check if category exists
    await getById(undefined, id);

    const { data, error } = await supabaseAdmin
        .from(TABLES.CATEGORIES)
        .update({
            ...dto,
            updated_at: new Date().toISOString(),
        })
        // .eq('company_id', effectiveCompanyId) // Shared: Removed restriction
        .eq('id', id)
        .select('*');

    if (error) throw error;
    if (!data || data.length === 0) {
        throw new NotFoundError('Category not found or update failed');
    }

    return data[0];
};

export const remove = async (companyId: string | undefined, id: string): Promise<void> => {
    // Shared: Allow delete by any company
    // Check if category exists
    await getById(undefined, id);

    // Check if category has items (globally)
    const { count } = await supabaseAdmin
        .from(TABLES.INVENTORY)
        .select('*', { count: 'exact', head: true })
        .eq('category_id', id);

    if (count && count > 0) {
        throw new ConflictError('Cannot delete category with existing items');
    }

    const { error } = await supabaseAdmin
        .from(TABLES.CATEGORIES)
        .delete()
        // .eq('company_id', effectiveCompanyId) // Shared: Removed restriction
        .eq('id', id);

    if (error) throw error;
};

