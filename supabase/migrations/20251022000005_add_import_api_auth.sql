/*
  # Add Import API Authentication Configuration

  1. Changes
    - Add import API authentication credentials to app_configurations
    - Insert default configuration entries
    - Support username/password basic auth for import endpoint

  2. Security
    - Credentials stored in existing secure configuration table
    - Marked as encrypted for future encryption implementation
*/

-- Insert import API authentication configuration
INSERT INTO app_configurations (config_key, config_value, config_type, description, is_encrypted)
VALUES
  ('import_api_enabled', 'false', 'import_api', 'Enable/Disable authentication for import API', false),
  ('import_api_username', '', 'import_api', 'Username for import API authentication', false),
  ('import_api_password', '', 'import_api', 'Password for import API authentication', true),
  ('import_api_rate_limit', '100', 'import_api', 'Maximum requests per hour', false)
ON CONFLICT (config_key) DO NOTHING;
