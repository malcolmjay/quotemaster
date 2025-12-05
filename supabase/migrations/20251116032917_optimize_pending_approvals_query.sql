/*
  # Optimize Pending Approvals Query

  1. Problem
    - Current implementation has N+1 query problem
    - Fetches approvals, then queries user data separately
    - Poor performance with many pending approvals

  2. Solution
    - Create optimized RPC function with proper JOINs
    - Returns all data in single query
    - Pre-filters by user role and approval level

  3. Performance
    - Reduces queries from N+1 to 1
    - Improves response time significantly
*/

-- ============================================================================
-- Create optimized function to get pending approvals with user data
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_pending_approvals_optimized()
RETURNS TABLE (
  id uuid,
  quote_id uuid,
  approval_level text,
  required_approvers integer,
  current_approvers integer,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  quote_data json,
  approval_actions_data json
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
  user_level integer;
  is_admin boolean;
BEGIN
  -- Get current user's highest role
  SELECT ur.role INTO user_role
  FROM user_roles ur
  WHERE ur.user_id = auth.uid()
    AND ur.is_active = true
  ORDER BY 
    CASE ur.role
      WHEN 'Admin' THEN 6
      WHEN 'President' THEN 5
      WHEN 'VP' THEN 4
      WHEN 'Director' THEN 3
      WHEN 'Manager' THEN 2
      WHEN 'CSR' THEN 1
      ELSE 0
    END DESC
  LIMIT 1;

  -- If no role found, return empty
  IF user_role IS NULL THEN
    RETURN;
  END IF;

  -- Check if user is Admin
  is_admin := user_role = 'Admin';

  -- Get user's role level
  user_level := CASE user_role
    WHEN 'Admin' THEN 6
    WHEN 'President' THEN 5
    WHEN 'VP' THEN 4
    WHEN 'Director' THEN 3
    WHEN 'Manager' THEN 2
    WHEN 'CSR' THEN 1
    ELSE 0
  END;

  -- Return pending approvals with all related data
  RETURN QUERY
  SELECT 
    qa.id,
    qa.quote_id,
    qa.approval_level::text,
    qa.required_approvers,
    qa.current_approvers,
    qa.status::text,
    qa.created_at,
    qa.updated_at,
    -- Quote data with customer and creator info
    json_build_object(
      'id', q.id,
      'quote_number', q.quote_number,
      'total_value', q.total_value,
      'total_cost', q.total_cost,
      'created_by', q.created_by,
      'created_at', q.created_at,
      'customer', json_build_object(
        'id', c.id,
        'name', c.name,
        'customer_number', c.customer_number
      ),
      'creator_email', creator_ur.email
    ) AS quote_data,
    -- Approval actions with approver info
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', aa.id,
            'approver_id', aa.approver_id,
            'approver_role', aa.approver_role,
            'action', aa.action,
            'comments', aa.comments,
            'created_at', aa.created_at,
            'approver_email', approver_ur.email
          )
          ORDER BY aa.created_at DESC
        )
        FROM approval_actions aa
        LEFT JOIN user_roles approver_ur ON aa.approver_id = approver_ur.user_id AND approver_ur.is_active = true
        WHERE aa.quote_approval_id = qa.id
      ),
      '[]'::json
    ) AS approval_actions_data
  FROM quote_approvals qa
  INNER JOIN quotes q ON qa.quote_id = q.id
  LEFT JOIN customers c ON q.customer_id = c.id
  LEFT JOIN user_roles creator_ur ON q.created_by = creator_ur.user_id AND creator_ur.is_active = true
  WHERE qa.status = 'pending'
    AND (
      is_admin -- Admin can see all
      OR 
      -- User can approve if their level >= required level
      user_level >= CASE qa.approval_level
        WHEN 'President' THEN 5
        WHEN 'VP' THEN 4
        WHEN 'Director' THEN 3
        WHEN 'Manager' THEN 2
        WHEN 'CSR' THEN 1
        ELSE 0
      END
    )
  ORDER BY qa.created_at DESC;
END;
$$;

-- Grant execute to authenticated users
REVOKE ALL ON FUNCTION public.get_pending_approvals_optimized() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_pending_approvals_optimized() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_pending_approvals_optimized() TO authenticated;

COMMENT ON FUNCTION public.get_pending_approvals_optimized() IS 
  'Optimized function to fetch pending approvals with all related data in a single query. Filters by user role and approval level.';
