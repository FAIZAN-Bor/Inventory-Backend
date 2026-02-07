// Invoice number generator utility
import { supabaseAdmin } from '../config/supabase';
import { TABLES } from '../config/database';

type InvoiceType = 'SALE' | 'PURCHASE' | 'QUOTATION' | 'DC' | 'STI';

const PREFIXES: Record<InvoiceType, string> = {
    SALE: 'INV',
    PURCHASE: 'PUR',
    QUOTATION: 'QTN',
    DC: 'DC',
    STI: 'STI',
};

const TABLE_MAP: Record<InvoiceType, string> = {
    SALE: TABLES.SALES,
    PURCHASE: TABLES.PURCHASES,
    QUOTATION: TABLES.QUOTATIONS,
    DC: TABLES.DELIVERY_CHALLANS,
    STI: TABLES.SALES_TAX_INVOICES,
};

const COLUMN_MAP: Record<InvoiceType, string> = {
    SALE: 'invoice_no',
    PURCHASE: 'purchase_no',
    QUOTATION: 'quotation_no',
    DC: 'dc_number',
    STI: 'voucher_no',
};

/**
 * Generate next invoice number for a given type and company
 */
export const generateInvoiceNumber = async (
    type: InvoiceType,
    companyId: string
): Promise<string> => {
    const table = TABLE_MAP[type];
    const column = COLUMN_MAP[type];
    const prefix = PREFIXES[type];

    // Get the latest invoice number for this company
    const { data, error } = await supabaseAdmin
        .from(table)
        .select(column)
        .eq('company_id', companyId)
        .order(column, { ascending: false })
        .limit(1)
        .single();

    let nextNumber = 1;

    if (!error && data) {
        // Extract number from existing invoice number (e.g., "INV-0001" -> 1)
        const record = data as any;
        const match = (record[column] as string).match(/\d+$/);
        if (match) {
            nextNumber = parseInt(match[0], 10) + 1;
        }
    }

    // Format: PREFIX-0001
    return `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
};

/**
 * Generate article code for inventory
 */
export const generateArticleCode = async (
    companyId: string,
    categoryPrefix = 'ART'
): Promise<string> => {
    const { data, error } = await supabaseAdmin
        .from(TABLES.INVENTORY)
        .select('article_code')
        .eq('company_id', companyId)
        .order('article_code', { ascending: false })
        .limit(1)
        .single();

    let nextNumber = 1;

    if (!error && data) {
        const match = (data.article_code as string).match(/\d+$/);
        if (match) {
            nextNumber = parseInt(match[0], 10) + 1;
        }
    }

    return `${categoryPrefix}-${nextNumber.toString().padStart(5, '0')}`;
};

/**
 * Generate party number
 */
export const generatePartyNumber = async (companyId: string): Promise<number> => {
    const { data, error } = await supabaseAdmin
        .from(TABLES.PARTIES)
        .select('party_number')
        .eq('company_id', companyId)
        .order('party_number', { ascending: false })
        .limit(1)
        .single();

    if (!error && data) {
        return (data.party_number as number) + 1;
    }

    return 1;
};

/**
 * Generate Delivery Challan number with format DC-MMYY-0000
 */
export const generateDeliveryChallanNumber = async (companyId: string): Promise<string> => {
    const today = new Date();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear().toString().slice(-2);
    const prefix = `DC-${month}${year}`;

    // Find last DC with this prefix
    const { data, error } = await supabaseAdmin
        .from(TABLES.DELIVERY_CHALLANS)
        .select('dc_number')
        .eq('company_id', companyId)
        .ilike('dc_number', `${prefix}-%`)
        .order('dc_number', { ascending: false })
        .limit(1)
        .single();

    let nextNumber = 1;

    if (!error && data) {
        // Extract number from DC-MMYY-0000
        const parts = (data.dc_number as string).split('-');
        if (parts.length === 3) {
            nextNumber = parseInt(parts[2], 10) + 1;
        }
    }

    return `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
};

export default {
    generateInvoiceNumber,
    generateArticleCode,
    generatePartyNumber,
    generateDeliveryChallanNumber,
};
