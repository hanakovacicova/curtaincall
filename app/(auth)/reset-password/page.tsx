'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase exchanges the token from the URL hash and sets the session
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Heslá sa nezhodujú.'); return }
    if (password.length < 6) { setError('Heslo musí mať aspoň 6 znakov.'); return }
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }
    router.push('/')
  }

  const fieldClass = "w-full px-4 py-3 rounded-lg text-sm border bg-transparent outline-none focus:border-[var(--gold)] transition-colors"
  const fieldStyle = { borderColor: 'var(--border)', color: 'var(--foreground)' }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-2xl font-bold mb-8" style={{ color: 'var(--gold)' }}>
          CurtainCall
        </Link>
        <h1 className="text-xl font-semibold mb-6 text-center">Nové heslo</h1>

        {!ready ? (
          <p className="text-sm text-center" style={{ color: 'var(--muted)' }}>
            Overovanie odkazu…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="password"
              placeholder="Nové heslo"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className={fieldClass}
              style={fieldStyle}
            />
            <input
              type="password"
              placeholder="Zopakujte heslo"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
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
              {loading ? 'Ukladanie…' : 'Uložiť heslo'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
