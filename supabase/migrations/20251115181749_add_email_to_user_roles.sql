/*
  # Add Email Column to User Roles Table

  1. Changes
    - Add `email` column to `user_roles` table to store user email addresses
    - Populate existing records with email from auth.users
    - Make email NOT NULL after population

  2. Purpose
    - Store email addresses directly in user_roles for easier access
    - Avoid complex joins with auth.users table
    - Improve query performance in user management UI
    
  3. Notes
    - Email will be synced from auth.users
    - Existing records will be backfilled automatically
*/

-- Add email column to user_roles table (nullable initially)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_roles' AND column_name = 'email'
  ) THEN
    ALTER TABLE user_roles ADD COLUMN email text;
  END IF;
END $$;

-- Populate email from auth.users for existing records
UPDATE user_roles
SET email = auth.users.email
FROM auth.users
WHERE user_roles.user_id = auth.users.id
AND user_roles.email IS NULL;

-- Make email NOT NULL now that it's populated
ALTER TABLE user_roles ALTER COLUMN email SET NOT NULL;

-- Create index for faster email searches
CREATE INDEX IF NOT EXISTS idx_user_roles_email ON user_roles(email);

-- Create trigger to auto-populate email on insert
CREATE OR REPLACE FUNCTION set_user_email()
RETURNS TRIGGER AS $$
BEGIN
  SELECT email INTO NEW.email
  FROM auth.users
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_email_trigger ON user_roles;
CREATE TRIGGER set_user_email_trigger
  BEFORE INSERT ON user_roles
  FOR EACH ROW
  WHEN (NEW.email IS NULL)
  EXECUTE FUNCTION set_user_email();