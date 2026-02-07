export interface SalesTaxInvoiceItem {
    id?: string;
    sales_tax_invoice_id?: string;
    item_name: string;
    hs_code: string;
    po_number?: string;
    demand_number?: string;
    weight_kgs: number;

    quantity: number;
    unit: string;
    rate: number;
    amt_excl_tax: number;
    st_percent: number;
    sales_tax: number;
    val_inc_tax: number;
}

export interface SalesTaxInvoice {
    id: string;
    company_id: string;
    voucher_no: string;
    date: string;
    party_code?: string;
    party_name: string;
    party_address?: string;
    party_ntn?: string;
    party_gst?: string;
    items: SalesTaxInvoiceItem[];
    total_quantity: number;
    total_weight: number;
    total_amt_excl_tax: number;
    total_sales_tax: number;
    grand_total: number;
    created_by?: string;
    company_name?: string;
    created_at: string;
}

export interface CreateSalesTaxInvoiceDTO {
    voucher_no: string;
    date: string;
    party_code?: string;
    party_name: string;
    party_address?: string;
    party_ntn?: string;
    party_gst?: string;
    items: SalesTaxInvoiceItem[];
    total_quantity: number;
    total_weight: number;
    total_amt_excl_tax: number;
    total_sales_tax: number;
    grand_total: number;
    company_name?: string;
}

export interface UpdateSalesTaxInvoiceDTO extends Partial<CreateSalesTaxInvoiceDTO> { }
