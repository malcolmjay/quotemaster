import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuthContext } from '../components/auth/AuthProvider'
import { createQuote, updateQuote, createLineItem, updateLineItem, deleteLineItem, deleteQuote, getQuotes, supabase } from '../lib/supabase'
import { logger } from '../utils/logger'

interface Quote {
  id: string
  quote_number: string
  customer_id: string
  customer_user_id?: string
  quote_type: 'Daily Quote' | 'Bid'
  status: 'draft' | 'sent' | 'accepted' | 'won' | 'lost' | 'expired'
  valid_until?: string
  ship_until?: string
  customer_bid_number?: string
  purchase_order_number?: string
  total_value: number
  total_cost: number
  total_margin: number
  line_item_count: number
  created_by?: string
  created_at: string
  updated_at: string
  dbe_required: boolean
  bid_bond_required: boolean
  performance_bond_required: boolean
  insurance_required: boolean
  winning_competitor?: string
  loss_reason?: string
  loss_notes?: string
  quote_status: 'draft' | 'pending_approval' | 'approved'
  carrying_cost_percent?: number
  freight_overhead_percent?: number
  quote_line_items?: QuoteLineItem[]
  customers?: any
}

interface QuoteLineItem {
  id: string
  quote_id: string
  product_id?: string
  sku: string
  product_name: string
  supplier: string
  category?: string
  quantity: number
  unit_price: number
  unit_cost: number
  subtotal: number
  total_cost: number
  margin_percent: number
  lead_time?: string
  quoted_lead_time?: string
  next_available_date?: string
  status: 'pending' | 'won' | 'lost' | 'price_request' | 'lead_time_request' | 'item_load' | 'no_quote'
  shipping_instructions?: string
  ship_to_address_id?: string
  customer_part_number?: string
  is_replacement: boolean
  replacement_type?: string
  replacement_reason?: string
  original_customer_sku?: string
  original_customer_name?: string
  cost_effective_from?: string
  cost_effective_to?: string
  created_at: string
  updated_at: string
}

interface SupabaseQuoteContextType {
  currentQuote: Quote | null
  quotes: Quote[]
  loading: boolean
  error: string | null
  setCurrentQuote: (quote: Quote | null) => void
  createNewQuote: (quoteData: Partial<Quote>) => Promise<Quote>
  updateCurrentQuote: (updates: Partial<Quote>) => Promise<void>
  addLineItem: (lineItem: Partial<QuoteLineItem>) => Promise<QuoteLineItem>
  updateLineItemById: (lineItemId: string, updates: Partial<QuoteLineItem>) => Promise<void>
  removeLineItem: (lineItemId: string) => Promise<void>
  deleteQuote: (quoteId: string) => Promise<void>
  refreshQuotes: () => Promise<void>
  syncLineItems: (localLineItems: any[], quoteId?: string) => Promise<void>
}

const SupabaseQuoteContext = createContext<SupabaseQuoteContextType | undefined>(undefined)

export const useSupabaseQuote = (): SupabaseQuoteContextType => {
  const context = useContext(SupabaseQuoteContext)
  if (!context) {
    throw new Error('useSupabaseQuote must be used within a SupabaseQuoteProvider')
  }
  return context
}

interface SupabaseQuoteProviderProps {
  children: ReactNode
}

export const SupabaseQuoteProvider: React.FC<SupabaseQuoteProviderProps> = ({ children }) => {
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuthContext()

  const QUOTE_PERSISTENCE_KEY = 'currentQuoteId'

  const setCurrentQuoteWithPersistence = (quote: Quote | null) => {
    setCurrentQuote(quote)
    if (quote) {
      localStorage.setItem(QUOTE_PERSISTENCE_KEY, quote.id)
    } else {
      localStorage.removeItem(QUOTE_PERSISTENCE_KEY)
    }
  }

  const refreshQuotes = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      const data = await getQuotes()
      setQuotes(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quotes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      refreshQuotes()

      let refreshTimeout: NodeJS.Timeout | null = null

      const channel = supabase
        .channel('quote_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'quote_line_items'
          },
          (payload) => {
            logger.debug('Quote line item changed')
            if (refreshTimeout) {
              clearTimeout(refreshTimeout)
            }
            refreshTimeout = setTimeout(() => {
              refreshQuotes()
            }, 500)
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'quotes'
          },
          (payload) => {
            logger.debug('Quote changed')
            if (refreshTimeout) {
              clearTimeout(refreshTimeout)
            }
            refreshTimeout = setTimeout(() => {
              refreshQuotes()
            }, 500)
          }
        )
        .subscribe()

      return () => {
        if (refreshTimeout) {
          clearTimeout(refreshTimeout)
        }
        supabase.removeChannel(channel)
      }
    } else {
      localStorage.removeItem(QUOTE_PERSISTENCE_KEY)
    }
  }, [user])

  useEffect(() => {
    if (quotes.length > 0 && user) {
      const persistedQuoteId = localStorage.getItem(QUOTE_PERSISTENCE_KEY)

      if (persistedQuoteId && !currentQuote) {
        const persistedQuote = quotes.find(q => q.id === persistedQuoteId)
        if (persistedQuote) {
          logger.debug('Restoring persisted quote')
          setCurrentQuote(persistedQuote)
        } else {
          localStorage.removeItem(QUOTE_PERSISTENCE_KEY)
        }
      } else if (currentQuote) {
        const updatedQuote = quotes.find(q => q.id === currentQuote.id)
        if (updatedQuote && JSON.stringify(updatedQuote) !== JSON.stringify(currentQuote)) {
          setCurrentQuote(updatedQuote)
        }
      }
    }
  }, [quotes, user])

  const generateQuoteNumber = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `Q-${year}-${month}${day}-${hours}${minutes}-${randomSuffix}`
  }

  const createNewQuote = async (quoteData: Partial<Quote>): Promise<Quote> => {
    if (!user) throw new Error('User not authenticated')

    try {
      logger.debug('Creating new quote');
      setLoading(true)
      setError(null)

      const newQuote = {
        quote_number: generateQuoteNumber(),
        created_by: user.id,
        total_value: 0,
        total_cost: 0,
        total_margin: 0,
        line_item_count: 0,
        dbe_required: false,
        bid_bond_required: false,
        performance_bond_required: false,
        insurance_required: false,
        quote_status: 'draft' as const,
        ...quoteData
      }
      
      logger.debug('Quote data formatted for database');

      const createdQuote = await createQuote(newQuote)
      logger.debug('Quote created successfully');
      setCurrentQuoteWithPersistence(createdQuote)
      await refreshQuotes()
      return createdQuote
    } catch (err) {
      logger.error('Error creating quote', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create quote'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const updateCurrentQuote = async (updates: Partial<Quote>): Promise<void> => {
    if (!currentQuote) throw new Error('No current quote selected')

    try {
      logger.debug('Updating quote');
      setLoading(true)
      setError(null)

      const updatedQuote = await updateQuote(currentQuote.id, updates)
      logger.debug('Quote updated successfully');
      setCurrentQuote(updatedQuote)
      await refreshQuotes()
    } catch (err) {
      logger.error('Error updating quote', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update quote'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const addLineItem = async (lineItemData: Partial<QuoteLineItem>): Promise<QuoteLineItem> => {
    if (!currentQuote) throw new Error('No current quote selected')

    try {
      setLoading(true)
      setError(null)

      const newLineItem = {
        quote_id: currentQuote.id,
        quantity: 1,
        unit_price: 0,
        unit_cost: 0,
        status: 'pending' as const,
        is_replacement: false,
        ...lineItemData
      }

      const createdLineItem = await createLineItem(newLineItem)
      
      // Update quote totals
      const newLineItemCount = currentQuote.line_item_count + 1
      const newTotalValue = currentQuote.total_value + (createdLineItem.subtotal || 0)
      const newTotalCost = currentQuote.total_cost + (createdLineItem.total_cost || 0)
      
      await updateCurrentQuote({
        line_item_count: newLineItemCount,
        total_value: newTotalValue,
        total_cost: newTotalCost,
        total_margin: newTotalValue > 0 ? ((newTotalValue - newTotalCost) / newTotalValue) * 100 : 0
      })

      return createdLineItem
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add line item'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to check if a string is a valid UUID
  const isUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const syncLineItems = async (localLineItems: any[], quoteId?: string): Promise<void> => {
    const targetQuoteId = quoteId || currentQuote?.id
    if (!targetQuoteId) throw new Error('No quote ID provided and no current quote selected')

    try {
      setLoading(true)
      setError(null)

      const { data: existingLineItems, error: fetchError } = await supabase
        .from('quote_line_items')
        .select('*')
        .eq('quote_id', targetQuoteId)

      if (fetchError) throw fetchError

      const existingIds = new Set(existingLineItems?.map(item => item.id) || [])
      const localIds = new Set(localLineItems.filter(item => isUUID(item.id)).map(item => item.id))

      const itemsToDelete = Array.from(existingIds).filter(id => !localIds.has(id))

      if (itemsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('quote_line_items')
          .delete()
          .in('id', itemsToDelete)

        if (deleteError) throw deleteError
      }

      const newItems = localLineItems.filter(item => !isUUID(item.id))

      if (newItems.length > 0) {
        const insertPayloads = newItems.map(item => ({
          quote_id: targetQuoteId,
          product_id: null,
          sku: item.sku,
          product_name: item.name,
          supplier: item.supplier,
          category: item.category,
          quantity: item.qty,
          unit_price: item.price,
          unit_cost: item.cost,
          lead_time: item.leadTime,
          quoted_lead_time: item.quotedLeadTime,
          next_available_date: item.available,
          status: item.status.toLowerCase().replace(/\s+/g, '_') as any,
          shipping_instructions: item.shippingInstructions,
          ship_to_address_id: item.ship_to_address_id || null,
          customer_part_number: item.customerPartNumber,
          warehouse: item.warehouse || null,
          is_replacement: item.isReplacement || false,
          replacement_type: item.replacementType,
          replacement_reason: item.replacementReason,
          original_customer_sku: item.originalCustomerSku,
          original_customer_name: item.originalCustomerName,
          cost_effective_from: item.cost_effective_from,
          cost_effective_to: item.cost_effective_to,
          award_company_id: item.award_company_id || null,
          award_price: item.award_price ?? null,
          award_quantity: item.award_quantity ?? null,
          award_contract_number: item.award_contract_number || null,
          bid_competitor_1_id: item.bid_competitor_1_id || null,
          bid_price_1: item.bid_price_1 ?? null,
          bid_price_2: item.bid_price_2 ?? null,
          bid_competitor_2_id: item.bid_competitor_2_id || null,
          bid_competitor_2_price: item.bid_competitor_2_price ?? null
        }))

        const { error: insertError } = await supabase
          .from('quote_line_items')
          .insert(insertPayloads)

        if (insertError) throw insertError
      }

      const existingItems = localLineItems.filter(item => isUUID(item.id))

      if (existingItems.length > 0) {
        const upsertPayloads = existingItems.map(item => ({
          id: item.id,
          quote_id: targetQuoteId,
          sku: item.sku,
          product_name: item.name,
          supplier: item.supplier,
          category: item.category,
          quantity: item.qty,
          unit_price: item.price,
          unit_cost: item.cost,
          lead_time: item.leadTime,
          quoted_lead_time: item.quotedLeadTime,
          next_available_date: item.available,
          status: item.status.toLowerCase().replace(/\s+/g, '_') as any,
          shipping_instructions: item.shippingInstructions,
          ship_to_address_id: item.ship_to_address_id || null,
          customer_part_number: item.customerPartNumber,
          warehouse: item.warehouse || null,
          is_replacement: item.isReplacement || false,
          replacement_type: item.replacementType,
          replacement_reason: item.replacementReason,
          original_customer_sku: item.originalCustomerSku,
          original_customer_name: item.originalCustomerName,
          cost_effective_from: item.cost_effective_from,
          cost_effective_to: item.cost_effective_to,
          award_company_id: item.award_company_id || null,
          award_price: item.award_price ?? null,
          award_quantity: item.award_quantity ?? null,
          award_contract_number: item.award_contract_number || null,
          bid_competitor_1_id: item.bid_competitor_1_id || null,
          bid_price_1: item.bid_price_1 ?? null,
          bid_price_2: item.bid_price_2 ?? null,
          bid_competitor_2_id: item.bid_competitor_2_id || null,
          bid_competitor_2_price: item.bid_competitor_2_price ?? null
        }))

        const { error: upsertError } = await supabase
          .from('quote_line_items')
          .upsert(upsertPayloads, { onConflict: 'id' })

        if (upsertError) throw upsertError
      }

      await refreshQuotes()

    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }
  const updateLineItemById = async (lineItemId: string, updates: Partial<QuoteLineItem>): Promise<void> => {
    if (!currentQuote) throw new Error('No current quote selected')

    try {
      setLoading(true)
      setError(null)

      await updateLineItem(lineItemId, updates)
      await refreshQuotes()
      
      // Refresh current quote if it's still selected
      const updatedQuote = quotes.find(q => q.id === currentQuote.id)
      if (updatedQuote) {
        setCurrentQuote(updatedQuote)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update line item'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const removeLineItem = async (lineItemId: string): Promise<void> => {
    if (!currentQuote) throw new Error('No current quote selected')

    try {
      setLoading(true)
      setError(null)

      logger.debug('Removing line item');
      await deleteLineItem(lineItemId)
      logger.debug('Line item removed successfully');
      await refreshQuotes()
    } catch (err) {
      logger.error('Error removing line item', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove line item'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const deleteQuoteById = async (quoteId: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      logger.debug('Deleting quote');
      await deleteQuote(quoteId)
      logger.debug('Quote deleted successfully');
      
      // Clear current quote if it was the one deleted
      if (currentQuote?.id === quoteId) {
        setCurrentQuoteWithPersistence(null)
      }
      
      await refreshQuotes()
    } catch (err) {
      logger.error('Error deleting quote', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete quote'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const value: SupabaseQuoteContextType = {
    currentQuote,
    quotes,
    loading,
    error,
    setCurrentQuote: setCurrentQuoteWithPersistence,
    createNewQuote,
    updateCurrentQuote,
    addLineItem,
    updateLineItemById,
    removeLineItem,
    deleteQuote: deleteQuoteById,
    refreshQuotes,
    syncLineItems
  }

  return (
    <SupabaseQuoteContext.Provider value={value}>
      {children}
    </SupabaseQuoteContext.Provider>
  )
}