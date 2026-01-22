/*
  # Fix user_roles Trigger Permissions

  1. Problem
    - The set_user_email trigger function tries to read from auth.users
    - Regular authenticated users don't have permission to access auth.users
    - This causes "permission denied for table users" errors when inserting roles

  2. Solution
    - Make the set_user_email function SECURITY DEFINER
    - This allows it to run with elevated privileges to access auth.users
    - Set search_path for security

  3. Security
    - Function only reads email from auth.users (safe operation)
    - No user input is used in the query
    - search_path is explicitly set to prevent injection
*/

-- Recreate the function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION set_user_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  SELECT email INTO NEW.email
  FROM auth.users
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

-- Document the function
COMMENT ON FUNCTION set_user_email() IS 
  'Automatically sets the email field from auth.users when inserting user_roles. Runs with elevated privileges to access auth.users.';
