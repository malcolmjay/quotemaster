/*
  # Enhance Sales Orders with Oracle EBS Fields
  
  This migration aligns the sales_orders and sales_order_lines tables with Oracle E-Business Suite
  Order Management (oe_order_headers_all and oe_order_lines_all) baseline structure.

  ## 1. Sales Order Header Enhancements (based on oe_order_headers_all)
  
  ### Status and Workflow Fields
    - `booked_flag` - Indicates if order is booked (similar to Oracle EBS)
    - `open_flag` - Indicates if order is open
    - `flow_status_code` - Workflow status tracking
    - `cancelled_flag` - Indicates if order is cancelled
    
  ### Date Fields
    - `pricing_date` - Date used for pricing calculations
    - `shipment_priority_code` - Priority for shipment (e.g., High, Medium, Low)
    - `expiration_date` - Order expiration date
    
  ### Pricing and Financial Fields
    - `transactional_curr_code` - Transaction currency code
    - `conversion_rate` - Currency conversion rate
    - `conversion_rate_date` - Date of currency conversion
    - `conversion_type_code` - Type of currency conversion
    - `price_list_id` - Reference to price list used
    - `invoicing_rule_id` - Invoicing rule reference
    - `accounting_rule_id` - Accounting rule reference
    
  ### Tax Fields
    - `tax_exempt_flag` - Tax exemption indicator
    - `tax_exempt_number` - Tax exemption number
    - `tax_exempt_reason_code` - Reason for tax exemption
    - `tax_point_code` - Tax point code
    
  ### Shipping and Delivery Fields
    - `partial_shipments_allowed` - Allow partial shipments flag
    - `ship_tolerance_above` - Over-shipment tolerance percentage
    - `ship_tolerance_below` - Under-shipment tolerance percentage
    - `shipping_method_code` - Shipping method
    - `freight_carrier_code` - Freight carrier
    - `freight_terms_code` - Freight terms (e.g., Prepaid, Collect)
    - `fob_point_code` - FOB point
    
  ### Organization and Contact Fields
    - `org_id` - Operating unit ID
    - `sold_from_org_id` - Sold from organization
    - `ship_from_org_id` - Ship from organization (warehouse)
    - `deliver_to_org_id` - Deliver to organization
    - `sold_to_contact_id` - Sold to contact
    - `deliver_to_contact_id` - Deliver to contact
    
  ### Source Document Fields
    - `order_source_id` - Order source identifier
    - `source_document_type_id` - Source document type
    - `orig_sys_document_ref` - Original system document reference
    - `source_document_id` - Source document ID
    - `version_number` - Order version (for order changes)
    
  ### Additional Fields
    - `demand_class_code` - Demand class
    - `agreement_id` - Agreement reference
    - `sales_channel` - Sales channel (e.g., Direct, Partner, Web)
    - `return_reason_code` - For return orders

  ## 2. Sales Order Line Enhancements (based on oe_order_lines_all)
  
  ### Status and Workflow Fields
    - `flow_status_code` - Line workflow status
    - `open_flag` - Line is open
    - `booked_flag` - Line is booked
    - `cancelled_flag` - Line is cancelled
    - `fulfilled_flag` - Line is fulfilled
    - `invoice_interface_status_code` - Invoice interface status
    - `visible_demand_flag` - Visible to MRP/Planning
    
  ### Quantity Fields (comprehensive tracking)
    - `ordered_quantity` - Original ordered quantity
    - `cancelled_quantity` - Cancelled quantity
    - `shipped_quantity` - Shipped quantity
    - `fulfilled_quantity` - Fulfilled quantity
    - `invoiced_quantity` - Invoiced quantity
    - `pricing_quantity` - Quantity used for pricing
    - `shipping_quantity` - Shipping quantity
    
  ### Unit of Measure Fields
    - `order_quantity_uom` - Order quantity UOM
    - `pricing_quantity_uom` - Pricing quantity UOM
    - `shipping_quantity_uom` - Shipping quantity UOM
    
  ### Date Fields
    - `schedule_ship_date` - Scheduled ship date
    - `schedule_arrival_date` - Scheduled arrival date
    - `promise_date` - Promised delivery date
    - `actual_shipment_date` - Actual ship date
    - `actual_arrival_date` - Actual delivery date
    - `earliest_acceptable_date` - Earliest acceptable ship date
    - `latest_acceptable_date` - Latest acceptable ship date
    
  ### Pricing and Tax Fields
    - `tax_date` - Tax calculation date
    - `tax_code` - Tax code
    - `tax_rate` - Tax rate
    - `tax_value` - Tax amount
    - `list_price` - List price
    - `calculate_price_flag` - Auto-calculate price flag
    
  ### Shipping Tolerance
    - `ship_tolerance_above` - Line-level over-shipment tolerance
    - `ship_tolerance_below` - Line-level under-shipment tolerance
    
  ### Customer and Project Fields
    - `cust_production_seq_num` - Customer production sequence
    - `customer_dock_code` - Customer dock code
    - `customer_job` - Customer job number
    - `customer_production_line` - Customer production line
    - `cust_model_serial_number` - Customer model/serial number
    - `project_id` - Project reference
    - `task_id` - Task reference
    
  ### Item and Inventory Fields
    - `inventory_item_id` - Inventory item ID
    - `ordered_item` - Item number as ordered
    - `item_type_code` - Item type (Standard, Model, Option, etc.)
    - `ship_model_complete_flag` - Ship complete model flag
    - `top_model_line_id` - Top model line reference
    - `link_to_line_id` - Link to parent line
    - `component_code` - Component code for kits/configs
    - `config_header_id` - Configuration header
    - `config_rev_nbr` - Configuration revision number
    
  ### Shipping and Delivery
    - `deliver_to_org_id` - Deliver to organization
    - `intmed_ship_to_org_id` - Intermediate ship-to
    - `intmed_ship_to_contact_id` - Intermediate ship-to contact
    - `delivery_lead_time` - Delivery lead time
    - `shipping_interfaced_flag` - Shipped to shipping system
    - `ship_set_id` - Ship set identifier
    - `arrival_set_id` - Arrival set identifier
    - `ship_from_org_id` - Ship from organization
    
  ### Additional Tracking
    - `subinventory` - Subinventory location
    - `lot_number` - Lot number
    - `serial_number` - Serial number
    - `return_reason_code` - Return reason for RMA lines
    - `return_context` - Return context
    - `line_category_code` - Line category (Order, Return)
    - `reference_line_id` - Reference to original line for returns
    - `reference_header_id` - Reference to original order for returns
    - `reference_type` - Type of reference
    
  ### Demand and Planning
    - `demand_bucket_type_code` - Demand bucket type
    - `demand_class_code` - Demand class
    - `planning_priority` - Planning priority
    
  ### Holds and Credits
    - `credit_invoice_line_id` - Credit invoice reference
    - `authorized_to_ship_flag` - Authorization to ship
    
  ## 3. Indexes
    - Performance indexes on key Oracle EBS-aligned fields
    - Status and date fields for reporting
    
  ## 4. Notes
    - These fields align with Oracle E-Business Suite R12 Order Management
    - Maintains backward compatibility with existing fields
    - All new fields are nullable to support gradual adoption
    - Flow status codes track order/line progression through workflow
*/

-- =====================================================
-- SALES_ORDERS TABLE ENHANCEMENTS
-- =====================================================

-- Status and Workflow Fields
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS booked_flag boolean DEFAULT false;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS open_flag boolean DEFAULT true;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS flow_status_code text;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS cancelled_flag boolean DEFAULT false;

-- Date Fields
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS pricing_date date;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS shipment_priority_code text;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS expiration_date date;

-- Pricing and Financial Fields
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS transactional_curr_code text DEFAULT 'USD';
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS conversion_rate numeric(15,7);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS conversion_rate_date date;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS conversion_type_code text;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS price_list_id uuid;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS invoicing_rule_id uuid;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS accounting_rule_id uuid;

-- Tax Fields
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS tax_exempt_flag boolean DEFAULT false;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS tax_exempt_number text;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS tax_exempt_reason_code text;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS tax_point_code text;

-- Shipping and Delivery Fields
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS partial_shipments_allowed boolean DEFAULT true;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS ship_tolerance_above numeric(5,2) DEFAULT 0;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS ship_tolerance_below numeric(5,2) DEFAULT 0;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS shipping_method_code text;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS freight_carrier_code text;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS freight_terms_code text;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS fob_point_code text;

-- Organization and Contact Fields
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS org_id uuid;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS sold_from_org_id uuid;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS ship_from_org_id uuid;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS deliver_to_org_id uuid;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS sold_to_contact_id uuid;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS deliver_to_contact_id uuid;

-- Source Document Fields
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS order_source_id text;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS source_document_type_id text;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS orig_sys_document_ref text;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS source_document_id text;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS version_number integer DEFAULT 1;

-- Additional Fields
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS demand_class_code text;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS agreement_id uuid;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS sales_channel text;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS return_reason_code text;

-- =====================================================
-- SALES_ORDER_LINES TABLE ENHANCEMENTS
-- =====================================================

-- Status and Workflow Fields
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS flow_status_code text;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS open_flag boolean DEFAULT true;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS booked_flag boolean DEFAULT false;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS cancelled_flag boolean DEFAULT false;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS fulfilled_flag boolean DEFAULT false;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS invoice_interface_status_code text;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS visible_demand_flag boolean DEFAULT true;

-- Quantity Fields
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS ordered_quantity numeric;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS cancelled_quantity numeric DEFAULT 0;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS shipped_quantity numeric DEFAULT 0;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS fulfilled_quantity numeric DEFAULT 0;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS invoiced_quantity numeric DEFAULT 0;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS pricing_quantity numeric;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS shipping_quantity numeric;

-- Unit of Measure Fields
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS order_quantity_uom text DEFAULT 'EA';
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS pricing_quantity_uom text;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS shipping_quantity_uom text;

-- Date Fields
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS schedule_ship_date date;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS schedule_arrival_date date;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS promise_date date;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS actual_shipment_date date;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS actual_arrival_date date;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS earliest_acceptable_date date;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS latest_acceptable_date date;

-- Pricing and Tax Fields
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS tax_date date;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS tax_code text;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS tax_rate numeric(5,2);
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS tax_value numeric(12,2);
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS list_price numeric(10,2);
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS calculate_price_flag boolean DEFAULT true;

-- Shipping Tolerance
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS ship_tolerance_above numeric(5,2);
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS ship_tolerance_below numeric(5,2);

-- Customer and Project Fields
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS cust_production_seq_num text;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS customer_dock_code text;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS customer_job text;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS customer_production_line text;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS cust_model_serial_number text;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS project_id uuid;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS task_id uuid;

-- Item and Inventory Fields
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS inventory_item_id uuid;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS ordered_item text;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS item_type_code text;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS ship_model_complete_flag boolean DEFAULT false;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS top_model_line_id uuid;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS link_to_line_id uuid;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS component_code text;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS config_header_id uuid;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS config_rev_nbr text;

-- Shipping and Delivery
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS deliver_to_org_id uuid;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS intmed_ship_to_org_id uuid;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS intmed_ship_to_contact_id uuid;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS delivery_lead_time numeric;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS shipping_interfaced_flag boolean DEFAULT false;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS ship_set_id uuid;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS arrival_set_id uuid;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS ship_from_org_id uuid;

-- Additional Tracking
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS subinventory text;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS lot_number text;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS serial_number text;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS return_reason_code text;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS return_context text;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS line_category_code text DEFAULT 'ORDER';
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS reference_line_id uuid;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS reference_header_id uuid;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS reference_type text;

-- Demand and Planning
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS demand_bucket_type_code text;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS demand_class_code text;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS planning_priority integer;

-- Holds and Credits
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS credit_invoice_line_id uuid;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS authorized_to_ship_flag boolean DEFAULT true;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Sales Orders Indexes
CREATE INDEX IF NOT EXISTS idx_sales_orders_flow_status ON sales_orders(flow_status_code);
CREATE INDEX IF NOT EXISTS idx_sales_orders_booked_flag ON sales_orders(booked_flag);
CREATE INDEX IF NOT EXISTS idx_sales_orders_open_flag ON sales_orders(open_flag);
CREATE INDEX IF NOT EXISTS idx_sales_orders_pricing_date ON sales_orders(pricing_date);
CREATE INDEX IF NOT EXISTS idx_sales_orders_version ON sales_orders(order_number, version_number);
CREATE INDEX IF NOT EXISTS idx_sales_orders_source_doc ON sales_orders(orig_sys_document_ref);
CREATE INDEX IF NOT EXISTS idx_sales_orders_sales_channel ON sales_orders(sales_channel);

-- Sales Order Lines Indexes
CREATE INDEX IF NOT EXISTS idx_sales_order_lines_flow_status ON sales_order_lines(flow_status_code);
CREATE INDEX IF NOT EXISTS idx_sales_order_lines_open_flag ON sales_order_lines(open_flag);
CREATE INDEX IF NOT EXISTS idx_sales_order_lines_booked_flag ON sales_order_lines(booked_flag);
CREATE INDEX IF NOT EXISTS idx_sales_order_lines_fulfilled_flag ON sales_order_lines(fulfilled_flag);
CREATE INDEX IF NOT EXISTS idx_sales_order_lines_schedule_ship ON sales_order_lines(schedule_ship_date);
CREATE INDEX IF NOT EXISTS idx_sales_order_lines_item_type ON sales_order_lines(item_type_code);
CREATE INDEX IF NOT EXISTS idx_sales_order_lines_ship_set ON sales_order_lines(ship_set_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_lines_arrival_set ON sales_order_lines(arrival_set_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_lines_reference_line ON sales_order_lines(reference_line_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_lines_line_category ON sales_order_lines(line_category_code);
CREATE INDEX IF NOT EXISTS idx_sales_order_lines_project ON sales_order_lines(project_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_lines_inventory_item ON sales_order_lines(inventory_item_id);

-- Comments for key fields
COMMENT ON COLUMN sales_orders.flow_status_code IS 'Workflow status: ENTERED, BOOKED, PICKED, SHIPPED, CLOSED, CANCELLED';
COMMENT ON COLUMN sales_orders.booked_flag IS 'Indicates if order has been booked (committed)';
COMMENT ON COLUMN sales_orders.open_flag IS 'Indicates if order is still open for changes';
COMMENT ON COLUMN sales_orders.version_number IS 'Version number for order changes/amendments';
COMMENT ON COLUMN sales_orders.orig_sys_document_ref IS 'Original system document reference (e.g., from import)';

COMMENT ON COLUMN sales_order_lines.flow_status_code IS 'Line workflow status: ENTERED, BOOKED, AWAITING_SHIPPING, SHIPPED, CLOSED';
COMMENT ON COLUMN sales_order_lines.ordered_quantity IS 'Original ordered quantity';
COMMENT ON COLUMN sales_order_lines.shipped_quantity IS 'Quantity actually shipped';
COMMENT ON COLUMN sales_order_lines.fulfilled_quantity IS 'Quantity fulfilled';
COMMENT ON COLUMN sales_order_lines.visible_demand_flag IS 'Visible to MRP/Planning systems';
COMMENT ON COLUMN sales_order_lines.ship_set_id IS 'Ship set - lines that must ship together';
COMMENT ON COLUMN sales_order_lines.line_category_code IS 'ORDER for sales order lines, RETURN for RMA lines';
