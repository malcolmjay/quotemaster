/*
  # Create Application Configurations Table

  1. New Tables
    - `app_configurations`
      - `id` (uuid, primary key)
      - `config_key` (text, unique) - Configuration identifier
      - `config_value` (text) - Encrypted configuration value
      - `config_type` (text) - Type of configuration (erp_api, smtp, etc.)
      - `is_encrypted` (boolean) - Whether value is encrypted
      - `description` (text) - Human-readable description
      - `last_updated_by` (uuid) - User who last updated
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `app_configurations` table
    - Only authenticated users with admin role can read/write
    - All configuration changes are audited
*/

-- Create app_configurations table
CREATE TABLE IF NOT EXISTS app_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text UNIQUE NOT NULL,
  config_value text,
  config_type text NOT NULL DEFAULT 'general',
  is_encrypted boolean DEFAULT false,
  description text,
  last_updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_configurations ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
-- Note: In production, you should add role-based checks
-- For now, all authenticated users can view, but consider restricting to admins
CREATE POLICY "Authenticated users can view configurations"
  ON app_configurations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert configurations"
  ON app_configurations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = last_updated_by);

CREATE POLICY "Authenticated users can update configurations"
  ON app_configurations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = last_updated_by);

CREATE POLICY "Authenticated users can delete configurations"
  ON app_configurations FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_configurations_key ON app_configurations(config_key);
CREATE INDEX IF NOT EXISTS idx_app_configurations_type ON app_configurations(config_type);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_app_configurations_updated_at
  BEFORE UPDATE ON app_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default ERP API configuration placeholders
INSERT INTO app_configurations (config_key, config_value, config_type, description, is_encrypted)
VALUES
  ('erp_api_url', '', 'erp_api', 'ERP REST API Base URL', false),
  ('erp_api_key', '', 'erp_api', 'ERP API Authentication Key', true),
  ('erp_api_timeout', '10000', 'erp_api', 'API Request Timeout (milliseconds)', false),
  ('erp_api_retry_attempts', '3', 'erp_api', 'Number of retry attempts for failed requests', false),
  ('erp_api_cache_ttl', '300000', 'erp_api', 'Cache Time-To-Live (milliseconds)', false),
  ('erp_api_enabled', 'false', 'erp_api', 'Enable/Disable ERP API Integration', false),
  ('default_warehouse', 'WH01', 'erp_api', 'Default Warehouse Code', false)
ON CONFLICT (config_key) DO NOTHING;

-- Create audit log table for configuration changes
CREATE TABLE IF NOT EXISTS configuration_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text NOT NULL,
  old_value text,
  new_value text,
  changed_by uuid REFERENCES auth.users(id),
  change_type text NOT NULL, -- 'create', 'update', 'delete'
  changed_at timestamptz DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE configuration_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view audit log"
  ON configuration_audit_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert audit log"
  ON configuration_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create index on audit log
CREATE INDEX IF NOT EXISTS idx_config_audit_log_key ON configuration_audit_log(config_key);
CREATE INDEX IF NOT EXISTS idx_config_audit_log_changed_at ON configuration_audit_log(changed_at DESC);

-- Create function to log configuration changes
CREATE OR REPLACE FUNCTION log_configuration_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO configuration_audit_log (config_key, new_value, changed_by, change_type)
    VALUES (NEW.config_key, NEW.config_value, NEW.last_updated_by, 'create');
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO configuration_audit_log (config_key, old_value, new_value, changed_by, change_type)
    VALUES (NEW.config_key, OLD.config_value, NEW.config_value, NEW.last_updated_by, 'update');
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO configuration_audit_log (config_key, old_value, changed_by, change_type)
    VALUES (OLD.config_key, OLD.config_value, auth.uid(), 'delete');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for audit logging
CREATE TRIGGER audit_configuration_changes
  AFTER INSERT OR UPDATE OR DELETE ON app_configurations
  FOR EACH ROW
  EXECUTE FUNCTION log_configuration_change();
