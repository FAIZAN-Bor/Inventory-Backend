// Supplier service - business logic, mirrors party service
import { supabaseAdmin } from '../config/supabase';
import { TABLES } from '../config/database';
import { Supplier, CreateSupplierDTO, UpdateSupplierDTO, SupplierFilter, SupplierTransaction } from '../types';
import { NotFoundError, BadRequestError } from '../utils';
import { generateSupplierNumber } from '../utils/invoiceGenerator';

/**
 * Generate a unique payment voucher number
 */
const generateVoucherNumber = async (companyId: string): Promise<string> => {
    // Format: PV-MMDD-XXXX (e.g., PV-0126-0001)
    const date = new Date();
    const prefix = `PV-${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;

    // Get last voucher number to increment
    const { data } = await supabaseAdmin
        .from(TABLES.SUPPLIER_TRANSACTIONS)
        .select('invoice_no')
        .eq('company_id', companyId)
        .ilike('invoice_no', `${prefix}-%`)
        .order('invoice_no', { ascending: false })
        .limit(1)
        .single();

    let nextNum = 1;
    if (data && data.invoice_no) {
        const parts = data.invoice_no.split('-');
        if (parts.length === 3) {
            nextNum = parseInt(parts[2], 10) + 1;
        }
    }

    return `${prefix}-${nextNum.toString().padStart(4, '0')}`;
};

export const getAll = async (companyId: string, filter: SupplierFilter) => {
    const { page = 1, limit = 20, search, status, city } = filter;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
        .from(TABLES.SUPPLIERS)
        .select('*', { count: 'exact' });

    if (search) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    if (status) {
        query = query.eq('status', status);
    }

    if (city) {
        query = query.eq('city', city);
    }

    const { data: suppliers, count, error } = await query
        .order('name', { ascending: true })
        .range(offset, offset + limit - 1);

    if (error) throw error;
    if (!suppliers || suppliers.length === 0) return { data: [], total: 0 };

    // Fetch Financials
    const supplierIds = suppliers.map(s => s.id);
    const { data: financials } = await supabaseAdmin
        .from(TABLES.SUPPLIER_FINANCIALS)
        .select('*')
        .eq('company_id', companyId)
        .in('supplier_id', supplierIds);

    // Merge
    const mergedData = suppliers.map(s => {
        const fin = financials?.find(f => f.supplier_id === s.id);
        return {
            ...s,
            credit_limit: fin?.credit_limit || 0,
            opening_balance: fin?.opening_balance || 0,
            current_balance: fin?.current_balance || 0,
            total_purchases: fin?.total_purchases || 0,
            total_payments: fin?.total_payments || 0,
        };
    });

    return { data: mergedData, total: count || 0 };
};

export const getById = async (companyId: string, id: string): Promise<Supplier> => {
    const { data: supplier, error } = await supabaseAdmin
        .from(TABLES.SUPPLIERS)
        .select('*')
        .eq('id', id)
        .single();

    if (error || !supplier) {
        throw new NotFoundError('Supplier not found');
    }

    const { data: fin } = await supabaseAdmin
        .from(TABLES.SUPPLIER_FINANCIALS)
        .select('*')
        .eq('company_id', companyId)
        .eq('supplier_id', id)
        .single();

    return {
        ...supplier,
        credit_limit: fin?.credit_limit || 0,
        opening_balance: fin?.opening_balance || 0,
        current_balance: fin?.current_balance || 0,
        total_purchases: fin?.total_purchases || 0,
        total_payments: fin?.total_payments || 0,
    };
};

export const getLedger = async (companyId: string, supplierId: string): Promise<SupplierTransaction[]> => {
    await getById(companyId, supplierId);

    // Fetch transactions
    const { data } = await supabaseAdmin
        .from(TABLES.SUPPLIER_TRANSACTIONS)
        .select('*')
        .eq('company_id', companyId)
        .eq('supplier_id', supplierId)
        .order('date', { ascending: false });

    if (!data || data.length === 0) return [];

    // Filter out CASH purchases if requested (User requirement: "Only Purchases which are credit must be seen")
    // We need to know the term_of_sale for 'purchase' type transactions.

    // 1. Get invoice numbers for ALL transactions (Purchase, Payment, Return)
    const invoiceNumbers = data
        .filter(t => t.invoice_no)
        .map(t => t.invoice_no);

    if (invoiceNumbers.length > 0) {
        // 2. Fetch terms for these invoices
        const { data: purchases } = await supabaseAdmin
            .from(TABLES.PURCHASES)
            .select('invoice_number, term_of_sale')
            .eq('company_id', companyId)
            .in('invoice_number', invoiceNumbers);

        // 3. Create a map
        const termMap = new Map<string, string>();
        if (purchases) {
            purchases.forEach(p => {
                if (p.invoice_number) termMap.set(p.invoice_number, p.term_of_sale);
            });
        }

        // 4. Update ledger data: Filter out ANY transaction linked to a CASH purchase
        // This includes:
        // - 'purchase' record for Cash Invoice
        // - 'payment' record for Cash Invoice
        // - 'return' record for Cash Invoice
        return data.filter(t => {
            if (t.invoice_no) {
                const term = termMap.get(t.invoice_no);
                // If term is found and it is CASH, hide it.
                if (term === 'CASH') return false;
            }
            return true;
        });
    }

    return data;
};

export const create = async (companyId: string, dto: CreateSupplierDTO): Promise<Supplier> => {
    // Generate supplier number (party_number) with gap filling
    const supplierNumber = await generateSupplierNumber(companyId);

    const { data: supplier, error: supplierError } = await supabaseAdmin
        .from(TABLES.SUPPLIERS)
        .insert({
            party_number: supplierNumber,
            name: dto.name,
            contact_person: dto.contact_person,
            phone: dto.phone,
            email: dto.email,
            address: dto.address,
            city: dto.city,
            ntn: dto.ntn,
            strn: dto.strn,
            status: dto.status || 'active',
            notes: dto.notes,
        })
        .select()
        .single();

    if (supplierError) throw supplierError;

    // 2. Create Financials
    const { error: finError } = await supabaseAdmin
        .from(TABLES.SUPPLIER_FINANCIALS)
        .insert({
            supplier_id: supplier.id,
            company_id: companyId,
            credit_limit: dto.credit_limit || 0,
            opening_balance: dto.opening_balance || 0,
            current_balance: dto.opening_balance || 0,
        });

    if (finError) {
        console.error('Failed to create supplier financials', finError);
    }

    return {
        ...supplier,
        credit_limit: dto.credit_limit || 0,
        opening_balance: dto.opening_balance || 0,
        current_balance: dto.opening_balance || 0,
        total_purchases: 0,
        total_payments: 0,
    };
};

export const update = async (companyId: string, id: string, dto: UpdateSupplierDTO): Promise<Supplier> => {
    // 1. Global Update
    const { data: supplier, error } = await supabaseAdmin
        .from(TABLES.SUPPLIERS)
        .update({
            name: dto.name,
            contact_person: dto.contact_person,
            phone: dto.phone,
            email: dto.email,
            address: dto.address,
            city: dto.city,
            ntn: dto.ntn,
            strn: dto.strn,
            status: dto.status,
            notes: dto.notes,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    // 2. Financial Update
    const { data: existingFin } = await supabaseAdmin
        .from(TABLES.SUPPLIER_FINANCIALS)
        .select('id')
        .eq('company_id', companyId)
        .eq('supplier_id', id)
        .single();

    if (existingFin) {
        await supabaseAdmin
            .from(TABLES.SUPPLIER_FINANCIALS)
            .update({
                credit_limit: dto.credit_limit,
                updated_at: new Date().toISOString(),
            })
            .eq('id', existingFin.id);
    } else if (dto.credit_limit) {
        await supabaseAdmin
            .from(TABLES.SUPPLIER_FINANCIALS)
            .insert({
                supplier_id: id,
                company_id: companyId,
                credit_limit: dto.credit_limit,
            });
    }

    return getById(companyId, id);
};

export const remove = async (companyId: string, id: string): Promise<void> => {
    const { error } = await supabaseAdmin
        .from(TABLES.SUPPLIERS)
        .delete()
        .eq('id', id);

    if (error) throw error;
};

export const recordPayment = async (companyId: string, supplierId: string, payment: any): Promise<SupplierTransaction> => {
    // Payment to Supplier reduces Payable (positive balance)
    // Or if we treat balance as "What we owe", reducing it means we paid.
    // Logic: currentBalance - paymentAmount. 

    let { data: fin } = await supabaseAdmin
        .from(TABLES.SUPPLIER_FINANCIALS)
        .select('*')
        .eq('company_id', companyId)
        .eq('supplier_id', supplierId)
        .single();

    if (!fin) {
        const { data: newFin } = await supabaseAdmin
            .from(TABLES.SUPPLIER_FINANCIALS)
            .insert({
                supplier_id: supplierId,
                company_id: companyId,
                current_balance: 0
            })
            .select()
            .single();
        fin = newFin;
    }

    const currentBalance = fin.current_balance || 0;
    const newBalance = currentBalance - payment.amount;

    // Generate Payment Voucher Number and Insert with Retry
    let transaction: any;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        const invoiceNo = await generateVoucherNumber(companyId);

        const { data, error } = await supabaseAdmin
            .from(TABLES.SUPPLIER_TRANSACTIONS)
            .insert({
                company_id: companyId,
                supplier_id: supplierId,
                type: 'payment',
                invoice_no: invoiceNo,
                amount: payment.amount,
                previous_balance: currentBalance,
                new_balance: newBalance,
                date: payment.date,
                description: payment.description || 'Payment made',
                payment_method: payment.payment_method,
                cheque_no: payment.cheque_no,
                bank_name: payment.bank_name,
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique constraint violation
                attempts++;
                continue;
            }
            throw error;
        }

        transaction = data;
        break;
    }

    if (!transaction) throw new Error('Failed to generate unique voucher number');

    await supabaseAdmin
        .from(TABLES.SUPPLIER_FINANCIALS)
        .update({
            current_balance: newBalance,
            total_payments: (fin.total_payments || 0) + payment.amount,
            updated_at: new Date().toISOString(),
        })
        .eq('id', fin.id);

    return transaction;
};

export const deletePayment = async (companyId: string, supplierId: string, transactionId: string): Promise<void> => {
    // 1. Get Transaction
    const { data: txn, error: txnError } = await supabaseAdmin
        .from(TABLES.SUPPLIER_TRANSACTIONS)
        .select('*')
        .eq('company_id', companyId)
        .eq('supplier_id', supplierId)
        .eq('id', transactionId)
        .single();

    if (txnError || !txn) throw new NotFoundError('Transaction not found');
    if (txn.type !== 'payment') throw new BadRequestError('Only payments can be deleted here');

    // 2. Revert Financials
    const { data: fin } = await supabaseAdmin
        .from(TABLES.SUPPLIER_FINANCIALS)
        .select('*')
        .eq('company_id', companyId)
        .eq('supplier_id', supplierId)
        .single();

    if (fin) {
        // Payment reduced balance, so adding it back increases balance (liability)
        const reversedBalance = (fin.current_balance || 0) + txn.amount;
        const reversedTotalPayments = (fin.total_payments || 0) - txn.amount;

        await supabaseAdmin
            .from(TABLES.SUPPLIER_FINANCIALS)
            .update({
                current_balance: reversedBalance,
                total_payments: reversedTotalPayments,
                updated_at: new Date().toISOString()
            })
            .eq('id', fin.id);
    }

    // 3. Delete Transaction
    const { error: deleteError } = await supabaseAdmin
        .from(TABLES.SUPPLIER_TRANSACTIONS)
        .delete()
        .eq('id', transactionId);

    if (deleteError) throw deleteError;
};

export const updatePayment = async (companyId: string, supplierId: string, transactionId: string, updates: any): Promise<SupplierTransaction> => {
    // 1. Get Original Transaction
    const { data: txn, error: txnError } = await supabaseAdmin
        .from(TABLES.SUPPLIER_TRANSACTIONS)
        .select('*')
        .eq('company_id', companyId)
        .eq('supplier_id', supplierId)
        .eq('id', transactionId)
        .single();

    if (txnError || !txn) throw new NotFoundError('Transaction not found');
    if (txn.type !== 'payment') throw new BadRequestError('Only payments can be edited here');

    // 2. Adjust Financials (Old Amount vs New Amount)
    const oldAmount = Number(txn.amount);
    const newAmount = Number(updates.amount);
    const diff = newAmount - oldAmount; // Positive if paying more, Negative if paying less

    if (diff !== 0) {
        const { data: fin } = await supabaseAdmin
            .from(TABLES.SUPPLIER_FINANCIALS)
            .select('*')
            .eq('company_id', companyId)
            .eq('supplier_id', supplierId)
            .single();

        if (fin) {
            // If paying more (diff > 0), balance decreases (becomes more negative/less positive). 
            // Current Balance is "Payable". So paying more reduces Payable.
            // Balance -= diff.
            const newBalance = (fin.current_balance || 0) - diff;
            const newTotalPayments = (fin.total_payments || 0) + diff;

            await supabaseAdmin
                .from(TABLES.SUPPLIER_FINANCIALS)
                .update({
                    current_balance: newBalance,
                    total_payments: newTotalPayments,
                    updated_at: new Date().toISOString()
                })
                .eq('id', fin.id);
        }
    }

    // 3. Update Transaction
    const { data: updatedTxn, error: updateError } = await supabaseAdmin
        .from(TABLES.SUPPLIER_TRANSACTIONS)
        .update({
            amount: newAmount,
            description: updates.description,
            date: updates.date,
            // payment_method: updates.payment_method // if we want to allow changing method
        })
        .eq('id', transactionId)
        .select()
        .single();

    if (updateError) throw updateError;
    return updatedTxn;
};
