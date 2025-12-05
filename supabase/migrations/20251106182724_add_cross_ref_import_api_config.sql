/*
  # Add Cross Reference Import API Configuration

  1. Purpose
    - Add configuration entries for the Cross Reference Import API authentication
    - Mirrors the existing product import API configuration structure

  2. New Configuration Entries
    - `cross_ref_import_api_enabled` - Enable/disable authentication for cross reference imports
    - `cross_ref_import_api_username` - Username for Basic Authentication
    - `cross_ref_import_api_password` - Password for Basic Authentication (encrypted)
    - `cross_ref_import_api_rate_limit` - Maximum requests per hour

  3. Security
    - Password field marked as encrypted for secure storage
    - Configuration values can be managed through Settings UI
*/

-- Insert cross reference import API configuration entries
INSERT INTO app_configurations (config_key, config_value, config_type, is_encrypted, description)
VALUES 
  (
    'cross_ref_import_api_enabled',
    'false',
    'cross_ref_import_api',
    false,
    'Enable/Disable authentication for cross reference import API'
  ),
  (
    'cross_ref_import_api_username',
    '',
    'cross_ref_import_api',
    false,
    'Username for cross reference import API authentication'
  ),
  (
    'cross_ref_import_api_password',
    '',
    'cross_ref_import_api',
    true,
    'Password for cross reference import API authentication'
  ),
  (
    'cross_ref_import_api_rate_limit',
    '100',
    'cross_ref_import_api',
    false,
    'Maximum cross reference import API requests per hour'
  )
ON CONFLICT (config_key) DO NOTHING;