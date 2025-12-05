/*
  # Fix Approval Trigger to Use UPSERT

  1. Problem
    - The trigger tries to INSERT approval records on every quote update
    - Fails with "duplicate key value violates unique constraint unique_quote_approval"
    - This happens because an approval record already exists for the quote

  2. Solution
    - Update trigger to use INSERT ... ON CONFLICT DO UPDATE (UPSERT)
    - This will update existing approval records instead of failing
    
  3. Changes
    - Replace all INSERT statements with UPSERT logic
    - Update approval_level and required_approvers when quote value changes
*/

-- Drop and recreate the trigger function with UPSERT logic
DROP FUNCTION IF EXISTS create_approval_requirements() CASCADE;

CREATE OR REPLACE FUNCTION create_approval_requirements()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create/update approval requirements if the quote has a total value
  IF NEW.total_value IS NOT NULL AND NEW.total_value > 0 THEN
    
    -- Determine approval level and required approvers based on total value
    IF NEW.total_value >= 300000 THEN
      -- Over $300k requires both VP and President (dual approval)
      INSERT INTO quote_approvals (quote_id, approval_level, required_approvers, status)
      VALUES (NEW.id, 'VP', 2, 'pending')
      ON CONFLICT (quote_id) 
      DO UPDATE SET 
        approval_level = 'VP',
        required_approvers = 2,
        status = 'pending',
        updated_at = now();
      
    ELSIF NEW.total_value >= 200000 THEN
      -- $200k-$300k requires VP or President
      INSERT INTO quote_approvals (quote_id, approval_level, required_approvers, status)
      VALUES (NEW.id, 'VP', 1, 'pending')
      ON CONFLICT (quote_id) 
      DO UPDATE SET 
        approval_level = 'VP',
        required_approvers = 1,
        status = 'pending',
        updated_at = now();
      
    ELSIF NEW.total_value >= 50000 THEN
      -- $50k-$200k requires Director or higher
      INSERT INTO quote_approvals (quote_id, approval_level, required_approvers, status)
      VALUES (NEW.id, 'Director', 1, 'pending')
      ON CONFLICT (quote_id) 
      DO UPDATE SET 
        approval_level = 'Director',
        required_approvers = 1,
        status = 'pending',
        updated_at = now();
      
    ELSIF NEW.total_value >= 25000 THEN
      -- $25k-$50k requires Manager or higher
      INSERT INTO quote_approvals (quote_id, approval_level, required_approvers, status)
      VALUES (NEW.id, 'Manager', 1, 'pending')
      ON CONFLICT (quote_id) 
      DO UPDATE SET 
        approval_level = 'Manager',
        required_approvers = 1,
        status = 'pending',
        updated_at = now();
      
    ELSE
      -- Under $25k can be approved by CSR or higher
      INSERT INTO quote_approvals (quote_id, approval_level, required_approvers, status)
      VALUES (NEW.id, 'CSR', 1, 'pending')
      ON CONFLICT (quote_id) 
      DO UPDATE SET 
        approval_level = 'CSR',
        required_approvers = 1,
        status = 'pending',
        updated_at = now();
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER create_quote_approval_requirements
  AFTER INSERT OR UPDATE OF total_value ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION create_approval_requirements();
