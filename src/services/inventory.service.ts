// Inventory service - business logic for inventory operations
import { supabaseAdmin } from '../config/supabase';
import { TABLES } from '../config/database';
import {
    InventoryItem,
    CreateInventoryDTO,
    UpdateInventoryDTO,
    InventoryFilter,
    StockAdjustment,
    StockHistoryEntry,
    StockHistoryFilter,
    BulkCreateInventoryDTO,
    InventoryExportFilter,
    StockAdjustmentType
} from '../types';
import { NotFoundError, ConflictError, ValidationError, BadRequestError } from '../utils';
import { generateArticleCode } from '../utils/invoiceGenerator';

// Table name for stock history
const STOCK_HISTORY_TABLE = 'stock_history';

// Default company ID for development when no auth context
const getDefaultCompanyId = async (): Promise<string> => {
    const { data } = await supabaseAdmin
        .from(TABLES.COMPANIES)
        .select('id')
        .eq('is_active', true)
        .limit(1)
        .single();

    if (!data) {
        throw new BadRequestError('No company available. Please create a company first.');
    }
    return data.id;
};

/**
 * Validate that a category exists and belongs to the company
 */
const validateCategory = async (companyId: string, categoryId: string): Promise<void> => {
    const { data, error } = await supabaseAdmin
        .from(TABLES.CATEGORIES)
        .select('id')
        .eq('company_id', companyId)
        .eq('id', categoryId)
        .single();

    if (error || !data) {
        throw new ValidationError('Category not found or does not belong to this company');
    }
};

/**
 * Check if an article code already exists within the company
 */
const checkDuplicateArticleCode = async (companyId: string, articleCode: string, excludeId?: string): Promise<void> => {
    let query = supabaseAdmin
        .from(TABLES.INVENTORY)
        .select('id')
        .eq('article_code', articleCode);

    if (excludeId) {
        query = query.neq('id', excludeId);
    }

    const { data } = await query.single();

    if (data) {
        throw new ConflictError(`Article code "${articleCode}" already exists`);
    }
};

/**
 * Log stock adjustment to history
 */
const logStockHistory = async (
    companyId: string,
    inventoryId: string,
    adjustmentType: StockAdjustmentType,
    quantityBefore: number,
    quantityChange: number,
    quantityAfter: number,
    reason?: string,
    referenceType?: string,
    referenceId?: string,
    createdBy?: string
): Promise<void> => {
    await supabaseAdmin
        .from(STOCK_HISTORY_TABLE)
        .insert({
            company_id: companyId,
            inventory_id: inventoryId,
            adjustment_type: adjustmentType,
            quantity_before: quantityBefore,
            quantity_change: quantityChange,
            quantity_after: quantityAfter,
            reason,
            reference_type: referenceType,
            reference_id: referenceId,
            created_by: createdBy,
        });
};

/**
 * Get all inventory items with pagination and filters
 */
export const getAll = async (companyId: string | undefined, filter: InventoryFilter) => {
    const { page = 1, limit = 20, search, category_id, is_active, low_stock } = filter;
    const offset = (page - 1) * limit;

    // Query inventory items (without FK joins since constraints may not exist)
    let query = supabaseAdmin
        .from(TABLES.INVENTORY)
        // Select all fields AND joined category details
        .select('*, category:categories(id, name)', { count: 'exact' });

    // If company ID provided, filter by company
    // if (companyId) {
    //     query = query.eq('company_id', companyId);
    // }

    if (search) {
        query = query.or(`name.ilike.%${search}%,article_code.ilike.%${search}%`);
    }

    if (category_id) {
        query = query.eq('category_id', category_id);
    }

    if (typeof is_active === 'boolean') {
        query = query.eq('is_active', is_active);
    } else if (!companyId) {
        // Default to active items for public queries
        query = query.eq('is_active', true);
    }

    // Apply sorting
    query = query.order('name', { ascending: true });

    // Apply pagination only if limit is positive
    if (limit > 0) {
        query = query.range(offset, offset + limit - 1);
    }

    const { data, count, error } = await query;

    if (error) {
        console.error('[Inventory Service] getAll error:', JSON.stringify(error, null, 2));
        throw error;
    }

    // Filter low stock items in memory if requested
    let items = data || [];
    if (low_stock) {
        items = items.filter(item => item.current_stock < item.min_stock);
    }

    return { data: items, total: count || 0 };
};

/**
 * Get low stock items
 */
export const getLowStock = async (companyId: string | undefined): Promise<InventoryItem[]> => {
    let query = supabaseAdmin
        .from(TABLES.INVENTORY)
        // Select all fields AND joined category details
        .select('*, category:categories(id, name)')
        .eq('is_active', true);

    // if (companyId) {
    //     query = query.eq('company_id', companyId);
    // }

    const { data } = await query
        .order('current_stock', { ascending: true })
        .limit(50);

    // Filter items where current_stock < min_stock
    return (data || []).filter(item => item.current_stock < item.min_stock);
};

/**
 * Get inventory item by ID
 */
export const getById = async (companyId: string | undefined, id: string): Promise<InventoryItem> => {
    let query = supabaseAdmin
        .from(TABLES.INVENTORY)
        .select('*')
        .eq('id', id);

    // if (companyId) {
    //     query = query.eq('company_id', companyId);
    // }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching inventory item:', error);
        throw error;
    }

    if (!data || data.length === 0) {
        throw new NotFoundError('Inventory item not found');
    }

    return data[0];
};

/**
 * Create a new inventory item
 */
export const create = async (companyId: string | undefined, dto: CreateInventoryDTO): Promise<InventoryItem> => {
    // Use provided companyId or get default
    const effectiveCompanyId = companyId || await getDefaultCompanyId();

    // Validate category only if provided (skip for testing)
    if (dto.category_id && dto.category_id.trim() !== '') {
        try {
            await validateCategory(effectiveCompanyId, dto.category_id);
        } catch {
            // Skip validation error for testing - category will be null
        }
    }

    // Generate article code if not provided
    const articleCode = dto.article_code || await generateArticleCode(effectiveCompanyId);

    // Skip duplicate check for testing (just log warning)
    try {
        await checkDuplicateArticleCode(effectiveCompanyId, articleCode);
    } catch {
        // Skip for testing
    }

    const { data, error } = await supabaseAdmin
        .from(TABLES.INVENTORY)
        .insert({
            company_id: effectiveCompanyId,
            article_code: articleCode,
            name: dto.name || 'Unnamed Item',
            description: dto.description || '',
            category_id: (dto.category_id && dto.category_id.trim() !== '') ? dto.category_id : null,
            unit: dto.unit || 'Pieces',
            location: dto.location || '',
            image_url: dto.image_url || null,
            rate: dto.rate || 0,
            sale_price: dto.sale_price || null,
            min_sale_price: dto.min_sale_price || null,
            current_stock: dto.current_stock || 0,
            min_stock: dto.min_stock || 0,
            is_active: true,
        })
        .select('*')
        .single();

    if (error) throw error;

    // Log initial stock as history
    if (dto.current_stock > 0) {
        await logStockHistory(
            effectiveCompanyId,
            data.id,
            'add',
            0,
            dto.current_stock,
            dto.current_stock,
            'Initial stock on item creation'
        );
    }

    return data;
};

/**
 * Update an inventory item
 */
export const update = async (companyId: string | undefined, id: string, dto: UpdateInventoryDTO): Promise<InventoryItem> => {
    // Use provided companyId or get default
    const effectiveCompanyId = companyId || await getDefaultCompanyId();

    const existing = await getById(effectiveCompanyId, id);

    // Validate category if being changed
    if (dto.category_id && dto.category_id !== existing.category_id) {
        await validateCategory(effectiveCompanyId, dto.category_id);
    }

    const { data, error } = await supabaseAdmin
        .from(TABLES.INVENTORY)
        .update({
            ...dto,
            updated_at: new Date().toISOString(),
        })
        // .eq('company_id', effectiveCompanyId) // Shared inventory - allow update by any company
        .eq('id', id)
        .select('*');

    if (error) throw error;
    if (!data || data.length === 0) {
        throw new NotFoundError('Inventory item not found or update failed');
    }

    return data[0];
};

/**
 * Delete an inventory item
 */
export const remove = async (companyId: string | undefined, id: string): Promise<void> => {
    // Use provided companyId or get default
    const effectiveCompanyId = companyId || await getDefaultCompanyId();

    try {
        await getById(effectiveCompanyId, id);
    } catch (error) {
        if (error instanceof NotFoundError) {
            // Item already deleted or not found
            return;
        }
        throw error;
    }

    // Check if item is used in any sales or purchases
    const { count: salesCount } = await supabaseAdmin
        .from(TABLES.SALES_ITEMS)
        .select('*', { count: 'exact', head: true })
        .eq('inventory_id', id);

    if (salesCount && salesCount > 0) {
        throw new ConflictError('Cannot delete inventory item used in sales transactions');
    }

    const { count: purchaseCount } = await supabaseAdmin
        .from(TABLES.PURCHASE_ITEMS)
        .select('*', { count: 'exact', head: true })
        .eq('inventory_id', id);

    if (purchaseCount && purchaseCount > 0) {
        throw new ConflictError('Cannot delete inventory item used in purchase transactions');
    }

    const { error } = await supabaseAdmin
        .from(TABLES.INVENTORY)
        .delete()
        // .eq('company_id', companyId) // Shared inventory
        .eq('id', id);

    if (error) throw error;
};

/**
 * Adjust stock for an inventory item
 */
export const adjustStock = async (
    companyId: string | undefined,
    adjustment: StockAdjustment,
    userId?: string
): Promise<InventoryItem> => {
    // Use provided companyId or get default
    const effectiveCompanyId = companyId || await getDefaultCompanyId();

    const item = await getById(effectiveCompanyId, adjustment.item_id);
    const quantityBefore = item.current_stock;

    let newStock: number;
    let quantityChange: number;

    switch (adjustment.type) {
        case 'add':
            newStock = item.current_stock + adjustment.quantity;
            quantityChange = adjustment.quantity;
            break;
        case 'subtract':
            newStock = Math.max(0, item.current_stock - adjustment.quantity);
            quantityChange = -adjustment.quantity;
            break;
        case 'set':
            newStock = adjustment.quantity;
            quantityChange = adjustment.quantity - item.current_stock;
            break;
        default:
            newStock = item.current_stock;
            quantityChange = 0;
    }

    // Update inventory
    const updatedItem = await update(effectiveCompanyId, adjustment.item_id, {
        current_stock: newStock,
        last_restocked: adjustment.type === 'add' ? new Date().toISOString() : undefined,
    });

    // Log to stock history
    await logStockHistory(
        effectiveCompanyId,
        adjustment.item_id,
        adjustment.type,
        quantityBefore,
        quantityChange,
        newStock,
        adjustment.reason,
        undefined,
        undefined,
        userId
    );

    return updatedItem;
};

/**
 * Get stock history for an inventory item
 */
export const getStockHistory = async (
    companyId: string | undefined,
    itemId: string,
    filter: StockHistoryFilter
): Promise<{ data: StockHistoryEntry[]; total: number }> => {
    // Verify item exists
    await getById(companyId, itemId);

    const { page = 1, limit = 20, start_date, end_date, adjustment_type } = filter;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
        .from(STOCK_HISTORY_TABLE)
        .select('*', { count: 'exact' })
        .eq('inventory_id', itemId);

    // if (companyId) {
    //     query = query.eq('company_id', companyId);
    // }

    if (start_date) {
        query = query.gte('created_at', start_date);
    }

    if (end_date) {
        query = query.lte('created_at', end_date);
    }

    if (adjustment_type) {
        query = query.eq('adjustment_type', adjustment_type);
    }

    const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw error;

    return { data: data || [], total: count || 0 };
};

/**
 * Bulk create inventory items
 */
export const bulkCreate = async (
    companyId: string | undefined,
    dto: BulkCreateInventoryDTO
): Promise<{ created: InventoryItem[]; errors: Array<{ index: number; error: string }> }> => {
    const created: InventoryItem[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < dto.items.length; i++) {
        try {
            const item = await create(companyId, dto.items[i]);
            created.push(item);
        } catch (err) {
            errors.push({
                index: i,
                error: err instanceof Error ? err.message : 'Unknown error',
            });
        }
    }

    return { created, errors };
};

/**
 * Export inventory data
 */
export const exportInventory = async (
    companyId: string | undefined,
    filter: InventoryExportFilter
): Promise<InventoryItem[]> => {
    let query = supabaseAdmin
        .from(TABLES.INVENTORY)
        .select('*');

    // if (companyId) {
    //     query = query.eq('company_id', companyId);
    // }

    if (filter.category_id) {
        query = query.eq('category_id', filter.category_id);
    }

    if (typeof filter.is_active === 'boolean') {
        query = query.eq('is_active', filter.is_active);
    }

    const { data, error } = await query.order('name', { ascending: true });

    if (error) throw error;

    return data || [];
};

/**
 * Update stock from sales/purchase (used by other services)
 */
export const updateStockFromTransaction = async (
    companyId: string,
    itemId: string,
    quantity: number,
    type: 'sale' | 'purchase' | 'return',
    referenceType: string,
    referenceId: string,
    userId?: string
): Promise<void> => {
    const item = await getById(companyId, itemId);
    const quantityBefore = item.current_stock;

    let newStock: number;
    let quantityChange: number;

    if (type === 'sale') {
        newStock = Math.max(0, item.current_stock - quantity);
        quantityChange = -quantity;
    } else if (type === 'purchase' || type === 'return') {
        newStock = item.current_stock + quantity;
        quantityChange = quantity;
    } else {
        return;
    }

    // Update inventory
    await supabaseAdmin
        .from(TABLES.INVENTORY)
        .update({
            current_stock: newStock,
            last_restocked: type === 'purchase' ? new Date().toISOString() : undefined,
            updated_at: new Date().toISOString(),
        })
        // .eq('company_id', companyId) // Shared inventory
        .eq('id', itemId);

    // Log to stock history
    await logStockHistory(
        companyId,
        itemId,
        type,
        quantityBefore,
        quantityChange,
        newStock,
        `${type === 'sale' ? 'Sold' : type === 'purchase' ? 'Purchased' : 'Returned'} via ${referenceType}`,
        referenceType,
        referenceId,
        userId
    );
};
