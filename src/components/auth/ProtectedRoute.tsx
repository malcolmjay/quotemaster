import React, { useState, useRef, useEffect } from 'react'
import { useAuthContext } from './AuthProvider'
import { LoginForm } from './LoginForm'
import { WelcomeModal } from './WelcomeModal'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuthContext()
  const [showWelcome, setShowWelcome] = useState(false)
  const previousUserRef = useRef<string | null>(null)

  useEffect(() => {
    if (!loading && user && previousUserRef.current === null) {
      setShowWelcome(true)
    }
    previousUserRef.current = user?.id ?? null
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

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

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
