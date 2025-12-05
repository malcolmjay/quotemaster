/*
  # Fix ambiguous column reference in approval trigger

  This migration fixes the ambiguous column reference error in the create_approval_requirements trigger function.
  The issue occurs when the trigger tries to reference 'required_approvers' without specifying the table name.
*/

-- Drop and recreate the trigger function with proper table qualifications
DROP FUNCTION IF EXISTS create_approval_requirements() CASCADE;

CREATE OR REPLACE FUNCTION create_approval_requirements()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create approval requirements if the quote has a total value
  IF NEW.total_value IS NOT NULL AND NEW.total_value > 0 THEN
    
    -- Determine approval level and required approvers based on total value
    IF NEW.total_value >= 300000 THEN
      -- Over $300k requires both VP and President (dual approval)
      INSERT INTO quote_approvals (quote_id, approval_level, required_approvers)
      VALUES (NEW.id, 'VP', 2);
      
    ELSIF NEW.total_value >= 200000 THEN
      -- $200k-$300k requires VP or President
      INSERT INTO quote_approvals (quote_id, approval_level, required_approvers)
      VALUES (NEW.id, 'VP', 1);
      
    ELSIF NEW.total_value >= 50000 THEN
      -- $50k-$200k requires Director or higher
      INSERT INTO quote_approvals (quote_id, approval_level, required_approvers)
      VALUES (NEW.id, 'Director', 1);
      
    ELSIF NEW.total_value >= 25000 THEN
      -- $25k-$50k requires Manager or higher
      INSERT INTO quote_approvals (quote_id, approval_level, required_approvers)
      VALUES (NEW.id, 'Manager', 1);
      
    ELSE
      -- Under $25k can be approved by CSR or higher
      INSERT INTO quote_approvals (quote_id, approval_level, required_approvers)
      VALUES (NEW.id, 'CSR', 1);
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