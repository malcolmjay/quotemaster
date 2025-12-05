/*
  # Drop Unused Indexes

  Removes indexes that are never used to improve write performance and reduce storage overhead.
  These indexes were identified by Supabase's database advisor as unused.
*/

-- Drop unused indexes to improve write performance
DROP INDEX IF EXISTS idx_quote_line_items_ship_to_address;
DROP INDEX IF EXISTS idx_products_buyer;
DROP INDEX IF EXISTS idx_customer_addresses_site_use_id;
DROP INDEX IF EXISTS idx_customer_addresses_customer_primary;
DROP INDEX IF EXISTS idx_customers_sales_manager;
DROP INDEX IF EXISTS idx_customers_sales_rep;
DROP INDEX IF EXISTS idx_config_audit_log_key;
DROP INDEX IF EXISTS idx_config_audit_log_changed_at;
DROP INDEX IF EXISTS idx_quote_approvals_quote_id;
DROP INDEX IF EXISTS idx_quote_approvals_status;
DROP INDEX IF EXISTS idx_customer_contacts_email;
DROP INDEX IF EXISTS idx_customer_contacts_is_primary;
DROP INDEX IF EXISTS idx_products_category_set;
DROP INDEX IF EXISTS idx_products_item_type;
DROP INDEX IF EXISTS idx_products_rep_code;
DROP INDEX IF EXISTS idx_products_country_of_origin;
DROP INDEX IF EXISTS idx_products_fleet;
DROP INDEX IF EXISTS idx_cross_references_supplier;
DROP INDEX IF EXISTS idx_cross_references_type;
DROP INDEX IF EXISTS products_inventory_item_id_idx;
DROP INDEX IF EXISTS cross_references_ordered_item_id_idx;
DROP INDEX IF EXISTS idx_cross_references_internal_part_number;
DROP INDEX IF EXISTS idx_quotes_status;
DROP INDEX IF EXISTS idx_price_requests_quote_id;
DROP INDEX IF EXISTS idx_price_requests_requested_by;
DROP INDEX IF EXISTS quote_line_items_inventory_item_id_idx;
DROP INDEX IF EXISTS quote_line_items_ordered_item_id_idx;
DROP INDEX IF EXISTS idx_quote_line_items_price_request_id;
DROP INDEX IF EXISTS idx_item_relationships_from_item;
DROP INDEX IF EXISTS idx_item_relationships_to_item;
DROP INDEX IF EXISTS idx_item_relationships_type;
DROP INDEX IF EXISTS idx_role_approval_limits_role;
DROP INDEX IF EXISTS idx_products_cost_effective_to;
DROP INDEX IF EXISTS idx_products_cost_validity;
DROP INDEX IF EXISTS idx_user_roles_active;
DROP INDEX IF EXISTS idx_user_roles_email;
DROP INDEX IF EXISTS idx_user_metadata_disabled;