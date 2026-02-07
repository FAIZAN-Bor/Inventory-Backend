# Inventory System Backend API

A robust Node.js/Express backend API with Supabase integration for the Inventory System.

## 📁 Project Structure

```
backend/
├── src/
│   ├── index.ts                    # Application entry point
│   ├── app.ts                      # Express app configuration
│   │
│   ├── config/                     # Configuration files
│   │   ├── index.ts                # Environment configuration
│   │   ├── supabase.ts             # Supabase client setup
│   │   └── database.ts             # Database configuration
│   │
│   ├── controllers/                # Request handlers
│   │   ├── index.ts                # Barrel export
│   │   ├── auth.controller.ts      # Authentication
│   │   ├── inventory.controller.ts # Inventory management
│   │   ├── category.controller.ts  # Category management
│   │   ├── party.controller.ts     # Party/Customer management
│   │   ├── supplier.controller.ts  # Supplier management
│   │   ├── sales.controller.ts     # Sales operations
│   │   ├── purchase.controller.ts  # Purchase operations
│   │   ├── quotation.controller.ts # Quotation management
│   │   ├── deliveryChallan.controller.ts    # Delivery challan
│   │   ├── salesTaxInvoice.controller.ts    # Sales tax invoice
│   │   └── dashboard.controller.ts # Dashboard statistics
│   │
│   ├── services/                   # Business logic layer
│   │   ├── index.ts                # Barrel export
│   │   ├── auth.service.ts         # Authentication logic
│   │   ├── inventory.service.ts    # Inventory logic
│   │   ├── category.service.ts     # Category logic
│   │   ├── party.service.ts        # Party logic
│   │   ├── supplier.service.ts     # Supplier logic
│   │   ├── sales.service.ts        # Sales logic
│   │   ├── purchase.service.ts     # Purchase logic
│   │   ├── quotation.service.ts    # Quotation logic
│   │   ├── deliveryChallan.service.ts    # Challan logic
│   │   ├── salesTaxInvoice.service.ts    # Tax invoice logic
│   │   └── dashboard.service.ts    # Dashboard logic
│   │
│   ├── routes/                     # API route definitions
│   │   ├── index.ts                # Route aggregator
│   │   ├── auth.routes.ts          # /api/auth
│   │   ├── inventory.routes.ts     # /api/inventory
│   │   ├── category.routes.ts      # /api/categories
│   │   ├── party.routes.ts         # /api/parties
│   │   ├── supplier.routes.ts      # /api/suppliers
│   │   ├── sales.routes.ts         # /api/sales
│   │   ├── purchase.routes.ts      # /api/purchases
│   │   ├── quotation.routes.ts     # /api/quotations
│   │   ├── deliveryChallan.routes.ts    # /api/delivery-challans
│   │   ├── salesTaxInvoice.routes.ts    # /api/sales-tax-invoices
│   │   └── dashboard.routes.ts     # /api/dashboard
│   │
│   ├── middleware/                 # Express middleware
│   │   ├── index.ts                # Barrel export
│   │   ├── auth.middleware.ts      # JWT verification
│   │   ├── validation.middleware.ts # Request validation
│   │   ├── errorHandler.middleware.ts # Error handling
│   │   └── company.middleware.ts   # Multi-tenant context
│   │
│   ├── validators/                 # Joi validation schemas
│   │   ├── index.ts                # Barrel export
│   │   ├── common.validator.ts     # Shared schemas
│   │   ├── auth.validator.ts       # Auth schemas
│   │   ├── inventory.validator.ts  # Inventory schemas
│   │   ├── category.validator.ts   # Category schemas
│   │   ├── party.validator.ts      # Party schemas
│   │   ├── supplier.validator.ts   # Supplier schemas
│   │   ├── sales.validator.ts      # Sales schemas
│   │   ├── purchase.validator.ts   # Purchase schemas
│   │   ├── quotation.validator.ts  # Quotation schemas
│   │   ├── deliveryChallan.validator.ts  # Challan schemas
│   │   └── salesTaxInvoice.validator.ts  # Tax invoice schemas
│   │
│   ├── types/                      # TypeScript definitions
│   │   ├── index.ts                # Barrel export
│   │   ├── common.types.ts         # Shared types
│   │   ├── express.types.ts        # Express extensions
│   │   ├── auth.types.ts           # Auth types
│   │   ├── inventory.types.ts      # Inventory types
│   │   ├── category.types.ts       # Category types
│   │   ├── party.types.ts          # Party types
│   │   ├── supplier.types.ts       # Supplier types
│   │   ├── sales.types.ts          # Sales types
│   │   ├── purchase.types.ts       # Purchase types
│   │   ├── quotation.types.ts      # Quotation types
│   │   ├── deliveryChallan.types.ts    # Challan types
│   │   └── salesTaxInvoice.types.ts    # Tax invoice types
│   │
│   ├── utils/                      # Utility functions
│   │   ├── index.ts                # Barrel export
│   │   ├── apiError.ts             # Custom error classes
│   │   ├── apiResponse.ts          # Response formatters
│   │   ├── asyncHandler.ts         # Async wrapper
│   │   ├── logger.ts               # Logging utility
│   │   ├── dateUtils.ts            # Date helpers
│   │   ├── formatters.ts           # Number/currency formatters
│   │   └── invoiceGenerator.ts     # Invoice number generator
│   │
│   └── database/                   # Database files
│       ├── migrations/             # SQL migrations
│       │   ├── 001_create_companies.sql
│       │   ├── 002_create_users.sql
│       │   ├── 003_create_categories.sql
│       │   ├── 004_create_inventory.sql
│       │   ├── 005_create_parties.sql
│       │   ├── 006_create_suppliers.sql
│       │   ├── 007_create_sales.sql
│       │   ├── 008_create_sales_items.sql
│       │   ├── 009_create_purchases.sql
│       │   ├── 010_create_purchase_items.sql
│       │   ├── 011_create_quotations.sql
│       │   ├── 012_create_delivery_challans.sql
│       │   ├── 013_create_sales_tax_invoices.sql
│       │   └── 014_create_transactions.sql
│       │
│       └── seeds/                  # Seed data
│           ├── 001_companies.seed.ts
│           ├── 002_categories.seed.ts
│           └── 003_inventory.seed.ts
│
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
├── .env.example                    # Environment template
├── .gitignore                      # Git ignore rules
└── README.md                       # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Install dependencies:
```bash
cd backend
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your Supabase credentials

4. Start development server:
```bash
npm run dev
```

## 📋 API Endpoints

| Module | Base Path | Description |
|--------|-----------|-------------|
| Auth | `/api/auth` | Authentication & authorization |
| Inventory | `/api/inventory` | Stock management |
| Categories | `/api/categories` | Category management |
| Parties | `/api/parties` | Customer management |
| Suppliers | `/api/suppliers` | Supplier management |
| Sales | `/api/sales` | Sales transactions |
| Purchases | `/api/purchases` | Purchase transactions |
| Quotations | `/api/quotations` | Quotation management |
| Delivery Challans | `/api/delivery-challans` | Delivery challan management |
| Sales Tax Invoices | `/api/sales-tax-invoices` | Tax invoice management |
| Dashboard | `/api/dashboard` | Dashboard statistics |

## 🛠️ Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## 📦 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Language**: TypeScript
- **Validation**: Joi
- **Authentication**: Supabase Auth + JWT
