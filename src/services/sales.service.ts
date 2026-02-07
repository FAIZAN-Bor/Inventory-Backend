import { supabaseAdmin } from '../config/supabase';
import { TABLES } from '../config/database';
import { CreateSaleDTO, Sale, SalesFilter } from '../types/sales.types';
import { inventoryService } from './index';
import { recordPayment } from './party.service'; // We might use this or direct insert
import { NotFoundError, BadRequestError } from '../utils';

export const getAll = async (companyId: string, filter: SalesFilter) => {
    const { page = 1, limit = 20, search, startDate, endDate, customerType } = filter;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
        .from(TABLES.SALES)
        .select('*, items:sales_items(*)', { count: 'exact' })
        .eq('company_id', companyId);

    if (search) {
        query = query.or(`invoice_no.ilike.%${search}%,customer_name.ilike.%${search}%`);
    }

    if (startDate) {
        query = query.gte('invoice_date', startDate);
    }

    if (endDate) {
        query = query.lte('invoice_date', endDate);
    }

    if (customerType) {
        query = query.eq('customer_type', customerType);
    }

    const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw error;

    // Map to camelCase
    const sales = (data || []).map(mapToCamelCase);

    return { data: sales, total: count || 0 };
};

export const getById = async (companyId: string, id: string): Promise<Sale> => {
    const { data, error } = await supabaseAdmin
        .from(TABLES.SALES)
        .select('*, items:sales_items(*)')
        .eq('company_id', companyId)
        .eq('id', id)
        .single();

    if (error || !data) {
        throw new NotFoundError('Sale not found');
    }

    return mapToCamelCase(data);
};

export const create = async (companyId: string, dto: CreateSaleDTO): Promise<Sale> => {
    // 1. Generate Invoice Number if not provided
    // For now, assume frontend sends it or we rely on some logic. 
    // Frontend logic: `SI-${month}${year}-${random}`. 
    // Ideally backend should generate or validate uniqueness.

    // 2. Validate Items existence and stock
    // Check stock? Frontend does it, but backend should too ideally.
    // For speed, skipping deep pre-check, letting triggers or subsequent steps handle it.

    // 3. Create Sale Record
    const saleData = {
        company_id: companyId,
        invoice_no: dto.invoiceNo,
        customer_type: dto.customerType,
        customer_name: dto.customerName,
        party_id: dto.partyId,
        term_of_sale: dto.termOfSale,
        invoice_date: dto.invoiceDate || new Date().toISOString(),
        total_amount: dto.totalAmount,
        discount: dto.discount,
        tcs_charges: dto.tcsCharges,
        net_total: dto.netTotal,
        cash_received: dto.cashReceived,
        remaining_balance: dto.remainingBalance,
        payment_option: dto.paymentOption,
        due_days: dto.dueDays,
        due_date: dto.dueDate,
        remarks: dto.remarks
    };

    const { data: sale, error: saleError } = await supabaseAdmin
        .from(TABLES.SALES)
        .insert(saleData)
        .select()
        .single();

    if (saleError) throw saleError;

    // 4. Create Sale Items
    const itemsData = dto.items.map(item => ({
        sale_id: sale.id,
        article_code: item.articleCode,
        item_id: item.itemId,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        rate: item.rate,
        total_amount: item.totalAmount,
        tax_percentage: item.taxPercentage
    }));

    const { error: itemsError } = await supabaseAdmin
        .from(TABLES.SALES_ITEMS)
        .insert(itemsData);

    if (itemsError) {
        // Rollback sale? Supabase doesn't support easy multi-table rollback without stored procedures.
        // We delete the sale.
        await supabaseAdmin.from(TABLES.SALES).delete().eq('id', sale.id);
        throw itemsError;
    }

    // 5. Deduct Stock & Update Inventory (PARALLEL for speed)
    const stockUpdatePromises = dto.items
        .filter(item => item.itemId)
        .map(item =>
            inventoryService.updateStockFromTransaction(
                companyId,
                item.itemId!,
                Number(item.quantity),
                'sale',
                'sales_invoice',
                sale.id
            ).catch(err => {
                console.error(`Failed to update stock for item ${item.itemId}`, err);
                return null; // Continue with other items
            })
        );

    await Promise.all(stockUpdatePromises);

    // 6. Handle Party Ledger (If Party)
    if (dto.customerType === 'party' && dto.partyId) {
        // If it's a CREDIT sale, we add to their balance.
        // If it's CASH sale, we might not add to balance, OR we add debit (sale) and credit (payment) immediately.
        // The implementation in frontend:
        // Cash Sale -> Full Payment -> No Balance Change
        // Credit Sale -> No Payment -> Balance Increase

        if (dto.termOfSale === 'Credit') {
            // Get Current Financials first
            const { data: fin } = await supabaseAdmin
                .from(TABLES.PARTY_FINANCIALS)
                .select('*')
                .eq('company_id', companyId)
                .eq('party_id', dto.partyId)
                .single();

            let previousBalance = 0;
            let currentBalance = 0;
            let totalPurchases = 0;

            if (fin) {
                previousBalance = fin.current_balance || 0;
                currentBalance = previousBalance + Number(dto.netTotal);
                totalPurchases = (fin.total_purchases || 0) + Number(dto.netTotal);
            } else {
                // If no financials, create specific record or assume 0 (but we should create)
                currentBalance = Number(dto.netTotal);
                totalPurchases = Number(dto.netTotal);
                // We'll insert logic below handles update/insert if not exists?
                // Actually the update logic below relies on 'fin' existing.
            }

            // Add Transaction Record
            await supabaseAdmin.from(TABLES.TRANSACTIONS).insert({
                company_id: companyId,
                party_id: dto.partyId,
                date: sale.invoice_date,
                type: 'sale',
                description: `Invoice ${sale.invoice_no}`,
                invoice_no: sale.invoice_no,
                amount: dto.netTotal,
                payment_received: 0,
                new_balance: currentBalance,
                previous_balance: previousBalance
            });

            // Update Party Financials
            if (fin) {
                await supabaseAdmin
                    .from(TABLES.PARTY_FINANCIALS)
                    .update({
                        current_balance: currentBalance,
                        total_purchases: totalPurchases,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', fin.id);
            } else {
                // Create Party Financials if not exist
                await supabaseAdmin
                    .from(TABLES.PARTY_FINANCIALS)
                    .insert({
                        party_id: dto.partyId,
                        company_id: companyId,
                        credit_limit: 0,
                        opening_balance: 0,
                        current_balance: currentBalance,
                        total_purchases: totalPurchases,
                        total_payments: 0
                    });
            }
        }
    }

    return getById(companyId, sale.id);
};

export const update = async (companyId: string, id: string, dto: CreateSaleDTO): Promise<Sale> => {
    // 1. Fetch existing sale
    const existingSale = await getById(companyId, id);

    // 2. Revert Stock for existing items (PARALLEL for speed)
    if (existingSale.items && existingSale.items.length > 0) {
        const revertPromises = existingSale.items
            .filter(item => item.itemId)
            .map(item =>
                inventoryService.updateStockFromTransaction(
                    companyId,
                    item.itemId!,
                    Number(item.quantity),
                    'return',
                    'sales_return_internal',
                    id
                ).catch(err => {
                    console.error(`Failed to revert stock for item ${item.itemId}`, err);
                    return null;
                })
            );
        await Promise.all(revertPromises);
    }

    // 3. Revert Party Balance (If Credit)
    if (existingSale.customerType === 'party' && existingSale.partyId && existingSale.termOfSale === 'Credit') {
        // We need to reduce the party balance by the OLD net total
        const { data: fin } = await supabaseAdmin
            .from(TABLES.PARTY_FINANCIALS)
            .select('*')
            .eq('company_id', companyId)
            .eq('party_id', existingSale.partyId)
            .single();

        if (fin) {
            const newBalance = (fin.current_balance || 0) - Number(existingSale.netTotal);
            await supabaseAdmin
                .from(TABLES.PARTY_FINANCIALS)
                .update({
                    current_balance: newBalance,
                    total_purchases: (fin.total_purchases || 0) - Number(existingSale.netTotal),
                    updated_at: new Date().toISOString()
                })
                .eq('id', fin.id);

            // Also delete the transaction? Or add a reversal transaction?
            // Deleting the original transaction is cleaner if we are "editing" the invoice basically in-place.
            // But we might need to find the specific transaction.
            const { error: txError } = await supabaseAdmin
                .from(TABLES.TRANSACTIONS)
                .delete()
                .eq('company_id', companyId)
                .eq('invoice_no', existingSale.invoiceNo) // Assuming invoiceNo is unique/key
                .eq('type', 'sale');

            if (txError) console.error('Failed to delete old transaction', txError);
        }
    }

    // 4. Update Sale Record
    const saleData = {
        customer_type: dto.customerType,
        customer_name: dto.customerName,
        party_id: dto.partyId,
        term_of_sale: dto.termOfSale,
        invoice_date: dto.invoiceDate,
        total_amount: dto.totalAmount,
        discount: dto.discount,
        tcs_charges: dto.tcsCharges,
        net_total: dto.netTotal,
        cash_received: dto.cashReceived,
        remaining_balance: dto.remainingBalance,
        payment_option: dto.paymentOption,
        due_days: dto.dueDays,
        due_date: dto.dueDate,
        remarks: dto.remarks,
        updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabaseAdmin
        .from(TABLES.SALES)
        .update(saleData)
        .eq('id', id)
        .eq('company_id', companyId);

    if (updateError) throw updateError;

    // 5. Delete old items and insert new ones
    // Delete old
    await supabaseAdmin.from(TABLES.SALES_ITEMS).delete().eq('sale_id', id);

    // Insert new
    const itemsData = dto.items.map(item => ({
        sale_id: id,
        article_code: item.articleCode,
        item_id: item.itemId,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        rate: item.rate,
        total_amount: item.totalAmount,
        tax_percentage: item.taxPercentage
    }));

    const { error: itemsError } = await supabaseAdmin
        .from(TABLES.SALES_ITEMS)
        .insert(itemsData);

    if (itemsError) throw itemsError;

    // 6. Apply Stock Deduction for New Items (PARALLEL for speed)
    const deductPromises = dto.items
        .filter(item => item.itemId)
        .map(item =>
            inventoryService.updateStockFromTransaction(
                companyId,
                item.itemId!,
                Number(item.quantity),
                'sale',
                'sales_invoice',
                id
            ).catch(err => {
                console.error(`Failed to deduct stock for item ${item.itemId}`, err);
                return null;
            })
        );
    await Promise.all(deductPromises);

    // 7. Apply Party Balance Update (If Credit)
    if (dto.customerType === 'party' && dto.partyId && dto.termOfSale === 'Credit') {
        const { data: fin } = await supabaseAdmin
            .from(TABLES.PARTY_FINANCIALS)
            .select('*')
            .eq('company_id', companyId)
            .eq('party_id', dto.partyId)
            .single();

        if (fin) {
            const newBalance = (fin.current_balance || 0) + Number(dto.netTotal);
            await supabaseAdmin
                .from(TABLES.PARTY_FINANCIALS)
                .update({
                    current_balance: newBalance,
                    total_purchases: (fin.total_purchases || 0) + Number(dto.netTotal),
                    updated_at: new Date().toISOString()
                })
                .eq('id', fin.id);

            // Add new transaction
            await supabaseAdmin.from(TABLES.TRANSACTIONS).insert({
                company_id: companyId,
                party_id: dto.partyId,
                date: dto.invoiceDate || new Date().toISOString(),
                type: 'sale',
                description: `Invoice ${existingSale.invoiceNo} - Credit Sale (Updated)`,
                invoice_no: existingSale.invoiceNo, // Keep original number
                amount: dto.netTotal,
                payment_received: 0,
                new_balance: dto.remainingBalance,
                previous_balance: 0
            });
        }
    }

    return getById(companyId, id);
};

export const remove = async (companyId: string, id: string): Promise<void> => {
    // 1. Fetch existing sale
    const existingSale = await getById(companyId, id);

    // 2. Revert Stock
    if (existingSale.items) {
        for (const item of existingSale.items) {
            if (item.itemId) {
                try {
                    await inventoryService.updateStockFromTransaction(
                        companyId,
                        item.itemId,
                        Number(item.quantity),
                        'return',
                        'sales_delete',
                        id
                    );
                } catch (err) {
                    console.error(`Failed to revert stock for item ${item.itemId}`, err);
                }
            }
        }
    }

    // 3. Revert Party Balance (If Credit)
    if (existingSale.customerType === 'party' && existingSale.partyId && existingSale.termOfSale === 'Credit') {
        const { data: fin } = await supabaseAdmin
            .from(TABLES.PARTY_FINANCIALS)
            .select('*')
            .eq('company_id', companyId)
            .eq('party_id', existingSale.partyId)
            .single();

        if (fin) {
            const newBalance = (fin.current_balance || 0) - Number(existingSale.netTotal);
            await supabaseAdmin
                .from(TABLES.PARTY_FINANCIALS)
                .update({
                    current_balance: newBalance,
                    total_purchases: (fin.total_purchases || 0) - Number(existingSale.netTotal),
                    updated_at: new Date().toISOString()
                })
                .eq('id', fin.id);

            // Delete transaction
            await supabaseAdmin
                .from(TABLES.TRANSACTIONS)
                .delete()
                .eq('company_id', companyId)
                .eq('invoice_no', existingSale.invoiceNo)
                .eq('type', 'sale');
        }
    }

    // 4. Delete Sale (Cascade deletes items)
    const { error } = await supabaseAdmin
        .from(TABLES.SALES)
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);

    if (error) throw error;
};

// Helper to map snake_case to camelCase
const mapToCamelCase = (dbSale: any): Sale => {
    return {
        id: dbSale.id,
        invoiceNo: dbSale.invoice_no,
        customerType: dbSale.customer_type,
        customerName: dbSale.customer_name,
        partyId: dbSale.party_id,
        termOfSale: dbSale.term_of_sale,
        invoiceDate: dbSale.invoice_date,
        totalAmount: Number(dbSale.total_amount),
        discount: Number(dbSale.discount || 0),
        tcsCharges: Number(dbSale.tcs_charges || 0),
        netTotal: Number(dbSale.net_total),
        cashReceived: Number(dbSale.cash_received || 0),
        remainingBalance: Number(dbSale.remaining_balance || 0),
        paymentOption: dbSale.payment_option,
        dueDays: dbSale.due_days,
        dueDate: dbSale.due_date,
        items: (dbSale.items || []).map((item: any) => ({
            id: item.id,
            saleId: item.sale_id,
            articleCode: item.article_code,
            itemId: item.item_id,
            description: item.description,
            quantity: Number(item.quantity),
            unit: item.unit,
            rate: Number(item.rate),
            totalAmount: Number(item.total_amount),
            taxPercentage: Number(item.tax_percentage || 0)
        })),
        createdAt: dbSale.created_at,
        updatedAt: dbSale.updated_at
    };
};

export const getNextInvoiceNumber = async (companyId: string): Promise<string> => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = String(today.getFullYear()).slice(-2);
    const prefix = `SI-${month}${year}-`;

    const { data, error } = await supabaseAdmin
        .from(TABLES.SALES)
        .select('invoice_no')
        .eq('company_id', companyId)
        .ilike('invoice_no', `${prefix}%`)
        .order('invoice_no', { ascending: false })
        .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
        const lastInvoiceNo = data[0].invoice_no;
        const lastSequence = parseInt(lastInvoiceNo.split('-').pop() || '0');
        const nextSequence = String(lastSequence + 1).padStart(4, '0');
        return `${prefix}${nextSequence}`;
    }

    return `${prefix}0001`;
};

export const getLastPrice = async (companyId: string, partyId: string, itemId: string, articleCode?: string): Promise<number> => {
    let query = supabaseAdmin
        .from(TABLES.SALES_ITEMS)
        .select(`
            rate,
            sale:sales!inner (
                party_id,
                company_id,
                created_at,
                invoice_no
            )
        `)
        .eq('sale.party_id', partyId)
        .eq('sale.company_id', companyId);

    // Filter by itemId OR articleCode
    if (itemId && articleCode) {
        query = query.or(`item_id.eq.${itemId},article_code.eq.${articleCode}`);
    } else if (itemId) {
        query = query.eq('item_id', itemId);
    } else if (articleCode) {
        query = query.eq('article_code', articleCode);
    } else {
        return 0;
    }

    const { data, error } = await query
        .order('created_at', { foreignTable: 'sale', ascending: false })
        .limit(1)
        .single();

    if (error || !data) {
        return 0;
    }

    return data.rate || 0;
};

