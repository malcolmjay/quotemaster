import { useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, signIn, signUp, signOut } from '../lib/supabase'

/**
 * Convert Supabase auth errors to user-friendly messages
 */
const getAuthErrorMessage = (error: any): string => {
  const message = error?.message || String(error);

  if (message.includes('Invalid login credentials')) {
    return 'Incorrect email or password. Please try again.';
  }

  if (message.includes('Email not confirmed')) {
    return 'Please verify your email address before signing in.';
  }

  if (message.includes('Too many requests')) {
    return 'Too many login attempts. Please try again later.';
  }

  if (message.includes('User already registered')) {
    return 'This email is already registered. Please sign in instead.';
  }

  if (message.includes('Password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }

  if (message.includes('Unable to validate email')) {
    return 'Invalid email format. Please check and try again.';
  }

  // Return original message if no specific match
  return message;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false;
      subscription.unsubscribe()
    }
  }, [])

  const handleSignIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      await signIn(email, password)
    } catch (error) {
      setLoading(false)
      throw new Error(getAuthErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true)
      await signUp(email, password, fullName)
    } catch (error) {
      setLoading(false)
      throw new Error(getAuthErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      setLoading(true)
      await signOut()
    } catch (error) {
      setLoading(false)
      throw new Error('Failed to sign out. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    session,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut
  }
}