/*
  # Add Admin Role to user_role_type Enum

  1. Problem
    - The user_role_type enum exists with values: CSR, Manager, Director, VP, President
    - User Management UI tries to assign "Admin" role which is not in the enum
    - Error: invalid input value for enum user_role_type: "Admin"

  2. Solution
    - Add "Admin" to the existing user_role_type enum
    
  3. Changes
    - Alter the enum type to include "Admin" value
*/

-- Add Admin to the enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Admin' 
    AND enumtypid = 'user_role_type'::regtype
  ) THEN
    ALTER TYPE user_role_type ADD VALUE 'Admin';
  END IF;
END $$;