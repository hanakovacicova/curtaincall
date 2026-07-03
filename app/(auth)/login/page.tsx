'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/')
    router.refresh()
  }

  const fieldClass = "w-full px-4 py-3 rounded-lg text-sm border bg-transparent outline-none focus:border-[var(--gold)] transition-colors"
  const fieldStyle = { borderColor: 'var(--border)', color: 'var(--foreground)' }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-2xl font-bold mb-8" style={{ color: 'var(--gold)' }}>
          CurtainCall
        </Link>
        <h1 className="text-xl font-semibold mb-6 text-center">Prihlásiť sa</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className={fieldClass}
            style={fieldStyle}
          />
          <input
            type="password"
            placeholder="Heslo"
            value={password}
            onChange={e => setPassword(e.target.value)}
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
            {loading ? 'Prihlasovanie…' : 'Prihlásiť sa'}
          </button>
        </form>
        <p className="text-center text-sm mt-4" style={{ color: 'var(--muted)' }}>
          <Link href="/forgot-password" className="hover:text-[var(--gold)] underline underline-offset-2">
            Zabudli ste heslo?
          </Link>
        </p>
        <p className="text-center text-sm mt-3" style={{ color: 'var(--muted)' }}>
          Nemáte účet?{' '}
          <Link href="/signup" className="hover:text-[var(--gold)] underline underline-offset-2">
            Vytvoriť
          </Link>
        </p>
      </div>
    </div>
  )
}
