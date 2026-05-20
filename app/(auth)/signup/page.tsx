'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (username.length < 3) { setError('Používateľské meno musí mať aspoň 3 znaky'); return }
    if (!/^[a-z0-9_]+$/.test(username)) { setError('Používateľské meno môže obsahovať iba malé písmená, čísla a podčiarkovníky'); return }

    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, display_name: username } },
    })

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
        <h1 className="text-xl font-semibold mb-6 text-center">Vytvoriť účet</h1>
        <form onSubmit={handleSignup} className="flex flex-col gap-3">
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
            placeholder="Používateľské meno (napr. divadelnik)"
            value={username}
            onChange={e => setUsername(e.target.value.toLowerCase())}
            required
            className={fieldClass}
            style={fieldStyle}
          />
          <input
            type="password"
            placeholder="Heslo (min. 6 znakov)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
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
            {loading ? 'Vytváram účet…' : 'Začať'}
          </button>
        </form>
        <p className="text-center text-sm mt-6" style={{ color: 'var(--muted)' }}>
          Máte už účet?{' '}
          <Link href="/login" className="hover:text-[var(--gold)] underline underline-offset-2">
            Prihlásiť sa
          </Link>
        </p>
      </div>
    </div>
  )
}
