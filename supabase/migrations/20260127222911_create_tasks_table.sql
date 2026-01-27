/*
  # Create Tasks Table for Quote Management

  1. New Table
    - `tasks`
      - `id` (uuid, primary key)
      - `quote_id` (uuid, foreign key to quotes) - associated quote
      - `title` (text) - task title
      - `description` (text, optional) - detailed description
      - `assigned_to` (uuid, foreign key to auth.users, optional) - assigned user
      - `created_by` (uuid, foreign key to auth.users) - task creator
      - `status` (text) - task status (pending, in_progress, completed, cancelled)
      - `priority` (text) - priority level (low, medium, high, urgent)
      - `due_date` (timestamptz, optional) - when task is due
      - `completed_at` (timestamptz, optional) - when task was completed
      - `created_at` (timestamptz) - when task was created
      - `updated_at` (timestamptz) - when task was last updated

  2. Security
    - Enable RLS
    - Authenticated users can view tasks for quotes they have access to
    - Authenticated users can create tasks
    - Task creators and assignees can update tasks
    - Only task creators can delete tasks

  3. Indexes
    - Index on quote_id for fast task lookups by quote
    - Index on assigned_to for fast task lookups by assignee
    - Index on status for filtering
    - Index on due_date for sorting by due date
*/

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view tasks for quotes they can access
CREATE POLICY "Users can view tasks for accessible quotes"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = tasks.quote_id
    )
  );

-- Policies: Authenticated users can create tasks
CREATE POLICY "Authenticated users can create tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Policies: Task creators and assignees can update tasks
CREATE POLICY "Task creators and assignees can update tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by OR 
    auth.uid() = assigned_to
  )
  WITH CHECK (
    auth.uid() = created_by OR 
    auth.uid() = assigned_to
  );

-- Policies: Only task creators can delete tasks
CREATE POLICY "Task creators can delete tasks"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_quote_id ON tasks(quote_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at_trigger
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_tasks_updated_at();
