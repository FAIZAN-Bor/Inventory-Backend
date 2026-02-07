// Party service - business logic for party/customer operations
import { supabaseAdmin } from '../config/supabase';
import { TABLES } from '../config/database';
import { Party, CreatePartyDTO, UpdatePartyDTO, PartyFilter, PartyTransaction } from '../types';
import { NotFoundError, BadRequestError } from '../utils';

export const getAll = async (companyId: string, filter: PartyFilter) => {
    const { page = 1, limit = 20, search, type, status, city } = filter;
    const offset = (page - 1) * limit;

    // We fetch global parties, but we want to mix in our company's financials.
    // Supabase JS doesn't support complex left joins easily with renaming columns in one go usually, 
    // but we can select relational data.
    // Query: Select all parties, and the financial record for THIS company.
    // Note: If financial record is missing (new global party not yet linked), we might still want to see it? 
    // "Parties list will be same for all companies".
    // So distinct list of parties?
    // Actually, if we just select * from parties, we get all. 
    // And we include party_financials(credit_limit, balances) where company_id = X.

    let query = supabaseAdmin
        .from(TABLES.PARTIES)
        .select(`
            *,
            party_financials!left(
                company_id,
                credit_limit,
                opening_balance,
                current_balance,
                total_purchases,
                total_payments
            )
        `, { count: 'exact' });

    // Filter financials by company - Supabase post-filtering usually
    // But referencing nested table in filter is cleaner:
    // .eq('party_financials.company_id', companyId) <-- This implies INNER JOIN usually.
    // If we want ALL parties even if no transaction, we assume global list.
    // But if we want to show balance, we filter the joined data. 
    // Supabase syntax for filtering nested: 
    // embed resource with filter? .select('..., financials:party_financials(...)')

    // Improved Query:
    // We want the financials ONLY for this company.
    // We can use the filter on the relation directly inside select? 
    // Not directly in valid JS syntax implies distinct string usually.
    // Actually, simple .eq on foreign table filters the PARENT rows if inner join.
    // If left join, we need to be careful.

    // For now, let's fetch all parties and the specific company financials.
    // Supabase V2 allows filtering on join:
    // .select('*, party_financials(*)')
    // .eq('party_financials.company_id', companyId)
    // BUT this filters the Top Level rows based on child presence (INNER JOIN behavior).

    // User wants "Parties list same for all". So we want ALL parties.
    // But we want to attach financial info if it exists for us.
    // This is tricky in Supabase one-shot.
    // Easier approach: Fetch parties. Then Fetch financials for this company and merge in memory.
    // Pagination applies to parties.

    // 1. Build Party Query
    let partyQuery = supabaseAdmin
        .from(TABLES.PARTIES)
        .select('*', { count: 'exact' });

    if (search) {
        partyQuery = partyQuery.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    if (status) {
        partyQuery = partyQuery.eq('status', status);
    }

    if (city) {
        partyQuery = partyQuery.eq('city', city);
    }

    const { data: parties, count, error } = await partyQuery
        .order('name', { ascending: true })
        .range(offset, offset + limit - 1);

    if (error) throw error;
    if (!parties || parties.length === 0) return { data: [], total: 0 };

    // 2. Fetch Financials for these parties AND this company
    const partyIds = parties.map(p => p.id);
    const { data: financials } = await supabaseAdmin
        .from(TABLES.PARTY_FINANCIALS)
        .select('*')
        .eq('company_id', companyId)
        .in('party_id', partyIds);

    // 3. Merge
    const mergedData = parties.map(p => {
        const fin = financials?.find(f => f.party_id === p.id);
        return {
            ...p,
            credit_limit: fin?.credit_limit || 0,
            opening_balance: fin?.opening_balance || 0,
            current_balance: fin?.current_balance || 0,
            total_purchases: fin?.total_purchases || 0,
            total_payments: fin?.total_payments || 0,
        };
    });

    return { data: mergedData, total: count || 0 };
};

export const getById = async (companyId: string, id: string): Promise<Party> => {
    // Fetch global details
    const { data: party, error } = await supabaseAdmin
        .from(TABLES.PARTIES)
        .select('*')
        .eq('id', id)
        .single();

    if (error || !party) {
        throw new NotFoundError('Party not found');
    }

    // Fetch financials
    const { data: fin } = await supabaseAdmin
        .from(TABLES.PARTY_FINANCIALS)
        .select('*')
        .eq('company_id', companyId)
        .eq('party_id', id)
        .single();

    return {
        ...party,
        credit_limit: fin?.credit_limit || 0,
        opening_balance: fin?.opening_balance || 0,
        current_balance: fin?.current_balance || 0,
        total_purchases: fin?.total_purchases || 0,
        total_payments: fin?.total_payments || 0,
    };
};



export const create = async (companyId: string, dto: CreatePartyDTO): Promise<Party> => {
    // 1. Create Global Party (No duplication check on name globally? 
    //    User said "list same for all". If A creates "John", B sees "John".
    //    If A creates "John" and B creates "John" (different person?), we have duplicates.
    //    Assuming unique name globally or allows duplicates?
    //    Migration had NO unique constraint on name globally, only indexes.
    //    So we act like it's a new entry always for now.)

    //    Wait, if the list is "same for all", B should see "John" created by A.
    //    B can Use "John".
    //    But if B wants to create "John2", B creates row. A sees "John2".
    //    This is what logic implies.

    //    We assume 'create' means adding a NEW global party.

    const { data: party, error: partyError } = await supabaseAdmin
        .from(TABLES.PARTIES)
        .insert({
            name: dto.name,
            contact_person: dto.contact_person,
            phone: dto.phone,
            email: dto.email,
            address: dto.address,
            city: dto.city,
            ntn: dto.ntn,
            strn: dto.strn,
            status: 'active',
            notes: dto.notes,
        })
        .select()
        .single();

    if (partyError) throw partyError;

    // 2. Create Financial Record for Creating Company
    // Only init financials for the creator? Others will have 0/null until they transact?
    // We already return 0 defaults in read.
    // But we should create the record if we have opening balance.

    const { error: finError } = await supabaseAdmin
        .from(TABLES.PARTY_FINANCIALS)
        .insert({
            party_id: party.id,
            company_id: companyId,
            credit_limit: dto.credit_limit || 0,
            opening_balance: dto.opening_balance || 0,
            current_balance: dto.opening_balance || 0,
        });

    if (finError) {
        // Rollback party? Not easy.
        console.error('Failed to create party financials', finError);
    }

    return {
        ...party,
        credit_limit: dto.credit_limit || 0,
        opening_balance: dto.opening_balance || 0,
        current_balance: dto.opening_balance || 0,
        total_purchases: 0,
        total_payments: 0,
    };
};

export const update = async (companyId: string, id: string, dto: UpdatePartyDTO): Promise<Party> => {
    // 1. Update Global Info (Name, etc) - affects everyone!
    //    Is this safe? User said "Parties list same". 
    //    Usually suggests shared master data.

    const { data: party, error } = await supabaseAdmin
        .from(TABLES.PARTIES)
        .update({
            name: dto.name,
            contact_person: dto.contact_person,
            phone: dto.phone,
            email: dto.email,
            address: dto.address,
            city: dto.city,
            ntn: dto.ntn,
            strn: dto.strn,
            status: dto.status, // Global status?
            notes: dto.notes,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    // 2. Update Financials (Company Specific)
    // Check if record exists
    const { data: existingFin } = await supabaseAdmin
        .from(TABLES.PARTY_FINANCIALS)
        .select('id')
        .eq('company_id', companyId)
        .eq('party_id', id)
        .single();

    if (existingFin) {
        await supabaseAdmin
            .from(TABLES.PARTY_FINANCIALS)
            .update({
                credit_limit: dto.credit_limit,
                // status? No, status is global in our schema for now.
                updated_at: new Date().toISOString(),
            })
            .eq('id', existingFin.id);
    } else if (dto.credit_limit) {
        // Create if setting limit
        await supabaseAdmin
            .from(TABLES.PARTY_FINANCIALS)
            .insert({
                party_id: id,
                company_id: companyId,
                credit_limit: dto.credit_limit,
            });
    }

    return getById(companyId, id);
};

export const getLedger = async (companyId: string, partyId: string) => {
    const { data, error } = await supabaseAdmin
        .from(TABLES.TRANSACTIONS)
        .select('*')
        .eq('company_id', companyId)
        .eq('party_id', partyId)
        .order('date', { ascending: false });

    if (error) throw error;

    return data.map(t => ({
        id: t.id,
        companyId: t.company_id,
        partyId: t.party_id,
        date: t.date,
        type: t.type,
        description: t.description,
        invoiceNo: t.invoice_no,
        amount: Number(t.amount),
        paymentReceived: Number(t.payment_received),
        previousBalance: Number(t.previous_balance),
        newBalance: Number(t.new_balance),
        paymentMethod: t.payment_method,
        chequeNo: t.cheque_no,
        bankName: t.bank_name,
        createdAt: t.created_at
    }));
};

export const remove = async (companyId: string, id: string): Promise<void> => {
    // Deleting a global party?
    // If we delete, it vanishes for EVERYONE.
    // Dangerous. 
    // Maybe we should only remove "Link" (financials)?
    // But user asked for "Delete".
    // For now, let's implement Delete as Global Delete (since we are owner in theory? or Admin).
    // Or, we prevent delete if financials exist for OTHER companies?
    // RLS will allow delete if we have access?
    // Let's rely on cascade delete. If Global Party is deleted, all financials gone.

    // Check if we can delete?
    const { error } = await supabaseAdmin
        .from(TABLES.PARTIES)
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// Helper to generate voucher number
const generateVoucherNumber = async (companyId: string): Promise<string> => {
    // Format: RV-MMDD-XXXX (Receipt Voucher)
    const date = new Date();
    const prefix = `RV-${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;

    // Get last voucher number
    const { data } = await supabaseAdmin
        .from(TABLES.TRANSACTIONS)
        .select('invoice_no')
        .eq('company_id', companyId)
        .eq('type', 'payment')
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

export const recordPayment = async (companyId: string, partyId: string, payment: any): Promise<PartyTransaction> => {
    // Ensure financials exist
    let { data: fin } = await supabaseAdmin
        .from(TABLES.PARTY_FINANCIALS)
        .select('*')
        .eq('company_id', companyId)
        .eq('party_id', partyId)
        .single();

    if (!fin) {
        // Create dummy
        const { data: newFin } = await supabaseAdmin
            .from(TABLES.PARTY_FINANCIALS)
            .insert({
                party_id: partyId,
                company_id: companyId,
                current_balance: 0,
                total_purchases: 0,
                total_payments: 0
            })
            .select()
            .single();
        fin = newFin;
    }

    const currentBalance = fin.current_balance || 0;
    // Payment Received reduces Receivable (Positive Balance).
    // If Balance is 2000 (Receivable), Payment of 500 -> New Balance 1500.
    // So newBalance = currentBalance - payment.amount
    const newBalance = currentBalance - payment.amount;

    let transaction: any;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        const voucherNo = await generateVoucherNumber(companyId);

        const { data, error } = await supabaseAdmin
            .from(TABLES.TRANSACTIONS)
            .insert({
                company_id: companyId,
                party_id: partyId,
                type: 'payment',
                invoice_no: voucherNo, // Insert Generated Voucher No
                amount: payment.amount,
                payment_received: payment.amount, // Also set this for clarity? Supplier uses amount. Let's set both or follow convention.
                // Supplier service sets 'amount'.
                // 'payment_received' column exists in transactions table.
                // To match supplier logic exactly: Supplier sets 'amount'.
                // But let's set 'amount' as the main value column.
                previous_balance: currentBalance,
                new_balance: newBalance,
                date: payment.date,
                description: payment.description || 'Payment received',
                payment_method: payment.payment_method,
                cheque_no: payment.cheque_no,
                bank_name: payment.bank_name,
            })
            .select()
            .single();

        if (error) {
            // 23505 is unique constraint. transactions table might not have unique constraint on invoice_no?
            // But if we want unique vouchers, we should respect it.
            // If error occurs and it's unique violation, retry.
            if (error.code === '23505') {
                attempts++;
                continue;
            }
            throw error;
        }

        transaction = data;
        break;
    }

    if (!transaction) throw new Error('Failed to generate unique voucher number');

    // Update financials
    await supabaseAdmin
        .from(TABLES.PARTY_FINANCIALS)
        .update({
            current_balance: newBalance,
            total_payments: (fin.total_payments || 0) + payment.amount,
            updated_at: new Date().toISOString(),
        })
        .eq('id', fin.id);

    return transaction;
};

export const deletePayment = async (companyId: string, partyId: string, transactionId: string): Promise<void> => {
    // 1. Get Transaction
    const { data: txn, error: txnError } = await supabaseAdmin
        .from(TABLES.TRANSACTIONS)
        .select('*')
        .eq('company_id', companyId)
        .eq('party_id', partyId)
        .eq('id', transactionId)
        .single();

    if (txnError || !txn) throw new Error('Transaction not found');
    if (txn.type !== 'payment') throw new Error('Only payments can be deleted here');

    // 2. Revert Financials
    const { data: fin } = await supabaseAdmin
        .from(TABLES.PARTY_FINANCIALS)
        .select('*')
        .eq('company_id', companyId)
        .eq('party_id', partyId)
        .single();

    if (fin) {
        // Payment reduced balance (Receivable decreased).
        // Deleting payment means Receivable INCREASES back.
        // Balance = Balance + amount.
        const reversedBalance = (fin.current_balance || 0) + Number(txn.amount);
        const reversedTotalPayments = (fin.total_payments || 0) - Number(txn.amount);

        await supabaseAdmin
            .from(TABLES.PARTY_FINANCIALS)
            .update({
                current_balance: reversedBalance,
                total_payments: reversedTotalPayments,
                updated_at: new Date().toISOString()
            })
            .eq('id', fin.id);
    }

    // 3. Delete Transaction
    const { error: deleteError } = await supabaseAdmin
        .from(TABLES.TRANSACTIONS)
        .delete()
        .eq('id', transactionId);

    if (deleteError) throw deleteError;
};

export const updatePayment = async (companyId: string, partyId: string, transactionId: string, updates: any): Promise<PartyTransaction> => {
    // 1. Get Original Transaction
    const { data: txn, error: txnError } = await supabaseAdmin
        .from(TABLES.TRANSACTIONS)
        .select('*')
        .eq('company_id', companyId)
        .eq('party_id', partyId)
        .eq('id', transactionId)
        .single();

    if (txnError || !txn) throw new Error('Transaction not found');
    if (txn.type !== 'payment') throw new Error('Only payments can be edited here');

    // 2. Adjust Financials (Old Amount vs New Amount)
    const oldAmount = Number(txn.amount);
    const newAmount = Number(updates.amount);
    const diff = newAmount - oldAmount; // Positive if paying MORE.

    if (diff !== 0) {
        const { data: fin } = await supabaseAdmin
            .from(TABLES.PARTY_FINANCIALS)
            .select('*')
            .eq('company_id', companyId)
            .eq('party_id', partyId)
            .single();

        if (fin) {
            // New Amount > Old Amount => Paid MORE.
            // Balance (Receivable) should DECREASE more.
            // Balance -= diff.
            // If Paid LESS (diff < 0), Balance INCREASES.
            // Balance -= (-diff) => Balance += diff.
            const newBalance = (fin.current_balance || 0) - diff;
            const newTotalPayments = (fin.total_payments || 0) + diff;

            await supabaseAdmin
                .from(TABLES.PARTY_FINANCIALS)
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
        .from(TABLES.TRANSACTIONS)
        .update({
            amount: newAmount,
            payment_received: newAmount,
            description: updates.description,
            date: updates.date,
            payment_method: updates.payment_method,
            cheque_no: updates.cheque_no,
            bank_name: updates.bank_name
        })
        .eq('id', transactionId)
        .select()
        .single();

    if (updateError) throw updateError;
    return updatedTxn;
};
