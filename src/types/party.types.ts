// Party types - TypeScript interfaces for party
import { BaseEntity } from './common.types';

export type PartyType = 'customer' | 'supplier';
export type PartyStatus = 'active' | 'inactive';

export interface Party extends BaseEntity {
    party_number: number;
    name: string;
    type: PartyType;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    cnic?: string;
    ntn?: string;
    strn?: string;
    credit_limit: number;
    opening_balance: number;
    current_balance: number;
    total_purchases: number;
    total_payments: number;
    status: PartyStatus;
    last_transaction_date?: string;
    notes?: string;
}

export interface CreatePartyDTO {
    name: string;
    type?: PartyType;
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
}

export interface UpdatePartyDTO {
    name?: string;
    type?: PartyType;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    cnic?: string;
    ntn?: string;
    strn?: string;
    credit_limit?: number;
    status?: PartyStatus;
    notes?: string;
}

export interface PartyFilter {
    page?: number;
    limit?: number;
    search?: string;
    type?: PartyType;
    status?: PartyStatus;
    city?: string;
}

export interface PartyTransaction {
    id: string;
    party_id: string;
    type: 'sale' | 'payment' | 'return' | 'purchase';
    invoice_no?: string;
    amount: number;
    paid_amount?: number;
    remaining_amount?: number;
    previous_balance: number;
    new_balance: number;
    date: string;
    description: string;
    payment_method?: 'cash' | 'bank' | 'cheque';
    cheque_no?: string;
    bank_name?: string;
}
