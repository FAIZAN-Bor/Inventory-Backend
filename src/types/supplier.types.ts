// Supplier types - TypeScript interfaces for supplier
import { BaseEntity } from './common.types';

export type SupplierStatus = 'active' | 'inactive';

export interface Supplier extends BaseEntity {
    party_number: number; // Global ID
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    cnic?: string;
    ntn?: string;
    strn?: string;

    // Financials (Merged)
    credit_limit: number;
    opening_balance: number;
    current_balance: number;
    total_purchases: number;
    total_payments: number;

    status: SupplierStatus;
    last_transaction_date?: string;
    notes?: string;
}

export interface CreateSupplierDTO {
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    cnic?: string;
    ntn?: string;
    strn?: string;
    credit_limit?: number;
    opening_balance?: number;
    notes?: string;
    status?: SupplierStatus;
}

export interface UpdateSupplierDTO {
    name?: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    cnic?: string;
    ntn?: string;
    strn?: string;
    credit_limit?: number;
    status?: SupplierStatus;
    notes?: string;
}

export interface SupplierFilter {
    page?: number;
    limit?: number;
    search?: string;
    status?: SupplierStatus;
    city?: string;
}

export interface SupplierTransaction {
    id: string;
    company_id: string;
    supplier_id: string;
    type: 'payment' | 'purchase' | 'return'; // Different types for supplier
    invoice_no?: string;
    amount: number;
    previous_balance: number;
    new_balance: number;
    date: string;
    description: string;
    payment_method?: 'cash' | 'bank' | 'cheque';
    cheque_no?: string;
    bank_name?: string;
}
