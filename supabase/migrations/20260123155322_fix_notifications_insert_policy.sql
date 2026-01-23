/*
  # Fix Notifications Insert Policy

  1. Problem
    - The current INSERT policy uses WITH CHECK (true) but is still failing
    - This might be due to implicit security checks on foreign key references
    - Need to make the policy more explicit

  2. Changes
    - Drop the existing INSERT policy
    - Create a new INSERT policy that explicitly allows authenticated users to create notifications
    - Ensure the policy doesn't restrict based on user_id (since mentions create notifications for other users)

  3. Security
    - Any authenticated user can create notifications (needed for @mentions)
    - The created_by field tracks who triggered the notification
    - Users can only view/update their own notifications (via SELECT/UPDATE policies)
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON notifications;

-- Create a more explicit INSERT policy
CREATE POLICY "Authenticated users can create notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow any authenticated user to create notifications
    -- This is needed for @mentions where the current user creates a notification for another user
    auth.uid() IS NOT NULL
  );
