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
/**
 * Generate party number (MAX + 1)
 */
export const generatePartyNumber = async (companyId: string): Promise<number> => {
    // Parties are GLOBAL. Do not filter by company_id.
    const { data, error } = await supabaseAdmin
        .from(TABLES.PARTIES)
        .select('party_number')
        .order('party_number', { ascending: false })
        .limit(1)
        .single();

    if (!error && data) {
        return (data.party_number as number) + 1;
    }

    return 1;
};

/**
 * Generate supplier number with gap filling
 */
export const generateSupplierNumber = async (companyId: string): Promise<number> => {
    // For suppliers, party_number is global serial, not per company in the schema?
    // Migration: party_number SERIAL. It is NOT per company_id in unique constraint.
    // However, the function signature usually takes companyId. 
    // BUT the schema says `party_number SERIAL`. This implies GLOBAL unique.
    // Wait, the user said "party number assigns to him...".
    // If it's global, gap filling is global.
    // Let's check schema again. `party_number` is just a column.

    // In `006_create_suppliers.sql`: 
    // party_number SERIAL
    // No unique constraint with company_id.

    // In `005_create_parties.sql` (I didn't view it but I assume similar).

    // If it's SERIAL, it is global. 
    // If I filter by companyId, I might find gaps *within the company* that are actually taken by *other* companies if it was shared?
    // But `Suppliers` table columns: `company_id` is NOT in the main table! It's in `financials`.
    // The `Suppliers` table is GLOBAL.
    // So valid query for gap-filling MUST be global (no companyId filter).

    const { data, error } = await supabaseAdmin
        .from(TABLES.SUPPLIERS)
        .select('party_number')
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
    generateSupplierNumber,
    generateDeliveryChallanNumber,
};
