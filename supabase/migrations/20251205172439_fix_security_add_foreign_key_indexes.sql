/*
  # Add Missing Foreign Key Indexes

  Adds indexes to all foreign key columns without covering indexes to improve join performance.
  
  ## Tables Affected
  - app_configurations
  - approval_actions
  - configuration_audit_log
  - cost_analysis
  - customer_users
  - price_requests
  - quotes
  - reservations
  - user_metadata
  - user_roles
*/

-- app_configurations
CREATE INDEX IF NOT EXISTS idx_app_configurations_last_updated_by
  ON app_configurations(last_updated_by);

-- approval_actions
CREATE INDEX IF NOT EXISTS idx_approval_actions_quote_approval_id
  ON approval_actions(quote_approval_id);

-- configuration_audit_log
CREATE INDEX IF NOT EXISTS idx_configuration_audit_log_changed_by
  ON configuration_audit_log(changed_by);

-- cost_analysis
CREATE INDEX IF NOT EXISTS idx_cost_analysis_line_item_id
  ON cost_analysis(line_item_id);

-- customer_users
CREATE INDEX IF NOT EXISTS idx_customer_users_customer_id
  ON customer_users(customer_id);

-- price_requests
CREATE INDEX IF NOT EXISTS idx_price_requests_completed_by
  ON price_requests(completed_by);

-- quotes
CREATE INDEX IF NOT EXISTS idx_quotes_customer_user_id
  ON quotes(customer_user_id);

-- reservations
CREATE INDEX IF NOT EXISTS idx_reservations_created_by
  ON reservations(created_by);
CREATE INDEX IF NOT EXISTS idx_reservations_line_item_id
  ON reservations(line_item_id);
CREATE INDEX IF NOT EXISTS idx_reservations_product_id
  ON reservations(product_id);
CREATE INDEX IF NOT EXISTS idx_reservations_quote_id
  ON reservations(quote_id);

-- user_metadata
CREATE INDEX IF NOT EXISTS idx_user_metadata_disabled_by
  ON user_metadata(disabled_by);

-- user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_by
  ON user_roles(assigned_by);