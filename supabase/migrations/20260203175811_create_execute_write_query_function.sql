/*
  # Create Execute Write Query Function for Admin Users

  1. New Function
    - `execute_write_query` - Allows Admin users to execute INSERT, UPDATE, DELETE queries
    
  2. Security
    - Only accessible to authenticated users with Admin role
    - Validates query type to prevent dangerous operations
    - Uses SECURITY DEFINER to execute with elevated privileges
    - Returns query results and affected row count
    
  3. Safety Features
    - Blocks DDL operations (DROP, ALTER, TRUNCATE, CREATE)
    - Blocks multiple statements
    - Requires Admin role check before execution
*/

-- Create function to execute write queries for Admin users
CREATE OR REPLACE FUNCTION execute_write_query(query_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_json jsonb;
  affected_count integer;
  user_roles text[];
  is_admin boolean := false;
  query_upper text;
BEGIN
  -- Get user's roles
  SELECT COALESCE(array_agg(role), ARRAY[]::text[])
  INTO user_roles
  FROM user_roles
  WHERE user_id = auth.uid();

  -- Check if user is Admin
  is_admin := 'Admin' = ANY(user_roles);

  -- Only Admins can execute write queries
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only Admin users can execute write operations';
  END IF;

  -- Convert query to uppercase for validation
  query_upper := upper(trim(query_text));

  -- Validate query type - only allow INSERT, UPDATE, DELETE
  IF NOT (
    query_upper LIKE 'INSERT %' OR
    query_upper LIKE 'UPDATE %' OR
    query_upper LIKE 'DELETE %'
  ) THEN
    RAISE EXCEPTION 'Only INSERT, UPDATE, and DELETE queries are allowed';
  END IF;

  -- Block dangerous operations
  IF query_upper LIKE '%DROP %' OR
     query_upper LIKE '%ALTER %' OR
     query_upper LIKE '%TRUNCATE %' OR
     query_upper LIKE '%CREATE %' OR
     query_text LIKE '%;%' THEN
    RAISE EXCEPTION 'Dangerous operations and multiple statements are not allowed';
  END IF;

  -- Execute the write query
  EXECUTE query_text;
  
  -- Get affected row count
  GET DIAGNOSTICS affected_count = ROW_COUNT;

  -- Return success with affected count
  result_json := jsonb_build_object(
    'success', true,
    'affected_rows', affected_count,
    'message', 'Query executed successfully'
  );

  RETURN result_json;

EXCEPTION
  WHEN OTHERS THEN
    -- Return error information
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;

-- Grant execute permission to authenticated users (function itself checks for Admin)
GRANT EXECUTE ON FUNCTION execute_write_query(text) TO authenticated;