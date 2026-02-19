'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function RegisterPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords don't match")
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-[10px] bg-accent flex items-center justify-center">
              <span className="text-background font-bold text-xl font-serif">T</span>
            </div>
            <span className="font-serif text-3xl font-semibold text-text-primary">Trevio</span>
          </div>
          <h1 className="font-serif text-2xl font-semibold text-text-primary mb-2">Create account</h1>
          <p className="text-text-muted text-sm">Join Trevio to manage your photo orders</p>
        </div>

        <div className="bg-card border border-[#2E2E2E] rounded-[16px] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field"
                placeholder="Min. 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="label" htmlFor="confirm-password">Confirm password</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="input-field"
                placeholder="Repeat your password"
                required
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="bg-status-cancelled/10 border border-status-cancelled/20 rounded-[8px] px-4 py-3">
                <p className="text-status-cancelled text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Creating account...</span>
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-text-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-accent hover:text-accent-dark font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
