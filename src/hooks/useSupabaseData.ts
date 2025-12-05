import { useState, useEffect } from 'react'
import {
  getCustomers,
  getProducts,
  getQuotes,
  getCrossReferences,
  subscribeToQuotes,
  supabase
} from '../lib/supabase'

export const useCustomers = () => {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const data = await getCustomers()
      setCustomers(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  return { customers, loading, error, refetch: fetchCustomers }
}

export const useProducts = () => {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const data = await getProducts()
      setProducts(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()

    let refreshTimeout: NodeJS.Timeout | null = null

    const channel = supabase
      .channel('products_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          console.log('Product changed:', payload)
          if (refreshTimeout) {
            clearTimeout(refreshTimeout)
          }
          refreshTimeout = setTimeout(() => {
            fetchProducts()
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
  }, [])

  return { products, loading, error, refetch: fetchProducts }
}

export const useQuotes = () => {
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQuotes = async () => {
    try {
      setLoading(true)
      const data = await getQuotes()
      setQuotes(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quotes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuotes()

    const subscription = subscribeToQuotes((payload) => {
      console.log('Quote updated:', payload)
      fetchQuotes()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { quotes, loading, error, refetch: fetchQuotes }
}

export const useCrossReferences = () => {
  const [crossReferences, setCrossReferences] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCrossReferences = async () => {
    try {
      setLoading(true)
      const data = await getCrossReferences()
      setCrossReferences(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cross references')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCrossReferences()
  }, [])

  return { crossReferences, loading, error, refetch: fetchCrossReferences }
}