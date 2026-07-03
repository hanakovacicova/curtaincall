'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { BookOpen, Search, Heart, User as UserIcon, LogOut, PlusCircle, CalendarDays } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single()
          .then(({ data }) => setUsername(data?.username ?? null))
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) setUsername(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navLink = (href: string, label: string, Icon: React.ElementType) => (
    <Link
      href={href}
      className={`flex flex-col items-center gap-0.5 text-xs transition-colors ${
        pathname === href
          ? 'text-[var(--gold)]'
          : 'text-[var(--muted)] hover:text-[var(--foreground)]'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </Link>
  )

  return (
    <>
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b"
        style={{ background: 'var(--background)', borderColor: 'var(--border)' }}>
        <Link href="/" className="text-xl font-bold tracking-wide" style={{ color: 'var(--gold)' }}>
          CurtainCall
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/plays/new"
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]"
                style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
              >
                <PlusCircle size={14} />
                Zapísať hru
              </Link>
              <button
                onClick={handleSignOut}
                className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm px-4 py-1.5 rounded-full border transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]"
              style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
            >
              Prihlásiť sa
            </Link>
          )}
        </div>
      </header>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-4 py-2 border-t"
        style={{ background: 'var(--background)', borderColor: 'var(--border)' }}>
        {navLink('/', 'Domov', BookOpen)}
        {navLink('/plays', 'Hry', Search)}
        {navLink('/discover', 'Program', CalendarDays)}
        {user && navLink('/watchlist', 'Zoznam prianí', Heart)}
        {user && username
          ? navLink(`/profile/${username}`, 'Profil', UserIcon)
          : !user && navLink('/login', 'Prihlásiť sa', UserIcon)}
      </nav>
    </>
  )
}
