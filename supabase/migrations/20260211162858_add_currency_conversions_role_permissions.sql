/*
  # Add role permissions for currency_conversions table

  1. Changes
    - Adds role_permissions entries for the `currency_conversions` table for all existing roles
    - Admin gets full CRUD access
    - All other roles get read and update access with navigation visibility

  2. Notes
    - Ensures the Currency Conversions page appears in navigation for all roles
*/

INSERT INTO role_permissions (role_id, table_name, can_create, can_read, can_update, can_delete, show_in_navigation)
SELECT id, 'currency_conversions', true, true, true, true, true
FROM roles WHERE name = 'Admin'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, table_name, can_create, can_read, can_update, can_delete, show_in_navigation)
SELECT id, 'currency_conversions', true, true, true, false, true
FROM roles WHERE name IN ('Manager', 'Director', 'VP', 'President')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, table_name, can_create, can_read, can_update, can_delete, show_in_navigation)
SELECT id, 'currency_conversions', false, true, true, false, true
FROM roles WHERE name = 'CSR'
ON CONFLICT DO NOTHING;