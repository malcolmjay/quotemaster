/*
  # Fix user_permissions View to Include Navigation Visibility

  1. Changes
    - Drop and recreate `user_permissions` view
    - Add `show_in_navigation` field to the view
    - Maintains all existing fields (user_id, role, table_name, can_create, can_read, can_update, can_delete)

  2. Purpose
    - Ensures frontend can read the `show_in_navigation` flag from role_permissions
    - Fixes issue where navigation visibility wasn't being enforced for non-admin users
    - Aligns view with the actual role_permissions table structure
*/

-- Drop the existing view
DROP VIEW IF EXISTS user_permissions;

-- Recreate the view with show_in_navigation field
CREATE VIEW user_permissions AS
SELECT 
  ur.user_id,
  ur.role::text AS role,
  rp.table_name,
  rp.can_create,
  rp.can_read,
  rp.can_update,
  rp.can_delete,
  rp.show_in_navigation
FROM user_roles ur
JOIN roles r ON r.name = ur.role::text
JOIN role_permissions rp ON rp.role_id = r.id
WHERE ur.is_active = true 
  AND r.is_active = true;
