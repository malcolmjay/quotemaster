/*
  # Add Remaining Foreign Key Indexes

  Adds indexes for foreign key columns and columns used in joins to improve query performance.
  
  ## Tables Affected
  - cross_references (internal_part_number)
  - item_relationships (from_item_id, to_item_id)
  - price_requests (quote_id, requested_by)
  - quote_line_items (price_request_id, ship_to_address_id)
*/

-- cross_references: internal_part_number references products.sku
CREATE INDEX IF NOT EXISTS idx_cross_references_internal_part_number
  ON cross_references(internal_part_number);

-- item_relationships: from_item_id and to_item_id
CREATE INDEX IF NOT EXISTS idx_item_relationships_from_item_id
  ON item_relationships(from_item_id);

CREATE INDEX IF NOT EXISTS idx_item_relationships_to_item_id
  ON item_relationships(to_item_id);

-- price_requests: quote_id and requested_by
CREATE INDEX IF NOT EXISTS idx_price_requests_quote_id
  ON price_requests(quote_id);

CREATE INDEX IF NOT EXISTS idx_price_requests_requested_by
  ON price_requests(requested_by);

-- quote_line_items: price_request_id and ship_to_address_id
CREATE INDEX IF NOT EXISTS idx_quote_line_items_price_request_id
  ON quote_line_items(price_request_id);

CREATE INDEX IF NOT EXISTS idx_quote_line_items_ship_to_address_id
  ON quote_line_items(ship_to_address_id);