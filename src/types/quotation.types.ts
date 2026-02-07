// Quotation types - TypeScript interfaces for quotation
import { BaseEntity } from './common.types';

export type QuotationStatus = 'draft' | 'sent' | 'received' | 'comparison' | 'awarded' | 'closed';

export interface QuotationItem {
    id: string;
    quotation_id: string;
    item_id?: string;
    article_code?: string;
    item_name: string;
    description?: string;
    unit: string;
    quantity: number;
}

export interface SupplierQuote {
    supplier_id: string;
    supplier_name: string;
    item_quotes: {
        item_id: string;
        rate: number;
        delivery_days: number;
        available: boolean;
    }[];
    total_amount: number;
    tax_percentage: number;
    discount: number;
    final_amount: number;
    remarks?: string;
    submitted_date?: string;
}

export interface Quotation extends BaseEntity {
    quotation_no: string;
    title: string;
    description?: string;
    request_date: string;
    due_date: string;
    status: QuotationStatus;
    items: QuotationItem[];
    suppliers: string[];
    quotes: SupplierQuote[];
    selected_supplier_id?: string;
    created_by: string;
}

export interface CreateQuotationDTO {
    title: string;
    description?: string;
    request_date: string;
    due_date: string;
    items: CreateQuotationItemDTO[];
    suppliers: string[];
}

export interface CreateQuotationItemDTO {
    item_id?: string;
    item_name: string;
    description?: string;
    unit: string;
    quantity: number;
}

export interface QuotationFilter {
    search?: string;
    status?: QuotationStatus;
    supplier_id?: string;
    start_date?: string;
    end_date?: string;
}
