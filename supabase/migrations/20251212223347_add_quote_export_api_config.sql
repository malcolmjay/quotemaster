/*
  # Add Quote Export REST API Configuration

  1. Configuration Keys
    - `quote_export_api_enabled` - Enable/disable quote export integration
    - `quote_export_api_url` - REST endpoint URL for sending quote data
    - `quote_export_api_username` - Username for Basic Authentication
    - `quote_export_api_password` - Password for Basic Authentication
    - `quote_export_api_timeout` - Request timeout in milliseconds

  2. Purpose
    - Configure automatic export of approved quotes to external systems
    - Support for updating quotes after approval triggers re-export
    - All exports are logged in the rest_logs table for auditing
*/

-- Insert quote export API configuration placeholders
INSERT INTO app_configurations (config_key, config_value, config_type, description, is_encrypted)
VALUES
  ('quote_export_api_enabled', 'false', 'quote_export_api', 'Enable/Disable Quote Export Integration', false),
  ('quote_export_api_url', '', 'quote_export_api', 'REST Endpoint URL for Quote Export', false),
  ('quote_export_api_username', '', 'quote_export_api', 'Username for Basic Authentication', false),
  ('quote_export_api_password', '', 'quote_export_api', 'Password for Basic Authentication', true),
  ('quote_export_api_timeout', '30000', 'quote_export_api', 'Request Timeout (milliseconds)', false)
ON CONFLICT (config_key) DO NOTHING;
