import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import { logger } from '../utils/logger'
import type {
  Quote,
  CreateQuoteInput,
  UpdateQuoteInput,
  LineItem,
  CreateLineItemInput,
  UpdateLineItemInput,
  CreateLostDetailsInput
} from '../types'
import { sanitizeSearchTerm } from '../utils/validation'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Auth helpers
export const signUp = async (email: string, password: string, fullName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      }
    }
  })
  
  if (error) throw error
  return data
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) throw error
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// Database helpers
export const getCustomers = async () => {
  const { data, error } = await supabase
    .from('customers')
    .select(`
      *,
      contacts:customer_contacts (*),
      addresses:customer_addresses (*)
    `)
    .order('name')

  if (error) throw error
  return data
}

export const getProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      inventory_levels (*),
      price_breaks (*)
    `)
    .eq('status', 'active')
    .order('name')

  if (error) throw error
  return data
}

export const getAllProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      inventory_levels (*),
      price_breaks (*)
    `)
    .order('name')

  if (error) throw error
  return data
}

export const getQuotes = async () => {
  const { data, error } = await supabase
    .from('quotes')
    .select(`
      *,
      customers!quotes_customer_id_fkey (*),
      quote_line_items (
        *,
        products!quote_line_items_product_id_fkey (*)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const createQuote = async (quote: CreateQuoteInput): Promise<Quote> => {
  logger.debug('Creating quote', { quote_number: quote.quote_number });

  const { data, error } = await supabase
    .from('quotes')
    .insert({
      quote_number: quote.quote_number,
      customer_id: quote.customer_id,
      customer_user_id: quote.customer_user_id || null,
      quote_type: quote.quote_type || 'Daily Quote',
      status: quote.status || 'draft',
      valid_until: quote.valid_until || null,
      ship_until: quote.ship_until || null,
      customer_bid_number: quote.customer_bid_number || null,
      purchase_order_number: quote.purchase_order_number || null,
      total_value: quote.total_value || 0,
      total_cost: quote.total_cost || 0,
      total_margin: quote.total_margin || 0,
      line_item_count: quote.line_item_count || 0,
      created_by: quote.created_by,
      dbe_required: quote.dbe_required || false,
      bid_bond_required: quote.bid_bond_required || false,
      performance_bond_required: quote.performance_bond_required || false,
      insurance_required: quote.insurance_required || false,
      quote_status: quote.quote_status || 'draft',
      winning_competitor: quote.winning_competitor || null,
      loss_reason: quote.loss_reason || null,
      loss_notes: quote.loss_notes || null
    })
    .select()
    .single()

  if (error) {
    logger.error('Failed to create quote', error);
    throw new Error('Failed to create quote. Please try again.');
  }

  logger.info('Quote created successfully', { id: data.id });
  return data as Quote;
}

export const updateQuote = async (id: string, updates: UpdateQuoteInput): Promise<Quote> => {
  logger.debug('Updating quote', { id });

  const { data, error } = await supabase
    .from('quotes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('Failed to update quote', error, { id });
    throw new Error('Failed to update quote. Please try again.');
  }

  return data as Quote;
}

export const createLineItem = async (lineItem: CreateLineItemInput): Promise<LineItem> => {
  logger.debug('Creating line item', { sku: lineItem.sku, quote_id: lineItem.quote_id });

  // Validate required fields
  if (!lineItem.quote_id) {
    throw new Error('Quote ID is required');
  }
  if (!lineItem.sku) {
    throw new Error('SKU is required');
  }
  if (!lineItem.product_name) {
    throw new Error('Product name is required');
  }
  if (!lineItem.supplier) {
    throw new Error('Supplier is required');
  }

  // Ensure numeric fields are properly formatted
  const formattedLineItem = {
    ...lineItem,
    quantity: Number(lineItem.quantity) || 1,
    unit_price: Number(lineItem.unit_price) || 0,
    unit_cost: Number(lineItem.unit_cost) || 0,
    subtotal: lineItem.subtotal || Number(lineItem.quantity) * Number(lineItem.unit_price),
  };

  const { data, error } = await supabase
    .from('quote_line_items')
    .insert(formattedLineItem)
    .select()
    .single()

  if (error) {
    logger.error('Failed to create line item', error, { sku: lineItem.sku });
    throw new Error('Failed to create line item. Please check your input and try again.');
  }

  logger.info('Line item created successfully', { id: data.id });
  return data as LineItem;
}

export const updateLineItem = async (id: string, updates: UpdateLineItemInput): Promise<LineItem> => {
  logger.debug('Updating line item', { id });

  const { data, error } = await supabase
    .from('quote_line_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('Failed to update line item', error, { id });
    throw new Error('Failed to update line item. Please try again.');
  }

  return data as LineItem;
}

export const deleteLineItem = async (id: string) => {
  logger.debug('Deleting line item', { id });

  const { data, error } = await supabase
    .from('quote_line_items')
    .delete()
    .eq('id', id)
    .select()

  if (error) {
    logger.error('Failed to delete line item', error, { id });
    throw new Error('Failed to delete line item. Please try again.');
  }

  logger.info('Line item deleted successfully', { id });
  return data;
}

export const deleteQuote = async (id: string) => {
  logger.debug('Deleting quote', { id });

  const { data, error } = await supabase
    .from('quotes')
    .delete()
    .eq('id', id)
    .select()

  if (error) {
    logger.error('Failed to delete quote', error, { id });
    throw new Error('Failed to delete quote. Please try again.');
  }

  logger.info('Quote deleted successfully', { id });
  return data;
}

export const createLostDetails = async (lostDetails: CreateLostDetailsInput) => {
  logger.debug('Creating lost details', { lineItemId: lostDetails.lineItemId });

  const { data, error } = await supabase
    .from('lost_details')
    .insert({
      line_item_id: lostDetails.lineItemId,
      lost_reason: lostDetails.lostReason,
      competitor_1: lostDetails.competitor1,
      bid_price_1: lostDetails.bidPrice1,
      competitor_2: lostDetails.competitor2 || null,
      bid_price_2: lostDetails.bidPrice2 || null,
      created_by: lostDetails.createdBy
    })
    .select()
    .single()

  if (error) {
    logger.error('Failed to create lost details', error);
    throw new Error('Failed to save lost details. Please try again.');
  }

  logger.info('Lost details created successfully', { id: data.id });
  return data;
}

export const getLostDetails = async (lineItemId: string) => {
  const { data, error } = await supabase
    .from('lost_details')
    .select('*')
    .eq('line_item_id', lineItemId)
    .maybeSingle()
  
  if (error) throw error
  return data
}

export const updateLostDetails = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('lost_details')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Create lost_details table if it doesn't exist
export const createLostDetailsTable = async () => {
  // This function is no longer needed as we've created proper migration files
  // The lost_details table should be created by running the migration files in Supabase
  console.log('ℹ️ Please run the migration files in your Supabase SQL Editor:')
  console.log('1. supabase/migrations/add_missing_quote_fields.sql')
  console.log('2. supabase/migrations/create_lost_details_table.sql')
}
export const getCrossReferences = async () => {
  const { data, error } = await supabase
    .from('cross_references')
    .select(`
      *,
      customers (*),
      products (*)
    `)
    .order('last_used_at', { ascending: false })
  
  if (error) throw error
  return data
}

export const searchProducts = async (searchTerm: string) => {
  // Sanitize search term to prevent injection
  const sanitized = sanitizeSearchTerm(searchTerm);

  logger.debug('Searching products', { searchTerm: sanitized });

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      inventory_levels (*),
      cross_references (*)
    `)
    .or(`sku.ilike.%${sanitized}%,name.ilike.%${sanitized}%`)
    .eq('status', 'active')
    .limit(10)

  if (error) {
    logger.error('Product search failed', error);
    throw new Error('Product search failed. Please try again.');
  }

  logger.debug('Product search completed', { results: data?.length || 0 });
  return data;
}

// Real-time subscriptions
export const subscribeToQuotes = (callback: (payload: any) => void) => {
  return supabase
    .channel('quotes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'quotes' }, 
      callback
    )
    .subscribe()
}

export const subscribeToLineItems = (quoteId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`line_items_${quoteId}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'quote_line_items',
        filter: `quote_id=eq.${quoteId}`
      }, 
      callback
    )
    .subscribe()
}

// Approval system functions
export const getUserRole = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('role', { ascending: false }) // Get highest role first
    .limit(1)
    .maybeSingle()
  
  if (error) throw error
  return data?.role || null
}

export const getQuoteApprovalStatus = async (quoteId: string) => {
  const { data, error } = await supabase
    .from('quote_approvals')
    .select(`
      *,
      approval_actions (
        *,
        profiles!approval_actions_approver_id_fkey (full_name, email)
      )
    `)
    .eq('quote_id', quoteId)
    .maybeSingle()
  
  if (error) throw error
  return data
}

export const submitQuoteForApproval = async (quoteId: string, comments?: string) => {
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  // Get the quote to check its value
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select('total_value')
    .eq('id', quoteId)
    .single()

  if (quoteError) throw quoteError

  // Check user roles
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('is_active', true)

  // Check if user is Admin - Admins can auto-approve any quote
  const isAdmin = userRoles?.some(r => r.role === 'Admin')

  if (isAdmin) {
    const { data: updatedQuote, error: updateError } = await supabase
      .from('quotes')
      .update({
        quote_status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', quoteId)
      .select()
      .single()

    if (updateError) throw updateError

    return { quote: updatedQuote, approval: null, autoApproved: true }
  }

  // Get approval limits from database
  const { data: approvalLimits, error: limitsError } = await supabase
    .from('role_approval_limits')
    .select('role, min_amount, max_amount')
    .order('min_amount', { ascending: true })

  if (limitsError) throw limitsError

  // Check if user has any role that can approve this quote value
  if (approvalLimits && approvalLimits.length > 0 && userRoles) {
    for (const userRole of userRoles) {
      const limit = approvalLimits.find(l => l.role === userRole.role)
      if (limit && quote.total_value >= limit.min_amount && quote.total_value <= limit.max_amount) {
        // User has authority to approve this quote - auto-approve it
        const { data: updatedQuote, error: updateError } = await supabase
          .from('quotes')
          .update({
            quote_status: 'approved',
            updated_at: new Date().toISOString()
          })
          .eq('id', quoteId)
          .select()
          .single()

        if (updateError) throw updateError

        return { quote: updatedQuote, approval: null, autoApproved: true }
      }
    }
  }

  // User doesn't have authority to auto-approve - check if approval record already exists
  const { data: existingApproval, error: existingError } = await supabase
    .from('quote_approvals')
    .select('*')
    .eq('quote_id', quoteId)
    .maybeSingle()

  if (existingError) throw existingError

  // If approval record exists, just update quote status and return existing record
  if (existingApproval) {
    const { data: updatedQuote, error: updateError } = await supabase
      .from('quotes')
      .update({
        quote_status: 'pending_approval',
        updated_at: new Date().toISOString()
      })
      .eq('id', quoteId)
      .select()
      .single()

    if (updateError) throw updateError

    return { quote: updatedQuote, approval: existingApproval }
  }

  // Determine approval level and required approvers based on quote value
  let approvalLevel: 'CSR' | 'Manager' | 'Director' | 'VP' | 'President' | 'Admin' = 'CSR'
  let requiredApprovers = 1

  if (approvalLimits && approvalLimits.length > 0) {
    for (const limit of approvalLimits) {
      if (quote.total_value >= limit.min_amount && quote.total_value <= limit.max_amount) {
        approvalLevel = limit.role as any
        requiredApprovers = limit.role === 'President' && quote.total_value > 500000 ? 2 : 1
        break
      }
    }
  } else {
    // Fallback to default logic if no limits configured
    if (quote.total_value < 25000) {
      approvalLevel = 'CSR'
      requiredApprovers = 1
    } else if (quote.total_value >= 25000 && quote.total_value < 50000) {
      approvalLevel = 'Manager'
      requiredApprovers = 1
    } else if (quote.total_value >= 50000 && quote.total_value < 200000) {
      approvalLevel = 'Director'
      requiredApprovers = 1
    } else if (quote.total_value >= 200000 && quote.total_value < 300000) {
      approvalLevel = 'VP'
      requiredApprovers = 1
    } else {
      approvalLevel = 'President'
      requiredApprovers = 2
    }
  }

  // Create approval requirement record
  const { data: approvalRecord, error: approvalError } = await supabase
    .from('quote_approvals')
    .insert({
      quote_id: quoteId,
      approval_level: approvalLevel,
      required_approvers: requiredApprovers,
      current_approvers: 0,
      status: 'pending'
    })
    .select()
    .single()

  if (approvalError) throw approvalError

  // Update quote status to pending_approval
  const { data, error } = await supabase
    .from('quotes')
    .update({ 
      quote_status: 'pending_approval',
      updated_at: new Date().toISOString()
    })
    .eq('id', quoteId)
    .select()
    .single()
  
  if (error) throw error
  
  return { quote: data, approval: approvalRecord }
}

export const approveQuote = async (
  quoteId: string, 
  approverRole: string, 
  comments?: string
) => {
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  // Get the quote approval record
  const { data: quoteApproval, error: approvalError } = await supabase
    .from('quote_approvals')
    .select('*')
    .eq('quote_id', quoteId)
    .single()

  if (approvalError) throw approvalError

  // Create approval action
  const { data: approvalAction, error: actionError } = await supabase
    .from('approval_actions')
    .insert({
      quote_approval_id: quoteApproval.id,
      quote_id: quoteId,
      approver_id: user.id,
      approver_role: approverRole as any,
      action: 'approved',
      comments: comments || null
    })
    .select()
    .single()

  if (actionError) throw actionError

  // Update approval count
  const newApproverCount = quoteApproval.current_approvers + 1
  const isFullyApproved = newApproverCount >= quoteApproval.required_approvers

  const { data: updatedApproval, error: updateError } = await supabase
    .from('quote_approvals')
    .update({
      current_approvers: newApproverCount,
      status: isFullyApproved ? 'approved' : 'pending'
    })
    .eq('id', quoteApproval.id)
    .select()
    .single()

  if (updateError) throw updateError

  // If fully approved, update quote status
  if (isFullyApproved) {
    await supabase
      .from('quotes')
      .update({ quote_status: 'approved' })
      .eq('id', quoteId)

    // Trigger quote export asynchronously
    import('../services/quoteExportService').then(({ quoteExportService }) => {
      quoteExportService.exportQuote(quoteId).catch(error => {
        console.error('Failed to export approved quote:', error)
      })
    })
  }

  return { approvalAction, updatedApproval }
}

export const rejectQuote = async (
  quoteId: string, 
  approverRole: string, 
  comments: string
) => {
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  // Get the quote approval record
  const { data: quoteApproval, error: approvalError } = await supabase
    .from('quote_approvals')
    .select('*')
    .eq('quote_id', quoteId)
    .single()

  if (approvalError) throw approvalError

  // Create rejection action
  const { data: approvalAction, error: actionError } = await supabase
    .from('approval_actions')
    .insert({
      quote_approval_id: quoteApproval.id,
      quote_id: quoteId,
      approver_id: user.id,
      approver_role: approverRole as any,
      action: 'rejected',
      comments
    })
    .select()
    .single()

  if (actionError) throw actionError

  // Update approval status to rejected
  const { data: updatedApproval, error: updateError } = await supabase
    .from('quote_approvals')
    .update({ status: 'rejected' })
    .eq('id', quoteApproval.id)
    .select()
    .single()

  if (updateError) throw updateError

  // Update quote status
  await supabase
    .from('quotes')
    .update({ quote_status: 'draft' })
    .eq('id', quoteId)

  return { approvalAction, updatedApproval }
}

export const getPendingApprovals = async () => {
  logger.debug('Fetching pending approvals');

  // Use optimized RPC function to avoid N+1 queries
  const { data, error } = await supabase.rpc('get_pending_approvals_optimized');

  if (error) {
    logger.error('Failed to fetch pending approvals', error);
    throw new Error('Failed to load pending approvals. Please try again.');
  }

  logger.debug('Pending approvals fetched', { count: data?.length || 0 });
  return data || [];
}

// Pagination helpers
export interface PaginationParams {
  page: number;
  pageSize: number;
  searchTerm?: string;
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const getPaginatedQuotes = async (params: PaginationParams): Promise<PaginatedResponse<any>> => {
  const { page, pageSize, searchTerm, filters = {}, sortBy = 'created_at', sortOrder = 'desc' } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('quotes')
    .select(`
      *,
      customers!quotes_customer_id_fkey (*),
      quote_line_items (
        *,
        products!quote_line_items_product_id_fkey (*)
      )
    `, { count: 'exact' });

  // Apply search
  if (searchTerm) {
    const sanitized = sanitizeSearchTerm(searchTerm);
    query = query.or(`quote_number.ilike.%${sanitized}%,customers.name.ilike.%${sanitized}%`);
  }

  // Apply status filter
  if (filters.status && filters.status !== 'all') {
    query = query.eq('quote_status', filters.status);
  }

  // Apply sorting and pagination
  query = query.order(sortBy, { ascending: sortOrder === 'asc' }).range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize)
  };
};

export const getPaginatedProducts = async (params: PaginationParams): Promise<PaginatedResponse<any>> => {
  const { page, pageSize, searchTerm, filters = {}, sortBy = 'created_at', sortOrder = 'desc' } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('products')
    .select('*, inventory_levels (*), price_breaks (*)', { count: 'exact' });

  // Apply search
  if (searchTerm) {
    const sanitized = sanitizeSearchTerm(searchTerm);
    query = query.or(`sku.ilike.%${sanitized}%,name.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
  }

  // Apply filters
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.supplier) query = query.eq('supplier', filters.supplier);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.itemType) query = query.eq('item_type', filters.itemType);
  if (filters.categorySet) query = query.eq('category_set', filters.categorySet);
  if (filters.warehouse) query = query.eq('warehouse', filters.warehouse);

  // Apply sorting and pagination
  query = query.order(sortBy, { ascending: sortOrder === 'asc' }).range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize)
  };
};

export const getPaginatedCustomers = async (params: PaginationParams): Promise<PaginatedResponse<any>> => {
  const { page, pageSize, searchTerm, sortBy = 'created_at', sortOrder = 'desc' } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('customers')
    .select(`
      *,
      addresses:customer_addresses (*),
      contacts:customer_contacts (*)
    `, { count: 'exact' });

  // Apply search
  if (searchTerm) {
    const sanitized = sanitizeSearchTerm(searchTerm);
    query = query.or(`name.ilike.%${sanitized}%,customer_number.ilike.%${sanitized}%,type.ilike.%${sanitized}%`);
  }

  // Apply sorting and pagination
  query = query.order(sortBy, { ascending: sortOrder === 'asc' }).range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize)
  };
};

export const getPaginatedCrossReferences = async (params: PaginationParams): Promise<PaginatedResponse<any>> => {
  const { page, pageSize, searchTerm, filters = {}, sortBy = 'created_at', sortOrder = 'desc' } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('cross_references')
    .select('*', { count: 'exact' });

  // Apply search
  if (searchTerm) {
    const sanitized = sanitizeSearchTerm(searchTerm);
    query = query.or(`internal_part_number.ilike.%${sanitized}%,customer_part_number.ilike.%${sanitized}%,supplier_part_number.ilike.%${sanitized}%`);
  }

  // Apply filters
  if (filters.customer) query = query.eq('customer_id', filters.customer);
  if (filters.supplier) query = query.eq('supplier_name', filters.supplier);
  if (filters.type) query = query.eq('reference_type', filters.type);

  // Apply sorting and pagination
  query = query.order(sortBy, { ascending: sortOrder === 'asc' }).range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize)
  };
};

export const getPaginatedPriceRequests = async (params: PaginationParams): Promise<PaginatedResponse<any>> => {
  const { page, pageSize, searchTerm, filters = {}, sortBy = 'requested_at', sortOrder = 'desc' } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('price_requests')
    .select('*', { count: 'exact' });

  // Apply search
  if (searchTerm) {
    const sanitized = sanitizeSearchTerm(searchTerm);
    query = query.or(`product_number.ilike.%${sanitized}%,customer_name.ilike.%${sanitized}%,supplier_name.ilike.%${sanitized}%,buyer_name.ilike.%${sanitized}%`);
  }

  // Apply filters
  if (filters.buyer) query = query.eq('buyer_name', filters.buyer);
  if (filters.supplier) query = query.eq('supplier_name', filters.supplier);
  if (filters.customer) query = query.eq('customer_name', filters.customer);
  if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);

  // Apply sorting and pagination
  query = query.order(sortBy, { ascending: sortOrder === 'asc' }).range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize)
  };
};

export const getPaginatedUsers = async (params: PaginationParams): Promise<PaginatedResponse<any>> => {
  const { page, pageSize, searchTerm } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Get all users first (RPC doesn't support range)
  const { data: allUsers, error } = await supabase.rpc('get_all_user_profiles');

  if (error) throw error;

  let filteredUsers = allUsers || [];

  // Apply search filter
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredUsers = filteredUsers.filter((user: any) =>
      user.email?.toLowerCase().includes(term) ||
      user.display_name?.toLowerCase().includes(term)
    );
  }

  // Apply pagination
  const total = filteredUsers.length;
  const paginatedData = filteredUsers.slice(from, to + 1);

  return {
    data: paginatedData,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
};

export const getPaginatedPendingApprovals = async (params: PaginationParams): Promise<PaginatedResponse<any>> => {
  const { page, pageSize, searchTerm, filters = {} } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Get all pending approvals first (RPC doesn't support range)
  const { data: allApprovals, error } = await supabase.rpc('get_pending_approvals_optimized');

  if (error) throw error;

  let filteredApprovals = allApprovals || [];

  // Apply search filter
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredApprovals = filteredApprovals.filter((approval: any) =>
      approval.quote_number?.toLowerCase().includes(term) ||
      approval.customer_name?.toLowerCase().includes(term) ||
      approval.requester_name?.toLowerCase().includes(term)
    );
  }

  // Apply level filter
  if (filters.level && filters.level !== 'all') {
    filteredApprovals = filteredApprovals.filter((approval: any) =>
      approval.approval_level === filters.level
    );
  }

  // Apply pagination
  const total = filteredApprovals.length;
  const paginatedData = filteredApprovals.slice(from, to + 1);

  return {
    data: paginatedData,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
};