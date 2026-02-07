
import { supabaseAdmin } from '../../config/supabase';
import { TABLES } from '../../config/database';

const inventoryItems = [
    { name: 'Cotton Fabric 60/60', article_code: 'FAB-001', unit: 'Meters', rate: 150, current_stock: 1000, description: 'High quality cotton fabric' },
    { name: 'Polyester Thread White', article_code: 'THR-001', unit: 'Box', rate: 450, current_stock: 50, description: 'Standard sewing thread' },
    { name: 'Nylon Zipper 8 inch', article_code: 'ZIP-001', unit: 'PCS', rate: 15, current_stock: 2000, description: 'Durable nylon zipper' },
    { name: 'Buttons Shirt White', article_code: 'BTN-001', unit: 'DZN', rate: 60, current_stock: 500, description: 'Standard shirt buttons' },
    { name: 'Elastic Band 1 inch', article_code: 'ELS-001', unit: 'Meters', rate: 25, current_stock: 800, description: 'Wide elastic band' },
    { name: 'Denim Fabric Blue', article_code: 'FAB-002', unit: 'Meters', rate: 350, current_stock: 400, description: 'Heavy duty denim' },
    { name: 'Lace Trim White', article_code: 'LAC-001', unit: 'Meters', rate: 45, current_stock: 300, description: 'Decorative lace trim' },
    { name: 'Velvet Ribbon Red', article_code: 'RIB-001', unit: 'Meters', rate: 30, current_stock: 150, description: 'Soft velvet ribbon' },
    { name: 'Silk Thread Black', article_code: 'THR-002', unit: 'Box', rate: 550, current_stock: 40, description: 'Premium silk thread' },
    { name: 'Metal Zipper 12 inch', article_code: 'ZIP-002', unit: 'PCS', rate: 35, current_stock: 1000, description: 'Heavy duty metal zipper' },
    { name: 'Buttons Coat Black', article_code: 'BTN-002', unit: 'DZN', rate: 120, current_stock: 200, description: 'Large coat buttons' },
    { name: 'Lining Fabric Grey', article_code: 'FAB-003', unit: 'Meters', rate: 90, current_stock: 600, description: 'Inner lining fabric' },
    { name: 'Interfacing Medium', article_code: 'INT-001', unit: 'Meters', rate: 50, current_stock: 450, description: 'Fusible interfacing' },
    { name: 'Sewing Needles 90/14', article_code: 'NDL-001', unit: 'Box', rate: 200, current_stock: 100, description: 'Universal sewing needles' },
    { name: 'Measuring Tape', article_code: 'TOL-001', unit: 'PCS', rate: 40, current_stock: 50, description: 'Standard 60 inch tape' },
    { name: 'Tailor Chalk', article_code: 'TOL-002', unit: 'Box', rate: 80, current_stock: 75, description: 'Box of assorted chalk' },
    { name: 'Scissors 10 inch', article_code: 'TOL-003', unit: 'PCS', rate: 450, current_stock: 20, description: 'Fabric cutting scissors' },
    { name: 'Bobbin Case', article_code: 'MAC-001', unit: 'PCS', rate: 150, current_stock: 30, description: 'Standard bobbin case' },
    { name: 'Machine Oil', article_code: 'MAC-002', unit: 'PCS', rate: 120, current_stock: 40, description: 'Sewing machine lubricant' },
    { name: 'Safety Pins', article_code: 'PIN-001', unit: 'Box', rate: 50, current_stock: 200, description: 'Assorted safety pins' }
];

const seedInventory = async () => {
    console.log('🌱 Starting Inventory Seed...');

    // 1. Get Company
    const { data: company } = await supabaseAdmin
        .from(TABLES.COMPANIES)
        .select('id')
        .limit(1)
        .single();

    if (!company) {
        console.error('❌ No company found. Create a company first.');
        return;
    }
    console.log(`Using Company ID: ${company.id}`);

    // 2. Get Default Category
    let categoryId: string;
    const { data: category } = await supabaseAdmin
        .from(TABLES.CATEGORIES)
        .select('id')
        .eq('company_id', company.id)
        .limit(1)
        .single();

    if (category) {
        categoryId = category.id;
    } else {
        // Create category if not exists
        const { data: newCat, error } = await supabaseAdmin
            .from(TABLES.CATEGORIES)
            .insert({
                company_id: company.id,
                name: 'General Materials',
                description: 'Auto-generated for seeding'
            })
            .select('id')
            .single();

        if (error) {
            console.error('❌ Failed to create category:', error);
            return;
        }
        categoryId = newCat.id;
        console.log('Created new category: General Materials');
    }

    // 3. Insert Items
    let addedCount = 0;
    for (const item of inventoryItems) {
        // Check duplication
        const { data: existing } = await supabaseAdmin
            .from(TABLES.INVENTORY)
            .select('id')
            .eq('company_id', company.id)
            .eq('article_code', item.article_code)
            .single();

        if (!existing) {
            const { error } = await supabaseAdmin
                .from(TABLES.INVENTORY)
                .insert({
                    company_id: company.id,
                    category_id: categoryId,
                    ...item,
                    sale_price: Math.ceil(item.rate * 1.2), // 20% margin
                    min_stock: 10,
                    is_active: true
                });

            if (error) {
                console.error(`❌ Failed to insert ${item.name}:`, error.message);
            } else {
                addedCount++;
            }
        } else {
            console.log(`⚠️ Skipped ${item.name} (${item.article_code}) - Already exists`);
        }
    }

    console.log(`✅ Inventory Seeding Complete! Added ${addedCount} new items.`);
};

// Run if this file is executed directly
if (require.main === module) {
    seedInventory()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('Fatal Error:', err);
            process.exit(1);
        });
}

export default seedInventory;
