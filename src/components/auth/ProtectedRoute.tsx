import React, { useState, useEffect } from 'react'
import { useAuthContext } from './AuthProvider'
import { LoginForm } from './LoginForm'
import { WelcomeModal } from './WelcomeModal'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuthContext()
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      const shouldShow = sessionStorage.getItem('show_welcome_modal')
      if (shouldShow === 'true') {
        setShowWelcome(true)
        sessionStorage.removeItem('show_welcome_modal')
      }
    }
  }, [user, loading])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  const rawName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1)

  return (
    <>
      {showWelcome && (
        <WelcomeModal
          displayName={displayName}
          onAcknowledge={() => setShowWelcome(false)}
        />
      )}
      {children}
    </>
  )
}
