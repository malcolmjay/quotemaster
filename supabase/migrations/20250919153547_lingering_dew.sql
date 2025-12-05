/*
  # Assign CSR role to malcolm.jamal@gmail.com

  1. User Role Assignment
    - Find user by email malcolm.jamal@gmail.com
    - Assign CSR role to this user
    - Set role as active with current timestamp

  2. Security
    - Uses existing RLS policies on user_roles table
    - Ensures proper role assignment tracking
*/

-- Assign CSR role to malcolm.jamal@gmail.com user
INSERT INTO user_roles (user_id, role, assigned_by, is_active)
SELECT 
  u.id,
  'CSR'::user_role_type,
  u.id, -- Self-assigned for initial setup
  true
FROM auth.users u
WHERE u.email = 'malcolm.jamal@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = u.id 
  AND ur.role = 'CSR'::user_role_type 
  AND ur.is_active = true
);