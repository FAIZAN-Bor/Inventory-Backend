import { supabaseAdmin } from '../config/supabase';
import { TABLES } from '../config/database';
import { DeliveryChallan, CreateDeliveryChallanDTO, DeliveryChallanFilter } from '../types';
import { NotFoundError, BadRequestError } from '../utils';
import { generateDeliveryChallanNumber } from '../utils/invoiceGenerator';
import * as inventoryService from './inventory.service';

export const getAll = async (companyId: string, filter: DeliveryChallanFilter) => {
    const { page = 1, limit = 20, search, party_id, status, startDate, endDate } = filter;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
        .from(TABLES.DELIVERY_CHALLANS)
        // Select all challans fields AND joined items (full details needed for edit view)
        .select('*, items:delivery_challan_items(*)', { count: 'exact' })
        .eq('company_id', companyId);

    if (search) {
        query = query.or(`dc_number.ilike.%${search}%,party_name.ilike.%${search}%`);
    }

    if (party_id) query = query.eq('party_id', party_id);
    if (status) query = query.eq('status', status);
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, count, error } = await query
        .order('date', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw error;

    const mappedData = (data || []).map((row: any) => ({
        id: row.id,
        dcNumber: row.dc_number,
        date: row.date,
        partyId: row.party_id,
        partyName: row.party_name,
        partyAddress: row.party_address,
        courierName: row.courier_name,
        totalQty: row.total_qty,
        status: row.status,
        // Map items to camelCase
        items: (row.items || []).map((item: any) => ({
            id: item.id,
            itemId: item.item_id,
            itemName: item.item_name,
            poNumber: item.po_number,
            demandNumber: item.demand_number,
            quantity: item.quantity,
            unit: item.unit
        }))
    }));

    // To support frontend `challan.items.length`, we need to fetch items or a count. 
    // Let's update the query in a separate step or assume frontend will be updated to use a real count if I provide it.
    // For now, let's just return what we have mapped.
    // Re-reading frontend history: `c.totalQty` (which we have) and `{challan.items.length} (Rows)`.
    // We need to join items.

    return { data: mappedData, total: count || 0 };
};

export const getHistory = getAll;

export const getNextNumber = async (companyId: string): Promise<{ nextNumber: string }> => {
    const nextNumber = await generateDeliveryChallanNumber(companyId);
    return { nextNumber };
};

export const getById = async (companyId: string, id: string): Promise<any> => {
    const { data, error } = await supabaseAdmin
        .from(TABLES.DELIVERY_CHALLANS)
        .select('*, items:delivery_challan_items(*)')
        .eq('company_id', companyId)
        .eq('id', id)
        .single();

    if (error || !data) {
        throw new NotFoundError('Delivery challan not found');
    }

    // Map to camelCase for frontend
    return {
        id: data.id,
        dcNumber: data.dc_number,
        date: data.date,
        partyId: data.party_id,
        partyName: data.party_name,
        partyAddress: data.party_address,
        courierName: data.courier_name,
        totalQty: data.total_qty,
        status: data.status,
        remarks: data.remarks,
        items: data.items.map((item: any) => ({
            id: item.id,
            itemId: item.item_id,
            itemName: item.item_name,
            poNumber: item.po_number,
            demandNumber: item.demand_number,
            quantity: item.quantity,
            unit: item.unit
        }))
    };
};

export const create = async (companyId: string, dto: any): Promise<DeliveryChallan> => {
    // Unique DC Number: DC-MMYY-0000
    const dcNumber = await generateDeliveryChallanNumber(companyId);

    // Map frontend camelCase to backend snake_case (if needed) or assume DTO is already mapped.
    // Based on frontend 'items', we have itemName, poNumber etc.
    // We'll trust the Items Mapping below.

    // Calculate total quantity if not provided
    const totalQty = dto.items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0);

    const { data, error } = await supabaseAdmin
        .from(TABLES.DELIVERY_CHALLANS)
        .insert({
            company_id: companyId,
            dc_number: dcNumber,
            date: dto.date,
            party_id: dto.partyId, // Frontend might send partyId
            party_name: dto.partyName,
            party_address: dto.partyAddress,
            courier_name: dto.courierName,
            total_qty: totalQty,
            status: 'pending',
            remarks: dto.remarks
        })
        .select()
        .single();

    if (error) throw error;

    // Create challan items
    // Map frontend item keys (itemName, poNumber) to DB keys (item_name, po_number)
    const items = dto.items.map((item: any) => ({
        challan_id: data.id,
        item_id: item.itemId, // if available
        item_name: item.itemName,
        po_number: item.poNumber,
        demand_number: item.demandNumber,
        quantity: item.quantity,
        unit: item.unit
    }));

    await supabaseAdmin.from(TABLES.DELIVERY_CHALLAN_ITEMS).insert(items);

    // Deduct Stock for items that are linked to Inventory
    for (const item of dto.items) {
        if (item.itemId) {
            try {
                await inventoryService.updateStockFromTransaction(
                    companyId,
                    item.itemId,
                    Number(item.quantity) || 0,
                    'sale', // Deduct stock
                    'delivery_challan',
                    data.id
                );
            } catch (err) {
                console.error(`Failed to update stock for item ${item.itemId}`, err);
            }
        }
    }

    return getById(companyId, data.id);
};

export const update = async (companyId: string, id: string, dto: any): Promise<DeliveryChallan> => {
    // Verify existence
    const existingChallan = await getById(companyId, id);

    // Calculate total quantity
    const totalQty = dto.items ? dto.items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0) : 0;

    const { data, error } = await supabaseAdmin
        .from(TABLES.DELIVERY_CHALLANS)
        .update({
            date: dto.date,
            party_id: dto.partyId,
            party_name: dto.partyName,
            party_address: dto.partyAddress,
            courier_name: dto.courierName,
            remarks: dto.remarks,
            total_qty: totalQty,
            updated_at: new Date().toISOString(),
        })
        .eq('company_id', companyId)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    // Update items if provided
    if (dto.items) {
        // 1. Restore Stock for OLD items (Increase)
        for (const item of existingChallan.items) {
            if (item.itemId) {
                try {
                    await inventoryService.updateStockFromTransaction(
                        companyId,
                        item.itemId,
                        Number(item.quantity) || 0,
                        'return', // Restore stock
                        'delivery_challan',
                        id
                    );
                } catch (err) {
                    console.error(`Failed to restore stock for item ${item.itemId}`, err);
                }
            }
        }

        // 2. Delete existing items
        await supabaseAdmin
            .from(TABLES.DELIVERY_CHALLAN_ITEMS)
            .delete()
            .eq('challan_id', id);

        // 3. Insert new items
        const items = dto.items.map((item: any) => ({
            challan_id: id,
            item_id: item.itemId,
            item_name: item.itemName,
            po_number: item.poNumber,
            demand_number: item.demandNumber,
            quantity: item.quantity,
            unit: item.unit
        }));
        await supabaseAdmin.from(TABLES.DELIVERY_CHALLAN_ITEMS).insert(items);

        // 4. Deduct Stock for NEW items (Decrease)
        for (const item of dto.items) {
            if (item.itemId) {
                try {
                    await inventoryService.updateStockFromTransaction(
                        companyId,
                        item.itemId,
                        Number(item.quantity) || 0,
                        'sale', // Deduct stock
                        'delivery_challan',
                        id
                    );
                } catch (err) {
                    console.error(`Failed to deduct stock for item ${item.itemId}`, err);
                }
            }
        }
    }

    return getById(companyId, id);
};

export const markDelivered = async (companyId: string, id: string, dto: any): Promise<DeliveryChallan> => {
    return update(companyId, id, {
        status: 'delivered',
        delivered_date: dto.delivered_date || new Date().toISOString(),
        received_by: dto.received_by,
    });
};

export const cancel = async (companyId: string, id: string): Promise<void> => {
    const challan = await getById(companyId, id);
    if (challan.status === 'cancelled') return;

    // Restore Stock (Increase/Return)
    for (const item of challan.items) {
        if (item.itemId) {
            try {
                await inventoryService.updateStockFromTransaction(
                    companyId,
                    item.itemId,
                    Number(item.quantity) || 0,
                    'return', // Restore stock
                    'delivery_challan',
                    id
                );
            } catch (err) {
                console.error(`Failed to restore stock for item ${item.itemId}`, err);
            }
        }
    }

    const { error } = await supabaseAdmin
        .from(TABLES.DELIVERY_CHALLANS)
        .update({ status: 'cancelled' })
        .eq('company_id', companyId)
        .eq('id', id);

    if (error) throw error;
};

export const deleteChallan = async (companyId: string, id: string): Promise<void> => {
    const challan = await getById(companyId, id);

    // Restore Stock (Increase/Return)
    for (const item of challan.items) {
        if (item.itemId) {
            try {
                await inventoryService.updateStockFromTransaction(
                    companyId,
                    item.itemId,
                    Number(item.quantity) || 0,
                    'return', // Restore stock (reverse of sale)
                    'delivery_challan',
                    id
                );
            } catch (err) {
                console.error(`Failed to restore stock for item ${item.itemId}`, err);
            }
        }
    }

    // Optional: prevent deletion if delivered?
    // if (challan.status === 'delivered') throw new BadRequestError('Cannot delete delivered challan');

    const { error } = await supabaseAdmin
        .from(TABLES.DELIVERY_CHALLANS)
        .delete()
        .eq('company_id', companyId)
        .eq('id', id);

    if (error) throw error;
};
