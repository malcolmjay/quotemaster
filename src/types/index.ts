/**
 * Application-wide TypeScript type definitions
 */

// Quote Types
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'pending_approval' | 'approved';

export interface Quote {
  id: string;
  quote_number: string;
  customer_id: string;
  customer_user_id?: string | null;
  quote_type: string;
  status: QuoteStatus;
  quote_status: string;
  valid_until?: string | null;
  ship_until?: string | null;
  customer_bid_number?: string | null;
  purchase_order_number?: string | null;
  total_value: number;
  total_cost: number;
  total_margin: number;
  line_item_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  dbe_required: boolean;
  bid_bond_required: boolean;
  performance_bond_required: boolean;
  insurance_required: boolean;
  winning_competitor?: string | null;
  loss_reason?: string | null;
  loss_notes?: string | null;
  quote_line_items?: LineItem[];
  customers?: any;
}

export interface CreateQuoteInput {
  quote_number: string;
  customer_id: string;
  customer_user_id?: string | null;
  quote_type?: string;
  status?: QuoteStatus;
  valid_until?: string | null;
  ship_until?: string | null;
  customer_bid_number?: string | null;
  purchase_order_number?: string | null;
  total_value?: number;
  total_cost?: number;
  total_margin?: number;
  line_item_count?: number;
  created_by: string;
  dbe_required?: boolean;
  bid_bond_required?: boolean;
  performance_bond_required?: boolean;
  insurance_required?: boolean;
  quote_status?: string;
  winning_competitor?: string | null;
  loss_reason?: string | null;
  loss_notes?: string | null;
}

export interface UpdateQuoteInput {
  quote_number?: string;
  customer_id?: string;
  quote_type?: string;
  status?: QuoteStatus;
  quote_status?: string;
  valid_until?: string | null;
  ship_until?: string | null;
  customer_bid_number?: string | null;
  purchase_order_number?: string | null;
  total_value?: number;
  total_cost?: number;
  total_margin?: number;
  line_item_count?: number;
  dbe_required?: boolean;
  bid_bond_required?: boolean;
  performance_bond_required?: boolean;
  insurance_required?: boolean;
  winning_competitor?: string | null;
  loss_reason?: string | null;
  loss_notes?: string | null;
  updated_at?: string;
}

// Line Item Types
export interface LineItem {
  id: string;
  quote_id: string;
  product_id?: string | null;
  sku: string;
  product_name: string;
  supplier: string;
  category: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  subtotal: number;
  status?: string;
  lead_time?: string;
  quoted_lead_time?: string;
  next_available_date?: string;
  shipping_instructions?: string;
  customer_part_number?: string;
  is_replacement?: boolean;
  replacement_type?: string;
  replacement_reason?: string;
  original_customer_sku?: string;
  original_customer_name?: string;
  price_request_id?: string | null;
  cost_effective_from?: string | null;
  cost_effective_to?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateLineItemInput {
  quote_id: string;
  product_id?: string | null;
  sku: string;
  product_name: string;
  supplier: string;
  category?: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  subtotal?: number;
  status?: string;
  lead_time?: string;
  quoted_lead_time?: string;
  next_available_date?: string;
  shipping_instructions?: string;
  customer_part_number?: string;
  is_replacement?: boolean;
  replacement_type?: string;
  replacement_reason?: string;
  original_customer_sku?: string;
  original_customer_name?: string;
  price_request_id?: string | null;
  cost_effective_from?: string | null;
  cost_effective_to?: string | null;
}

export interface UpdateLineItemInput {
  quantity?: number;
  unit_price?: number;
  unit_cost?: number;
  subtotal?: number;
  status?: string;
  lead_time?: string;
  quoted_lead_time?: string;
  next_available_date?: string;
  shipping_instructions?: string;
  customer_part_number?: string;
  quoted_lead_time?: string;
  cost_effective_from?: string | null;
  cost_effective_to?: string | null;
}

// Product Types
export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  category: string;
  supplier: string;
  supplier_email?: string | null;
  unit_cost: number;
  list_price: number;
  lead_time_days: number;
  lead_time_text?: string | null;
  warehouse: string;
  status: 'active' | 'inactive' | 'discontinued';
  created_at: string;
  updated_at: string;
  inventory_item_id?: string | null;
}

// Customer Types
export interface Customer {
  id: string;
  customer_number: string;
  name: string;
  type: string;
  segment: string;
  contract_number?: string | null;
  payment_terms?: string | null;
  currency: string;
  tier?: string | null;
  sales_manager?: string | null;
  sales_rep?: string | null;
  created_at: string;
  updated_at: string;
  contacts?: CustomerContact[];
  addresses?: CustomerAddress[];
}

export interface CustomerContact {
  id: string;
  customer_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  title?: string | null;
  department?: string | null;
  is_primary: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerAddress {
  id: string;
  customer_number: string;
  site_use_id?: string | null;
  address_line_1: string;
  address_line_2?: string | null;
  address_line_3?: string | null;
  city: string;
  postal_code: string;
  state?: string | null;
  country: string;
  is_shipping: boolean;
  is_billing: boolean;
  is_primary: boolean;
  is_credit_hold: boolean;
  primary_warehouse?: string | null;
  second_warehouse?: string | null;
  third_warehouse?: string | null;
  fourth_warehouse?: string | null;
  fifth_warehouse?: string | null;
  created_at: string;
  updated_at: string;
}

// User & Auth Types
export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  user_created_at: string;
  last_sign_in_at: string | null;
  is_disabled: boolean;
  disabled_at: string | null;
  disabled_by: string | null;
  disabled_reason: string | null;
  roles: Array<{
    role: string;
    assigned_at: string;
    is_active: boolean;
  }>;
}

export type UserRole = 'CSR' | 'Manager' | 'Director' | 'VP' | 'President' | 'Admin';

// Approval Types
export interface QuoteApproval {
  id: string;
  quote_id: string;
  approval_level: UserRole;
  required_approvers: number;
  current_approvers: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface ApprovalAction {
  id: string;
  quote_approval_id: string;
  quote_id: string;
  approver_id: string;
  approver_role: UserRole;
  action: 'approved' | 'rejected';
  comments?: string | null;
  created_at: string;
}

// Lost Details Types
export interface LostDetails {
  id: string;
  line_item_id: string;
  lost_reason: string;
  competitor_1: string;
  bid_price_1: number;
  competitor_2?: string | null;
  bid_price_2?: number | null;
  created_by: string;
  created_at: string;
}

export interface CreateLostDetailsInput {
  lineItemId: string;
  lostReason: string;
  competitor1: string;
  bidPrice1: number;
  competitor2?: string | null;
  bidPrice2?: number | null;
  createdBy: string;
}
