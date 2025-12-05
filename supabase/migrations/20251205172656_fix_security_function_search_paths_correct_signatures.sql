/*
  # Fix Function Search Paths

  Sets immutable search_path for all functions to prevent SQL injection.
  Uses ALTER FUNCTION with correct signatures.
  
  ## Functions Updated
  - get_required_approval_level
  - set_user_email
  - log_configuration_change
  - user_can_approve_level
  - update_item_relationships_updated_at
  - create_approval_requirements
  - update_customer_contacts_updated_at
  - update_updated_at_column
*/

-- Set search_path for all functions with correct signatures
ALTER FUNCTION get_required_approval_level(quote_value numeric) SET search_path = public, pg_temp;
ALTER FUNCTION set_user_email() SET search_path = public, pg_temp;
ALTER FUNCTION log_configuration_change() SET search_path = public, pg_temp;
ALTER FUNCTION user_can_approve_level(user_id uuid, required_level user_role_type) SET search_path = public, pg_temp;
ALTER FUNCTION update_item_relationships_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION create_approval_requirements() SET search_path = public, pg_temp;
ALTER FUNCTION update_customer_contacts_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION update_updated_at_column() SET search_path = public, pg_temp;