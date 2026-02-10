/*
  # Create Event Logs Table

  1. New Tables
    - `event_logs`
      - `id` (uuid, primary key) - Unique log entry identifier
      - `event_type` (text) - Category of event: 'error', 'warning', 'info', 'auth', 'data_change', 'system'
      - `severity` (text) - Severity level: 'critical', 'high', 'medium', 'low', 'info'
      - `source` (text) - Component or module that generated the event
      - `message` (text) - Human-readable description of the event
      - `details` (jsonb) - Structured metadata about the event
      - `user_id` (uuid, nullable) - User who triggered the event, if applicable
      - `user_email` (text, nullable) - Cached email for display without joins
      - `ip_address` (text, nullable) - Client IP address if available
      - `created_at` (timestamptz) - When the event occurred

  2. Security
    - RLS enabled on `event_logs`
    - Admin users can read all logs
    - Authenticated users can insert logs (for client-side error reporting)
    - No update or delete policies (logs are immutable)

  3. Indexes
    - `event_type` for filtering by category
    - `severity` for filtering by severity
    - `created_at` for time-based queries and sorting
    - `user_id` for user-specific log lookups

  4. Notes
    - Logs are append-only; no update or delete policies are provided
    - A helper function `is_admin()` is used to restrict read access to admins
*/

CREATE TABLE IF NOT EXISTS event_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL DEFAULT 'info',
  severity text NOT NULL DEFAULT 'info',
  source text NOT NULL DEFAULT 'system',
  message text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  user_id uuid REFERENCES auth.users(id),
  user_email text DEFAULT '',
  ip_address text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE event_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_event_logs_event_type ON event_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_event_logs_severity ON event_logs(severity);
CREATE INDEX IF NOT EXISTS idx_event_logs_created_at ON event_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_logs_user_id ON event_logs(user_id);

CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'Admin'
    AND is_active = true
  );
$$;

CREATE POLICY "Admins can read all event logs"
  ON event_logs
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

CREATE POLICY "Authenticated users can insert event logs"
  ON event_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
