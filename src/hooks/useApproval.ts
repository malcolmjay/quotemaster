import { useState, useEffect } from 'react'
import {
  getUserRole,
  getQuoteApprovalStatus,
  submitQuoteForApproval,
  approveQuote,
  rejectQuote,
  getPendingApprovals,
  supabase
} from '../lib/supabase'
import { useAuthContext } from '../components/auth/AuthProvider'

export type UserRole = 'CSR' | 'Manager' | 'Director' | 'VP' | 'President' | 'Admin'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn'

interface RoleApprovalLimit {
  role: string
  min_amount: number
  max_amount: number
}

export interface ApprovalRequirement {
  level: UserRole
  requiredApprovers: number
  currentApprovers: number
  status: ApprovalStatus
}

export interface ApprovalAction {
  id: string
  approver_id: string
  approver_role: UserRole
  action: ApprovalStatus
  comments: string | null
  approved_at: string
  approver_name?: string
  approver_email?: string
}

export const useApproval = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
  const [approvalLimits, setApprovalLimits] = useState<RoleApprovalLimit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuthContext()

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return

      try {
        const role = await getUserRole(user.id)
        setUserRole(role)

        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('is_active', true)

        if (rolesData) {
          setUserRoles(rolesData.map(r => r.role as UserRole))
        }
      } catch (err) {
        console.error('Error fetching user role:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch user role')
      }
    }

    fetchUserRole()
  }, [user])

  useEffect(() => {
    const fetchApprovalLimits = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('role_approval_limits')
          .select('role, min_amount, max_amount')
          .order('min_amount', { ascending: true })

        if (fetchError) throw fetchError
        setApprovalLimits(data || [])
      } catch (err) {
        console.error('Error fetching approval limits:', err)
      }
    }

    fetchApprovalLimits()
  }, [])

  const getApprovalRequirement = (quoteValue: number): ApprovalRequirement => {
    if (approvalLimits.length === 0) {
      return { level: 'CSR', requiredApprovers: 1, currentApprovers: 0, status: 'pending' }
    }

    for (const limit of approvalLimits) {
      if (quoteValue >= limit.min_amount && quoteValue <= limit.max_amount) {
        const requiredApprovers = limit.role === 'President' && quoteValue > 500000 ? 2 : 1
        return {
          level: limit.role as UserRole,
          requiredApprovers,
          currentApprovers: 0,
          status: 'pending'
        }
      }
    }

    return { level: 'President', requiredApprovers: 1, currentApprovers: 0, status: 'pending' }
  }

  const canUserApprove = (quoteValue: number): boolean => {
    if (userRoles.length === 0) return false

    // Admin users can approve ANY quote regardless of value
    if (userRoles.includes('Admin')) return true

    if (approvalLimits.length === 0) return false

    for (const userRole of userRoles) {
      const limit = approvalLimits.find(l => l.role === userRole)
      if (limit && quoteValue >= limit.min_amount && quoteValue <= limit.max_amount) {
        return true
      }
    }

    return false
  }

  const getApprovalMessage = (quoteValue: number): string => {
    if (approvalLimits.length === 0) {
      return 'Loading approval requirements...'
    }

    const eligibleRoles: string[] = []

    for (const limit of approvalLimits) {
      if (quoteValue >= limit.min_amount && quoteValue <= limit.max_amount) {
        eligibleRoles.push(limit.role)
      }
    }

    if (eligibleRoles.length === 0) {
      return 'This quote value exceeds all configured approval limits.'
    }

    if (eligibleRoles.length === 1) {
      return `This quote requires approval from a ${eligibleRoles[0]}.`
    }

    const lastRole = eligibleRoles[eligibleRoles.length - 1]
    const otherRoles = eligibleRoles.slice(0, -1).join(', ')
    return `This quote can be approved by ${otherRoles}, or ${lastRole}.`
  }

  const submitForApproval = async (quoteId: string, comments?: string) => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔄 Submitting quote for approval:', quoteId)
      const result = await submitQuoteForApproval(quoteId, comments)
      console.log('✅ Quote submitted for approval successfully:', result)
      return result
    } catch (err) {
      console.error('❌ Error submitting for approval:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit for approval'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const approve = async (quoteId: string, comments?: string) => {
    if (!userRole) throw new Error('User role not determined')
    
    setLoading(true)
    setError(null)
    
    try {
      const result = await approveQuote(quoteId, userRole, comments)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve quote'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const reject = async (quoteId: string, comments: string) => {
    if (!userRole) throw new Error('User role not determined')
    
    setLoading(true)
    setError(null)
    
    try {
      const result = await rejectQuote(quoteId, userRole, comments)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject quote'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getApprovalStatus = async (quoteId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getQuoteApprovalStatus(quoteId)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get approval status'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getPendingApprovalsForUser = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await getPendingApprovals()
      return result
    } catch (err) {
      console.error('useApproval: Error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to get pending approvals'
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }

  return {
    userRole,
    loading,
    error,
    getApprovalRequirement,
    canUserApprove,
    getApprovalMessage,
    submitForApproval,
    approve,
    reject,
    getApprovalStatus,
    getPendingApprovalsForUser
  }
}