// Delivery Challan types - TypeScript interfaces for challan
import { BaseEntity } from './common.types';

export interface ChallanItem {
    id: string;
    challan_id: string;
    item_id?: string;
    item_name: string;
    po_number?: string;
    demand_number?: string;
    quantity: number;
    unit: string;
}

export interface DeliveryChallan extends BaseEntity {
    dc_number: string;
    date: string;
    party_id?: string;
    party_name: string;
    party_address?: string;
    courier_name?: string;
    items: ChallanItem[];
    total_qty: number;
    remarks?: string;
    status: 'pending' | 'delivered' | 'cancelled';
    delivered_date?: string;
    received_by?: string;
}

export interface CreateDeliveryChallanDTO {
    date: string;
    party_id?: string;
    party_name: string;
    party_address?: string;
    courier_name?: string;
    items: CreateChallanItemDTO[];
    remarks?: string;
}

export interface CreateChallanItemDTO {
    item_id?: string;
    item_name: string;
    po_number?: string;
    demand_number?: string;
    quantity: number;
    unit: string;
}

export interface DeliveryChallanFilter {
    search?: string;
    party_id?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
}
