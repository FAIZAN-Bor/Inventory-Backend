import { supabaseAdmin } from '../config/supabase';
import { TABLES } from '../config/database';
import { BadRequestError, NotFoundError } from '../utils';

export interface QuotationItem {
    id?: string;
    quotation_id?: string;
    inventory_id?: string | null;
    description: string;
    quantity: number;
    unit: string;
    rate: number;
    amount: number;
    brand?: string;
    remarks?: string;
}

export interface CreateQuotationDTO {
    party_name: string;
    party_id?: string; // Optional linkage
    date: string;
    items: QuotationItem[];
    notes?: string;
}

export interface UpdateQuotationDTO {
    party_name?: string;
    date?: string;
    status?: 'draft' | 'sent' | 'accepted' | 'rejected';
    items?: QuotationItem[];
    notes?: string;
}

const TABLE = 'quotations';
const ITEMS_TABLE = 'quotation_items';

/**
 * Generate a unique quotation number
 */
const generateQuotationNumber = async (companyId: string): Promise<string> => {
    // Format: Q-YYMM-XXXX (e.g., Q-2401-0001)
    const date = new Date();
    const prefix = `Q-${date.getFullYear().toString().substr(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}`;

    // Get last quotation number
    const { data } = await supabaseAdmin
        .from(TABLE)
        .select('quotation_number')
        .eq('company_id', companyId)
        .ilike('quotation_number', `${prefix}-%`)
        .order('quotation_number', { ascending: false })
        .limit(1)
        .single();

    let nextNum = 1;
    if (data && data.quotation_number) {
        const parts = data.quotation_number.split('-');
        if (parts.length === 3) {
            nextNum = parseInt(parts[2], 10) + 1;
        }
    }

    return `${prefix}-${nextNum.toString().padStart(4, '0')}`;
};

export const getAll = async (companyId: string, filter: any = {}) => {
    const { page = 1, limit = 20, search, status } = filter;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
        .from(TABLE)
        .select('*', { count: 'exact' })
        .eq('company_id', companyId);

    if (search) {
        query = query.or(`quotation_number.ilike.%${search}%,party_name.ilike.%${search}%`);
    }

    if (status) {
        query = query.eq('status', status);
    }

    const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw error;

    return { data: data || [], total: count || 0 };
};

export const getById = async (companyId: string, id: string) => {
    // Get quotation with items
    const { data: quotation, error } = await supabaseAdmin
        .from(TABLE)
        .select(`
            *,
            items:${ITEMS_TABLE}(*)
        `)
        .eq('company_id', companyId)
        .eq('id', id)
        .single();

    if (error || !quotation) {
        throw new NotFoundError('Quotation not found');
    }

    return quotation;
};

export const create = async (companyId: string, dto: CreateQuotationDTO) => {
    // Calculate total
    const total_amount = dto.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.rate)), 0);
    const quotation_number = await generateQuotationNumber(companyId);

    // Start transaction (mocked by sequential ops since Supabase REST doesn't support transactions easily without RPC)
    // 1. Create Quotation
    const { data: quotation, error: headerError } = await supabaseAdmin
        .from(TABLE)
        .insert({
            company_id: companyId,
            party_name: dto.party_name,
            party_id: dto.party_id || null,
            quotation_number,
            date: dto.date,
            total_amount,
            status: 'draft',
            notes: dto.notes
        })
        .select()
        .single();

    if (headerError) throw headerError;

    // 2. Create Items
    const items = dto.items.map(item => ({
        quotation_id: quotation.id,
        inventory_id: item.inventory_id || null,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        rate: item.rate,
        amount: Number(item.quantity) * Number(item.rate),
        brand: item.brand,
        remarks: item.remarks
    }));

    const { error: itemsError } = await supabaseAdmin
        .from(ITEMS_TABLE)
        .insert(items);

    if (itemsError) {
        // Rollback header (best effort)
        await supabaseAdmin.from(TABLE).delete().eq('id', quotation.id);
        throw itemsError;
    }

    return await getById(companyId, quotation.id);
};

export const update = async (companyId: string, id: string, dto: UpdateQuotationDTO) => {
    // Verify exists
    await getById(companyId, id);

    // Update items if provided
    if (dto.items) {
        // Calculate new total
        const total_amount = dto.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.rate)), 0);

        // Update header
        const { error: headerError } = await supabaseAdmin
            .from(TABLE)
            .update({
                party_name: dto.party_name,
                date: dto.date,
                status: dto.status,
                notes: dto.notes,
                total_amount,
                updated_at: new Date().toISOString()
            })
            .eq('company_id', companyId)
            .eq('id', id);

        if (headerError) throw headerError;

        // Replace items (Delete all + Insert new)
        // This is simpler than reconciling changes
        await supabaseAdmin
            .from(ITEMS_TABLE)
            .delete()
            .eq('quotation_id', id);

        const items = dto.items.map(item => ({
            quotation_id: id,
            inventory_id: item.inventory_id || null,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            rate: item.rate,
            amount: Number(item.quantity) * Number(item.rate),
            brand: item.brand,
            remarks: item.remarks
        }));

        const { error: itemsError } = await supabaseAdmin
            .from(ITEMS_TABLE)
            .insert(items);

        if (itemsError) throw itemsError;

    } else {
        // Just update header fields
        const updateData: any = { ...dto };
        delete updateData.items;
        updateData.updated_at = new Date().toISOString();

        const { error } = await supabaseAdmin
            .from(TABLE)
            .update(updateData)
            .eq('company_id', companyId)
            .eq('id', id);

        if (error) throw error;
    }

    return await getById(companyId, id);
};

export const remove = async (companyId: string, id: string) => {
    const { error } = await supabaseAdmin
        .from(TABLE)
        .delete()
        .eq('company_id', companyId)
        .eq('id', id);

    if (error) throw error;
};

export const getNextNumber = async (companyId: string): Promise<string> => {
    return await generateQuotationNumber(companyId);
};
