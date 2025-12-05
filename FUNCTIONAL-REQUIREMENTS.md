# Quote and Bid Management Tool - Functional Requirements Document

**Version:** 1.0
**Last Updated:** November 14, 2025
**Status:** Active

---

## Executive Summary

The Quote and Bid Management Tool is a comprehensive enterprise application designed for creating, managing, and tracking quotes and bids with integrated cost analysis, inventory management, and Oracle ERP integration. The system provides a complete quote-to-order workflow with advanced pricing capabilities, multi-dimensional cross-referencing, and approval management.

### Core Purpose
Enable sales and business development teams to efficiently create accurate quotes, manage customer relationships, track pricing requests, and analyze profitability while maintaining seamless integration with Oracle ERP systems.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [User Management & Authentication](#2-user-management--authentication)
3. [Quote Management](#3-quote-management)
4. [Product & Inventory Management](#4-product--inventory-management)
5. [Customer Management](#5-customer-management)
6. [Cross-Reference System](#6-cross-reference-system)
7. [Pricing & Cost Analysis](#7-pricing--cost-analysis)
8. [Approval Workflows](#8-approval-workflows)
9. [Data Import & Integration](#9-data-import--integration)
10. [Reporting & Analytics](#10-reporting--analytics)
11. [System Configuration](#11-system-configuration)
12. [Non-Functional Requirements](#12-non-functional-requirements)

---

## 1. System Overview

### 1.1 Application Architecture
- **Frontend:** React 18 with TypeScript and Tailwind CSS
- **Backend:** Supabase (PostgreSQL database with real-time capabilities)
- **Authentication:** Supabase Auth with email/password
- **Integration:** Oracle ERP via REST API
- **Deployment:** Web-based responsive application

### 1.2 Key Features
- Comprehensive quote creation and management
- Real-time inventory tracking with Oracle ERP integration
- Multi-dimensional part number cross-referencing
- Advanced cost analysis and margin calculations
- Role-based approval workflows
- Customer relationship management
- Price request tracking
- Product catalog management
- Bulk import capabilities
- Dark mode support

### 1.3 User Roles
- **Admin:** Full system access, user management, configuration
- **Manager:** Quote approval, customer management, reporting
- **Sales Rep:** Quote creation, customer interaction, pricing
- **User:** Basic quote viewing and creation

---

## 2. User Management & Authentication

### 2.1 Authentication
**FR-AUTH-001:** The system shall provide secure email/password authentication using Supabase Auth.

**FR-AUTH-002:** Users shall be required to log in before accessing any application features.

**FR-AUTH-003:** The system shall maintain user sessions and automatically log out inactive users.

**FR-AUTH-004:** Passwords shall be securely hashed and never stored in plain text.

### 2.2 User Management
**FR-USER-001:** Administrators shall be able to view all system users in a centralized management interface.

**FR-USER-002:** Administrators shall be able to assign roles to users (Admin, Manager, Sales Rep, User).

**FR-USER-003:** The system shall display user information including email, full name, role, and account creation date.

**FR-USER-004:** User profiles shall be automatically created upon first login.

**FR-USER-005:** The system shall maintain user activity logs for audit purposes.

### 2.3 Role-Based Access Control
**FR-RBAC-001:** The system shall enforce role-based permissions for all features and data.

**FR-RBAC-002:** Admins shall have full access to all system features.

**FR-RBAC-003:** Managers shall have access to approval functions and team analytics.

**FR-RBAC-004:** Sales Reps shall have access to quote creation and customer management.

**FR-RBAC-005:** Users shall have read-only access to assigned quotes.

---

## 3. Quote Management

### 3.1 Quote Creation
**FR-QUOTE-001:** Users shall be able to create new quotes with the following information:
- Quote number (auto-generated)
- Customer selection
- Quote type (Daily Quote/Bid)
- Bid number
- PO number
- Valid from/to dates
- Notes

**FR-QUOTE-002:** The system shall auto-generate sequential quote numbers.

**FR-QUOTE-003:** Users shall be able to select customers from the customer database.

**FR-QUOTE-004:** The system shall validate that all required fields are completed before saving.

### 3.2 Quote Line Items
**FR-QUOTE-005:** Users shall be able to add products to quotes as line items with:
- Product SKU and description
- Quantity
- Unit price
- Extended price (calculated)
- Lead time
- Status (Pending, Won, Lost, Price Request, etc.)
- Notes
- Shipping instructions

**FR-QUOTE-006:** The system shall support searching for products by:
- SKU
- Product name
- Customer part number
- Supplier part number
- Internal part number

**FR-QUOTE-007:** Users shall be able to upload line items via CSV file.

**FR-QUOTE-008:** The system shall calculate extended prices automatically (quantity × unit price).

**FR-QUOTE-009:** Users shall be able to edit quantities and prices for each line item.

**FR-QUOTE-010:** The system shall track inventory reservation quantities for each line item.

### 3.3 Quote Status Management
**FR-QUOTE-011:** The system shall support the following quote statuses:
- Draft
- Sent
- Accepted
- Rejected
- Expired

**FR-QUOTE-012:** Line items shall support the following statuses:
- Pending
- Won
- Lost
- Price Request
- Lead Time Request
- New Item Request
- Approval Required

**FR-QUOTE-013:** Users shall be able to update quote and line item statuses.

**FR-QUOTE-014:** The system shall track status change history with timestamps and user information.

### 3.4 Quote Operations
**FR-QUOTE-015:** Users shall be able to duplicate existing quotes.

**FR-QUOTE-016:** Users shall be able to delete quotes with confirmation.

**FR-QUOTE-017:** The system shall maintain quote history and audit trail.

**FR-QUOTE-018:** Users shall be able to export quotes to CSV or PDF format.

**FR-QUOTE-019:** The system shall calculate quote totals, subtotals, and summary statistics.

### 3.5 Multi-Year Pricing
**FR-QUOTE-020:** Users shall be able to set up multi-year pricing schedules with:
- Annual escalation percentages
- Fixed price periods
- Year-over-year adjustments

**FR-QUOTE-021:** The system shall calculate and display pricing for each year of the contract.

**FR-QUOTE-022:** Users shall be able to apply different escalation rates per line item.

### 3.6 Quote Search & Filtering
**FR-QUOTE-023:** Users shall be able to search quotes by:
- Quote number
- Customer name
- Status
- Date range
- Bid number
- PO number

**FR-QUOTE-024:** The system shall support filtering quotes by multiple criteria simultaneously.

**FR-QUOTE-025:** Search results shall be displayed in a sortable table view.

---

## 4. Product & Inventory Management

### 4.1 Product Catalog
**FR-PROD-001:** The system shall maintain a comprehensive product catalog with:
- SKU (unique identifier)
- Product name
- Description
- Category
- Unit of measure
- Cost price
- List price
- Supplier information
- Lead time
- Weight
- Inventory item ID (Oracle ERP)

**FR-PROD-002:** Users shall be able to search products by SKU, name, or category.

**FR-PROD-003:** The system shall display product images when available.

**FR-PROD-004:** Administrators shall be able to add, edit, and delete products.

**FR-PROD-005:** The system shall maintain product change history.

### 4.2 Inventory Management
**FR-INV-001:** The system shall integrate with Oracle ERP to retrieve real-time inventory levels.

**FR-INV-002:** The system shall display inventory availability for each product:
- On-hand quantity
- Available quantity
- Reserved quantity
- Warehouse location

**FR-INV-003:** The system shall support inventory reservations when quotes are created.

**FR-INV-004:** Inventory reservations shall automatically expire based on quote validity dates.

**FR-INV-005:** Users shall be able to manually release inventory reservations.

**FR-INV-006:** The system shall sync inventory data with Oracle ERP on a configurable schedule.

### 4.3 Product Relationships
**FR-PROD-006:** The system shall support product relationships:
- Supersessions (replacement products)
- Alternates (equivalent products)
- Accessories
- Related items

**FR-PROD-007:** Users shall be able to view and select supersession/alternate products when the primary product is unavailable.

**FR-PROD-008:** The system shall maintain bidirectional relationships between related products.

### 4.4 Product Import
**FR-PROD-009:** Administrators shall be able to import products via CSV file.

**FR-PROD-010:** The import process shall validate data and report errors before saving.

**FR-PROD-011:** The system shall support bulk updates via CSV import.

**FR-PROD-012:** The system shall provide an import template with required fields.

---

## 5. Customer Management

### 5.1 Customer Profiles
**FR-CUST-001:** The system shall maintain customer profiles with:
- Customer name
- Customer number (unique)
- Type (Federal, State, Local, Commercial)
- Segment (Government, Defense, Education, Healthcare, Commercial)
- Contract number
- Payment terms
- Currency
- Tier (Bronze, Silver, Gold, Platinum)
- Sales representative assignment

**FR-CUST-002:** Administrators shall be able to create, edit, and delete customers.

**FR-CUST-003:** The system shall prevent duplicate customer numbers.

### 5.2 Customer Addresses
**FR-CUST-004:** Each customer shall support multiple addresses with:
- Address type (Billing, Shipping, Site)
- Street address
- City, State, ZIP
- Country
- Primary address flag
- Warehouse/location code

**FR-CUST-005:** Users shall be able to select different shipping addresses per quote.

**FR-CUST-006:** The system shall validate address formats and required fields.

### 5.3 Customer Contacts
**FR-CUST-007:** Each customer shall support multiple contacts with:
- First name and last name
- Email address
- Phone number
- Job title
- Primary contact flag

**FR-CUST-008:** Users shall be able to select the requesting contact when creating quotes.

**FR-CUST-009:** The system shall store contact communication history.

### 5.4 Customer Analytics
**FR-CUST-010:** The system shall display customer analytics including:
- Total quotes submitted
- Win rate percentage
- Average margin percentage
- Total revenue
- Quote history timeline
- Trend indicators

**FR-CUST-011:** Analytics shall update in real-time as quotes are created and updated.

**FR-CUST-012:** Users shall be able to filter analytics by date range.

**FR-CUST-013:** The system shall identify high-value customers based on revenue and margin.

### 5.5 Customer Import
**FR-CUST-014:** Administrators shall be able to import customers via CSV file.

**FR-CUST-015:** The import shall support batch creation of customers with addresses and contacts.

**FR-CUST-016:** The system shall validate customer data and report errors before saving.

---

## 6. Cross-Reference System

### 6.1 Part Number Management
**FR-XREF-001:** The system shall support multiple part number types:
- Customer part numbers
- Supplier part numbers
- Manufacturer part numbers
- Internal part numbers

**FR-XREF-002:** Each cross-reference shall link to a product SKU in the catalog.

**FR-XREF-003:** Multiple cross-references can point to the same product.

**FR-XREF-004:** Users shall be able to search by any cross-reference type to find products.

### 6.2 Cross-Reference Search
**FR-XREF-005:** The system shall provide universal search across all cross-reference types.

**FR-XREF-006:** Search results shall display:
- Reference number
- Reference type
- Linked product SKU
- Product description
- Usage frequency

**FR-XREF-007:** Search shall be case-insensitive and support partial matches.

### 6.3 Cross-Reference Management
**FR-XREF-008:** Administrators shall be able to add, edit, and delete cross-references.

**FR-XREF-009:** The system shall track when each cross-reference was last used.

**FR-XREF-010:** Users shall be able to export cross-references to CSV.

**FR-XREF-011:** Administrators shall be able to import cross-references via CSV file.

**FR-XREF-012:** The system shall validate that referenced products exist before saving.

---

## 7. Pricing & Cost Analysis

### 7.1 Pricing Management
**FR-PRICE-001:** Each product shall have a standard list price.

**FR-PRICE-002:** Users shall be able to override prices on individual quote line items.

**FR-PRICE-003:** The system shall calculate discounts based on:
- List price vs. quoted price
- Volume/quantity breaks
- Customer tier
- Promotional pricing

**FR-PRICE-004:** Price overrides shall require approval based on discount threshold.

### 7.2 Price Breaks
**FR-PRICE-005:** Suppliers shall be able to define quantity-based price breaks:
- Minimum quantity
- Unit price at that quantity
- Valid from/to dates

**FR-PRICE-006:** The system shall automatically apply the best available price break based on quantity.

**FR-PRICE-007:** Users shall be able to view all available price breaks for a product.

**FR-PRICE-008:** Price breaks shall be version-controlled with effective dates.

### 7.3 Cost Analysis
**FR-COST-001:** The system shall calculate margins for each line item:
- Cost price
- Selling price
- Margin amount
- Margin percentage

**FR-COST-002:** Users shall be able to perform "what-if" analysis by adjusting:
- Target margin
- Overhead percentage
- Volume assumptions

**FR-COST-003:** The system shall display total quote margin and profitability metrics.

**FR-COST-004:** Cost analysis shall consider:
- Product cost
- Freight and handling
- Overhead allocation
- Target profit margin

**FR-COST-005:** Users shall be able to calculate recommended pricing based on target margins.

### 7.4 Historical Pricing
**FR-PRICE-009:** The system shall maintain historical pricing data for each product.

**FR-PRICE-010:** Users shall be able to view pricing trends over time.

**FR-PRICE-011:** The system shall reference previous quotes for pricing consistency.

---

## 8. Approval Workflows

### 8.1 Approval Requirements
**FR-APPR-001:** Quotes shall require approval when:
- Total value exceeds role-based limit
- Margin falls below minimum threshold
- Discount exceeds authorized limit
- Custom pricing is applied

**FR-APPR-002:** The system shall support configurable approval limits by role:
- Sales Rep: $0 - $50,000
- Manager: $50,001 - $250,000
- Admin: Unlimited

**FR-APPR-003:** Line items requiring approval shall be flagged with "Approval Required" status.

### 8.2 Approval Process
**FR-APPR-004:** Users with approval authority shall see a "Pending Approvals" dashboard.

**FR-APPR-005:** Approvers shall be able to:
- View quote details
- Review margin analysis
- Approve or reject quotes
- Add approval comments

**FR-APPR-006:** The system shall notify quote creators when quotes are approved or rejected.

**FR-APPR-007:** Approval history shall be maintained with timestamps and approver information.

**FR-APPR-008:** Quotes requiring approval cannot be marked as "Sent" until approved.

### 8.3 Approval Limits Configuration
**FR-APPR-009:** Administrators shall be able to configure approval limits by role.

**FR-APPR-010:** Limits shall be enforceable at both quote level and line item level.

**FR-APPR-011:** The system shall automatically route quotes to the appropriate approval level.

---

## 9. Data Import & Integration

### 9.1 Oracle ERP Integration
**FR-INT-001:** The system shall integrate with Oracle ERP REST API for:
- Customer data synchronization
- Product/inventory synchronization
- Real-time inventory lookups
- Price list updates

**FR-INT-002:** API credentials shall be securely stored and configurable via settings.

**FR-INT-003:** The system shall handle API authentication and token refresh automatically.

**FR-INT-004:** Integration errors shall be logged and displayed to administrators.

**FR-INT-005:** The system shall support batch synchronization on a schedule.

### 9.2 CSV Import Functions
**FR-IMP-001:** The system shall support CSV import for:
- Products
- Customers
- Customer addresses
- Customer contacts
- Cross-references
- Quote line items

**FR-IMP-002:** Import functions shall provide:
- Template download
- Data validation
- Error reporting
- Preview before save
- Rollback on error

**FR-IMP-003:** CSV files shall support UTF-8 encoding for international characters.

**FR-IMP-004:** The system shall provide clear error messages for invalid data.

### 9.3 API Authentication
**FR-IMP-005:** The system shall support API key authentication for import endpoints.

**FR-IMP-006:** API keys shall be generated by administrators and configurable per endpoint.

**FR-IMP-007:** API requests shall be logged with timestamp, user, and result.

**FR-IMP-008:** Failed authentication attempts shall be rate-limited.

---

## 10. Reporting & Analytics

### 10.1 Quote Reports
**FR-RPT-001:** Users shall be able to generate reports showing:
- Quotes by status
- Quotes by customer
- Quotes by date range
- Win/loss analysis
- Quote aging report

**FR-RPT-002:** Reports shall be exportable to CSV and PDF formats.

**FR-RPT-003:** Users shall be able to filter reports by multiple criteria.

### 10.2 Sales Analytics
**FR-RPT-004:** The system shall provide dashboards showing:
- Total quote value by period
- Win rate trends
- Average margin by customer/product
- Top performing products
- Sales pipeline value

**FR-RPT-005:** Analytics shall update in real-time as data changes.

**FR-RPT-006:** Users shall be able to drill down into detailed records from summary views.

### 10.3 Customer Analytics
**FR-RPT-007:** Customer profiles shall display:
- Quote history timeline
- Revenue trends
- Margin trends
- Product purchase patterns
- Quote frequency

**FR-RPT-008:** Visual charts shall illustrate trends and patterns.

**FR-RPT-009:** Comparative metrics shall show performance vs. averages.

---

## 11. System Configuration

### 11.1 Application Settings
**FR-CFG-001:** Administrators shall be able to configure:
- Company information
- Default currency
- Default payment terms
- Quote number prefix
- Quote validity period (default days)

**FR-CFG-002:** Settings shall be stored in the database and apply globally.

**FR-CFG-003:** Configuration changes shall take effect immediately.

### 11.2 Integration Configuration
**FR-CFG-004:** Administrators shall be able to configure Oracle ERP integration:
- API base URL
- Authentication credentials
- Sync schedule
- Timeout settings

**FR-CFG-005:** API credentials shall be encrypted in the database.

**FR-CFG-006:** The system shall provide connection testing before saving.

### 11.3 Import API Configuration
**FR-CFG-007:** Administrators shall be able to configure import API settings:
- API keys for each import endpoint (products, customers, cross-references)
- Enable/disable specific import endpoints
- Rate limiting settings

**FR-CFG-008:** API keys shall be displayed only once during generation.

**FR-CFG-009:** Administrators shall be able to regenerate API keys.

### 11.4 User Preferences
**FR-CFG-010:** Users shall be able to set personal preferences:
- Theme (light/dark mode)
- Default customer filter
- Dashboard layout
- Email notifications

**FR-CFG-011:** Preferences shall be saved per user and persist across sessions.

---

## 12. Non-Functional Requirements

### 12.1 Performance
**NFR-PERF-001:** Page load times shall not exceed 3 seconds under normal network conditions.

**NFR-PERF-002:** Search results shall return within 1 second for datasets up to 10,000 records.

**NFR-PERF-003:** The system shall support at least 50 concurrent users without performance degradation.

**NFR-PERF-004:** Database queries shall be optimized with appropriate indexes.

### 12.2 Security
**NFR-SEC-001:** All data transmission shall use HTTPS encryption.

**NFR-SEC-002:** Passwords shall be hashed using industry-standard algorithms (bcrypt).

**NFR-SEC-003:** API keys shall be stored encrypted in the database.

**NFR-SEC-004:** Row-level security shall be enforced at the database level.

**NFR-SEC-005:** The system shall prevent SQL injection through parameterized queries.

**NFR-SEC-006:** Session tokens shall expire after 24 hours of inactivity.

### 12.3 Usability
**NFR-USE-001:** The interface shall be responsive and work on desktop, tablet, and mobile devices.

**NFR-USE-002:** The system shall provide clear error messages for all validation failures.

**NFR-USE-003:** Critical actions (delete, bulk operations) shall require confirmation.

**NFR-USE-004:** The system shall provide inline help text for complex features.

**NFR-USE-005:** Form fields shall indicate required vs. optional inputs.

### 12.4 Reliability
**NFR-REL-001:** The system shall have 99.5% uptime availability.

**NFR-REL-002:** Database backups shall be performed daily and retained for 30 days.

**NFR-REL-003:** The system shall gracefully handle API failures with appropriate error messages.

**NFR-REL-004:** Data integrity shall be maintained through database constraints and transactions.

### 12.5 Maintainability
**NFR-MAIN-001:** Code shall follow TypeScript and React best practices.

**NFR-MAIN-002:** Database schema changes shall be managed through versioned migrations.

**NFR-MAIN-003:** The system shall provide audit logs for all data modifications.

**NFR-MAIN-004:** Error logs shall include timestamps, user context, and stack traces.

### 12.6 Scalability
**NFR-SCAL-001:** The database schema shall support millions of quotes without performance issues.

**NFR-SCAL-002:** The system shall support adding new product categories without code changes.

**NFR-SCAL-003:** The architecture shall support horizontal scaling for increased load.

### 12.7 Accessibility
**NFR-ACC-001:** The system shall support keyboard navigation for all functions.

**NFR-ACC-002:** Color contrast shall meet WCAG 2.1 Level AA standards.

**NFR-ACC-003:** Form labels shall be properly associated with input fields.

**NFR-ACC-004:** Dark mode shall be available for reduced eye strain.

---

## Appendix A: Key Database Tables

### Core Tables
1. **profiles** - User authentication and profiles
2. **customers** - Customer master data
3. **customer_addresses** - Customer shipping/billing addresses
4. **customer_contacts** - Customer contact information
5. **products** - Product catalog
6. **quotes** - Quote headers
7. **quote_line_items** - Quote line details
8. **cross_references** - Part number cross-references
9. **item_relationships** - Product relationships (supersessions, alternates)
10. **price_requests** - Price request tracking
11. **app_configurations** - System configuration
12. **role_approval_limits** - Approval workflow limits

### Support Tables
- **inventory_levels** - Stock quantities
- **price_breaks** - Quantity-based pricing
- **reservations** - Inventory reservations
- **cost_analysis** - Cost calculation data

---

## Appendix B: Integration Endpoints

### Oracle ERP Endpoints
- **GET** `/inventory/items` - Retrieve inventory items
- **GET** `/inventory/items/{id}/availability` - Get stock levels
- **GET** `/customers` - Retrieve customer list
- **GET** `/customers/{id}` - Get customer details
- **GET** `/price-lists` - Retrieve pricing information

### Import API Endpoints
- **POST** `/import-products` - Bulk product import
- **POST** `/import-customers` - Bulk customer import
- **POST** `/import-cross-references` - Bulk cross-reference import

All endpoints require Bearer token authentication.

---

## Appendix C: Quote Lifecycle Workflow

```
1. Draft → User creates quote
2. Pending → Quote submitted for review
3. Approval Required → Exceeds limits, needs manager approval
4. Approved → Manager approves quote
5. Sent → Quote delivered to customer
6. Accepted/Rejected → Customer response
7. Won/Lost → Final outcome per line item
```

---

## Appendix D: User Role Permissions Matrix

| Feature | Admin | Manager | Sales Rep | User |
|---------|-------|---------|-----------|------|
| Create Quote | ✓ | ✓ | ✓ | ✓ |
| Edit Own Quote | ✓ | ✓ | ✓ | ✓ |
| Delete Quote | ✓ | ✓ | ✓ | - |
| Approve Quotes | ✓ | ✓ | - | - |
| Manage Products | ✓ | ✓ | - | - |
| Manage Customers | ✓ | ✓ | ✓ | - |
| View Analytics | ✓ | ✓ | ✓ | - |
| Import Data | ✓ | - | - | - |
| Configure System | ✓ | - | - | - |
| Manage Users | ✓ | - | - | - |

---

## Document Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-14 | System | Initial document creation |

---

**End of Functional Requirements Document**
