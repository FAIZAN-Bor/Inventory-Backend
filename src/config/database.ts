// Database connection and configuration
import { supabaseAdmin } from './supabase';

// Database table names
export const TABLES = {
    COMPANIES: 'companies',
    USERS: 'users',
    CATEGORIES: 'categories',
    INVENTORY: 'inventory',
    PARTIES: 'parties',
    PARTY_FINANCIALS: 'party_financials',
    SUPPLIERS: 'suppliers',
    SUPPLIER_FINANCIALS: 'supplier_financials',
    SUPPLIER_TRANSACTIONS: 'supplier_transactions',
    SALES: 'sales',
    SALES_ITEMS: 'sales_items',
    PURCHASES: 'purchases',
    PURCHASE_ITEMS: 'purchase_items',
    QUOTATIONS: 'quotations',
    QUOTATION_ITEMS: 'quotation_items',
    DELIVERY_CHALLANS: 'delivery_challans',
    DELIVERY_CHALLAN_ITEMS: 'delivery_challan_items',
    SALES_TAX_INVOICES: 'sales_tax_invoices',
    SALES_TAX_INVOICE_ITEMS: 'sales_tax_invoice_items',
    TRANSACTIONS: 'transactions',
} as const;

// Test database connection
export const testConnection = async (): Promise<boolean> => {
    try {
        const { error } = await supabaseAdmin.from(TABLES.COMPANIES).select('id').limit(1);
        if (error) {
            console.error('Database connection test failed:', error.message);
            return false;
        }
        console.log('✅ Database connection successful');
        return true;
    } catch (err) {
        console.error('Database connection error:', err);
        return false;
    }
};

export default TABLES;
