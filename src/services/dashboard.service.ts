// Dashboard service - business logic for dashboard statistics
import { supabaseAdmin } from '../config/supabase';
import { TABLES } from '../config/database';

export const getStats = async (companyId: string) => {
    // Get total items
    const { count: totalItems } = await supabaseAdmin
        .from(TABLES.INVENTORY)
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('is_active', true);

    // Get low stock items
    const { count: lowStockItems } = await supabaseAdmin
        .from(TABLES.INVENTORY)
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('is_active', true)
        .lt('current_stock', supabaseAdmin.rpc('get_min_stock'));

    // Get total sales this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: salesData } = await supabaseAdmin
        .from(TABLES.SALES)
        .select('net_total')
        .eq('company_id', companyId)
        .gte('invoice_date', startOfMonth.toISOString());

    const totalSales = salesData?.reduce((sum, sale) => sum + (sale.net_total || 0), 0) || 0;

    // Get total purchases this month
    const { data: purchaseData } = await supabaseAdmin
        .from(TABLES.PURCHASES)
        .select('net_total')
        .eq('company_id', companyId)
        .gte('purchase_date', startOfMonth.toISOString());

    const totalPurchases = purchaseData?.reduce((sum, purchase) => sum + (purchase.net_total || 0), 0) || 0;

    return {
        totalItems: totalItems || 0,
        lowStockItems: lowStockItems || 0,
        totalSales,
        totalPurchases,
        totalRevenue: totalSales - totalPurchases,
        monthlyRevenue: totalSales,
    };
};

export const getLowStock = async (companyId: string) => {
    const { data } = await supabaseAdmin
        .from(TABLES.INVENTORY)
        .select('id, article_code, name, current_stock, min_stock, unit')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('current_stock', { ascending: true })
        .limit(10);

    return data || [];
};

export const getRecentTransactions = async (companyId: string) => {
    const { data } = await supabaseAdmin
        .from(TABLES.SALES)
        .select('id, invoice_no, customer_name, net_total, invoice_date')
        .eq('company_id', companyId)
        .order('invoice_date', { ascending: false })
        .limit(10);

    return data || [];
};

export const getSalesChart = async (companyId: string) => {
    // Get last 7 days of sales
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.toISOString().split('T')[0]);
    }

    const chartData = await Promise.all(
        days.map(async (day) => {
            const nextDay = new Date(day);
            nextDay.setDate(nextDay.getDate() + 1);

            const { data } = await supabaseAdmin
                .from(TABLES.SALES)
                .select('net_total')
                .eq('company_id', companyId)
                .gte('invoice_date', day)
                .lt('invoice_date', nextDay.toISOString().split('T')[0]);

            const total = data?.reduce((sum, sale) => sum + (sale.net_total || 0), 0) || 0;

            return { date: day, total };
        })
    );

    return chartData;
};
