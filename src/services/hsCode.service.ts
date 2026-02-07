import { supabaseAdmin } from '../config/supabase';
import { NotFoundError, ConflictError, BadRequestError } from '../utils';

// Table name constant
const TABLE_NAME = 'hs_codes';

// Interfaces (Normally these would be in a types file, keeping here for brevity/isolation as per migration)
// Although types are usually imported, we'll define locally if not present in main types file yet
// or assume 'any' for now to speed up implementation if strictly defining everything slows down
export interface CreateHSCodeDTO {
    code: string;
    description: string;
    quantity: number;
}

export interface UpdateHSCodeDTO {
    code?: string;
    description?: string;
    quantity?: number;
}

// Default company ID helper
const getDefaultCompanyId = async (): Promise<string> => {
    const { data } = await supabaseAdmin
        .from('companies') // Hardcoded or from config
        .select('id')
        .eq('is_active', true)
        .limit(1)
        .single();

    if (!data) {
        throw new BadRequestError('No company available. Please create a company first.');
    }
    return data.id;
};

export const getAll = async (companyId: string | undefined, params: any) => {
    const { page = 1, limit = 100, search, sortBy = 'created_at', sortOrder = 'desc' } = params;
    const offset = (page - 1) * limit;

    // Use provided companyId or get default if not provided (though specific to QSM, we support the standard pattern)
    // HS Codes might be company specific.
    const effectiveCompanyId = companyId || await getDefaultCompanyId();

    let query = supabaseAdmin
        .from(TABLE_NAME)
        .select('*', { count: 'exact' })
        .eq('company_id', effectiveCompanyId);

    if (search) {
        query = query.or(`code.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, count, error } = await query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

    if (error) throw error;

    return { data: data || [], total: count || 0 };
};

export const getById = async (companyId: string | undefined, id: string) => {
    const effectiveCompanyId = companyId || await getDefaultCompanyId();

    const { data, error } = await supabaseAdmin
        .from(TABLE_NAME)
        .select('*')
        .eq('id', id)
        .eq('company_id', effectiveCompanyId)
        .single();

    if (error) throw error;
    if (!data) {
        throw new NotFoundError('HS Code not found');
    }

    return data;
};

export const create = async (companyId: string | undefined, dto: CreateHSCodeDTO) => {
    const effectiveCompanyId = companyId || await getDefaultCompanyId();

    // Check for duplicate code within the company
    const { data: existing } = await supabaseAdmin
        .from(TABLE_NAME)
        .select('id')
        .eq('company_id', effectiveCompanyId)
        .eq('code', dto.code)
        .single();

    if (existing) {
        throw new ConflictError('HS Code already exists');
    }

    const { data, error } = await supabaseAdmin
        .from(TABLE_NAME)
        .insert({
            ...dto,
            company_id: effectiveCompanyId
        })
        .select()
        .single();

    if (error) throw error;

    return data;
};

export const update = async (companyId: string | undefined, id: string, dto: UpdateHSCodeDTO) => {
    const effectiveCompanyId = companyId || await getDefaultCompanyId();

    // Check existence
    await getById(companyId, id);

    // If updating code, check uniqueness
    if (dto.code) {
        const { data: existing } = await supabaseAdmin
            .from(TABLE_NAME)
            .select('id')
            .eq('company_id', effectiveCompanyId)
            .eq('code', dto.code)
            .neq('id', id)
            .single();

        if (existing) {
            throw new ConflictError('HS Code already exists');
        }
    }

    const { data, error } = await supabaseAdmin
        .from(TABLE_NAME)
        .update({
            ...dto,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('company_id', effectiveCompanyId)
        .select()
        .single();

    if (error) throw error;

    return data;
};

export const remove = async (companyId: string | undefined, id: string) => {
    const effectiveCompanyId = companyId || await getDefaultCompanyId();

    // Check existence
    await getById(companyId, id);

    const { error } = await supabaseAdmin
        .from(TABLE_NAME)
        .delete()
        .eq('id', id)
        .eq('company_id', effectiveCompanyId);

    if (error) throw error;
};
