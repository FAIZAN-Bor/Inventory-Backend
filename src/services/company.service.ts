// Company service - business logic for company operations
import { supabaseAdmin } from '../config/supabase';
import { TABLES } from '../config/database';

export interface Company {
    id: string;
    name: string;
    is_active: boolean;
    created_at: string;
}

/**
 * Get all active companies
 */
export const getAll = async (): Promise<{ data: Company[]; total: number }> => {
    const { data, count, error } = await supabaseAdmin
        .from(TABLES.COMPANIES)
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('name', { ascending: true });

    if (error) throw error;

    return { data: data || [], total: count || 0 };
};

/**
 * Get company by ID
 */
export const getById = async (id: string): Promise<Company | null> => {
    const { data, error } = await supabaseAdmin
        .from(TABLES.COMPANIES)
        .select('*')
        .eq('id', id)
        .single();

    if (error) return null;

    return data;
};
