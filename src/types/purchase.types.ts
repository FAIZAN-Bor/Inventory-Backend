// Purchase types - TypeScript interfaces for purchase
import { BaseEntity } from './common.types';

export type PurchaseStatus = 'draft' | 'completed' | 'cancelled';

export interface PurchaseItem {
    id: string;
    purchase_id: string;
    item_id: string;
    article_code: string;
    item_name: string;
    description?: string;
    unit: string;
    quantity: number;
    rate: number;
    total_amount: number;
    tax_percentage?: number;
    tax_amount?: number;
}

export interface Purchase extends BaseEntity {
    purchase_no: string;
    supplier_id: string;
    supplier_name: string;
    purchase_date: string;
    invoice_no?: string;
    invoice_date?: string;
    items: PurchaseItem[];
    subtotal: number;
    discount: number;
    tax_amount: number;
    other_charges: number;
    net_total: number;
    paid_amount: number;
    remaining_balance: number;
    payment_terms?: string;
    due_date?: string;
    remarks?: string;
    status: PurchaseStatus;
    received_by?: string;
}

export interface CreatePurchaseDTO {
    supplier_id: string;
    purchase_date: string;
    invoice_no?: string;
    invoice_date?: string;
    items: CreatePurchaseItemDTO[];
    discount?: number;
    other_charges?: number;
    paid_amount?: number;
    payment_terms?: string;
    due_date?: string;
    remarks?: string;
}

export interface CreatePurchaseItemDTO {
    item_id: string;
    quantity: number;
    rate: number;
    tax_percentage?: number;
}

export interface PurchaseFilter {
    search?: string;
    supplier_id?: string;
    status?: PurchaseStatus;
    start_date?: string;
    end_date?: string;
}
