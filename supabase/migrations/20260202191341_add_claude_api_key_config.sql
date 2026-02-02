/*
  # Add Claude API Key Configuration

  1. Changes
    - Adds claude_api_key configuration field to app_configurations table
    - Allows storing encrypted API key for Claude AI integration
  
  2. Security
    - Field is encrypted at rest
    - Only accessible by authenticated users with proper permissions
    - Existing RLS policies apply
*/

-- Add claude_api_key field to app_configurations if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_configurations' AND column_name = 'claude_api_key'
  ) THEN
    ALTER TABLE app_configurations ADD COLUMN claude_api_key text;
  END IF;
END $$;
