/*
  # Add Navigation Visibility Flag to Role Permissions

  1. Changes
    - Add `show_in_navigation` boolean field to `role_permissions` table
    - Default to true for existing records to maintain current behavior
    - When false, the table/section will not appear in navigation menu for that role

  2. Purpose
    - Allow granular control over which sections appear in navigation
    - Users can have read permissions but hide sections from their nav menu
    - Improves UX by showing only relevant sections to each role
*/

-- Add show_in_navigation column to role_permissions
ALTER TABLE role_permissions
ADD COLUMN IF NOT EXISTS show_in_navigation boolean DEFAULT true NOT NULL;

-- Update existing permissions to show in navigation by default
UPDATE role_permissions
SET show_in_navigation = true
WHERE show_in_navigation IS NULL;
