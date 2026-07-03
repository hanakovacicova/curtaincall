'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)
    if (error) { setError(error.message); return }
    setSent(true)
  }

  const fieldClass = "w-full px-4 py-3 rounded-lg text-sm border bg-transparent outline-none focus:border-[var(--gold)] transition-colors"
  const fieldStyle = { borderColor: 'var(--border)', color: 'var(--foreground)' }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-2xl font-bold mb-8" style={{ color: 'var(--gold)' }}>
          CurtainCall
        </Link>
        <h1 className="text-xl font-semibold mb-2 text-center">Zabudli ste heslo?</h1>

        {sent ? (
          <div className="text-center">
            <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
              Skontrolujte si email. Poslali sme vám odkaz na obnovenie hesla.
            </p>
            <Link
              href="/login"
              className="text-sm hover:text-[var(--gold)] underline underline-offset-2"
              style={{ color: 'var(--muted)' }}
            >
              Späť na prihlásenie
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-center mb-6" style={{ color: 'var(--muted)' }}>
              Zadajte svoj email a pošleme vám odkaz na obnovenie hesla.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className={fieldClass}
                style={fieldStyle}
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full font-medium text-sm mt-1 transition-opacity disabled:opacity-50"
                style={{ background: 'var(--gold)', color: '#0f0f0f' }}
              >
                {loading ? 'Odosielanie…' : 'Poslať odkaz'}
              </button>
            </form>
            <p className="text-center text-sm mt-6" style={{ color: 'var(--muted)' }}>
              <Link href="/login" className="hover:text-[var(--gold)] underline underline-offset-2">
                Späť na prihlásenie
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
