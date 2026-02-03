/*
  # Create execute_readonly_query function for AI Agent

  1. New Functions
    - `execute_readonly_query` - Safely executes SELECT queries for the AI agent
      - Takes a SQL query as text input
      - Only allows SELECT statements
      - Returns query results as JSON
      - Runs with the security context of the calling user (respects RLS)

  2. Security
    - Function validates that only SELECT queries are executed
    - Uses SECURITY INVOKER to respect RLS policies
    - Returns empty result set on validation failure
*/

-- Create function to execute read-only queries safely
CREATE OR REPLACE FUNCTION public.execute_readonly_query(query_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  result jsonb;
  normalized_query text;
BEGIN
  -- Normalize the query (trim and convert to uppercase for checking)
  normalized_query := upper(trim(query_text));
  
  -- Check if the query is a SELECT statement
  IF NOT normalized_query LIKE 'SELECT%' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;
  
  -- Check for dangerous keywords that shouldn't be in a SELECT
  IF normalized_query ~* '(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)' THEN
    RAISE EXCEPTION 'Query contains forbidden operations';
  END IF;
  
  -- Execute the query and return results as JSON
  EXECUTE format('SELECT jsonb_agg(row_to_json(t)) FROM (%s) t', query_text) INTO result;
  
  -- Return empty array if no results
  RETURN COALESCE(result, '[]'::jsonb);
EXCEPTION
  WHEN OTHERS THEN
    -- Return error information
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.execute_readonly_query(text) TO authenticated;