import { supabaseAdmin } from '../config/supabase';
import { NotFoundError } from '../utils';
import { CreateSalesTaxInvoiceDTO, UpdateSalesTaxInvoiceDTO } from '../types/salesTaxInvoice.types';

const TABLE = 'sales_tax_invoices';
const ITEMS_TABLE = 'sales_tax_invoice_items';

/**
 * Generate a unique invoice number or check uniqueness
 * The frontend apparently handles generation (Ref No), but we should ensure it on backend or auto-generate if missing.
 * Frontend has `generateRefNo` logic: `invoices.length + 5657`.
 * We should probably respect what frontend sends but ensure uniqueness.
 */

export const getAll = async (companyId: string, filter: any = {}) => {
    const { page = 1, limit = 20, search } = filter;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
        .from(TABLE)
        .select(`
            *,
            items:${ITEMS_TABLE}(*)
        `, { count: 'exact' })
        .eq('company_id', companyId);

    if (search) {
        query = query.or(`voucher_no.ilike.%${search}%,party_name.ilike.%${search}%`);
    }

    const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw error;

    return { data: data || [], total: count || 0 };
};

export const getById = async (companyId: string, id: string) => {
    const { data, error } = await supabaseAdmin
        .from(TABLE)
        .select(`
            *,
            items:${ITEMS_TABLE}(*)
        `)
        .eq('company_id', companyId)
        .eq('id', id)
        .single();

    if (error || !data) {
        throw new NotFoundError('Invoice not found');
    }

    return data;
};

const generateNextVoucherNo = async (companyId: string, date: string): Promise<string> => {
    const d = new Date(date);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear().toString().slice(-2);
    const prefix = `STI-${month}${year}-`;

    // Find latest voucher for this month/year
    const { data } = await supabaseAdmin
        .from(TABLE)
        .select('voucher_no')
        .eq('company_id', companyId)
        .ilike('voucher_no', `${prefix}%`)
        .order('voucher_no', { ascending: false })
        .limit(1)
        .single();

    let sequence = 1;
    if (data && data.voucher_no) {
        const parts = data.voucher_no.split('-');
        if (parts.length === 3) {
            sequence = parseInt(parts[2]) + 1;
        }
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
};

// Helper to update HS Code quantities
const updateHSCodesStock = async (items: any[], operation: 'decrement' | 'increment') => {
    for (const item of items) {
        if (!item.hs_code || !item.weight_kgs) continue;

        // Find HS Code by code string
        const { data: hsCode, error: findError } = await supabaseAdmin
            .from('hs_codes')
            .select('id, quantity')
            .eq('code', item.hs_code)
            .single();

        if (findError || !hsCode) continue; // Skip if Not Found or Error

        const newQuantity = operation === 'decrement'
            ? Number(hsCode.quantity) - Number(item.weight_kgs)
            : Number(hsCode.quantity) + Number(item.weight_kgs);

        await supabaseAdmin
            .from('hs_codes')
            .update({ quantity: newQuantity })
            .eq('id', hsCode.id);
    }
};

export const create = async (companyId: string, dto: CreateSalesTaxInvoiceDTO) => {
    // 0. Use provided Voucher No (Required)
    const voucherNo = dto.voucher_no;
    if (!voucherNo || voucherNo.trim() === '') {
        throw new Error('Reference Number (Ref #) is required');
    }

    // 1. Insert Header
    const { data: invoice, error } = await supabaseAdmin
        .from(TABLE)
        .insert({
            company_id: companyId,
            voucher_no: voucherNo,
            date: dto.date,
            party_code: dto.party_code,
            party_name: dto.party_name,
            party_address: dto.party_address,
            party_ntn: dto.party_ntn,
            party_gst: dto.party_gst,
            total_quantity: dto.total_quantity,
            total_weight: dto.total_weight,
            total_amt_excl_tax: dto.total_amt_excl_tax,
            total_sales_tax: dto.total_sales_tax,
            grand_total: dto.grand_total,
            company_name: dto.company_name,
            created_by: 'Admin' // Placeholder
        })
        .select()
        .single();

    if (error) throw error;

    // 2. Insert Items
    if (dto.items && dto.items.length > 0) {
        const items = dto.items.map(({ id, ...item }) => ({
            ...item,
            sales_tax_invoice_id: invoice.id
        }));

        const { error: itemsError } = await supabaseAdmin
            .from(ITEMS_TABLE)
            .insert(items);

        if (itemsError) {
            // Rollback
            await supabaseAdmin.from(TABLE).delete().eq('id', invoice.id);
            throw itemsError;
        }

        // 3. Update HS Code Stock (Decrement)
        await updateHSCodesStock(items, 'decrement');
    }


    return await getById(companyId, invoice.id);
};

export const update = async (companyId: string, id: string, dto: UpdateSalesTaxInvoiceDTO) => {
    // 0. Revert old stock (Increment)
    const oldInvoice = await getById(companyId, id);
    if (oldInvoice.items && oldInvoice.items.length > 0) {
        await updateHSCodesStock(oldInvoice.items, 'increment');
    }

    // 1. Update Header
    const { error } = await supabaseAdmin
        .from(TABLE)
        .update({
            voucher_no: dto.voucher_no,
            date: dto.date,
            party_code: dto.party_code,
            party_name: dto.party_name,
            party_address: dto.party_address,
            party_ntn: dto.party_ntn,
            party_gst: dto.party_gst,
            total_quantity: dto.total_quantity,
            total_weight: dto.total_weight,
            total_amt_excl_tax: dto.total_amt_excl_tax,
            total_sales_tax: dto.total_sales_tax,
            grand_total: dto.grand_total,
            updated_at: new Date().toISOString()
        })
        .eq('company_id', companyId)
        .eq('id', id);

    if (error) throw error;

    // 2. Update Items (Delete all and re-insert is simplest for full updates)
    // Or smart update. For simplicity and correctness with IDs, easiest is replace.

    if (dto.items) {
        // Delete existing items
        await supabaseAdmin
            .from(ITEMS_TABLE)
            .delete()
            .eq('sales_tax_invoice_id', id);

        // Insert new items
        const items = dto.items.map(({ id: _, ...item }) => ({
            ...item,
            sales_tax_invoice_id: id,
        }));

        if (items.length > 0) {
            const { error: itemsError } = await supabaseAdmin
                .from(ITEMS_TABLE)
                .insert(items);

            if (itemsError) throw itemsError;

            // 3. Apply new stock deduction (Decrement)
            await updateHSCodesStock(items, 'decrement');
        }
    }

    return await getById(companyId, id);
};

export const remove = async (companyId: string, id: string) => {
    // 0. Revert stock (Increment) before deletion
    try {
        const oldInvoice = await getById(companyId, id);
        if (oldInvoice.items && oldInvoice.items.length > 0) {
            await updateHSCodesStock(oldInvoice.items, 'increment');
        }
    } catch (e) {
        // Invoice might not exist, proceed to delete attempt anyway
    }

    const { error } = await supabaseAdmin
        .from(TABLE)
        .delete()
        .eq('company_id', companyId)
        .eq('id', id);

    if (error) throw error;
};
