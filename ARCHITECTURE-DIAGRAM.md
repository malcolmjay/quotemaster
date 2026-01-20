# Architecture Diagram - Quote and Bid Management Tool

This document provides visual representations of the application architecture.

## Table of Contents
1. [High-Level System Architecture](#high-level-system-architecture)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Database Schema Overview](#database-schema-overview)
5. [Authentication Flow](#authentication-flow)
6. [Data Flow Diagrams](#data-flow-diagrams)
7. [Deployment Architecture](#deployment-architecture)

---

## High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Web Browser (React)                       │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │   │
│  │  │  Quote   │  │ Customer │  │ Product  │  │   User   │   │   │
│  │  │ Builder  │  │   Mgmt   │  │   Mgmt   │  │   Mgmt   │   │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │   │
│  │        │             │              │              │         │   │
│  │        └─────────────┴──────────────┴──────────────┘         │   │
│  │                           │                                   │   │
│  │                  ┌────────▼────────┐                         │   │
│  │                  │  React Context  │                         │   │
│  │                  │  & Hooks Layer  │                         │   │
│  │                  └────────┬────────┘                         │   │
│  │                           │                                   │   │
│  │                  ┌────────▼────────┐                         │   │
│  │                  │ Supabase Client │                         │   │
│  │                  └────────┬────────┘                         │   │
│  └───────────────────────────┼─────────────────────────────────┘   │
└────────────────────────────────┼───────────────────────────────────┘
                                 │ HTTPS / WSS
                                 │
┌────────────────────────────────▼───────────────────────────────────┐
│                       SUPABASE CLOUD LAYER                          │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    API Gateway (Kong)                        │  │
│  └────────┬────────────┬──────────────┬────────────┬───────────┘  │
│           │            │              │            │               │
│  ┌────────▼───────┐ ┌──▼─────────┐ ┌─▼──────┐ ┌──▼──────────┐   │
│  │   PostgREST    │ │   Auth     │ │ Realtime│ │   Storage   │   │
│  │   (REST API)   │ │  (GoTrue)  │ │ (WebSoc)│ │   (Files)   │   │
│  └────────┬───────┘ └──┬─────────┘ └─┬──────┘ └──┬──────────┘   │
│           │            │              │            │               │
│  ┌────────┴────────────┴──────────────┴────────────┴───────────┐  │
│  │                  PostgreSQL Database                         │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │  │
│  │  │  Users   │  │Customers │  │ Products │  │  Quotes  │   │  │
│  │  │  Roles   │  │Addresses │  │  Cross   │  │   Line   │   │  │
│  │  │ Profiles │  │ Contacts │  │   Refs   │  │  Items   │   │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │          Row Level Security (RLS) Policies           │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Edge Functions (Deno Runtime)                │  │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────────┐   │  │
│  │  │   Import   │  │   Import   │  │     Import       │   │  │
│  │  │  Products  │  │ Customers  │  │ Cross-References │   │  │
│  │  └────────────┘  └────────────┘  └──────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ API Calls (Optional)
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SYSTEMS                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │     ERP      │  │   Suppliers  │  │   Price Providers    │  │
│  │   (Oracle)   │  │     APIs     │  │        APIs          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         REACT APPLICATION                           │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                      COMPONENT LAYER                          │ │
│  │                                                                │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │  Layout Components                                       │ │ │
│  │  │  ├── Header (Navigation, User Menu, Theme Toggle)       │ │ │
│  │  │  └── Navigation (Mobile Menu, Help Mode)                │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │                                                                │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │  Quote Components                                        │ │ │
│  │  │  ├── QuoteBuilder (Main quote creation interface)       │ │ │
│  │  │  ├── LineItems (Product line items management)          │ │ │
│  │  │  ├── CustomerSelector (Search & select customers)       │ │ │
│  │  │  ├── QuoteSummary (Totals & calculations)               │ │ │
│  │  │  ├── CostAnalysis (Margin analysis)                     │ │ │
│  │  │  ├── MultiYearPricing (Price projections)               │ │ │
│  │  │  ├── PriceBreakModal (Volume pricing)                   │ │ │
│  │  │  ├── CSVUploadModal (Bulk import)                       │ │ │
│  │  │  └── QuotePrintView (Print layout)                      │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │                                                                │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │  Management Components                                   │ │ │
│  │  │  ├── CustomerManagement                                  │ │ │
│  │  │  ├── ProductManagement                                   │ │ │
│  │  │  ├── QuoteManagement                                     │ │ │
│  │  │  ├── UserManagement                                      │ │ │
│  │  │  ├── CrossReferenceManagement                            │ │ │
│  │  │  ├── ItemRelationshipManagement                          │ │ │
│  │  │  ├── AddressManagement                                   │ │ │
│  │  │  ├── ContactManagement                                   │ │ │
│  │  │  └── PriceRequests                                       │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │                                                                │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │  Approval Components                                     │ │ │
│  │  │  ├── PendingApprovals (Approval queue)                  │ │ │
│  │  │  └── ApprovalStatus (Status badge)                      │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │                                                                │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │  Common Components                                       │ │ │
│  │  │  ├── Pagination (List pagination)                        │ │ │
│  │  │  ├── HelpTooltip (Help mode tooltips)                    │ │ │
│  │  │  └── DeleteConfirmationModal (Confirm deletes)           │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                      CONTEXT LAYER                            │ │
│  │                                                                │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │ │
│  │  │    Theme     │  │     Help     │  │       Auth       │   │ │
│  │  │   Context    │  │   Context    │  │     Provider     │   │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘   │ │
│  │                                                                │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │ │
│  │  │    Quote     │  │   Customer   │  │    Inventory     │   │ │
│  │  │   Context    │  │   Context    │  │     Context      │   │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘   │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                       HOOKS LAYER                             │ │
│  │                                                                │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │ │
│  │  │   useAuth    │  │  useApproval │  │   useDeletion    │   │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘   │ │
│  │                                                                │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │ │
│  │  │useSupabase   │  │ useDebounce  │  │ useERPInventory  │   │ │
│  │  │    Data      │  │              │  │                  │   │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘   │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                      SERVICES LAYER                           │ │
│  │                                                                │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │ │
│  │  │   Config     │  │   ERP API    │  │    Inventory     │   │ │
│  │  │   Service    │  │   Service    │  │  Sync Service    │   │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘   │ │
│  │                                                                │ │
│  │  ┌──────────────────────────────────────────────────────┐    │ │
│  │  │            Quote Export Service                       │    │ │
│  │  └──────────────────────────────────────────────────────┘    │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    UTILITIES LAYER                            │ │
│  │                                                                │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │ │
│  │  │   Supabase   │  │   Logger     │  │    Validation    │   │ │
│  │  │    Client    │  │              │  │                  │   │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘   │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Backend Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                    SUPABASE BACKEND SERVICES                        │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    AUTHENTICATION (GoTrue)                    │ │
│  │  ┌────────────────────────────────────────────────────────┐  │ │
│  │  │  • Email/Password Authentication                        │  │ │
│  │  │  • JWT Token Management                                 │  │ │
│  │  │  • Session Management                                   │  │ │
│  │  │  • User Metadata Storage                                │  │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    REST API (PostgREST)                       │ │
│  │  ┌────────────────────────────────────────────────────────┐  │ │
│  │  │  • Automatic REST API from Database Schema             │  │ │
│  │  │  • CRUD Operations on All Tables                        │  │ │
│  │  │  • Query Filtering, Sorting, Pagination                 │  │ │
│  │  │  • JSON Response Format                                 │  │ │
│  │  │  • OpenAPI Documentation                                │  │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                 REALTIME (WebSockets)                         │ │
│  │  ┌────────────────────────────────────────────────────────┐  │ │
│  │  │  • Real-time Quote Updates                              │  │ │
│  │  │  • Live Approval Notifications                          │  │ │
│  │  │  • Inventory Level Changes                              │  │ │
│  │  │  • Multi-user Collaboration                             │  │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              EDGE FUNCTIONS (Deno Runtime)                    │ │
│  │                                                                │ │
│  │  ┌────────────────────────────────────────────────────────┐  │ │
│  │  │  import-products                                        │  │ │
│  │  │  ├── Validates product data                             │  │ │
│  │  │  ├── Checks for duplicates                              │  │ │
│  │  │  ├── Bulk inserts/updates                               │  │ │
│  │  │  └── Returns import results                             │  │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  │                                                                │ │
│  │  ┌────────────────────────────────────────────────────────┐  │ │
│  │  │  import-customers                                       │  │ │
│  │  │  ├── Validates customer data                            │  │ │
│  │  │  ├── Handles addresses & contacts                       │  │ │
│  │  │  ├── Bulk inserts/updates                               │  │ │
│  │  │  └── Returns import results                             │  │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  │                                                                │ │
│  │  ┌────────────────────────────────────────────────────────┐  │ │
│  │  │  import-cross-references                                │  │ │
│  │  │  ├── Validates cross-reference data                     │  │ │
│  │  │  ├── Links to products                                  │  │ │
│  │  │  ├── Bulk inserts/updates                               │  │ │
│  │  │  └── Returns import results                             │  │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  │                                                                │ │
│  │  ┌────────────────────────────────────────────────────────┐  │ │
│  │  │  create-user                                            │  │ │
│  │  │  ├── Creates auth user                                  │  │ │
│  │  │  ├── Assigns role                                       │  │ │
│  │  │  ├── Sets up user profile                               │  │ │
│  │  │  └── Returns user details                               │  │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    POSTGRESQL DATABASE                        │ │
│  │                                                                │ │
│  │  ┌────────────────────────────────────────────────────────┐  │ │
│  │  │  Core Tables                                            │  │ │
│  │  │  ├── auth.users (Supabase managed)                      │  │ │
│  │  │  ├── user_roles                                         │  │ │
│  │  │  ├── user_metadata                                      │  │ │
│  │  │  ├── app_configurations                                 │  │ │
│  │  │  └── role_approval_limits                               │  │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  │                                                                │ │
│  │  ┌────────────────────────────────────────────────────────┐  │ │
│  │  │  Customer Tables                                        │  │ │
│  │  │  ├── customers                                          │  │ │
│  │  │  ├── customer_addresses                                 │  │ │
│  │  │  └── customer_contacts                                  │  │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  │                                                                │ │
│  │  ┌────────────────────────────────────────────────────────┐  │ │
│  │  │  Product Tables                                         │  │ │
│  │  │  ├── products                                           │  │ │
│  │  │  ├── cross_references                                   │  │ │
│  │  │  ├── item_relationships                                 │  │ │
│  │  │  └── price_requests                                     │  │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  │                                                                │ │
│  │  ┌────────────────────────────────────────────────────────┐  │ │
│  │  │  Quote Tables                                           │  │ │
│  │  │  ├── quotes                                             │  │ │
│  │  │  ├── quote_line_items                                   │  │ │
│  │  │  ├── approval_actions                                   │  │ │
│  │  │  └── rest_logs                                          │  │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  │                                                                │ │
│  │  ┌────────────────────────────────────────────────────────┐  │ │
│  │  │  Row Level Security (RLS)                               │  │ │
│  │  │  ├── User-based data isolation                          │  │ │
│  │  │  ├── Role-based access control                          │  │ │
│  │  │  ├── Quote ownership policies                           │  │ │
│  │  │  └── Approval workflow policies                         │  │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  │                                                                │ │
│  │  ┌────────────────────────────────────────────────────────┐  │ │
│  │  │  Database Functions                                     │  │ │
│  │  │  ├── optimize_pending_approvals_query()                 │  │ │
│  │  │  ├── get_user_role()                                    │  │ │
│  │  │  ├── check_approval_limit()                             │  │ │
│  │  │  └── calculate_quote_totals()                           │  │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  │                                                                │ │
│  │  ┌────────────────────────────────────────────────────────┐  │ │
│  │  │  Triggers                                               │  │ │
│  │  │  ├── update_quote_totals                                │  │ │
│  │  │  ├── create_approval_action                             │  │ │
│  │  │  ├── update_timestamps                                  │  │ │
│  │  │  └── sync_user_metadata                                 │  │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  │                                                                │ │
│  │  ┌────────────────────────────────────────────────────────┐  │ │
│  │  │  Indexes & Performance                                  │  │ │
│  │  │  ├── User ID indexes                                    │  │ │
│  │  │  ├── Foreign key indexes                                │  │ │
│  │  │  ├── Quote status indexes                               │  │ │
│  │  │  └── Composite indexes for queries                      │  │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          DATABASE SCHEMA                             │
│                                                                      │
│  ┌────────────────────┐                                             │
│  │    auth.users      │  (Supabase Managed)                         │
│  ├────────────────────┤                                             │
│  │ • id (uuid) PK     │                                             │
│  │ • email            │                                             │
│  │ • encrypted_pass   │                                             │
│  │ • created_at       │                                             │
│  └──────┬─────────────┘                                             │
│         │                                                            │
│         │ 1:1                                                        │
│         │                                                            │
│  ┌──────▼─────────────┐         ┌──────────────────────┐           │
│  │   user_roles       │         │   user_metadata      │           │
│  ├────────────────────┤         ├──────────────────────┤           │
│  │ • id PK            │         │ • id PK              │           │
│  │ • user_id FK       │◄────────┤ • user_id FK         │           │
│  │ • role             │         │ • full_name          │           │
│  │ • email            │         │ • preferences        │           │
│  │ • is_active        │         └──────────────────────┘           │
│  └────────────────────┘                                             │
│                                                                      │
│  ┌────────────────────┐         ┌──────────────────────┐           │
│  │   customers        │         │ customer_addresses   │           │
│  ├────────────────────┤         ├──────────────────────┤           │
│  │ • id PK            │         │ • id PK              │           │
│  │ • customer_number  │◄────────┤ • customer_id FK     │           │
│  │ • company_name     │    1:N  │ • address_type       │           │
│  │ • account_type     │         │ • street_address     │           │
│  │ • industry         │         │ • city, state, zip   │           │
│  │ • primary_warehouse│         │ • warehouse_id       │           │
│  │ • created_by       │         └──────────────────────┘           │
│  └──────┬─────────────┘                                             │
│         │                                                            │
│         │ 1:N                                                        │
│         │                                                            │
│  ┌──────▼─────────────┐         ┌──────────────────────┐           │
│  │customer_contacts   │         │      quotes          │           │
│  ├────────────────────┤         ├──────────────────────┤           │
│  │ • id PK            │         │ • id PK              │           │
│  │ • customer_id FK   │◄────────┤ • customer_id FK     │           │
│  │ • contact_type     │    1:N  │ • quote_number       │           │
│  │ • first_name       │         │ • quote_status       │           │
│  │ • last_name        │         │ • total_amount       │           │
│  │ • email            │         │ • margin_percentage  │           │
│  │ • phone            │         │ • created_by         │           │
│  └────────────────────┘         │ • approval_status    │           │
│                                  └──────┬───────────────┘           │
│                                         │                            │
│  ┌────────────────────┐                │ 1:N                        │
│  │   products         │                │                            │
│  ├────────────────────┤         ┌──────▼───────────────┐           │
│  │ • id PK            │         │ quote_line_items     │           │
│  │ • sku              │◄────────┤──────────────────────┤           │
│  │ • description      │    N:1  │ • id PK              │           │
│  │ • category         │         │ • quote_id FK        │           │
│  │ • manufacturer     │         │ • product_id FK      │           │
│  │ • cost             │         │ • quantity           │           │
│  │ • price            │         │ • unit_price         │           │
│  │ • inventory_item_id│         │ • extended_price     │           │
│  │ • supplier_email   │         │ • margin_percentage  │           │
│  └──────┬─────────────┘         │ • ship_to_address_id │           │
│         │                        │ • warehouse          │           │
│         │ 1:N                    └──────────────────────┘           │
│         │                                                            │
│  ┌──────▼─────────────┐                                             │
│  │cross_references    │                                             │
│  ├────────────────────┤                                             │
│  │ • id PK            │                                             │
│  │ • product_id FK    │                                             │
│  │ • reference_type   │                                             │
│  │ • reference_number │                                             │
│  │ • customer_id FK   │                                             │
│  │ • ordered_item_id  │                                             │
│  └────────────────────┘                                             │
│                                                                      │
│  ┌────────────────────┐         ┌──────────────────────┐           │
│  │item_relationships  │         │  price_requests      │           │
│  ├────────────────────┤         ├──────────────────────┤           │
│  │ • id PK            │         │ • id PK              │           │
│  │ • parent_product_id│         │ • product_number     │           │
│  │ • child_product_id │         │ • supplier           │           │
│  │ • relationship_type│         │ • supplier_pricing   │           │
│  │ • quantity         │         │ • status             │           │
│  └────────────────────┘         │ • effective_dates    │           │
│                                  └──────────────────────┘           │
│                                                                      │
│  ┌────────────────────┐         ┌──────────────────────┐           │
│  │approval_actions    │         │role_approval_limits  │           │
│  ├────────────────────┤         ├──────────────────────┤           │
│  │ • id PK            │         │ • id PK              │           │
│  │ • quote_id FK      │         │ • role               │           │
│  │ • action_by FK     │         │ • min_amount         │           │
│  │ • action           │         │ • max_amount         │           │
│  │ • comments         │         └──────────────────────┘           │
│  │ • created_at       │                                             │
│  └────────────────────┘                                             │
│                                                                      │
│  ┌────────────────────┐         ┌──────────────────────┐           │
│  │app_configurations  │         │     rest_logs        │           │
│  ├────────────────────┤         ├──────────────────────┤           │
│  │ • id PK            │         │ • id PK              │           │
│  │ • config_key       │         │ • endpoint           │           │
│  │ • config_value     │         │ • request_data       │           │
│  │ • description      │         │ • response_data      │           │
│  │ • is_active        │         │ • status_code        │           │
│  └────────────────────┘         │ • created_at         │           │
│                                  └──────────────────────┘           │
└──────────────────────────────────────────────────────────────────────┘

Legend:
  PK = Primary Key
  FK = Foreign Key
  1:1 = One-to-One Relationship
  1:N = One-to-Many Relationship
  N:1 = Many-to-One Relationship
```

---

## Authentication Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION FLOW                          │
└──────────────────────────────────────────────────────────────────┘

User Login Flow:
─────────────────

  ┌──────────┐
  │  Browser │
  └────┬─────┘
       │
       │ 1. User enters email/password
       │
       ▼
  ┌────────────────────┐
  │   LoginForm.tsx    │
  └────┬───────────────┘
       │
       │ 2. supabase.auth.signInWithPassword()
       │
       ▼
  ┌────────────────────────────────┐
  │  Supabase Auth (GoTrue)        │
  ├────────────────────────────────┤
  │  • Validates credentials       │
  │  • Generates JWT token         │
  │  • Creates session             │
  └────┬───────────────────────────┘
       │
       │ 3. Returns { user, session }
       │
       ▼
  ┌────────────────────┐
  │  AuthProvider.tsx  │
  ├────────────────────┤
  │  • Stores user     │
  │  • Stores session  │
  │  • Sets up listener│
  └────┬───────────────┘
       │
       │ 4. Fetch user role
       │
       ▼
  ┌────────────────────────────────┐
  │  Database Query                │
  │  SELECT * FROM user_roles      │
  │  WHERE user_id = ?             │
  └────┬───────────────────────────┘
       │
       │ 5. Role data returned
       │
       ▼
  ┌────────────────────┐
  │  AuthProvider      │
  │  Updates Context   │
  └────┬───────────────┘
       │
       │ 6. Redirect to dashboard
       │
       ▼
  ┌────────────────────┐
  │   Quote Builder    │
  │   (Authenticated)  │
  └────────────────────┘


Session Management:
───────────────────

  ┌──────────────────────────────────────────┐
  │  On Every Page Load                      │
  │                                          │
  │  1. AuthProvider checks session          │
  │     ↓                                    │
  │  2. If valid JWT exists:                 │
  │     • Auto-refresh if needed             │
  │     • Restore user state                 │
  │     • Fetch role data                    │
  │     ↓                                    │
  │  3. If no valid session:                 │
  │     • Redirect to login                  │
  │     • Clear user state                   │
  │     ↓                                    │
  │  4. Set up real-time listener:           │
  │     • onAuthStateChange()                │
  │     • Handle token refresh               │
  │     • Handle logout                      │
  └──────────────────────────────────────────┘


Protected Route Flow:
─────────────────────

  User navigates to /quote-builder
             │
             ▼
  ┌──────────────────────┐
  │  ProtectedRoute.tsx  │
  └──────────┬───────────┘
             │
             │ Check: isAuthenticated?
             │
       ┌─────┴─────┐
       │           │
      Yes          No
       │           │
       │           └──────► Redirect to /login
       │
       │ Check: hasRequiredRole?
       │
       ┌─────┴─────┐
       │           │
      Yes          No
       │           │
       │           └──────► Show "Access Denied"
       │
       ▼
  ┌──────────────────────┐
  │  Render Component    │
  │  (Quote Builder)     │
  └──────────────────────┘
```

---

## Data Flow Diagrams

### Quote Creation Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                      QUOTE CREATION FLOW                          │
└──────────────────────────────────────────────────────────────────┘

  User (CSR)
      │
      │ 1. Click "New Quote"
      ▼
  ┌─────────────────┐
  │  Quote Builder  │
  └────────┬────────┘
           │
           │ 2. Select Customer
           ▼
  ┌─────────────────────┐
  │ CustomerSelector    │
  │  • Search customers │
  │  • Display results  │
  └────────┬────────────┘
           │
           │ 3. Customer selected
           ▼
  ┌─────────────────────┐
  │  Load customer data │
  │  • Addresses        │
  │  • Contacts         │
  │  • History          │
  └────────┬────────────┘
           │
           │ 4. Add line items
           ▼
  ┌─────────────────────┐
  │   LineItems.tsx     │
  │  • Search products  │
  │  • Add quantities   │
  │  • Set pricing      │
  └────────┬────────────┘
           │
           │ 5. For each product added
           │
           ├────────────────────────────┐
           │                            │
           ▼                            ▼
  ┌─────────────────┐      ┌──────────────────────┐
  │ Check inventory │      │ Calculate pricing    │
  │ • ERP API call  │      │ • Apply margins      │
  │ • Display stock │      │ • Calculate totals   │
  └─────────┬───────┘      └──────────┬───────────┘
           │                            │
           └────────────┬───────────────┘
                        │
                        │ 6. Real-time calculations
                        ▼
  ┌──────────────────────────────────┐
  │       QuoteSummary.tsx           │
  │  • Subtotal                      │
  │  • Total Cost                    │
  │  • Total Price                   │
  │  • Margin %                      │
  └────────┬─────────────────────────┘
           │
           │ 7. User clicks "Save"
           ▼
  ┌──────────────────────────────────┐
  │  Validate quote data             │
  │  • All required fields present   │
  │  • Calculations correct          │
  └────────┬─────────────────────────┘
           │
           │ 8. Insert to database
           ▼
  ┌──────────────────────────────────┐
  │  Supabase INSERT                 │
  │                                  │
  │  BEGIN TRANSACTION;              │
  │    INSERT INTO quotes ...        │
  │    INSERT INTO quote_line_items  │
  │    (multiple rows)               │
  │  COMMIT;                         │
  └────────┬─────────────────────────┘
           │
           │ 9. Database triggers fire
           ▼
  ┌──────────────────────────────────┐
  │  • update_quote_totals           │
  │  • create_approval_action        │
  │  • update_timestamps             │
  └────────┬─────────────────────────┘
           │
           │ 10. Check approval needed?
           │
           ├─────────────┬────────────────┐
           │             │                │
   Amount > limit?     Yes               No
           │             │                │
           │             ▼                │
           │    ┌─────────────────┐      │
           │    │ Create approval │      │
           │    │ request         │      │
           │    │ • Calculate who │      │
           │    │   can approve   │      │
           │    └────────┬────────┘      │
           │             │                │
           └─────────────┴────────────────┘
                         │
                         │ 11. Success response
                         ▼
  ┌──────────────────────────────────┐
  │  Update UI                       │
  │  • Show success message          │
  │  • Display quote number          │
  │  • Show approval status          │
  │  • Enable PDF generation         │
  └──────────────────────────────────┘
```

### Approval Workflow

```
┌──────────────────────────────────────────────────────────────────┐
│                      APPROVAL WORKFLOW                            │
└──────────────────────────────────────────────────────────────────┘

Quote Total: $75,000
CSR Limit: $25,000
Manager Limit: $50,000
Director Limit: $200,000

  ┌──────────────────┐
  │  CSR creates     │
  │  quote           │
  └────────┬─────────┘
           │
           │ Quote saved: status = 'Draft'
           ▼
  ┌──────────────────────┐
  │  CSR clicks          │
  │  "Submit for         │
  │   Approval"          │
  └────────┬─────────────┘
           │
           │ Update: approval_status = 'Pending'
           │         quote_status = 'Sent'
           ▼
  ┌──────────────────────────────────┐
  │  System checks approval limits   │
  │                                  │
  │  SELECT * FROM                   │
  │  role_approval_limits            │
  │  WHERE $75,000 BETWEEN           │
  │    min_amount AND max_amount     │
  │                                  │
  │  Result: Director level required │
  └────────┬─────────────────────────┘
           │
           │ Create approval record
           ▼
  ┌──────────────────────────────────┐
  │  INSERT INTO approval_actions    │
  │    quote_id, required_role,      │
  │    status = 'Pending'            │
  └────────┬─────────────────────────┘
           │
           ├──────────────────┬───────────────────┐
           │                  │                   │
           ▼                  ▼                   ▼
  ┌────────────────┐ ┌────────────────┐ ┌──────────────────┐
  │ Email          │ │ Dashboard      │ │ Real-time        │
  │ notification   │ │ shows pending  │ │ notification     │
  │ to Directors   │ │ in Directors'  │ │ to all Directors │
  │                │ │ queue          │ │                  │
  └────────────────┘ └────────────────┘ └──────────────────┘
           │                  │                   │
           └──────────────────┴───────────────────┘
                              │
                              │ Director logs in
                              ▼
  ┌────────────────────────────────────┐
  │  PendingApprovals.tsx              │
  │                                    │
  │  Shows quote with:                 │
  │  • Quote number                    │
  │  • Customer                        │
  │  • Amount: $75,000                 │
  │  • Margin: 28%                     │
  │  • Created by: John (CSR)          │
  │  • [Approve] [Reject] buttons      │
  └────────┬───────────────────────────┘
           │
           │ Director clicks "Approve"
           ▼
  ┌────────────────────────────────────┐
  │  Confirmation dialog               │
  │  • Optional comments               │
  │  • Confirm action                  │
  └────────┬───────────────────────────┘
           │
           │ Update database
           ▼
  ┌────────────────────────────────────┐
  │  UPDATE approval_actions           │
  │    action = 'Approved'             │
  │    action_by = director_user_id    │
  │    comments = '...'                │
  │    acted_at = NOW()                │
  │                                    │
  │  UPDATE quotes                     │
  │    approval_status = 'Approved'    │
  └────────┬───────────────────────────┘
           │
           ├──────────────────┬──────────────────┐
           │                  │                  │
           ▼                  ▼                  ▼
  ┌────────────────┐ ┌────────────────┐ ┌──────────────┐
  │ Email to CSR   │ │ Real-time      │ │ Quote status │
  │ "Quote         │ │ notification   │ │ badge        │
  │  approved"     │ │ to CSR         │ │ updates      │
  └────────────────┘ └────────────────┘ └──────────────┘
           │                  │                  │
           └──────────────────┴──────────────────┘
                              │
                              ▼
  ┌────────────────────────────────────┐
  │  CSR can now:                      │
  │  • Generate PDF                    │
  │  • Email to customer               │
  │  • Export to ERP                   │
  │  • Convert to order                │
  └────────────────────────────────────┘
```

---

## Deployment Architecture

### Cloud Deployment (Supabase Cloud)

```
┌──────────────────────────────────────────────────────────────────┐
│                     INTERNET / USERS                              │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
         ┌──────────▼────────┐   ┌───▼──────────────┐
         │   Vercel/Netlify  │   │  Mobile Devices  │
         │   (Frontend Host) │   │  (Browsers)      │
         └──────────┬────────┘   └───┬──────────────┘
                    │                │
                    └────────┬───────┘
                             │ HTTPS
                             │
                    ┌────────▼────────┐
                    │                 │
         ┌──────────▼────────┐   ┌───▼──────────────┐
         │  Supabase Cloud   │   │  CDN (Assets)    │
         │  us-east-1        │   │  Global          │
         └──────────┬────────┘   └──────────────────┘
                    │
       ┌────────────┼────────────┐
       │            │            │
   ┌───▼────┐  ┌───▼────┐  ┌───▼────┐
   │  Auth  │  │  REST  │  │ Realtime│
   │ GoTrue │  │PostgREST│ │  WS    │
   └───┬────┘  └───┬────┘  └───┬────┘
       │           │            │
       └───────────┼────────────┘
                   │
          ┌────────▼────────┐
          │   PostgreSQL    │
          │   (Primary)     │
          └────────┬────────┘
                   │
          ┌────────▼────────┐
          │   PostgreSQL    │
          │   (Replica)     │
          └─────────────────┘
```

### Self-Hosted Deployment

```
┌──────────────────────────────────────────────────────────────────┐
│                     INTERNET / USERS                              │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             │ HTTPS (443)
                             │
                    ┌────────▼────────┐
                    │  Linux Server   │
                    │  (Ubuntu 20.04) │
                    └────────┬────────┘
                             │
                    ┌────────▼────────────────────┐
                    │    Docker Engine            │
                    │                             │
                    │  ┌────────────────────────┐│
                    │  │   Nginx Reverse Proxy ││
                    │  │   - SSL Termination   ││
                    │  │   - Load Balancing    ││
                    │  └──────────┬─────────────┘│
                    │             │              │
                    │  ┌──────────▼─────────────┐│
                    │  │   Quote App Container ││
                    │  │   - Vite (Production) ││
                    │  │   - Static Files      ││
                    │  └──────────┬─────────────┘│
                    │             │              │
                    │  ┌──────────▼─────────────┐│
                    │  │   Supabase Stack      ││
                    │  │  ┌──────────────────┐ ││
                    │  │  │   PostgreSQL     │ ││
                    │  │  └────────┬─────────┘ ││
                    │  │  ┌────────▼─────────┐ ││
                    │  │  │   PostgREST      │ ││
                    │  │  └────────┬─────────┘ ││
                    │  │  ┌────────▼─────────┐ ││
                    │  │  │   GoTrue Auth    │ ││
                    │  │  └────────┬─────────┘ ││
                    │  │  ┌────────▼─────────┐ ││
                    │  │  │   Realtime       │ ││
                    │  │  └────────┬─────────┘ ││
                    │  │  ┌────────▼─────────┐ ││
                    │  │  │   Storage        │ ││
                    │  │  └────────┬─────────┘ ││
                    │  │  ┌────────▼─────────┐ ││
                    │  │  │   Studio UI      │ ││
                    │  │  └──────────────────┘ ││
                    │  └───────────────────────┘│
                    │                            │
                    │  ┌───────────────────────┐│
                    │  │   Persistent Volumes  ││
                    │  │   - /var/lib/docker   ││
                    │  │   - Database data     ││
                    │  │   - Logs              ││
                    │  └───────────────────────┘│
                    └─────────────────────────────┘
```

---

## Component Interaction Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                   COMPONENT INTERACTIONS                          │
└──────────────────────────────────────────────────────────────────┘

User Action: "Add product to quote"
─────────────────────────────────────

  User types in search box
           │
           ▼
  ┌─────────────────┐
  │  LineItems.tsx  │
  └────────┬────────┘
           │
           │ onChange (debounced 300ms)
           ▼
  ┌──────────────────┐
  │  useDebounce     │
  │  hook            │
  └────────┬─────────┘
           │
           │ After delay
           ▼
  ┌──────────────────────────────┐
  │  Supabase query              │
  │  .from('products')           │
  │  .select()                   │
  │  .ilike('description', %)    │
  │  .limit(10)                  │
  └────────┬─────────────────────┘
           │
           │ Results returned
           ▼
  ┌──────────────────┐
  │  Update state    │
  │  searchResults   │
  └────────┬─────────┘
           │
           │ Re-render
           ▼
  ┌──────────────────────────┐
  │  Display dropdown        │
  │  with product results    │
  └────────┬─────────────────┘
           │
           │ User clicks product
           ▼
  ┌──────────────────────────┐
  │  addLineItem(product)    │
  └────────┬─────────────────┘
           │
           ├────────────────────┬─────────────────────┐
           │                    │                     │
           ▼                    ▼                     ▼
  ┌────────────────┐  ┌──────────────┐   ┌──────────────────┐
  │ Update         │  │ Check        │   │ Calculate        │
  │ QuoteContext   │  │ inventory    │   │ pricing          │
  │ lineItems[]    │  │ (ERP API)    │   │ (apply margins)  │
  └────────┬───────┘  └──────┬───────┘   └──────┬───────────┘
           │                  │                   │
           └──────────────────┴───────────────────┘
                              │
                              │ All complete
                              ▼
  ┌──────────────────────────────────────┐
  │  Trigger recalculation               │
  │  • QuoteSummary updates              │
  │  • CostAnalysis updates              │
  │  • Line item totals update           │
  └──────────────────────────────────────┘
```

---

## Technology Stack Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                        TECHNOLOGY STACK                             │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  PRESENTATION LAYER                                           │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │  React 18.3.1         │  TypeScript 5.5.3                    │ │
│  │  Tailwind CSS 3.4.1   │  Lucide React Icons                  │ │
│  │  Vite 5.4.2           │  PostCSS, Autoprefixer               │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  STATE MANAGEMENT                                             │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │  React Context API    │  Custom Hooks                        │ │
│  │  Local State (useState) │  Effect Hooks (useEffect)          │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  BACKEND AS A SERVICE                                         │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │  Supabase (@supabase/supabase-js 2.57.4)                     │ │
│  │  ├── PostgreSQL 15                                            │ │
│  │  ├── PostgREST (Auto REST API)                                │ │
│  │  ├── GoTrue (Authentication)                                  │ │
│  │  ├── Realtime (WebSockets)                                    │ │
│  │  └── Edge Functions (Deno Runtime)                            │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  DATABASE FEATURES                                            │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │  Row Level Security   │  Database Functions                  │ │
│  │  Foreign Keys         │  Triggers                            │ │
│  │  Indexes              │  Views                               │ │
│  │  Check Constraints    │  JSONB Columns                       │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  DEVELOPMENT TOOLS                                            │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │  ESLint 9.9.1         │  Git Version Control                 │ │
│  │  Node.js 18+          │  npm Package Manager                 │ │
│  │  VS Code (Recommended)│  Chrome DevTools                     │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  DEPLOYMENT                                                   │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │  Option 1: Vercel/Netlify (Frontend) + Supabase Cloud        │ │
│  │  Option 2: Docker Container + Self-hosted Supabase           │ │
│  │  Option 3: VPS with Nginx + Supabase Cloud                   │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                      SECURITY ARCHITECTURE                          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  FRONTEND SECURITY                                            │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │  • HTTPS Only (Strict Transport Security)                    │ │
│  │  • Content Security Policy Headers                           │ │
│  │  • XSS Protection (React's built-in escaping)                │ │
│  │  • No eval() or dangerous innerHTML usage                    │ │
│  │  • Environment variables for sensitive config                │ │
│  │  • Protected routes with authentication checks               │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  AUTHENTICATION SECURITY                                      │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │  • JWT tokens with short expiry (1 hour)                     │ │
│  │  • Secure token storage (httpOnly cookies recommended)       │ │
│  │  • Automatic token refresh                                   │ │
│  │  • Password hashing (bcrypt via Supabase)                    │ │
│  │  • Session management                                        │ │
│  │  • Logout clears all auth state                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  DATABASE SECURITY                                            │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │  Row Level Security (RLS) Policies:                          │ │
│  │  ┌────────────────────────────────────────────────────────┐ │ │
│  │  │  quotes:                                                │ │ │
│  │  │  • Users see only their own quotes                     │ │ │
│  │  │  • Managers see team quotes                            │ │ │
│  │  │  • Admins see all quotes                               │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  │  ┌────────────────────────────────────────────────────────┐ │ │
│  │  │  quote_line_items:                                      │ │ │
│  │  │  • Users see items from their accessible quotes        │ │ │
│  │  │  • Enforced through quote_id foreign key               │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  │  ┌────────────────────────────────────────────────────────┐ │ │
│  │  │  customers:                                             │ │ │
│  │  │  • All authenticated users can read                    │ │ │
│  │  │  • Only admins/managers can write                      │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  │  ┌────────────────────────────────────────────────────────┐ │ │
│  │  │  products:                                              │ │ │
│  │  │  • All authenticated users can read                    │ │ │
│  │  │  • Only admins can write                               │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  │  ┌────────────────────────────────────────────────────────┐ │ │
│  │  │  user_roles:                                            │ │ │
│  │  │  • Users see their own role only                       │ │ │
│  │  │  • Admins see all roles                                │ │ │
│  │  │  • Only service_role can modify                        │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  API SECURITY                                                 │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │  Import APIs:                                                 │ │
│  │  • Basic authentication required                             │ │
│  │  • Username/password from app_configurations                 │ │
│  │  • Rate limiting (10 requests/minute)                        │ │
│  │  • Request logging for audit trail                           │ │
│  │  • Input validation and sanitization                         │ │
│  │  • CORS headers properly configured                          │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  DATA PROTECTION                                              │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │  • Encryption at rest (database)                             │ │
│  │  • Encryption in transit (TLS/SSL)                           │ │
│  │  • No sensitive data in frontend code                        │ │
│  │  • API keys stored in environment variables                  │ │
│  │  • No credentials committed to version control               │ │
│  │  • Regular database backups                                  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  AUDIT & COMPLIANCE                                           │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │  • All quote modifications tracked (created_by, updated_by)  │ │
│  │  • Approval actions logged (approval_actions table)          │ │
│  │  • API request logging (rest_logs table)                     │ │
│  │  • Timestamp tracking (created_at, updated_at)               │ │
│  │  • User activity monitoring                                  │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Performance Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                    PERFORMANCE OPTIMIZATIONS                        │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  FRONTEND PERFORMANCE                                         │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │  • Code splitting (React.lazy, Suspense)                     │ │
│  │  • Debounced search inputs (300ms delay)                     │ │
│  │  • Pagination for large lists (50 items/page)                │ │
│  │  • Memoization of expensive calculations                     │ │
│  │  • Optimized re-renders (React.memo where appropriate)       │ │
│  │  • Tree shaking (Vite automatically removes unused code)     │ │
│  │  • Compressed assets (gzip/brotli)                           │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  DATABASE PERFORMANCE                                         │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │  Indexes on:                                                  │ │
│  │  • user_id columns (for RLS queries)                         │ │
│  │  • Foreign key columns                                       │ │
│  │  • quote_status, approval_status                             │ │
│  │  • customer_number, product sku                              │ │
│  │  • created_at (for sorting)                                  │ │
│  │                                                               │ │
│  │  Optimized Queries:                                           │ │
│  │  • optimize_pending_approvals_query() function               │ │
│  │  • Selective column fetching (no SELECT *)                   │ │
│  │  • Query result pagination                                   │ │
│  │  • Efficient JOIN strategies                                 │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  CACHING STRATEGY                                             │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │  • Supabase client-side caching                              │ │
│  │  • React Context prevents redundant fetches                  │ │
│  │  • Static assets cached with long TTL                        │ │
│  │  • CDN caching for production deployments                    │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  REAL-TIME OPTIMIZATION                                       │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │  • Selective subscriptions (only active pages)               │ │
│  │  • Automatic reconnection on disconnect                      │ │
│  │  • Debounced updates to prevent UI thrashing                 │ │
│  │  • Cleanup subscriptions on unmount                          │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Integration Points

```
┌────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL INTEGRATIONS                          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  ERP INTEGRATION (Oracle EBS) - Optional                      │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │  Direction: Bi-directional                                    │ │
│  │                                                                │ │
│  │  Inbound (ERP → App):                                         │ │
│  │  • Product catalog                                            │ │
│  │  • Inventory levels                                           │ │
│  │  • Customer data                                              │ │
│  │  • Pricing information                                        │ │
│  │                                                                │ │
│  │  Outbound (App → ERP):                                        │ │
│  │  • Approved quotes                                            │ │
│  │  • Order conversions                                          │ │
│  │                                                                │ │
│  │  Method: REST API calls via erpApiService.ts                  │ │
│  │  Auth: API key or OAuth token                                 │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  IMPORT APIs (External Systems → App)                         │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │  Endpoints:                                                    │ │
│  │  • POST /functions/v1/import-products                         │ │
│  │  • POST /functions/v1/import-customers                        │ │
│  │  • POST /functions/v1/import-cross-references                 │ │
│  │                                                                │ │
│  │  Auth: Basic authentication (username/password)               │ │
│  │  Rate Limit: 10 requests/minute                               │ │
│  │  Format: JSON                                                 │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  EMAIL NOTIFICATIONS - Future Enhancement                     │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │  • Quote approval notifications                               │ │
│  │  • Quote status changes                                       │ │
│  │  • Daily digest for managers                                  │ │
│  │  • Integration options: SendGrid, AWS SES, SMTP              │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

This architecture diagram document provides a comprehensive visual overview of the Quote and Bid Management Tool's structure, data flows, security model, and deployment options.
