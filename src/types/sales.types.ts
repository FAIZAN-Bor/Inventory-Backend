import { BaseEntity } from './common.types';

export interface SalesItem extends BaseEntity {
    saleId: string;
    articleCode: string;
    itemId?: string;
    description?: string;
    quantity: number;
    unit: string;
    rate: number;
    totalAmount: number;
    taxPercentage: number;
}

export interface Sale extends BaseEntity {
    invoiceNo: string;
    customerType: 'party' | 'non-party';
    customerName: string;
    partyId?: string;
    termOfSale: string; // 'Cash' | 'Credit'
    invoiceDate: string;
    totalAmount: number;
    discount: number;
    tcsCharges: number;
    netTotal: number;
    cashReceived: number;
    remainingBalance: number;
    paymentOption: 'cash' | 'later' | 'partial';
    dueDays: number;
    dueDate?: string;
    remarks?: string;
    items?: SalesItem[];
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateSaleItemDTO {
    articleCode: string;
    itemId?: string;
    description?: string;
    quantity: number;
    unit: string;
    rate: number;
    totalAmount: number;
    taxPercentage?: number;
}

export interface CreateSaleDTO {
    invoiceNo?: string; // Optional, can be generated
    customerType: 'party' | 'non-party';
    customerName: string;
    partyId?: string;
    termOfSale: string;
    invoiceDate?: string;
    items: CreateSaleItemDTO[];
    totalAmount: number;
    discount: number;
    tcsCharges: number;
    netTotal: number;
    cashReceived: number;
    remainingBalance: number;
    paymentOption: 'cash' | 'later' | 'partial';
    dueDays?: number;
    dueDate?: string;
    remarks?: string;
}

export interface SalesFilter {
    page?: number;
    limit?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
    customerType?: string;
}
