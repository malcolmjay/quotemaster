/*
  # AI Agent File Uploads

  1. New Storage Bucket
    - Create 'ai-agent-files' bucket for file uploads
    - Configure with appropriate size limits and allowed file types

  2. New Tables
    - `ai_conversation_files`
      - Tracks files uploaded during AI conversations
      - Links to conversations and stores metadata
      - Stores file path, name, size, and mime type

  3. Security
    - Enable RLS on ai_conversation_files table
    - Allow authenticated users to upload and view their own files
    - Storage policies to control file access
*/

-- Create storage bucket for AI agent files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ai-agent-files',
  'ai-agent-files',
  false,
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/json',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create table for tracking uploaded files
CREATE TABLE IF NOT EXISTS ai_conversation_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer NOT NULL,
  mime_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_conversation_files_conversation 
  ON ai_conversation_files(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_files_user 
  ON ai_conversation_files(user_id);

-- Enable RLS
ALTER TABLE ai_conversation_files ENABLE ROW LEVEL SECURITY;

-- Policies for ai_conversation_files
CREATE POLICY "Users can view their own uploaded files"
  ON ai_conversation_files
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload files"
  ON ai_conversation_files
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files"
  ON ai_conversation_files
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Storage policies for the bucket
CREATE POLICY "Users can upload their own files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'ai-agent-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view their own files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'ai-agent-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'ai-agent-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
