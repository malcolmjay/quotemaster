/*
  # Fix execute_readonly_query word boundary validation

  1. Changes
    - Update the forbidden keyword check to use word boundaries
    - This prevents false positives like "created_at" matching "CREATE"
    - Ensures only standalone SQL commands are blocked, not column names

  2. Security
    - Maintains security by blocking dangerous SQL commands
    - Allows legitimate column names that contain similar strings
*/

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
  
  -- Check for dangerous keywords using word boundaries
  -- \m and \M are word boundary markers in PostgreSQL regex
  IF normalized_query ~* '\m(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)\M' THEN
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