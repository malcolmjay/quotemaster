/*
  # Create REST Logs Table

  1. New Tables
    - `rest_logs`
      - `id` (uuid, primary key)
      - `direction` (text) - 'inbound' or 'outbound'
      - `method` (text) - HTTP method (GET, POST, PUT, DELETE, etc.)
      - `url` (text) - Full URL of the request
      - `endpoint` (text) - Extracted endpoint path for filtering
      - `request_headers` (jsonb) - Request headers
      - `request_payload` (jsonb) - Request body/payload
      - `response_status` (integer) - HTTP status code
      - `response_headers` (jsonb) - Response headers
      - `response_body` (jsonb) - Response body
      - `error_message` (text) - Error message if request failed
      - `duration_ms` (integer) - Request duration in milliseconds
      - `user_id` (uuid) - User who made the request
      - `ip_address` (text) - Client IP address
      - `user_agent` (text) - Client user agent
      - `created_at` (timestamptz) - When the log was created

  2. Security
    - Enable RLS on `rest_logs` table
    - Add policy for authenticated users to read logs based on role

  3. Indexes
    - Add indexes for common query patterns
*/

-- Create the rest_logs table
CREATE TABLE IF NOT EXISTS rest_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  method text NOT NULL,
  url text NOT NULL,
  endpoint text,
  request_headers jsonb DEFAULT '{}'::jsonb,
  request_payload jsonb,
  response_status integer,
  response_headers jsonb DEFAULT '{}'::jsonb,
  response_body jsonb,
  error_message text,
  duration_ms integer,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_rest_logs_created_at ON rest_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rest_logs_direction ON rest_logs(direction);
CREATE INDEX IF NOT EXISTS idx_rest_logs_method ON rest_logs(method);
CREATE INDEX IF NOT EXISTS idx_rest_logs_endpoint ON rest_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_rest_logs_response_status ON rest_logs(response_status);
CREATE INDEX IF NOT EXISTS idx_rest_logs_user_id ON rest_logs(user_id);

-- Enable RLS
ALTER TABLE rest_logs ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view all logs
CREATE POLICY "Admins can view all REST logs"
  ON rest_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'Admin'
    )
  );

-- Policy for users to view their own logs
CREATE POLICY "Users can view own REST logs"
  ON rest_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Function to automatically extract endpoint from URL
CREATE OR REPLACE FUNCTION extract_endpoint_from_url()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract path from URL (everything after the domain)
  NEW.endpoint := regexp_replace(NEW.url, '^https?://[^/]+', '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically extract endpoint
CREATE TRIGGER set_endpoint_from_url
  BEFORE INSERT ON rest_logs
  FOR EACH ROW
  EXECUTE FUNCTION extract_endpoint_from_url();
