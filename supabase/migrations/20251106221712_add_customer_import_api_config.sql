/*
  # Add Customer Import API Configuration

  1. Configuration Entries
    - Add `customer_import_api_enabled` configuration key
      - Controls whether authentication is required for customer import API
      - Default: false (authentication disabled)
    
    - Add `customer_import_api_username` configuration key
      - Stores the username for Basic Authentication
      - Used when authentication is enabled
    
    - Add `customer_import_api_password` configuration key
      - Stores the password for Basic Authentication
      - Used when authentication is enabled

  2. Notes
    - These configurations enable secure customer, address, and contact imports from ERP systems
    - Follows the same pattern as product and cross-reference import APIs
    - Authentication can be toggled on/off via the settings UI
    - Credentials are stored securely in the app_configurations table
*/

-- Insert customer import API configuration entries if they don't exist
INSERT INTO app_configurations (config_key, config_value, description, created_at, updated_at)
VALUES 
  (
    'customer_import_api_enabled',
    'false',
    'Enable/disable authentication for the customer import API',
    now(),
    now()
  ),
  (
    'customer_import_api_username',
    '',
    'Username for customer import API Basic Authentication',
    now(),
    now()
  ),
  (
    'customer_import_api_password',
    '',
    'Password for customer import API Basic Authentication',
    now(),
    now()
  )
ON CONFLICT (config_key) DO NOTHING;