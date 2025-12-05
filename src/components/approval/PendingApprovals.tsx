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
  
  const { 
    userRole,
    canUserApprove,
    approve,
    reject,
    getPendingApprovalsForUser,
    loading 
  } = useApproval()

  useEffect(() => {
    const fetchPendingApprovals = async () => {
      try {
        const approvals = await getPendingApprovalsForUser()
        setPendingApprovals(approvals)
        setFilteredApprovals(approvals)
      } catch (error) {
        console.error('Error fetching pending approvals:', error)
      }
    }

    if (userRole) {
      fetchPendingApprovals()
    }
  }, [userRole, getPendingApprovalsForUser])

  useEffect(() => {
    let filtered = pendingApprovals

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(approval => 
        approval.quotes?.quote_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        approval.quotes?.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        approval.quotes?.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply level filter
    if (levelFilter !== 'all') {
      filtered = filtered.filter(approval => approval.approval_level === levelFilter)
    }

    setFilteredApprovals(filtered)
  }, [pendingApprovals, searchTerm, levelFilter])

  const handleApprovalAction = async (quoteId: string) => {
    if (!userRole) return
    
    try {
      if (actionType === 'approve') {
        await approve(quoteId, approvalComments)
      } else {
        await reject(quoteId, approvalComments)
      }
      
      setShowApprovalModal(null)
      setApprovalComments('')
      
      // Refresh pending approvals
      const approvals = await getPendingApprovalsForUser()
      setPendingApprovals(approvals)
    } catch (error) {
      console.error('Error processing approval:', error)
    }
  }

  const getValueColor = (value: number) => {
    if (value >= 300000) return 'text-red-600 font-bold'
    if (value >= 200000) return 'text-orange-600 font-semibold'
    if (value >= 50000) return 'text-yellow-600 font-medium'
    return 'text-green-600'
  }

  const getUrgencyIndicator = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
    
    if (hoursDiff > 48) return { color: 'text-red-600', label: 'Urgent' }
    if (hoursDiff > 24) return { color: 'text-orange-600', label: 'High' }
    if (hoursDiff > 8) return { color: 'text-yellow-600', label: 'Medium' }
    return { color: 'text-green-600', label: 'Normal' }
  }

  if (!userRole) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Approval Authority</h3>
        <p className="text-gray-600">You do not have an assigned role for quote approvals.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Pending Approvals</h2>
            <p className="text-gray-600 mt-1">
              Quotes requiring approval • Your role: <span className="font-medium text-blue-600">{userRole}</span>
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-500">
              {filteredApprovals.length} pending approval{filteredApprovals.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by quote number, customer, or creator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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

      {loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pending approvals...</p>
        </div>
      )}

      {!loading && filteredApprovals.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Approvals</h3>
          <p className="text-gray-600">
            {pendingApprovals.length === 0 
              ? 'There are no quotes pending approval at this time.'
              : 'No approvals match your current search criteria.'
            }
          </p>
        </div>
      )}

      {!loading && filteredApprovals.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quote Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value & Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timeline</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApprovals.map((approval) => {
                  const quote = approval.quotes
                  const urgency = getUrgencyIndicator(approval.created_at)
                  const userCanApproveThis = canUserApprove(quote?.total_value || 0)
                  
                  return (
                    <tr key={approval.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{quote?.quote_number}</div>
                          <div className="text-sm text-gray-600">
                            Created by: {quote?.profiles?.full_name || 'Unknown'}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${urgency.color} bg-opacity-10`}>
                              <Clock className="h-3 w-3 mr-1" />
                              {urgency.label}
                            </span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{quote?.customers?.name}</div>
                          <div className="text-sm text-gray-600">
                            Type: {quote?.quote_type || 'Daily Quote'}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div>
                          <div className={`font-medium ${getValueColor(quote?.total_value || 0)}`}>
                            ${(quote?.total_value || 0).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">
                            Requires: {approval.approval_level}
                          </div>
                          {approval.required_approvers > 1 && (
                            <div className="text-xs text-red-600 font-medium">
                              Dual approval required
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-3 w-3 mr-1" />
                            Submitted: {new Date(approval.created_at).toLocaleDateString()}
                          </div>
                          {quote?.valid_until && (
                            <div className="text-sm text-gray-600">
                              Valid until: {new Date(quote.valid_until).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ 
                                width: `${(approval.current_approvers / approval.required_approvers) * 100}%` 
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">
                            {approval.current_approvers}/{approval.required_approvers}
                          </span>
                        </div>
                        
                        {approval.approval_actions && approval.approval_actions.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs text-gray-500">Recent approvals:</div>
                            {approval.approval_actions.slice(0, 2).map((action: any) => (
                              <div key={action.id} className="text-xs text-gray-600">
                                {action.profiles?.full_name} ({action.approver_role})
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        {userCanApproveThis ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setShowApprovalModal(approval.quote_id)
                                setActionType('approve')
                              }}
                              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setShowApprovalModal(approval.quote_id)
                                setActionType('reject')
                              }}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 text-center">
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {actionType === 'approve' ? 'Approve Quote' : 'Reject Quote'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Quote: {pendingApprovals.find(a => a.quote_id === showApprovalModal)?.quotes?.quote_number}
              </p>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Approving as: {userRole}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Value: ${(pendingApprovals.find(a => a.quote_id === showApprovalModal)?.quotes?.total_value || 0).toLocaleString()}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments {actionType === 'reject' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  placeholder={
                    actionType === 'approve' 
                      ? 'Optional comments about the approval...'
                      : 'Please provide a reason for rejection...'
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required={actionType === 'reject'}
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowApprovalModal(null)
                  setApprovalComments('')
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApprovalAction(showApprovalModal!)}
                disabled={loading || (actionType === 'reject' && !approvalComments.trim())}
                className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                  actionType === 'approve'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {loading ? 'Processing...' : (actionType === 'approve' ? 'Approve' : 'Reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}