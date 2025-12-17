import React, { useState, useEffect } from 'react'
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Building, 
  DollarSign,
  Calendar,
  MessageSquare,
  Filter,
  Search
} from 'lucide-react'
import { useApproval } from '../../hooks/useApproval'

export const PendingApprovals: React.FC = () => {
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([])
  const [filteredApprovals, setFilteredApprovals] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [showApprovalModal, setShowApprovalModal] = useState<string | null>(null)
  const [approvalComments, setApprovalComments] = useState('')
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  
  const {
    userRole,
    canUserApprove,
    approve,
    reject,
    getPendingApprovalsForUser,
    loading,
    error: approvalError
  } = useApproval()

  useEffect(() => {
    const fetchPendingApprovals = async () => {
      try {
        const approvals = await getPendingApprovalsForUser()

        const uniqueApprovals = Array.from(
          new Map(approvals.map(a => [a.id, a])).values()
        )

        setPendingApprovals(uniqueApprovals)
        setFilteredApprovals(uniqueApprovals)
      } catch (error) {
        console.error('Error fetching pending approvals:', error)
        setPendingApprovals([])
        setFilteredApprovals([])
      }
    }

    if (userRole) {
      fetchPendingApprovals()
    }
  }, [userRole])

  useEffect(() => {
    let filtered = pendingApprovals

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(approval =>
        approval.quote_data?.quote_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        approval.quote_data?.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        approval.quote_data?.creator_email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply level filter
    if (levelFilter !== 'all') {
      filtered = filtered.filter(approval => approval.approval_level === levelFilter)
    }

    setFilteredApprovals(filtered)
  }, [pendingApprovals, searchTerm, levelFilter])

  const handleApprovalAction = async (quoteId: string) => {
    if (!userRole || actionLoading) return

    setActionLoading(true)
    setActionError(null)
    const modalQuoteId = showApprovalModal
    const actionComments = approvalComments

    try {
      if (actionType === 'approve') {
        await approve(quoteId, actionComments)
      } else {
        await reject(quoteId, actionComments)
      }

      // Close modal after successful action
      setShowApprovalModal(null)
      setApprovalComments('')
      setActionError(null)

      // Refresh pending approvals after successful action
      const approvals = await getPendingApprovalsForUser()
      const uniqueApprovals = Array.from(
        new Map(approvals.map(a => [a.id, a])).values()
      )

      setPendingApprovals(uniqueApprovals)
      setFilteredApprovals(uniqueApprovals)
    } catch (error) {
      console.error('Error processing approval:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to process approval'
      setActionError(errorMessage)

      // Keep modal open on error so user can try again
      if (!showApprovalModal) {
        setShowApprovalModal(modalQuoteId)
        setApprovalComments(actionComments)
      }
    } finally {
      setActionLoading(false)
    }
  }

  const getValueColor = (value: number) => {
    if (value >= 300000) return 'text-[#a94442] font-bold'
    if (value >= 200000) return 'text-[#8a6d3b] font-semibold'
    if (value >= 50000) return 'text-[#8a6d3b] font-medium'
    return 'text-[#3c763d]'
  }

  const getUrgencyIndicator = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60)

    if (hoursDiff > 48) return { color: 'text-[#a94442]', label: 'Urgent' }
    if (hoursDiff > 24) return { color: 'text-[#8a6d3b]', label: 'High' }
    if (hoursDiff > 8) return { color: 'text-[#8a6d3b]', label: 'Medium' }
    return { color: 'text-[#3c763d]', label: 'Normal' }
  }

  if (!userRole) {
    return (
      <div className="bg-white rounded border border-[#d4d4d4] p-8 text-center">
        <Shield className="h-12 w-12 text-[#999] mx-auto mb-4" />
        <h3 className="text-lg font-medium text-[#333] mb-2">No Approval Authority</h3>
        <p className="text-[#666]">You do not have an assigned role for quote approvals.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded border border-[#d4d4d4] p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#333]">Pending Approvals</h2>
            <p className="text-[#666] mt-1">
              Quotes requiring approval • Your role: <span className="font-medium text-[#428bca]">{userRole}</span>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="text-sm text-[#999]">
              {filteredApprovals.length} pending approval{filteredApprovals.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#999]" />
            <input
              type="text"
              placeholder="Search by quote number, customer, or creator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca]"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-[#999]" />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-4 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca]"
            >
              <option value="all">All Levels</option>
              <option value="CSR">CSR</option>
              <option value="Manager">Manager</option>
              <option value="Director">Director</option>
              <option value="VP">VP</option>
              <option value="President">President</option>
            </select>
          </div>
        </div>
      </div>

      {approvalError && (
        <div className="bg-white rounded border border-[#d4d4d4] p-8 text-center">
          <XCircle className="h-12 w-12 text-[#a94442] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#333] mb-2">Error Loading Approvals</h3>
          <p className="text-[#666]">{approvalError}</p>
        </div>
      )}

      {loading && !approvalError && (
        <div className="bg-white rounded border border-[#d4d4d4] p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#428bca] mx-auto mb-4"></div>
          <p className="text-[#666]">Loading pending approvals...</p>
        </div>
      )}

      {!loading && !approvalError && filteredApprovals.length === 0 && (
        <div className="bg-white rounded border border-[#d4d4d4] p-8 text-center">
          <Shield className="h-12 w-12 text-[#999] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#333] mb-2">No Pending Approvals</h3>
          <p className="text-[#666]">
            {pendingApprovals.length === 0
              ? 'There are no quotes pending approval at this time.'
              : 'No approvals match your current search criteria.'
            }
          </p>
        </div>
      )}

      {!loading && !approvalError && filteredApprovals.length > 0 && (
        <div className="bg-white rounded border border-[#d4d4d4] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f5f5f5] border-b border-[#d4d4d4]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#999] uppercase tracking-wider">Quote Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#999] uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#999] uppercase tracking-wider">Value & Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#999] uppercase tracking-wider">Timeline</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#999] uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#999] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#d4d4d4]">
                {filteredApprovals.map((approval, index) => {
                  const quote = approval.quote_data
                  const urgency = getUrgencyIndicator(approval.created_at)
                  const userCanApproveThis = canUserApprove(quote?.total_value || 0)

                  return (
                    <tr key={`${approval.id}-${index}`} className="hover:bg-[#f5f5f5] transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-[#333]">{quote?.quote_number}</div>
                          <div className="text-sm text-[#666]">
                            Created by: {quote?.creator_email || 'Unknown'}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${urgency.color} bg-opacity-10`}>
                              <Clock className="h-3 w-3 mr-1" />
                              {urgency.label}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-[#333]">{quote?.customer?.name}</div>
                          <div className="text-sm text-[#666]">
                            Type: Daily Quote
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <div className={`font-medium ${getValueColor(quote?.total_value || 0)}`}>
                            ${(quote?.total_value || 0).toLocaleString()}
                          </div>
                          <div className="text-sm text-[#666]">
                            Requires: {approval.approval_level}
                          </div>
                          {approval.required_approvers > 1 && (
                            <div className="text-xs text-[#a94442] font-medium">
                              Dual approval required
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-[#666]">
                            <Calendar className="h-3 w-3 mr-1" />
                            Submitted: {new Date(approval.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-[#f0f0f0] rounded-full h-2">
                            <div
                              className="bg-[#428bca] h-2 rounded-full"
                              style={{
                                width: `${(approval.current_approvers / approval.required_approvers) * 100}%`
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-[#666]">
                            {approval.current_approvers}/{approval.required_approvers}
                          </span>
                        </div>

                        {(() => {
                          const actions = typeof approval.approval_actions_data === 'string'
                            ? JSON.parse(approval.approval_actions_data)
                            : approval.approval_actions_data;

                          return actions && Array.isArray(actions) && actions.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs text-[#999]">Recent approvals:</div>
                              {actions.slice(0, 2).map((action: any) => (
                                <div key={action.id} className="text-xs text-[#666]">
                                  {action.approver_email} ({action.approver_role})
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </td>

                      <td className="px-6 py-4">
                        {userCanApproveThis ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setShowApprovalModal(approval.quote_id)
                                setActionType('approve')
                                setActionError(null)
                              }}
                              className="p-2 text-[#3c763d] hover:bg-[#dff0d8] rounded transition-colors"
                              title="Approve"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setShowApprovalModal(approval.quote_id)
                                setActionType('reject')
                                setActionError(null)
                              }}
                              className="p-2 text-[#a94442] hover:bg-[#f2dede] rounded transition-colors"
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs text-[#999] text-center">
                            Insufficient authority
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approval Action Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-[#d4d4d4]">
              <h3 className="text-lg font-semibold text-[#333]">
                {actionType === 'approve' ? 'Approve Quote' : 'Reject Quote'}
              </h3>
              <p className="text-sm text-[#666] mt-1">
                Quote: {pendingApprovals.find(a => a.quote_id === showApprovalModal)?.quote_data?.quote_number}
              </p>
            </div>

            <div className="p-6">
              {actionError && (
                <div className="mb-4 p-3 bg-[#f2dede] border border-[#ebccd1] rounded">
                  <div className="flex items-start space-x-2">
                    <XCircle className="h-4 w-4 text-[#a94442] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#a94442]">Error</p>
                      <p className="text-sm text-[#a94442]">{actionError}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="h-4 w-4 text-[#666]" />
                  <span className="text-sm font-medium text-[#333]">
                    Approving as: {userRole}
                  </span>
                </div>
                <div className="text-sm text-[#666]">
                  Value: ${(pendingApprovals.find(a => a.quote_id === showApprovalModal)?.quote_data?.total_value || 0).toLocaleString()}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-[#333] mb-2">
                  Comments {actionType === 'reject' && <span className="text-[#a94442]">*</span>}
                </label>
                <textarea
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  placeholder={
                    actionType === 'approve'
                      ? 'Optional comments about the approval...'
                      : 'Please provide a reason for rejection...'
                  }
                  className="w-full px-3 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca]"
                  rows={3}
                  required={actionType === 'reject'}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#d4d4d4] flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowApprovalModal(null)
                  setApprovalComments('')
                }}
                disabled={actionLoading}
                className="px-4 py-2 text-[#666] hover:text-[#333] hover:bg-[#f5f5f5] border border-transparent hover:border-[#d4d4d4] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApprovalAction(showApprovalModal!)}
                disabled={actionLoading || (actionType === 'reject' && !approvalComments.trim())}
                className={`px-4 py-2 rounded transition-colors disabled:opacity-50 ${
                  actionType === 'approve'
                    ? 'bg-[#428bca] hover:bg-[#3276b1] text-white'
                    : 'bg-[#a94442] hover:bg-[#843534] text-white'
                }`}
              >
                {actionLoading ? 'Processing...' : (actionType === 'approve' ? 'Approve' : 'Reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}