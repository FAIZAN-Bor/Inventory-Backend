// Inventory types - TypeScript interfaces for inventory
import { BaseEntity } from './common.types';

export interface InventoryItem extends BaseEntity {
    article_code: string;
    name: string;
    description?: string;
    category_id: string;
    category_name?: string;
    unit: string;
    location?: string;
    image_url?: string;
    rate: number;
    sale_price?: number;
    min_sale_price?: number;
    current_stock: number;
    min_stock: number;
    last_restocked?: string;
    is_active: boolean;
}

export interface CreateInventoryDTO {
    article_code?: string;
    name: string;
    description?: string;
    category_id: string;
    unit: string;
    location?: string;
    image_url?: string;
    rate: number;
    sale_price?: number;
    min_sale_price?: number;
    current_stock: number;
    min_stock: number;
}

export interface UpdateInventoryDTO {
    article_code?: string;
    name?: string;
    description?: string;
    category_id?: string;
    unit?: string;
    location?: string;
    image_url?: string;
    rate?: number;
    sale_price?: number;
    min_sale_price?: number;
    current_stock?: number;
    min_stock?: number;
    is_active?: boolean;
    last_restocked?: string;
}

export interface InventoryFilter {
    page?: number;
    limit?: number;
    search?: string;
    category_id?: string;
    is_active?: boolean;
    low_stock?: boolean;
}

export interface StockAdjustment {
    item_id: string;
    quantity: number;
    type: 'add' | 'subtract' | 'set';
    reason?: string;
}

// Stock adjustment types for history tracking
export type StockAdjustmentType = 'add' | 'subtract' | 'set' | 'sale' | 'purchase' | 'return';

// Stock history entry for audit trail
export interface StockHistoryEntry {
    id: string;
    company_id: string;
    inventory_id: string;
    adjustment_type: StockAdjustmentType;
    quantity_before: number;
    quantity_change: number;
    quantity_after: number;
    reason?: string;
    reference_type?: string;
    reference_id?: string;
    created_by?: string;
    created_at: string;
}

// Filter for stock history queries
export interface StockHistoryFilter {
    page?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
    adjustment_type?: StockAdjustmentType;
}

// Bulk create DTO for importing multiple items
export interface BulkCreateInventoryDTO {
    items: CreateInventoryDTO[];
}

// Inventory with category and supplier names (for list views)
export interface InventoryWithRelations extends InventoryItem {
    category: {
        id: string;
        name: string;
    };
}

// Export filter options
export interface InventoryExportFilter {
    category_id?: string;
    is_active?: boolean;
    format?: 'json' | 'csv';
}
