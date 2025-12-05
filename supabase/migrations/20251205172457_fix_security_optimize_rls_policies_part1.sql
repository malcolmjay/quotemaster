/*
  # Optimize RLS Policies - Part 1

  Wraps auth functions in SELECT to prevent re-evaluation for each row.
  This significantly improves query performance at scale.
  
  ## Tables Affected
  - profiles
  - reservations
  - cost_analysis (via line_item_id join)
  - lost_details (via line_item_id join)
  - quote_approvals
  - approval_actions
*/

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()));

-- reservations
DROP POLICY IF EXISTS "Users can view their reservations" ON reservations;
CREATE POLICY "Users can view their reservations"
  ON reservations FOR SELECT
  TO authenticated
  USING (created_by = (select auth.uid()));

DROP POLICY IF EXISTS "Users can manage their reservations" ON reservations;
CREATE POLICY "Users can manage their reservations"
  ON reservations FOR ALL
  TO authenticated
  USING (created_by = (select auth.uid()));

-- cost_analysis
DROP POLICY IF EXISTS "Users can view cost analysis for their quotes" ON cost_analysis;
DROP POLICY IF EXISTS "Users can manage cost analysis for their quotes" ON cost_analysis;
CREATE POLICY "Users can manage cost analysis for their quotes"
  ON cost_analysis FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quote_line_items qli
      JOIN quotes q ON q.id = qli.quote_id
      WHERE qli.id = cost_analysis.line_item_id
      AND q.created_by = (select auth.uid())
    )
  );

-- lost_details
DROP POLICY IF EXISTS "Users can manage lost details for their quotes" ON lost_details;
CREATE POLICY "Users can manage lost details for their quotes"
  ON lost_details FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quote_line_items qli
      JOIN quotes q ON q.id = qli.quote_id
      WHERE qli.id = lost_details.line_item_id
      AND q.created_by = (select auth.uid())
    )
  );

-- quote_approvals
DROP POLICY IF EXISTS "Users can view approvals for their quotes or if they can approv" ON quote_approvals;
CREATE POLICY "Users can view approvals for their quotes or if they can approve"
  ON quote_approvals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_approvals.quote_id
      AND quotes.created_by = (select auth.uid())
    ) OR
    user_can_approve_level((select auth.uid()), approval_level)
  );

-- approval_actions
DROP POLICY IF EXISTS "Users can view approval actions for relevant quotes" ON approval_actions;
CREATE POLICY "Users can view approval actions for relevant quotes"
  ON approval_actions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quote_approvals qa
      JOIN quotes q ON q.id = qa.quote_id
      WHERE qa.id = approval_actions.quote_approval_id
      AND (q.created_by = (select auth.uid()) OR user_can_approve_level((select auth.uid()), qa.approval_level))
    )
  );

DROP POLICY IF EXISTS "Users can create approval actions if they have authority" ON approval_actions;
CREATE POLICY "Users can create approval actions if they have authority"
  ON approval_actions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_can_approve_level((select auth.uid()),
      (SELECT approval_level FROM quote_approvals WHERE id = quote_approval_id)
    )
  );