# Quote and Bid Management Tool - Technical Architecture Document

**Version:** 1.0
**Last Updated:** November 14, 2025
**Status:** Production

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Application Structure](#3-application-structure)
4. [Database Architecture](#4-database-architecture)
5. [Component Architecture](#5-component-architecture)
6. [State Management](#6-state-management)
7. [API Integration](#7-api-integration)
8. [Authentication & Security](#8-authentication--security)
9. [File Structure Reference](#9-file-structure-reference)
10. [Deployment Architecture](#10-deployment-architecture)

---

## 1. Architecture Overview

### 1.1 System Architecture

The Quote and Bid Management Tool follows a modern three-tier architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  React 18 + TypeScript + Tailwind CSS (SPA)                 │
│  - Component-based UI                                        │
│  - Client-side routing                                       │
│  - Real-time updates                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  Supabase Backend Services                                   │
│  - PostgreSQL Database                                       │
│  - Authentication (Supabase Auth)                            │
│  - Real-time subscriptions                                   │
│  - Row Level Security (RLS)                                  │
│  - Edge Functions (Deno Runtime)                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Integration Layer                         │
│  External Systems                                            │
│  - Oracle ERP REST API                                       │
│  - CSV Import/Export                                         │
│  - Email Services                                            │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Design Patterns

**Frontend Patterns:**
- **Component Pattern:** Reusable React functional components
- **Context Pattern:** Global state management with React Context API
- **Hook Pattern:** Custom hooks for business logic encapsulation
- **Provider Pattern:** Authentication, theme, and data providers

**Backend Patterns:**
- **Repository Pattern:** Data access through Supabase client
- **Service Layer Pattern:** Business logic in service modules
- **Strategy Pattern:** Multiple import/export strategies
- **Observer Pattern:** Real-time data subscriptions

### 1.3 Key Architectural Principles

1. **Separation of Concerns:** UI components separated from business logic
2. **Single Responsibility:** Each module has one clear purpose
3. **DRY (Don't Repeat Yourself):** Reusable components and utilities
4. **Security by Default:** RLS enforced at database level
5. **Type Safety:** TypeScript throughout the application
6. **Responsive Design:** Mobile-first CSS approach

---

## 2. Technology Stack

### 2.1 Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.5.3 | Type-safe JavaScript |
| Vite | 5.4.2 | Build tool and dev server |
| Tailwind CSS | 3.4.1 | Utility-first CSS framework |
| Lucide React | 0.344.0 | Icon library |
| PostCSS | 8.4.35 | CSS processing |
| Autoprefixer | 10.4.18 | CSS vendor prefixing |

### 2.2 Backend Technologies

| Technology | Purpose |
|------------|---------|
| Supabase | Backend-as-a-Service platform |
| PostgreSQL | Relational database (v15+) |
| Supabase Auth | Authentication service |
| Supabase Realtime | WebSocket-based real-time updates |
| Deno | Edge functions runtime |

### 2.3 Development Tools

| Tool | Purpose |
|------|---------|
| ESLint | Code linting |
| TypeScript ESLint | TypeScript-specific linting |
| npm | Package management |
| Git | Version control |

### 2.4 External Integrations

| Service | Purpose |
|---------|---------|
| Oracle ERP | Inventory and customer data sync |
| SMTP Service | Email notifications |
| PDF Generation | Quote document generation |

---

## 3. Application Structure

### 3.1 Project Directory Layout

```
quote-bid-management-tool/
├── public/                      # Static assets
├── src/                         # Source code
│   ├── components/             # React components
│   │   ├── approval/          # Approval workflow components
│   │   ├── auth/              # Authentication components
│   │   ├── catalog/           # Product catalog components
│   │   ├── common/            # Shared/reusable components
│   │   ├── customer/          # Customer-related components
│   │   ├── inventory/         # Inventory display components
│   │   ├── layout/            # Layout components (header, nav)
│   │   ├── management/        # CRUD management interfaces
│   │   ├── quote/             # Quote builder components
│   │   ├── reference/         # Cross-reference components
│   │   ├── settings/          # Settings/configuration
│   │   └── training/          # Training and help content
│   ├── context/               # React Context providers
│   ├── data/                  # Static/test data
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Core libraries and utilities
│   ├── services/              # Business logic services
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Utility functions
│   ├── App.tsx                # Main application component
│   ├── main.tsx               # Application entry point
│   └── index.css              # Global styles
├── supabase/
│   ├── functions/             # Edge functions (serverless)
│   │   ├── import-products/
│   │   ├── import-customers/
│   │   └── import-cross-references/
│   └── migrations/            # Database migrations (51 files)
├── index.html                 # HTML entry point
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite configuration
├── tailwind.config.js         # Tailwind CSS configuration
└── .env                       # Environment variables
```

### 3.2 Component Organization

Components are organized by feature/domain:

- **approval/** - Approval status display, pending approvals list
- **auth/** - Login form, auth provider, protected routes
- **catalog/** - Product catalog, product modal
- **common/** - Delete confirmation modal, shared utilities
- **customer/** - Customer profile, charts, analytics
- **inventory/** - Inventory display and management
- **layout/** - Header, navigation, page layout
- **management/** - CRUD interfaces for all entities
- **quote/** - Quote builder and all quote-related UI
- **reference/** - Cross-reference lookup
- **settings/** - Application configuration, approval limits
- **training/** - User training guides and documentation

---

## 4. Database Architecture

### 4.1 Database Schema Overview

The database consists of **12 core tables** and **51 migration files** that implement the schema progressively.

### 4.2 Core Tables

#### 4.2.1 User Management

**profiles**
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'manager', 'sales_rep')),
  company TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose:** Extends Supabase auth.users with application-specific profile data
**Relationships:** One-to-one with auth.users
**Indexes:** Primary key on id, unique index on email

**role_approval_limits**
```sql
CREATE TABLE role_approval_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role TEXT UNIQUE NOT NULL,
  max_quote_value NUMERIC(12,2) NOT NULL,
  max_discount_percent NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose:** Configurable approval thresholds by user role
**Key Fields:** role, max_quote_value, max_discount_percent

#### 4.2.2 Customer Management

**customers**
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  customer_number TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('federal', 'state', 'local', 'commercial')),
  segment TEXT NOT NULL CHECK (segment IN ('government', 'defense', 'education', 'healthcare', 'commercial')),
  contract_number TEXT,
  payment_terms TEXT DEFAULT 'NET 30',
  currency TEXT DEFAULT 'USD',
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  sales_rep_id UUID REFERENCES profiles(id),
  oracle_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose:** Customer master data
**Key Fields:** customer_number (unique), type, segment, tier
**Oracle Integration:** oracle_customer_id for ERP sync

**customer_addresses**
```sql
CREATE TABLE customer_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  address_type TEXT CHECK (address_type IN ('billing', 'shipping', 'site')),
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'US',
  is_primary BOOLEAN DEFAULT false,
  warehouse_code TEXT,
  site_use_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose:** Multiple addresses per customer
**Relationships:** Many-to-one with customers
**Oracle Integration:** site_use_id for ERP sync

**customer_contacts**
```sql
CREATE TABLE customer_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  title TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose:** Contact persons for each customer
**Relationships:** Many-to-one with customers

#### 4.2.3 Product Management

**products**
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  supplier TEXT NOT NULL,
  supplier_email TEXT,
  unit_cost NUMERIC(10,2) DEFAULT 0,
  list_price NUMERIC(10,2) DEFAULT 0,
  lead_time_days INTEGER DEFAULT 0,
  lead_time_text TEXT,
  warehouse TEXT DEFAULT 'MAIN',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
  cost_effective_from DATE,
  cost_effective_to DATE,
  buyer TEXT,
  category_set TEXT,
  assignment TEXT,
  long_description TEXT,
  item_type TEXT,
  unit_of_measure TEXT,
  moq INTEGER,
  min_quantity INTEGER,
  max_quantity INTEGER,
  weight NUMERIC(10,2),
  length NUMERIC(10,2),
  width NUMERIC(10,2),
  height NUMERIC(10,2),
  fleet TEXT,
  country_of_origin TEXT,
  tariff_amount NUMERIC(10,2),
  cs_notes TEXT,
  average_lead_time INTEGER,
  rep_code TEXT,
  rep_by TEXT,
  revision TEXT,
  inventory_item_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose:** Complete product catalog with extended attributes
**Key Fields:** sku (unique), name, category, supplier, pricing
**Oracle Integration:** inventory_item_id for ERP sync

**inventory_levels**
```sql
CREATE TABLE inventory_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  warehouse TEXT DEFAULT 'MAIN',
  quantity_on_hand INTEGER DEFAULT 0,
  quantity_reserved INTEGER DEFAULT 0,
  quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
  reorder_point INTEGER DEFAULT 0,
  reorder_quantity INTEGER DEFAULT 0,
  last_restock_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose:** Real-time inventory tracking
**Relationships:** Many-to-one with products (one per warehouse)
**Computed Column:** quantity_available (on_hand - reserved)

**cross_references**
```sql
CREATE TABLE cross_references (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  reference_type TEXT CHECK (reference_type IN ('customer', 'supplier', 'manufacturer', 'internal')),
  reference_number TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id),
  description TEXT,
  last_used_date DATE,
  usage_count INTEGER DEFAULT 0,
  ordered_item_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reference_type, reference_number, customer_id)
);
```

**Purpose:** Multi-dimensional part number cross-referencing
**Key Fields:** reference_type, reference_number, product_id
**Unique Constraint:** Prevents duplicate references per customer
**Oracle Integration:** ordered_item_id for ERP sync

**item_relationships**
```sql
CREATE TABLE item_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  primary_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  related_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  relationship_type TEXT CHECK (relationship_type IN ('supersession', 'alternate', 'accessory', 'related')),
  notes TEXT,
  effective_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(primary_product_id, related_product_id, relationship_type)
);
```

**Purpose:** Product supersessions and alternates
**Relationships:** Self-referencing products table (many-to-many)

#### 4.2.4 Quote Management

**quotes**
```sql
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) NOT NULL,
  customer_user_id UUID REFERENCES customer_contacts(id),
  quote_type TEXT DEFAULT 'Daily Quote' CHECK (quote_type IN ('Daily Quote', 'Bid')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'won', 'lost', 'expired')),
  valid_until DATE,
  ship_until DATE,
  customer_bid_number TEXT,
  purchase_order_number TEXT,
  notes TEXT,
  total_value NUMERIC(12,2) DEFAULT 0,
  total_cost NUMERIC(12,2) DEFAULT 0,
  total_margin NUMERIC(12,2) DEFAULT 0,
  line_item_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  dbe_required BOOLEAN DEFAULT false,
  bid_bond_required BOOLEAN DEFAULT false,
  performance_bond_required BOOLEAN DEFAULT false,
  insurance_required BOOLEAN DEFAULT false,
  winning_competitor TEXT,
  loss_reason TEXT,
  loss_notes TEXT,
  quote_status TEXT DEFAULT 'draft' CHECK (quote_status IN ('draft', 'pending_approval', 'approved'))
);
```

**Purpose:** Quote header with totals and status
**Key Fields:** quote_number (unique), customer_id, status
**Calculated Fields:** total_value, total_margin (updated via triggers)

**quote_line_items**
```sql
CREATE TABLE quote_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  supplier TEXT NOT NULL,
  category TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL,
  unit_cost NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  total_cost NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  margin_percent NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN unit_price > 0
    THEN ((unit_price - unit_cost) / unit_price * 100)
    ELSE 0 END
  ) STORED,
  lead_time TEXT,
  quoted_lead_time TEXT,
  reserve_quantity INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  shipping_instructions TEXT,
  cost_effective_from DATE,
  cost_effective_to DATE,
  inventory_item_id TEXT,
  ordered_item_id TEXT,
  price_list_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose:** Individual line items within quotes
**Relationships:** Many-to-one with quotes
**Computed Columns:** subtotal, total_cost, margin_percent
**Oracle Integration:** inventory_item_id, ordered_item_id, price_list_id

**price_requests**
```sql
CREATE TABLE price_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_line_item_id UUID REFERENCES quote_line_items(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES auth.users(id),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  supplier_email TEXT,
  supplier_response TEXT,
  price_breaks JSONB,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose:** Track pricing requests to suppliers
**Relationships:** Many-to-one with quote_line_items
**JSONB Field:** price_breaks stores array of quantity/price objects

#### 4.2.5 Configuration

**app_configurations**
```sql
CREATE TABLE app_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT,
  config_type TEXT CHECK (config_type IN ('api', 'import_auth', 'general')),
  description TEXT,
  is_encrypted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose:** System-wide configuration storage
**Key Features:** Supports encrypted values, typed configuration

**Stored Configurations:**
- Oracle ERP API credentials
- Import API authentication keys
- System-wide defaults (payment terms, currency, etc.)

### 4.3 Database Triggers

**update_quote_totals_trigger**
```sql
CREATE TRIGGER update_quote_totals
  AFTER INSERT OR UPDATE OR DELETE ON quote_line_items
  FOR EACH ROW
  EXECUTE FUNCTION update_quote_totals();
```

**Purpose:** Automatically recalculate quote totals when line items change
**Updates:** total_value, total_cost, total_margin, line_item_count

**update_approval_status_trigger**
```sql
CREATE TRIGGER check_approval_status
  AFTER INSERT OR UPDATE ON quote_line_items
  FOR EACH ROW
  EXECUTE FUNCTION check_approval_requirements();
```

**Purpose:** Flag quotes requiring approval based on thresholds

### 4.4 Row Level Security (RLS)

All tables have RLS enabled. Key policies:

**Profiles:**
- Users can view and update their own profile
- Admins can view all profiles

**Customers:**
- All authenticated users can view all customers
- Only managers and admins can modify customers

**Products:**
- All authenticated users can view products
- Only admins can modify products

**Quotes:**
- All authenticated users can view all quotes
- Users can modify quotes they created
- Managers can modify all quotes

**Quote Line Items:**
- Access inherits from parent quote
- Modification rules match quote access

### 4.5 Indexes

Performance indexes on frequently queried fields:

```sql
-- Quote number lookup
CREATE INDEX idx_quotes_quote_number ON quotes(quote_number);

-- Customer lookups
CREATE INDEX idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX idx_customers_customer_number ON customers(customer_number);

-- Product SKU lookup
CREATE INDEX idx_products_sku ON products(sku);

-- Cross-reference searches
CREATE INDEX idx_cross_references_reference_number ON cross_references(reference_number);
CREATE INDEX idx_cross_references_product_id ON cross_references(product_id);

-- Line item queries
CREATE INDEX idx_quote_line_items_quote_id ON quote_line_items(quote_id);
CREATE INDEX idx_quote_line_items_product_id ON quote_line_items(product_id);

-- Price requests
CREATE INDEX idx_price_requests_quote_line_item_id ON price_requests(quote_line_item_id);
CREATE INDEX idx_price_requests_status ON price_requests(status);
```

### 4.6 Migration Strategy

Migrations are version-controlled SQL files in `supabase/migrations/`:

**Migration Naming:** `YYYYMMDDHHMMSS_descriptive_name.sql`

**Key Migrations:**
1. `20250911210238_autumn_bridge.sql` - Initial schema
2. `20251003115002_create_price_requests_table.sql` - Price requests
3. `20251022000003_create_app_configurations.sql` - Configuration system
4. `20251106181141_create_user_roles_management_v2.sql` - Role management
5. `20251106183543_create_customer_addresses_table.sql` - Customer addresses
6. `20251106195551_create_customer_contacts_table.sql` - Customer contacts
7. `20251108235526_create_role_approval_limits.sql` - Approval limits

**Total Migrations:** 51 files implementing progressive schema evolution

---

## 5. Component Architecture

### 5.1 Component Hierarchy

```
App (main.tsx)
├── ThemeProvider
│   └── AuthProvider
│       └── ProtectedRoute
│           └── SupabaseQuoteProvider
│               └── QuoteProvider
│                   └── CustomerProvider
│                       └── InventoryProvider
│                           ├── Header
│                           ├── Navigation
│                           └── Main Content (Active Tab)
│                               ├── QuoteBuilder
│                               ├── ProductCatalog
│                               ├── CustomerProfile
│                               ├── QuoteManagement
│                               ├── PendingApprovals
│                               ├── PriceRequests
│                               ├── ProductManagement
│                               ├── CrossReferenceManagement
│                               ├── ItemRelationshipManagement
│                               ├── CustomerManagement
│                               ├── UserManagement
│                               ├── ProductImport
│                               ├── ConfigurationSettings
│                               └── TrainingGuide
```

### 5.2 Core Components

#### 5.2.1 Layout Components

**Header** (`src/components/layout/Header.tsx`)
- Application branding
- User profile display
- Theme toggle (light/dark)
- Notification bell
- Real-time quote statistics

**Navigation** (`src/components/layout/Navigation.tsx`)
- Sidebar navigation menu
- Mobile hamburger menu
- Active tab highlighting
- Feature icon indicators
- 13 navigation items

#### 5.2.2 Authentication Components

**AuthProvider** (`src/components/auth/AuthProvider.tsx`)
- Manages authentication state
- Provides login/logout functions
- User session management
- Context provider for auth data

**LoginForm** (`src/components/auth/LoginForm.tsx`)
- Email/password login form
- Error handling and validation
- Loading states
- Remember me functionality

**ProtectedRoute** (`src/components/auth/ProtectedRoute.tsx`)
- Route guard for authenticated access
- Redirects to login if not authenticated
- Shows loading spinner during auth check

#### 5.2.3 Quote Management Components

**QuoteBuilder** (`src/components/quote/QuoteBuilder.tsx`)
- Main quote creation interface
- Customer selection
- Quote details form
- Line items management
- Cost analysis integration
- Multi-year pricing
- 600+ lines of code

**LineItems** (`src/components/quote/LineItems.tsx`)
- Line item table display
- Add/edit/delete line items
- Product search and selection
- CSV upload support
- Bulk operations (select all, mass actions)
- Price break selection
- Supersession/alternate lookup
- Status management per item
- 1000+ lines of code

**QuoteDetails** (`src/components/quote/QuoteDetails.tsx`)
- Quote header information form
- Customer user selection
- Quote type selection
- Bid/PO number entry
- Validity dates
- Special requirements (bonds, insurance)

**QuoteSummary** (`src/components/quote/QuoteSummary.tsx`)
- Total value calculation
- Total cost display
- Margin percentage
- Line item count
- Quote status indicator

**CostAnalysis** (`src/components/quote/CostAnalysis.tsx`)
- What-if margin calculations
- Target margin setting
- Overhead percentage
- Recommended price calculation
- Profit analysis

**MultiYearPricing** (`src/components/quote/MultiYearPricing.tsx`)
- Annual pricing schedules
- Escalation percentage setting
- Year-over-year pricing display
- Contract duration configuration

**PriceBreakModal** (`src/components/quote/PriceBreakModal.tsx`)
- Display available price breaks
- Quantity tier selection
- Discount visualization
- Apply price break to line item

**SupersessionModal** (`src/components/quote/SupersessionModal.tsx`)
- Show superseded products
- Display alternate products
- Product relationship management
- Replace with alternate functionality

**HistoryModal** (`src/components/quote/HistoryModal.tsx`)
- Historical pricing lookup
- Previous quotes for same product
- Trend analysis
- Price reference data

**CSVUploadModal** (`src/components/quote/CSVUploadModal.tsx`)
- Bulk line item upload
- CSV file parsing
- Data validation
- Preview before import
- Error reporting

**LostDetailsModal** (`src/components/quote/LostDetailsModal.tsx`)
- Capture loss reason
- Winning competitor entry
- Loss notes
- Competitive intelligence

**CustomerSelector** (`src/components/quote/CustomerSelector.tsx`)
- Customer dropdown selection
- Search and filter customers
- Display customer details
- Integration with customer context

**MassActionModal** (`src/components/quote/MassActionModal.tsx`)
- Bulk status updates
- Mass price requests
- Lead time requests
- New item requests

#### 5.2.4 Product Management Components

**ProductCatalog** (`src/components/catalog/ProductCatalog.tsx`)
- Grid view of products
- Search and filter
- Category filtering
- Stock level indicators
- Add to quote functionality

**ProductModal** (`src/components/catalog/ProductModal.tsx`)
- Detailed product information
- Specifications display
- Inventory levels
- Add to quote with quantity

**ProductManagement** (`src/components/management/ProductManagement.tsx`)
- CRUD operations for products
- Product list table
- Search and filter
- Edit/delete actions
- 400+ lines of code

**ProductEditModal** (`src/components/management/ProductEditModal.tsx`)
- Product creation/editing form
- All product fields
- Validation
- Save/cancel actions

**ProductImport** (`src/components/management/ProductImport.tsx`)
- CSV import interface
- Template download
- Import preview
- Error handling
- Bulk product creation

#### 5.2.5 Customer Management Components

**CustomerProfile** (`src/components/customer/CustomerProfile.tsx`)
- Customer analytics dashboard
- Win rate calculation
- Average margin display
- Quote history timeline
- Trend indicators
- Chart integration

**CustomerManagement** (`src/components/management/CustomerManagement.tsx`)
- Customer CRUD operations
- Customer list table
- Search and filter
- Integrated address and contact management
- 500+ lines of code

**CustomerEditModal** (`src/components/management/CustomerEditModal.tsx`)
- Customer form
- All customer fields
- Validation
- Save functionality

**AddressManagement** (`src/components/management/AddressManagement.tsx`)
- Manage customer addresses
- Add/edit/delete addresses
- Address type selection
- Primary address flag

**ContactManagement** (`src/components/management/ContactManagement.tsx`)
- Manage customer contacts
- Add/edit/delete contacts
- Primary contact flag
- Contact details form

**Chart** (`src/components/customer/Chart.tsx`)
- Reusable chart component
- Visual data representation
- Trend line display
- Used in customer analytics

#### 5.2.6 Cross-Reference Components

**CrossReference** (`src/components/reference/CrossReference.tsx`)
- Multi-dimensional part lookup
- Search all reference types
- Result display with product details
- Add to quote functionality

**CrossReferenceManagement** (`src/components/management/CrossReferenceManagement.tsx`)
- CRUD for cross-references
- Reference list table
- Search and filter
- Edit/delete actions
- 400+ lines of code

**CrossReferenceEditModal** (`src/components/management/CrossReferenceEditModal.tsx`)
- Cross-reference form
- Reference type selection
- Product linking
- Customer association

#### 5.2.7 Approval Components

**PendingApprovals** (`src/components/approval/PendingApprovals.tsx`)
- List quotes requiring approval
- Approval/rejection actions
- Quote details display
- Margin analysis
- Comment entry
- 300+ lines of code

**ApprovalStatus** (`src/components/approval/ApprovalStatus.tsx`)
- Visual approval status indicator
- Approval history display
- Approver information
- Timestamp display

#### 5.2.8 Price Request Components

**PriceRequests** (`src/components/management/PriceRequests.tsx`)
- List all price requests
- Filter by status
- Display request details
- Complete/cancel actions
- 400+ lines of code

**PriceRequestEntry** (`src/components/management/PriceRequestEntry.tsx`)
- Individual price request card
- Supplier response entry
- Price break entry (JSON)
- Status updates
- Complete request action

#### 5.2.9 Management Components

**QuoteManagement** (`src/components/management/QuoteManagement.tsx`)
- View all quotes
- Search and filter quotes
- Quote list table
- Edit/delete/duplicate actions
- Status statistics
- 300+ lines of code

**UserManagement** (`src/components/management/UserManagement.tsx`)
- List all users
- Display user roles
- Role assignment
- User details
- Integration with profiles table

**RoleAssignmentModal** (`src/components/management/RoleAssignmentModal.tsx`)
- Assign roles to users
- Role dropdown
- Save role changes
- Admin-only access

**ItemRelationshipManagement** (`src/components/management/ItemRelationshipManagement.tsx`)
- Manage product relationships
- Supersession tracking
- Alternate products
- Relationship CRUD
- 300+ lines of code

**ItemRelationshipEditModal** (`src/components/management/ItemRelationshipEditModal.tsx`)
- Relationship form
- Relationship type selection
- Product selection (primary and related)
- Notes and effective date

#### 5.2.10 Settings Components

**ConfigurationSettings** (`src/components/settings/ConfigurationSettings.tsx`)
- Oracle ERP configuration
- API credentials management
- Import API key generation
- Test connection functionality
- Configuration storage
- 600+ lines of code

**ApprovalLimitsSettings** (`src/components/settings/ApprovalLimitsSettings.tsx`)
- Configure approval limits by role
- Max quote value per role
- Max discount percent per role
- Save limits to database

#### 5.2.11 Common Components

**DeleteConfirmationModal** (`src/components/common/DeleteConfirmationModal.tsx`)
- Reusable confirmation dialog
- Customizable message
- Confirm/cancel actions
- Loading state during deletion

#### 5.2.12 Training Components

**TrainingGuide** (`src/components/training/TrainingGuide.tsx`)
- Interactive user guide
- Feature documentation
- Step-by-step tutorials
- Screenshots and examples
- 800+ lines of code

#### 5.2.13 Inventory Components

**InventoryDisplay** (`src/components/inventory/InventoryDisplay.tsx`)
- Display inventory levels
- Stock availability
- Warehouse locations
- Reorder point indicators

---

## 6. State Management

### 6.1 Context Providers

The application uses React Context API for global state management:

#### 6.1.1 ThemeContext (`src/context/ThemeContext.tsx`)

**Purpose:** Manage light/dark theme preference

**State:**
- `theme`: 'light' | 'dark'

**Methods:**
- `toggleTheme()`: Switch between themes

**Storage:** localStorage persistence

#### 6.1.2 AuthProvider (`src/components/auth/AuthProvider.tsx`)

**Purpose:** Manage authentication state and user session

**State:**
- `user`: Current authenticated user object
- `loading`: Authentication check in progress
- `session`: Current session object

**Methods:**
- `signIn(email, password)`: Authenticate user
- `signOut()`: End user session
- `getUser()`: Retrieve current user

**Integration:** Supabase Auth

#### 6.1.3 SupabaseQuoteContext (`src/context/SupabaseQuoteContext.tsx`)

**Purpose:** Manage quote state with Supabase integration

**State:**
- `quotes`: Array of all quotes
- `currentQuote`: Currently selected/active quote
- `loading`: Data fetch in progress

**Methods:**
- `createQuote(quoteData)`: Create new quote
- `updateQuote(id, updates)`: Update existing quote
- `deleteQuote(id)`: Remove quote
- `setCurrentQuote(quote)`: Set active quote
- `refreshQuotes()`: Reload quotes from database

**Real-time:** Subscribes to quote changes via Supabase Realtime

#### 6.1.4 QuoteContext (`src/context/QuoteContext.tsx`)

**Purpose:** Legacy quote context (being phased out in favor of SupabaseQuoteContext)

**State:**
- Similar to SupabaseQuoteContext
- Local state management

**Note:** Maintained for backward compatibility

#### 6.1.5 CustomerContext (`src/context/CustomerContext.tsx`)

**Purpose:** Manage customer state and selection

**State:**
- `customers`: Array of all customers
- `selectedCustomer`: Currently selected customer
- `loading`: Data fetch in progress

**Methods:**
- `setSelectedCustomer(customer)`: Set active customer
- `refreshCustomers()`: Reload customers
- `getCustomerById(id)`: Fetch single customer

**Real-time:** Subscribes to customer changes

#### 6.1.6 InventoryContext (`src/context/InventoryContext.tsx`)

**Purpose:** Manage inventory data and Oracle ERP integration

**State:**
- `inventory`: Array of inventory levels
- `loading`: Sync in progress
- `lastSync`: Timestamp of last sync

**Methods:**
- `syncInventory()`: Trigger Oracle ERP sync
- `getInventoryForProduct(sku)`: Get stock for product
- `reserveInventory(productId, quantity)`: Create reservation

**Integration:** Oracle ERP API via `inventorySyncService`

### 6.2 Custom Hooks

#### 6.2.1 useAuth (`src/hooks/useAuth.ts`)

**Purpose:** Access authentication context

**Returns:** `{ user, loading, signIn, signOut }`

**Usage:**
```typescript
const { user, signIn, signOut } = useAuth();
```

#### 6.2.2 useSupabaseData (`src/hooks/useSupabaseData.ts`)

**Purpose:** Fetch and manage Supabase data with real-time updates

**Exports:**
- `useProducts()`: Product catalog with real-time sync
- `useCustomers()`: Customer list with real-time sync
- `useCrossReferences()`: Cross-references with real-time sync
- `useItemRelationships()`: Product relationships

**Features:**
- Automatic loading states
- Error handling
- Real-time subscriptions
- Cached data

**Usage:**
```typescript
const { products, loading, error, refresh } = useProducts();
```

#### 6.2.3 useApproval (`src/hooks/useApproval.ts`)

**Purpose:** Handle quote approval logic

**Methods:**
- `approveQuote(quoteId, comments)`: Approve a quote
- `rejectQuote(quoteId, reason)`: Reject a quote
- `checkApprovalRequired(quoteValue, role)`: Check if approval needed

**Returns:** `{ approveQuote, rejectQuote, loading, error }`

#### 6.2.4 useDeletion (`src/hooks/useDeletion.ts`)

**Purpose:** Handle entity deletion with confirmation

**Methods:**
- `deleteQuote(id)`: Delete quote with cascade
- `deleteProduct(id)`: Delete product
- `deleteCustomer(id)`: Delete customer
- `confirmDelete()`: Show confirmation modal

**Returns:** `{ deleteQuote, deleteProduct, deleteCustomer, loading }`

#### 6.2.5 useERPInventory (`src/hooks/useERPInventory.ts`)

**Purpose:** Oracle ERP inventory integration

**Methods:**
- `fetchInventory(sku)`: Get current stock from Oracle
- `syncAllInventory()`: Full inventory sync
- `checkAvailability(sku, quantity)`: Check if stock available

**Returns:** `{ fetchInventory, loading, error, lastSync }`

### 6.3 Local State Management

Individual components use `useState` and `useEffect` for local state:

**Common Patterns:**
- Form state (input values)
- Modal open/close state
- Loading indicators
- Error messages
- Pagination state
- Search/filter state

---

## 7. API Integration

### 7.1 Supabase Client Configuration

**File:** `src/lib/supabase.ts`

**Initialization:**
```typescript
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

**Type Safety:** Full TypeScript types generated from database schema

### 7.2 Database Operations

**CRUD Helper Functions:**

```typescript
// Quotes
export const getQuotes = async () => {
  const { data, error } = await supabase
    .from('quotes')
    .select('*, customers(*), quote_line_items(*)');
  return { data, error };
};

export const createQuote = async (quote) => {
  const { data, error } = await supabase
    .from('quotes')
    .insert(quote)
    .select();
  return { data, error };
};

export const updateQuote = async (id, updates) => {
  const { data, error } = await supabase
    .from('quotes')
    .update(updates)
    .eq('id', id)
    .select();
  return { data, error };
};

export const deleteQuote = async (id) => {
  const { error } = await supabase
    .from('quotes')
    .delete()
    .eq('id', id);
  return { error };
};
```

### 7.3 Real-time Subscriptions

**Quote Updates:**
```typescript
useEffect(() => {
  const channel = supabase
    .channel('quotes-changes')
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'quotes'
      },
      (payload) => {
        // Handle real-time update
        refreshQuotes();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

### 7.4 Oracle ERP Integration

**Service:** `src/services/erpApiService.ts`

**Purpose:** Interface with Oracle ERP REST API

**Key Functions:**

```typescript
// Fetch inventory from Oracle
export const fetchOracleInventory = async (sku: string) => {
  const config = await getERPConfig();
  const response = await fetch(
    `${config.baseUrl}/inventory/items/${sku}`,
    {
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.json();
};

// Fetch customer data
export const fetchOracleCustomer = async (customerId: string) => {
  const config = await getERPConfig();
  const response = await fetch(
    `${config.baseUrl}/customers/${customerId}`,
    {
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.json();
};
```

**Configuration:** Stored in `app_configurations` table

**Authentication:** Bearer token authentication

### 7.5 Inventory Sync Service

**Service:** `src/services/inventorySyncService.ts`

**Purpose:** Synchronize inventory between Oracle ERP and Supabase

**Functions:**

```typescript
// Full inventory sync
export const syncAllInventory = async () => {
  const products = await getProducts();

  for (const product of products) {
    const oracleData = await fetchOracleInventory(product.sku);

    await supabase
      .from('inventory_levels')
      .upsert({
        product_id: product.id,
        quantity_on_hand: oracleData.onHand,
        quantity_reserved: oracleData.reserved,
        warehouse: oracleData.warehouse
      });
  }
};

// Sync single product
export const syncProductInventory = async (sku: string) => {
  const oracleData = await fetchOracleInventory(sku);
  // Update inventory_levels table
};
```

**Schedule:** Can be triggered manually or on a schedule

### 7.6 Configuration Service

**Service:** `src/services/configService.ts`

**Purpose:** Manage application configuration

**Functions:**

```typescript
// Get ERP configuration
export const getERPConfig = async () => {
  const { data } = await supabase
    .from('app_configurations')
    .select('*')
    .eq('config_type', 'api')
    .eq('config_key', 'oracle_erp');

  return JSON.parse(data[0].config_value);
};

// Save ERP configuration
export const saveERPConfig = async (config) => {
  await supabase
    .from('app_configurations')
    .upsert({
      config_key: 'oracle_erp',
      config_value: JSON.stringify(config),
      config_type: 'api',
      is_encrypted: true
    });
};

// Get import API key
export const getImportAPIKey = async (endpoint: string) => {
  const { data } = await supabase
    .from('app_configurations')
    .select('config_value')
    .eq('config_key', `import_api_key_${endpoint}`)
    .maybeSingle();

  return data?.config_value;
};
```

### 7.7 Edge Functions (Supabase Functions)

#### 7.7.1 import-products

**Location:** `supabase/functions/import-products/index.ts`

**Purpose:** Bulk import products via API

**Endpoint:** `POST /functions/v1/import-products`

**Authentication:** API key in Authorization header

**Request Body:**
```json
{
  "products": [
    {
      "sku": "PROD-001",
      "name": "Product Name",
      "category": "Category",
      "supplier": "Supplier Name",
      "unit_cost": 10.00,
      "list_price": 15.00,
      // ... other fields
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "imported": 25,
  "errors": []
}
```

**Features:**
- Validates API key
- Validates product data
- Upserts products (update if exists, insert if new)
- Returns detailed error messages
- CORS enabled

#### 7.7.2 import-customers

**Location:** `supabase/functions/import-customers/index.ts`

**Purpose:** Bulk import customers with addresses and contacts

**Endpoint:** `POST /functions/v1/import-customers`

**Authentication:** API key in Authorization header

**Request Body:**
```json
{
  "customers": [
    {
      "customer_number": "CUST-001",
      "name": "Customer Name",
      "type": "federal",
      "segment": "government",
      "addresses": [
        {
          "address_type": "billing",
          "address_line1": "123 Main St",
          "city": "Washington",
          "state": "DC",
          "postal_code": "20001"
        }
      ],
      "contacts": [
        {
          "first_name": "John",
          "last_name": "Doe",
          "email": "john@example.com",
          "is_primary": true
        }
      ]
    }
  ]
}
```

**Features:**
- Imports customer, addresses, and contacts in single transaction
- Handles nested data structures
- Validates relationships
- Returns import summary

#### 7.7.3 import-cross-references

**Location:** `supabase/functions/import-cross-references/index.ts`

**Purpose:** Bulk import cross-references

**Endpoint:** `POST /functions/v1/import-cross-references`

**Authentication:** API key in Authorization header

**Request Body:**
```json
{
  "cross_references": [
    {
      "product_sku": "PROD-001",
      "reference_type": "customer",
      "reference_number": "CUST-PART-123",
      "customer_number": "CUST-001"
    }
  ]
}
```

**Features:**
- Links to existing products by SKU
- Links to customers by customer_number
- Validates product and customer existence
- Prevents duplicate cross-references

### 7.8 API Error Handling

**Pattern:**
```typescript
try {
  const { data, error } = await supabase
    .from('table')
    .select();

  if (error) throw error;

  return data;
} catch (error) {
  console.error('Database error:', error);
  logger.error('Operation failed', { error, context: 'functionName' });
  throw new Error('User-friendly error message');
}
```

**Logger:** `src/utils/logger.ts`

**Logging Levels:**
- `error()`: Critical errors
- `warn()`: Warnings
- `info()`: Informational
- `debug()`: Debug information

---

## 8. Authentication & Security

### 8.1 Authentication Flow

```
1. User enters email/password
2. Frontend calls supabase.auth.signInWithPassword()
3. Supabase Auth validates credentials
4. On success, returns JWT token and user object
5. JWT stored in localStorage
6. JWT included in all subsequent API requests
7. Supabase validates JWT on every request
8. Row Level Security policies enforced
```

### 8.2 Session Management

**Session Duration:** 24 hours (configurable)

**Refresh Tokens:** Automatically refreshed by Supabase client

**Logout:** Clears JWT and redirects to login

### 8.3 Row Level Security (RLS)

**Enforcement:** All database queries filtered by RLS policies

**Example Policy:**
```sql
CREATE POLICY "Users can view all quotes"
  ON quotes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own quotes"
  ON quotes FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());
```

### 8.4 API Security

**Edge Functions:**
- API key authentication
- Rate limiting (configurable)
- CORS headers configured
- Input validation

**Configuration Storage:**
- Sensitive values encrypted in database
- API keys hashed
- Never exposed in client code

### 8.5 SQL Injection Prevention

**Parameterized Queries:** All Supabase queries use parameterized inputs

**Example:**
```typescript
// Safe
await supabase
  .from('products')
  .select()
  .eq('sku', userInput);

// Unsafe (never used)
// await supabase.rpc('raw_sql', { query: `SELECT * FROM products WHERE sku = '${userInput}'` });
```

### 8.6 XSS Prevention

**React Escaping:** React automatically escapes values in JSX

**Dangerous HTML:** Never use `dangerouslySetInnerHTML`

**User Input:** Sanitized before display

### 8.7 CSRF Protection

**Same-Origin Policy:** API requests from same domain only

**CORS Configuration:** Restrictive CORS headers on edge functions

---

## 9. File Structure Reference

### 9.1 Source Files Breakdown

**Total TypeScript Files:** 68

#### Component Files (42 files)

**Approval (2 files):**
- `ApprovalStatus.tsx` - Visual approval status display
- `PendingApprovals.tsx` - List of quotes requiring approval

**Auth (3 files):**
- `AuthProvider.tsx` - Authentication context provider
- `LoginForm.tsx` - Login UI
- `ProtectedRoute.tsx` - Route guard

**Catalog (2 files):**
- `ProductCatalog.tsx` - Product grid display
- `ProductModal.tsx` - Product detail modal

**Common (1 file):**
- `DeleteConfirmationModal.tsx` - Reusable confirmation dialog

**Customer (2 files):**
- `CustomerProfile.tsx` - Customer analytics dashboard
- `Chart.tsx` - Chart component for analytics

**Inventory (1 file):**
- `InventoryDisplay.tsx` - Inventory level display

**Layout (2 files):**
- `Header.tsx` - Application header
- `Navigation.tsx` - Sidebar navigation

**Management (18 files):**
- `AddressManagement.tsx` - Customer address CRUD
- `ContactManagement.tsx` - Customer contact CRUD
- `CrossReferenceEditModal.tsx` - Cross-reference form
- `CrossReferenceManagement.tsx` - Cross-reference CRUD
- `CustomerEditModal.tsx` - Customer form
- `CustomerManagement.tsx` - Customer CRUD
- `ItemRelationshipEditModal.tsx` - Relationship form
- `ItemRelationshipManagement.tsx` - Relationship CRUD
- `PriceRequestEntry.tsx` - Single price request card
- `PriceRequests.tsx` - Price request list
- `ProductEditModal.tsx` - Product form
- `ProductImport.tsx` - CSV product import
- `ProductManagement.tsx` - Product CRUD
- `QuoteManagement.tsx` - Quote list and management
- `RoleAssignmentModal.tsx` - User role assignment
- `UserManagement.tsx` - User list and role management

**Quote (11 files):**
- `CostAnalysis.tsx` - Margin calculator
- `CSVUploadModal.tsx` - CSV line item import
- `CustomerSelector.tsx` - Customer dropdown
- `HistoryModal.tsx` - Historical pricing
- `LineItems.tsx` - Line item table
- `LostDetailsModal.tsx` - Lost quote details
- `MassActionModal.tsx` - Bulk operations
- `MultiYearPricing.tsx` - Multi-year pricing
- `PriceBreakModal.tsx` - Price break selection
- `QuoteBuilder.tsx` - Main quote interface
- `QuoteDetails.tsx` - Quote header form
- `QuoteSummary.tsx` - Quote totals
- `SupersessionModal.tsx` - Product supersession/alternates

**Reference (1 file):**
- `CrossReference.tsx` - Cross-reference lookup

**Settings (2 files):**
- `ApprovalLimitsSettings.tsx` - Approval limit configuration
- `ConfigurationSettings.tsx` - System configuration

**Training (1 file):**
- `TrainingGuide.tsx` - User documentation

#### Context Files (5 files)

- `CustomerContext.tsx` - Customer state management
- `InventoryContext.tsx` - Inventory state management
- `QuoteContext.tsx` - Legacy quote context
- `SupabaseQuoteContext.tsx` - Supabase quote context
- `ThemeContext.tsx` - Theme preference context

#### Hook Files (5 files)

- `useApproval.ts` - Approval logic hook
- `useAuth.ts` - Authentication hook
- `useDeletion.ts` - Deletion logic hook
- `useERPInventory.ts` - ERP integration hook
- `useSupabaseData.ts` - Data fetching hooks

#### Library Files (3 files)

- `database.types.ts` - TypeScript database types (auto-generated)
- `deletion.ts` - Deletion utility functions
- `supabase.ts` - Supabase client and helpers

#### Service Files (3 files)

- `configService.ts` - Configuration management
- `erpApiService.ts` - Oracle ERP integration
- `inventorySyncService.ts` - Inventory synchronization

#### Type Files (1 file)

- `oro-integration.ts` - OroCommerce type definitions

#### Utility Files (1 file)

- `logger.ts` - Logging utility

#### Data Files (1 file)

- `automotive-test-data.ts` - Test/demo data

#### Root Files (4 files)

- `App.tsx` - Main application component
- `main.tsx` - Application entry point
- `index.css` - Global styles
- `vite-env.d.ts` - Vite type definitions

### 9.2 Edge Function Files (3 functions)

- `supabase/functions/import-products/index.ts`
- `supabase/functions/import-customers/index.ts`
- `supabase/functions/import-cross-references/index.ts`

### 9.3 Migration Files (51 migrations)

Sequential SQL migration files in `supabase/migrations/`

**Key Migrations:**
1. Initial schema (profiles, customers, products, quotes)
2. Inventory management tables
3. Cross-references and relationships
4. Price requests
5. Configuration system
6. Customer addresses and contacts
7. Approval limits
8. RLS policy updates
9. Trigger functions
10. Index optimizations

### 9.4 Configuration Files

- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript compiler configuration
- `tsconfig.app.json` - App-specific TypeScript config
- `tsconfig.node.json` - Node-specific TypeScript config
- `vite.config.ts` - Vite build configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `eslint.config.js` - ESLint linting rules
- `.env` - Environment variables (not in repo)
- `.env.example` - Environment template
- `.gitignore` - Git ignore patterns

### 9.5 Documentation Files

- `README.md` - Project overview and setup
- `FUNCTIONAL-REQUIREMENTS.md` - Functional requirements
- `TECHNICAL-ARCHITECTURE.md` - This document
- `DOCUMENTATION.md` - Comprehensive documentation
- `DATABASE-SETUP-GUIDE.md` - Database setup instructions
- `ERP-INTEGRATION-GUIDE.md` - Oracle ERP integration guide
- `ERP-INTEGRATION-SUMMARY.md` - ERP integration summary
- `PRODUCT-IMPORT-API-GUIDE.md` - Product import API documentation
- `CUSTOMER-IMPORT-API-GUIDE.md` - Customer import API documentation
- `IMPORT-API-AUTH-GUIDE.md` - API authentication guide
- `DEPLOY-IMPORT-FUNCTION.md` - Edge function deployment guide
- `SECURITY-AUDIT-REPORT.md` - Security audit findings
- `CONFIGURATION-SYSTEM-GUIDE.md` - Configuration system guide
- `CHECK-IMPORT-AUTH-SETUP.md` - Import auth verification
- `QUICK-FIX-GUIDE.md` - Common issue resolutions
- `SETTINGS-FIX-SUMMARY.md` - Settings page fixes
- `PRODUCT-IMPORT-QUICK-GUIDE.md` - Quick import guide

---

## 10. Deployment Architecture

### 10.1 Deployment Environment

**Frontend Hosting:** Vercel, Netlify, or similar static hosting

**Backend:** Supabase hosted PostgreSQL and services

**Edge Functions:** Supabase Edge Functions (Deno runtime)

**CDN:** Cloudflare or similar for static assets

### 10.2 Build Process

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

**Build Output:** `dist/` directory

**Build Time:** ~7-10 seconds

**Bundle Size:**
- JavaScript: ~320 KB (gzipped: ~93 KB)
- CSS: ~41 KB (gzipped: ~7 KB)
- Total: ~360 KB (gzipped: ~100 KB)

### 10.3 Environment Variables

**Required Variables:**

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: Oracle ERP (configured in app)
# Stored in app_configurations table
```

### 10.4 Database Deployment

**Initial Setup:**
1. Create Supabase project
2. Run migrations in order (51 files)
3. Verify RLS policies
4. Seed initial data (optional)

**Migration Command:**
```bash
supabase db push
```

**Migration Rollback:**
```bash
supabase db reset
```

### 10.5 Edge Function Deployment

**Deploy Functions:**
```bash
# Via Supabase CLI
supabase functions deploy import-products
supabase functions deploy import-customers
supabase functions deploy import-cross-references
```

**Or via MCP Tool:**
```typescript
// Automated deployment via mcp__supabase__deploy_edge_function
```

### 10.6 Monitoring & Logging

**Frontend Monitoring:**
- Browser console errors
- Performance metrics (Core Web Vitals)
- User session tracking

**Backend Monitoring:**
- Supabase Dashboard
- Database performance metrics
- Edge function logs
- API error rates

**Custom Logging:**
- `logger.ts` utility for structured logging
- Console output in development
- Log aggregation in production

### 10.7 Backup & Recovery

**Database Backups:**
- Automatic daily backups (Supabase)
- Point-in-time recovery available
- 30-day retention

**Disaster Recovery:**
1. Restore from Supabase backup
2. Redeploy frontend from Git
3. Reconfigure environment variables
4. Verify edge functions

### 10.8 Scaling Considerations

**Database:**
- Supabase auto-scales
- Connection pooling built-in
- Read replicas for high traffic

**Frontend:**
- CDN caching
- Code splitting via Vite
- Lazy loading components

**API Rate Limiting:**
- Configurable per endpoint
- Token bucket algorithm
- Graceful degradation

### 10.9 Performance Optimization

**Frontend:**
- React.lazy() for code splitting
- Suspense boundaries
- Memoization (React.memo, useMemo)
- Virtual scrolling for large lists

**Database:**
- Indexed columns (51 indexes)
- Generated columns for calculations
- Efficient queries with `.select()`
- Real-time subscriptions only where needed

**Network:**
- HTTP/2
- Gzip compression
- Asset optimization
- Prefetching critical data

---

## Appendix A: Technology Versions

| Package | Version | Purpose |
|---------|---------|---------|
| react | 18.3.1 | UI library |
| react-dom | 18.3.1 | React DOM renderer |
| typescript | 5.5.3 | Type safety |
| vite | 5.4.2 | Build tool |
| @supabase/supabase-js | 2.57.4 | Supabase client |
| tailwindcss | 3.4.1 | CSS framework |
| lucide-react | 0.344.0 | Icons |
| eslint | 9.9.1 | Linting |
| typescript-eslint | 8.3.0 | TS linting |

---

## Appendix B: Database Entity Relationship Diagram

```
┌─────────────┐
│  auth.users │
└──────┬──────┘
       │
       │ 1:1
       │
┌──────▼──────┐
│  profiles   │
└─────────────┘

┌──────────────┐         ┌─────────────────────┐
│  customers   │◄───────┤ customer_addresses  │
└──────┬───────┘ 1:N    └─────────────────────┘
       │
       │ 1:N
       │
┌──────▼───────────┐
│ customer_contacts│
└──────────────────┘

┌──────────────┐         ┌─────────────────┐
│   products   │◄───────┤ inventory_levels│
└──────┬───────┘ 1:N    └─────────────────┘
       │
       │ 1:N
       ├──────────────────────────────┐
       │                              │
┌──────▼─────────┐         ┌─────────▼────────┐
│cross_references│         │ item_relationships│
└────────────────┘         └──────────────────┘

┌─────────┐         ┌──────────────────┐
│ quotes  │◄───────┤ quote_line_items │
└────┬────┘ 1:N    └─────────┬────────┘
     │                       │
     │ N:1                   │ 1:N
     │                       │
┌────▼────┐         ┌────────▼────────┐
│customers│         │ price_requests  │
└─────────┘         └─────────────────┘
```

---

## Appendix C: Component Dependency Graph

```
App
├── ThemeProvider
├── AuthProvider
├── SupabaseQuoteProvider
├── CustomerProvider
├── InventoryProvider
├── Header
│   ├── useAuth
│   ├── useCustomer
│   ├── useSupabaseQuote
│   └── useTheme
├── Navigation
└── Active Tab Content
    ├── QuoteBuilder
    │   ├── CustomerSelector
    │   ├── QuoteDetails
    │   ├── LineItems
    │   │   ├── ProductModal
    │   │   ├── PriceBreakModal
    │   │   ├── SupersessionModal
    │   │   ├── HistoryModal
    │   │   ├── CSVUploadModal
    │   │   ├── LostDetailsModal
    │   │   └── MassActionModal
    │   ├── QuoteSummary
    │   ├── CostAnalysis
    │   └── MultiYearPricing
    ├── ProductCatalog
    │   └── ProductModal
    ├── CustomerProfile
    │   └── Chart
    ├── PendingApprovals
    │   └── ApprovalStatus
    └── ... (other tabs)
```

---

## Appendix D: API Endpoints Summary

### Supabase Tables (REST API)

**Base URL:** `https://[project].supabase.co/rest/v1/`

**Format:** `GET /[table]?select=*`

**Tables:**
- `/profiles`
- `/customers`
- `/customer_addresses`
- `/customer_contacts`
- `/products`
- `/inventory_levels`
- `/quotes`
- `/quote_line_items`
- `/cross_references`
- `/item_relationships`
- `/price_requests`
- `/app_configurations`
- `/role_approval_limits`

### Edge Functions

**Base URL:** `https://[project].supabase.co/functions/v1/`

**Endpoints:**
- `POST /import-products`
- `POST /import-customers`
- `POST /import-cross-references`

### Oracle ERP (External)

**Configured in app_configurations**

**Typical Endpoints:**
- `GET /inventory/items`
- `GET /inventory/items/{id}`
- `GET /customers`
- `GET /customers/{id}`

---

## Appendix E: Code Style Guidelines

### TypeScript

- Use functional components with hooks
- Type all function parameters and returns
- Use interfaces for objects, types for unions
- Prefer `const` over `let`, never `var`
- Use optional chaining (`?.`) for nullable access

### React

- One component per file
- Props interface above component
- Destructure props in parameter
- Use meaningful component names (PascalCase)
- Extract complex logic to custom hooks

### CSS (Tailwind)

- Utility-first approach
- Group related utilities
- Use dark: prefix for dark mode
- Responsive prefixes (sm:, md:, lg:)
- Custom classes only when necessary

### Naming Conventions

- Components: PascalCase (`QuoteBuilder`)
- Hooks: camelCase with "use" prefix (`useAuth`)
- Functions: camelCase (`createQuote`)
- Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)
- Files: Match component/function name

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-14 | System | Initial technical architecture document |

---

**End of Technical Architecture Document**
