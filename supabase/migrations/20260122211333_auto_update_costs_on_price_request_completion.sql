/*
  # Auto-update Costs on Price Request Completion

  1. Purpose
    - Automatically update quote_line_items.unit_cost when a price_request is completed
    - Update cost effective dates on the line item
    - Ensures data consistency even if frontend is bypassed
    
  2. Changes
    - Create trigger function to update costs when price_request status changes to 'completed'
    - Function updates the associated quote_line_item with new supplier_pricing
    - Updates cost_effective_from and cost_effective_to dates
    - Also updates the quote's updated_at timestamp to trigger UI refresh
    
  3. Security
    - Function runs with SECURITY DEFINER for elevated privileges
    - Only updates when status changes to 'completed'
    - Only updates if quote_line_item_id is present
    
  4. Notes
    - This works alongside existing frontend code as a safety net
    - Ensures costs are always updated regardless of how the price request is completed
*/

-- Create function to auto-update costs when price request is completed
CREATE OR REPLACE FUNCTION auto_update_costs_on_price_request_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only proceed if status changed to 'completed' and we have a line item reference
  IF NEW.status = 'completed' 
     AND (OLD.status IS NULL OR OLD.status != 'completed')
     AND NEW.quote_line_item_id IS NOT NULL 
     AND NEW.supplier_pricing IS NOT NULL THEN
    
    -- Update the associated quote line item with the new cost
    UPDATE quote_line_items
    SET 
      unit_cost = NEW.supplier_pricing,
      cost_effective_from = NEW.effective_start_date,
      cost_effective_to = NEW.effective_end_date,
      updated_at = now()
    WHERE id = NEW.quote_line_item_id;
    
    -- Touch the quote to trigger real-time updates in the UI
    IF NEW.quote_id IS NOT NULL THEN
      UPDATE quotes
      SET updated_at = now()
      WHERE id = NEW.quote_id;
    END IF;
    
    -- Optionally update the product's default cost if product exists
    UPDATE products
    SET 
      unit_cost = NEW.supplier_pricing,
      cost_effective_from = NEW.effective_start_date,
      cost_effective_to = NEW.effective_end_date,
      updated_at = now()
    WHERE sku = NEW.product_number;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on price_requests table
DROP TRIGGER IF EXISTS trigger_auto_update_costs_on_completion ON price_requests;
CREATE TRIGGER trigger_auto_update_costs_on_completion
  AFTER UPDATE ON price_requests
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_costs_on_price_request_completion();

-- Add helpful comment
COMMENT ON FUNCTION auto_update_costs_on_price_request_completion() IS 
  'Automatically updates quote line item and product costs when a price request is marked as completed. Ensures data consistency.';
