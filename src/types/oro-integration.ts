// OroCommerce Integration Types
// These types represent the expected OroCommerce database schema

export interface OroCustomer {
  id: number;
  name: string;
  company?: string;
  email?: string;
  group_id?: number;
  website_id?: number;
  store_id?: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  default_billing_address_id?: number;
  default_shipping_address_id?: number;
  vat_id?: string;
  credit_limit?: number;
  payment_term_label?: string;
}

export interface OroCustomerUser {
  id: number;
  customer_id: number;
  username?: string;
  email: string;
  name_prefix?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  name_suffix?: string;
  birthday?: string;
  website_id: number;
  enabled: boolean;
  confirmed: boolean;
  salt?: string;
  password?: string;
  confirmation_token?: string;
  password_requested_at?: string;
  password_changed_at?: string;
  last_login?: string;
  login_count: number;
  created_at: string;
  updated_at: string;
  roles: string[];
}

export interface OroProduct {
  id: number;
  sku: string;
  status: 'enabled' | 'disabled';
  variant_fields: string[];
  type: 'simple' | 'kit' | 'configurable';
  created_at: string;
  updated_at: string;
  featured: boolean;
  new_arrival: boolean;
  brand_id?: number;
  organization_id: number;
  business_unit_owner_id?: number;
  inventory_status: 'in_stock' | 'out_of_stock' | 'discontinued';
}

export interface OroProductName {
  id: number;
  product_id: number;
  localized_value_id: number;
  fallback?: string;
  string?: string;
  text?: string;
}

export interface OroRFQ {
  id: number;
  identifier: string;
  customer_user_id?: number;
  customer_id?: number;
  request: string;
  first_name: string;
  last_name: string;
  company?: string;
  role?: string;
  email: string;
  phone?: string;
  body?: string;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  processed_at?: string;
  cancelled_at?: string;
  website_id: number;
  internal_status_id: string;
  customer_status_id: string;
  po_number?: string;
  ship_until?: string;
}

export interface OroRFQProductItem {
  id: number;
  rfq_id: number;
  product_id: number;
  product_sku?: string;
  comment?: string;
  created_at: string;
  updated_at: string;
}

export interface OroQuote {
  id: number;
  qid?: string;
  customer_user_id?: number;
  customer_id?: number;
  organization_id: number;
  ship_until?: string;
  po_number?: string;
  valid_until?: string;
  locked: boolean;
  created_at: string;
  updated_at: string;
  currency?: string;
  website_id?: number;
  demand_id?: number;
  internal_status_id: string;
  customer_status_id: string;
  shipping_estimate?: number;
  estimated_shipping_cost_amount?: number;
}

export interface OroQuoteProductOffer {
  id: number;
  quote_id: number;
  product_id: number;
  product_replacement_id?: number;
  product_sku?: string;
  product_replacement_sku?: string;
  comment?: string;
  comment_customer?: string;
  allow_increments?: boolean;
  created_at: string;
  updated_at: string;
}

export interface OroInventoryLevel {
  id: number;
  product_id: number;
  product_unit_precision_id: number;
  warehouse_id: number;
  quantity: number;
}

// Recommended additional tables for enhanced functionality
export interface QuoteMasterReservation {
  id: number;
  quote_id: number;
  product_id: number;
  quantity_reserved: number;
  reserved_at: string;
  expires_at: string;
  status: 'active' | 'expired' | 'released' | 'converted';
  created_by: number;
  updated_at: string;
}

export interface QuoteMasterCostAnalysis {
  id: number;
  quote_product_offer_id: number;
  base_cost: number;
  labor_cost: number;
  overhead_rate: number;
  overhead_amount: number;
  total_cost: number;
  target_margin: number;
  margin_amount: number;
  suggested_price: number;
  final_price: number;
  created_at: string;
  updated_at: string;
}

export interface QuoteMasterCustomerAnalytics {
  id: number;
  customer_id: number;
  period_start: string;
  period_end: string;
  total_quotes: number;
  won_quotes: number;
  lost_quotes: number;
  total_quote_value: number;
  won_quote_value: number;
  lost_quote_value: number;
  average_margin: number;
  won_margin: number;
  lost_margin: number;
  win_rate: number;
  calculated_at: string;
}

export interface QuoteMasterCrossReference {
  id: number;
  customer_id: number;
  supplier_id?: number;
  customer_part_number: string;
  supplier_part_number?: string;
  internal_part_number: string;
  product_id: number;
  description?: string;
  last_used_at?: string;
  usage_frequency: number;
  created_at: string;
  updated_at: string;
}
// OroCommerce Product Relationships (existing table)
export interface OroProductRelationship {
  id: number;
  product_id: number;
  related_product_id: number;
  type: 'related' | 'upsell' | 'cross_sell' | 'supersession' | 'alternate';
  created_at: string;
  updated_at: string;
}

// Enhanced table for QuoteMaster-specific relationship data
export interface QuoteMasterProductRelationship {
  id: number;
  oro_relationship_id: number;
  reason?: string;
  effective_date?: string;
  compatibility_notes?: string;
  cost_impact?: number;
  lead_time_impact?: number;
  created_at: string;
  updated_at: string;
}