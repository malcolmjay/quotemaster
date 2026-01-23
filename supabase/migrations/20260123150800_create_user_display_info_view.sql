/*
  # Create User Display Info View
  
  1. New View
    - `user_display_info` - Public view for user display names
      - Shows only non-sensitive user information (id, email, display_name)
      - Accessible by all authenticated users
      - Used for displaying user names in messages and other UI elements
  
  2. Security
    - View is accessible to all authenticated users
    - Contains only public-safe information
*/

-- Create a simple view for user display information
CREATE OR REPLACE VIEW user_display_info AS
SELECT
  u.id,
  u.email,
  COALESCE(um.display_name, split_part(u.email::text, '@', 1)) as display_name
FROM auth.users u
LEFT JOIN user_metadata um ON u.id = um.user_id;

-- Grant access to all authenticated users
GRANT SELECT ON user_display_info TO authenticated;