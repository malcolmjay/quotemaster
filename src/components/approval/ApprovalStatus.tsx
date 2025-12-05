import React, { useState, useEffect } from 'react'
import { Shield, CheckCircle, XCircle, Clock, AlertTriangle, User, MessageSquare } from 'lucide-react'
import { useApproval, UserRole } from '../../hooks/useApproval'

interface ApprovalStatusProps {
  quoteId: string
  quoteValue: number
  quoteStatus: string
  onApprovalChange?: () => void
}

export const ApprovalStatus: React.FC<ApprovalStatusProps> = ({ 
  quoteId, 
  quoteValue, 
  quoteStatus,
  onApprovalChange 
}) => {
  const [approvalData, setApprovalData] = useState<any>(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvalComments, setApprovalComments] = useState('')
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve')
  
  const { 
    userRole, 
    getApprovalRequirement, 
    canUserApprove, 
    getApprovalMessage,
    submitForApproval,
    approve,
    reject,
    getApprovalStatus,
    loading 
  } = useApproval()

  const approvalRequirement = getApprovalRequirement(quoteValue)
  const approvalMessage = getApprovalMessage(quoteValue)
  const userCanApprove = canUserApprove(quoteValue)

  useEffect(() => {
    const fetchApprovalData = async () => {
      if (quoteId && quoteStatus === 'pending_approval') {
        try {
          const data = await getApprovalStatus(quoteId)
          setApprovalData(data)
        } catch (error) {
          console.error('Error fetching approval data:', error)
        }
      }
    }

    fetchApprovalData()
  }, [quoteId, quoteStatus, getApprovalStatus])

  const handleSubmitForApproval = async () => {
    try {
      console.log('🔄 Submitting quote for approval from ApprovalStatus component')
      await submitForApproval(quoteId)
      console.log('✅ Quote submitted successfully, triggering refresh')
     
     // Force refresh the current quote data to reflect the new status
     if (onApprovalChange) {
       onApprovalChange()
     }
     
     // Also trigger a page refresh to ensure all data is current
     setTimeout(() => {
       window.location.reload()
     }, 500)
     
    } catch (error) {
      console.error('Error submitting for approval:', error)
    }
  }

  const handleApprovalAction = async () => {
    if (!userRole) return
    
    try {
      if (actionType === 'approve') {
        await approve(quoteId, approvalComments)
      } else {
        await reject(quoteId, approvalComments)
      }
      
      setShowApprovalModal(false)
      setApprovalComments('')
      if (onApprovalChange) onApprovalChange()
    } catch (error) {
      console.error('Error processing approval:', error)
    }
  }

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50 border-green-200'
      case 'rejected': return 'text-red-600 bg-red-50 border-red-200'
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const requiresApproval = quoteValue >= 25000 || quoteStatus === 'pending_approval'

  return (
    <div className="space-y-4">
      {/* Approval Requirement Message */}
      {requiresApproval && (
        <div className={`p-4 rounded-lg border ${
          quoteStatus === 'pending_approval' 
            ? 'bg-yellow-50 border-yellow-200' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start space-x-3">
            <Shield className={`h-5 w-5 mt-0.5 ${
              quoteStatus === 'pending_approval' ? 'text-yellow-600' : 'text-blue-600'
            }`} />
            <div className="flex-1">
              <h4 className={`font-medium ${
                quoteStatus === 'pending_approval' ? 'text-yellow-900' : 'text-blue-900'
              }`}>
                {quoteStatus === 'pending_approval' ? 'Approval Pending' : 'Approval Required'}
              </h4>
              <p className={`text-sm mt-1 ${
                quoteStatus === 'pending_approval' ? 'text-yellow-800' : 'text-blue-800'
              }`}>
                {approvalMessage}
              </p>
              
              {quoteValue >= 300000 && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">
                      High Value Quote: Requires BOTH VP and President approval
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Current Approval Status */}
      {approvalData && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Approval Status</h4>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
              getApprovalStatusColor(approvalData.status)
            }`}>
              {approvalData.status.charAt(0).toUpperCase() + approvalData.status.slice(1)}
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Required Level:</span>
              <span className="font-medium text-gray-900">{approvalData.approval_level}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress:</span>
              <span className="font-medium text-gray-900">
                {approvalData.current_approvers} of {approvalData.required_approvers} approvals
              </span>
            </div>
            
            {/* Approval History */}
            {approvalData.approval_actions && approvalData.approval_actions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h5 className="font-medium text-gray-900 mb-2">Approval History</h5>
                <div className="space-y-2">
                  {approvalData.approval_actions.map((action: any) => (
                    <div key={action.id} className="flex items-start space-x-3 text-sm">
                      <div className={`p-1 rounded-full ${
                        action.action === 'approved' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {action.action === 'approved' ? (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">
                            {action.profiles?.full_name || 'Unknown User'}
                          </span>
                          <span className="text-gray-500">({action.approver_role})</span>
                          <span className={`font-medium ${
                            action.action === 'approved' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {action.action}
                          </span>
                        </div>
                        <div className="text-gray-500">
                          {new Date(action.approved_at).toLocaleString()}
                        </div>
                        {action.comments && (
                          <div className="mt-1 text-gray-700 bg-gray-50 p-2 rounded text-xs">
                            {action.comments}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center space-x-3">
        {quoteStatus === 'pending_approval' && userCanApprove && (
          <>
            <button
              onClick={() => {
                setActionType('approve')
                setShowApprovalModal(true)
              }}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </button>
            <button
              onClick={() => {
                setActionType('reject')
                setShowApprovalModal(true)
              }}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </button>
          </>
        )}
        
        {quoteStatus === 'pending_approval' && !userCanApprove && (
          <div className="text-sm text-gray-600">
            You do not have authority to approve this quote. Required level: {approvalRequirement.level}
          </div>
        )}
      </div>

      {/* Approval Action Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {actionType === 'approve' ? 'Approve Quote' : 'Reject Quote'}
              </h3>
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
                  Quote Value: ${quoteValue.toLocaleString()}
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
                  setShowApprovalModal(false)
                  setApprovalComments('')
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApprovalAction}
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