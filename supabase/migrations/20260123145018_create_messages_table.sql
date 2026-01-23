/*
  # Create Messages System for Quotes and Line Items

  1. New Tables
    - `messages`
      - `id` (uuid, primary key)
      - `quote_id` (uuid, foreign key to quotes) - optional for quote-level messages
      - `line_item_id` (uuid, foreign key to quote_line_items) - optional for line-item-level messages
      - `message` (text) - the message content
      - `created_by` (uuid, references auth.users) - user who created the message
      - `created_at` (timestamptz) - when the message was created
      - `updated_at` (timestamptz) - when the message was last updated
      - `is_edited` (boolean) - flag to indicate if message was edited
      
  2. Indexes
    - Index on quote_id for fast lookups
    - Index on line_item_id for fast lookups
    - Index on created_at for chronological sorting
    
  3. Security
    - Enable RLS on `messages` table
    - Policy for authenticated users to view messages on quotes they have access to
    - Policy for authenticated users to create messages
    - Policy for users to update/delete their own messages
    
  4. Constraints
    - At least one of quote_id or line_item_id must be provided
    - Message content cannot be empty
*/

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid REFERENCES quotes(id) ON DELETE CASCADE,
  line_item_id uuid REFERENCES quote_line_items(id) ON DELETE CASCADE,
  message text NOT NULL CHECK (length(trim(message)) > 0),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_edited boolean DEFAULT false,
  CONSTRAINT message_has_reference CHECK (
    quote_id IS NOT NULL OR line_item_id IS NOT NULL
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_quote_id ON messages(quote_id);
CREATE INDEX IF NOT EXISTS idx_messages_line_item_id ON messages(line_item_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_created_by ON messages(created_by);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages on quotes they can access
CREATE POLICY "Users can view messages on accessible quotes"
  ON messages FOR SELECT
  TO authenticated
  USING (
    -- Can view if they can access the quote (either through quote_id or line_item's quote)
    EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = messages.quote_id
      OR (messages.line_item_id IS NOT NULL AND q.id IN (
        SELECT quote_id FROM quote_line_items WHERE id = messages.line_item_id
      ))
    )
  );

-- Policy: Authenticated users can create messages
CREATE POLICY "Authenticated users can create messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND (
      -- Can create message on quote they can access
      (quote_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM quotes WHERE id = quote_id
      ))
      OR
      -- Can create message on line item they can access
      (line_item_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM quote_line_items WHERE id = line_item_id
      ))
    )
  );

-- Policy: Users can update their own messages
CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Policy: Users can delete their own messages
CREATE POLICY "Users can delete own messages"
  ON messages FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.is_edited = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS messages_updated_at_trigger ON messages;
CREATE TRIGGER messages_updated_at_trigger
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_messages_updated_at();