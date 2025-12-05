export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: string
          company: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: string
          company?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: string
          company?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          customer_number: string
          type: 'federal' | 'state' | 'local' | 'commercial'
          segment: 'government' | 'defense' | 'education' | 'healthcare' | 'commercial'
          contract_number: string | null
          billing_address: Json | null
          shipping_address: Json | null
          primary_contact: Json | null
          payment_terms: string
          currency: string
          tier: 'bronze' | 'silver' | 'gold' | 'platinum'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          customer_number: string
          type: 'federal' | 'state' | 'local' | 'commercial'
          segment: 'government' | 'defense' | 'education' | 'healthcare' | 'commercial'
          contract_number?: string | null
          billing_address?: Json | null
          shipping_address?: Json | null
          primary_contact?: Json | null
          payment_terms?: string
          currency?: string
          tier?: 'bronze' | 'silver' | 'gold' | 'platinum'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          customer_number?: string
          type?: 'federal' | 'state' | 'local' | 'commercial'
          segment?: 'government' | 'defense' | 'education' | 'healthcare' | 'commercial'
          contract_number?: string | null
          billing_address?: Json | null
          shipping_address?: Json | null
          primary_contact?: Json | null
          payment_terms?: string
          currency?: string
          tier?: 'bronze' | 'silver' | 'gold' | 'platinum'
          created_at?: string
          updated_at?: string
        }
      }
      customer_users: {
        Row: {
          id: string
          customer_id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          title: string | null
          is_primary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          title?: string | null
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          title?: string | null
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          sku: string
          name: string
          description: string | null
          category: string
          supplier: string
          supplier_email: string | null
          unit_cost: number
          list_price: number
          lead_time_days: number
          lead_time_text: string | null
          warehouse: string
          status: 'active' | 'inactive' | 'discontinued'
          cost_effective_from: string | null
          cost_effective_to: string | null
          buyer: string | null
          category_set: string | null
          assignment: string | null
          long_description: string | null
          item_type: string | null
          unit_of_measure: string | null
          moq: number | null
          min_quantity: number | null
          max_quantity: number | null
          weight: number | null
          length: number | null
          width: number | null
          height: number | null
          fleet: string | null
          country_of_origin: string | null
          tariff_amount: number | null
          cs_notes: string | null
          average_lead_time: number | null
          rep_code: string | null
          rep_by: string | null
          revision: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sku: string
          name: string
          description?: string | null
          category: string
          supplier: string
          supplier_email?: string | null
          unit_cost?: number
          list_price?: number
          lead_time_days?: number
          lead_time_text?: string | null
          warehouse?: string
          status?: 'active' | 'inactive' | 'discontinued'
          cost_effective_from?: string | null
          cost_effective_to?: string | null
          buyer?: string | null
          category_set?: string | null
          assignment?: string | null
          long_description?: string | null
          item_type?: string | null
          unit_of_measure?: string | null
          moq?: number | null
          min_quantity?: number | null
          max_quantity?: number | null
          weight?: number | null
          length?: number | null
          width?: number | null
          height?: number | null
          fleet?: string | null
          country_of_origin?: string | null
          tariff_amount?: number | null
          cs_notes?: string | null
          average_lead_time?: number | null
          rep_code?: string | null
          rep_by?: string | null
          revision?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sku?: string
          name?: string
          description?: string | null
          category?: string
          supplier?: string
          supplier_email?: string | null
          unit_cost?: number
          list_price?: number
          lead_time_days?: number
          lead_time_text?: string | null
          warehouse?: string
          status?: 'active' | 'inactive' | 'discontinued'
          cost_effective_from?: string | null
          cost_effective_to?: string | null
          buyer?: string | null
          category_set?: string | null
          assignment?: string | null
          long_description?: string | null
          item_type?: string | null
          unit_of_measure?: string | null
          moq?: number | null
          min_quantity?: number | null
          max_quantity?: number | null
          weight?: number | null
          length?: number | null
          width?: number | null
          height?: number | null
          fleet?: string | null
          country_of_origin?: string | null
          tariff_amount?: number | null
          cs_notes?: string | null
          average_lead_time?: number | null
          rep_code?: string | null
          rep_by?: string | null
          revision?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      inventory_levels: {
        Row: {
          id: string
          product_id: string
          warehouse: string
          quantity_on_hand: number
          quantity_reserved: number
          quantity_available: number
          reorder_point: number
          reorder_quantity: number
          last_restock_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          warehouse?: string
          quantity_on_hand?: number
          quantity_reserved?: number
          reorder_point?: number
          reorder_quantity?: number
          last_restock_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          warehouse?: string
          quantity_on_hand?: number
          quantity_reserved?: number
          reorder_point?: number
          reorder_quantity?: number
          last_restock_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      quotes: {
        Row: {
          id: string
          quote_number: string
          customer_id: string
          customer_user_id: string | null
          quote_type: 'Daily Quote' | 'Bid'
          status: 'draft' | 'sent' | 'accepted' | 'won' | 'lost' | 'expired'
          valid_until: string | null
          ship_until: string | null
          customer_bid_number: string | null
          purchase_order_number: string | null
          total_value: number
          total_cost: number
          total_margin: number
          line_item_count: number
          created_by: string | null
          created_at: string
          updated_at: string
          dbe_required: boolean
          bid_bond_required: boolean
          performance_bond_required: boolean
          insurance_required: boolean
          winning_competitor: string | null
          loss_reason: string | null
          loss_notes: string | null
          quote_status: 'draft' | 'pending_approval' | 'approved'
        }
        Insert: {
          id?: string
          quote_number: string
          customer_id: string
          customer_user_id?: string | null
          quote_type?: 'Daily Quote' | 'Bid'
          status?: 'draft' | 'sent' | 'accepted' | 'won' | 'lost' | 'expired'
          valid_until?: string | null
          ship_until?: string | null
          customer_bid_number?: string | null
          purchase_order_number?: string | null
          total_value?: number
          total_cost?: number
          total_margin?: number
          line_item_count?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
          dbe_required?: boolean
          bid_bond_required?: boolean
          performance_bond_required?: boolean
          insurance_required?: boolean
          winning_competitor?: string | null
          loss_reason?: string | null
          loss_notes?: string | null
          quote_status?: 'draft' | 'pending_approval' | 'approved'
        }
        Update: {
          id?: string
          quote_number?: string
          customer_id?: string
          customer_user_id?: string | null
          quote_type?: 'Daily Quote' | 'Bid'
          status?: 'draft' | 'sent' | 'accepted' | 'won' | 'lost' | 'expired'
          valid_until?: string | null
          ship_until?: string | null
          customer_bid_number?: string | null
          purchase_order_number?: string | null
          total_value?: number
          total_cost?: number
          total_margin?: number
          line_item_count?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
          dbe_required?: boolean
          bid_bond_required?: boolean
          performance_bond_required?: boolean
          insurance_required?: boolean
          winning_competitor?: string | null
          loss_reason?: string | null
          loss_notes?: string | null
          quote_status?: 'draft' | 'pending_approval' | 'approved'
        }
      }
      quote_line_items: {
        Row: {
          id: string
          quote_id: string
          product_id: string | null
          sku: string
          product_name: string
          supplier: string
          category: string | null
          quantity: number
          unit_price: number
          unit_cost: number
          subtotal: number
          total_cost: number
          margin_percent: number
          lead_time: string | null
          quoted_lead_time: string | null
          next_available_date: string | null
          status: 'pending' | 'won' | 'lost' | 'price_request' | 'lead_time_request' | 'item_load' | 'no_quote'
          shipping_instructions: string | null
          customer_part_number: string | null
          is_replacement: boolean
          replacement_type: string | null
          replacement_reason: string | null
          original_customer_sku: string | null
          original_customer_name: string | null
          price_request_id: string | null
          cost_effective_from: string | null
          cost_effective_to: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          quote_id: string
          product_id?: string | null
          sku: string
          product_name: string
          supplier: string
          category?: string | null
          quantity?: number
          unit_price?: number
          unit_cost?: number
          lead_time?: string | null
          quoted_lead_time?: string | null
          next_available_date?: string | null
          status?: 'pending' | 'won' | 'lost' | 'price_request' | 'lead_time_request' | 'item_load' | 'no_quote'
          shipping_instructions?: string | null
          customer_part_number?: string | null
          is_replacement?: boolean
          replacement_type?: string | null
          replacement_reason?: string | null
          original_customer_sku?: string | null
          original_customer_name?: string | null
          price_request_id?: string | null
          cost_effective_from?: string | null
          cost_effective_to?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          quote_id?: string
          product_id?: string | null
          sku?: string
          product_name?: string
          supplier?: string
          category?: string | null
          quantity?: number
          unit_price?: number
          unit_cost?: number
          lead_time?: string | null
          quoted_lead_time?: string | null
          next_available_date?: string | null
          status?: 'pending' | 'won' | 'lost' | 'price_request' | 'lead_time_request' | 'item_load' | 'no_quote'
          shipping_instructions?: string | null
          customer_part_number?: string | null
          is_replacement?: boolean
          replacement_type?: string | null
          replacement_reason?: string | null
          original_customer_sku?: string | null
          original_customer_name?: string | null
          price_request_id?: string | null
          cost_effective_from?: string | null
          cost_effective_to?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      cross_references: {
        Row: {
          id: string
          customer_id: string | null
          product_id: string | null
          customer_part_number: string | null
          supplier_part_number: string | null
          internal_part_number: string
          description: string | null
          last_used_at: string | null
          usage_frequency: number
          supplier: string | null
          type: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id?: string | null
          product_id?: string | null
          customer_part_number?: string | null
          supplier_part_number?: string | null
          internal_part_number: string
          description?: string | null
          last_used_at?: string | null
          usage_frequency?: number
          supplier?: string | null
          type?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string | null
          product_id?: string | null
          customer_part_number?: string | null
          supplier_part_number?: string | null
          internal_part_number?: string
          description?: string | null
          last_used_at?: string | null
          usage_frequency?: number
          supplier?: string | null
          type?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      item_relationships: {
        Row: {
          id: string
          from_item_id: string
          to_item_id: string
          type: string
          reciprocal: boolean
          effective_from: string | null
          effective_to: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          from_item_id: string
          to_item_id: string
          type: string
          reciprocal?: boolean
          effective_from?: string | null
          effective_to?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          from_item_id?: string
          to_item_id?: string
          type?: string
          reciprocal?: boolean
          effective_from?: string | null
          effective_to?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      price_breaks: {
        Row: {
          id: string
          product_id: string
          min_quantity: number
          max_quantity: number
          unit_cost: number
          description: string | null
          discount_percent: number
          effective_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          min_quantity: number
          max_quantity: number
          unit_cost: number
          description?: string | null
          discount_percent?: number
          effective_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          min_quantity?: number
          max_quantity?: number
          unit_cost?: number
          description?: string | null
          discount_percent?: number
          effective_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      reservations: {
        Row: {
          id: string
          quote_id: string
          line_item_id: string
          product_id: string | null
          quantity_reserved: number
          reserved_at: string
          expires_at: string
          status: 'active' | 'expired' | 'released' | 'converted'
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          quote_id: string
          line_item_id: string
          product_id?: string | null
          quantity_reserved: number
          reserved_at?: string
          expires_at: string
          status?: 'active' | 'expired' | 'released' | 'converted'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          quote_id?: string
          line_item_id?: string
          product_id?: string | null
          quantity_reserved?: number
          reserved_at?: string
          expires_at?: string
          status?: 'active' | 'expired' | 'released' | 'converted'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      cost_analysis: {
        Row: {
          id: string
          line_item_id: string
          base_cost: number
          labor_cost: number
          overhead_rate: number
          overhead_amount: number
          total_cost: number
          target_margin: number
          margin_amount: number | null
          suggested_price: number | null
          final_price: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          line_item_id: string
          base_cost: number
          labor_cost?: number
          overhead_rate?: number
          target_margin?: number
          margin_amount?: number | null
          suggested_price?: number | null
          final_price?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          line_item_id?: string
          base_cost?: number
          labor_cost?: number
          overhead_rate?: number
          target_margin?: number
          margin_amount?: number | null
          suggested_price?: number | null
          final_price?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      lost_details: {
        Row: {
          id: string
          line_item_id: string
          lost_reason: string
          competitor_1: string
          bid_price_1: number
          competitor_2: string | null
          bid_price_2: number | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          line_item_id: string
          lost_reason: string
          competitor_1: string
          bid_price_1: number
          competitor_2?: string | null
          bid_price_2?: number | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          line_item_id?: string
          lost_reason?: string
          competitor_1?: string
          bid_price_1?: number
          competitor_2?: string | null
          bid_price_2?: number | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      price_requests: {
        Row: {
          id: string
          quote_id: string
          quote_line_item_id: string | null
          product_number: string
          description: string
          supplier_name: string | null
          buyer_name: string | null
          customer_name: string
          quote_number: string
          quote_type: string
          item_quantity: number
          supplier_pricing: number | null
          effective_start_date: string | null
          effective_end_date: string | null
          moq: number | null
          price_breaks: Json
          supplier_quote_number: string | null
          supplier_currency: string | null
          supplier_email: string | null
          attachment_url: string | null
          attachment_name: string | null
          attachment_size: number | null
          attachment_type: string | null
          status: string
          requested_at: string
          completed_at: string | null
          requested_by: string | null
          completed_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          quote_id: string
          quote_line_item_id?: string | null
          product_number: string
          description: string
          supplier_name?: string | null
          buyer_name?: string | null
          customer_name: string
          quote_number: string
          quote_type: string
          item_quantity: number
          supplier_pricing?: number | null
          effective_start_date?: string | null
          effective_end_date?: string | null
          moq?: number | null
          price_breaks?: Json
          supplier_quote_number?: string | null
          supplier_currency?: string | null
          supplier_email?: string | null
          attachment_url?: string | null
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          status?: string
          requested_at?: string
          completed_at?: string | null
          requested_by?: string | null
          completed_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          quote_id?: string
          quote_line_item_id?: string | null
          product_number?: string
          description?: string
          supplier_name?: string | null
          buyer_name?: string | null
          customer_name?: string
          quote_number?: string
          quote_type?: string
          item_quantity?: number
          supplier_pricing?: number | null
          effective_start_date?: string | null
          effective_end_date?: string | null
          moq?: number | null
          price_breaks?: Json
          supplier_quote_number?: string | null
          supplier_currency?: string | null
          supplier_email?: string | null
          attachment_url?: string | null
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          status?: string
          requested_at?: string
          completed_at?: string | null
          requested_by?: string | null
          completed_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    user_roles: {
      Row: {
        id: string
        user_id: string
        role: 'CSR' | 'Manager' | 'Director' | 'VP' | 'President'
        assigned_by: string | null
        assigned_at: string
        is_active: boolean
        created_at: string
        updated_at: string
      }
      Insert: {
        id?: string
        user_id: string
        role: 'CSR' | 'Manager' | 'Director' | 'VP' | 'President'
        assigned_by?: string | null
        assigned_at?: string
        is_active?: boolean
        created_at?: string
        updated_at?: string
      }
      Update: {
        id?: string
        user_id?: string
        role?: 'CSR' | 'Manager' | 'Director' | 'VP' | 'President'
        assigned_by?: string | null
        assigned_at?: string
        is_active?: boolean
        created_at?: string
        updated_at?: string
      }
    }
    quote_approvals: {
      Row: {
        id: string
        quote_id: string
        approval_level: 'CSR' | 'Manager' | 'Director' | 'VP' | 'President'
        required_approvers: number
        current_approvers: number
        status: 'pending' | 'approved' | 'rejected' | 'withdrawn'
        created_at: string
        updated_at: string
      }
      Insert: {
        id?: string
        quote_id: string
        approval_level: 'CSR' | 'Manager' | 'Director' | 'VP' | 'President'
        required_approvers?: number
        current_approvers?: number
        status?: 'pending' | 'approved' | 'rejected' | 'withdrawn'
        created_at?: string
        updated_at?: string
      }
      Update: {
        id?: string
        quote_id?: string
        approval_level?: 'CSR' | 'Manager' | 'Director' | 'VP' | 'President'
        required_approvers?: number
        current_approvers?: number
        status?: 'pending' | 'approved' | 'rejected' | 'withdrawn'
        created_at?: string
        updated_at?: string
      }
    }
    approval_actions: {
      Row: {
        id: string
        quote_approval_id: string
        quote_id: string
        approver_id: string
        approver_role: 'CSR' | 'Manager' | 'Director' | 'VP' | 'President'
        action: 'pending' | 'approved' | 'rejected' | 'withdrawn'
        comments: string | null
        approved_at: string
        created_at: string
      }
      Insert: {
        id?: string
        quote_approval_id: string
        quote_id: string
        approver_id: string
        approver_role: 'CSR' | 'Manager' | 'Director' | 'VP' | 'President'
        action: 'pending' | 'approved' | 'rejected' | 'withdrawn'
        comments?: string | null
        approved_at?: string
        created_at?: string
      }
      Update: {
        id?: string
        quote_approval_id?: string
        quote_id?: string
        approver_id?: string
        approver_role?: 'CSR' | 'Manager' | 'Director' | 'VP' | 'President'
        action?: 'pending' | 'approved' | 'rejected' | 'withdrawn'
        comments?: string | null
        approved_at?: string
        created_at?: string
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}