import { createClient } from '@/lib/supabase/server'
import LogCard from '@/components/LogCard'
import Link from 'next/link'
import { Log } from '@/lib/types'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let feedLogs: Log[] = []

  if (user) {
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)

    const followingIds = (follows ?? []).map((f) => f.following_id)
    const ids = [...followingIds, user.id]

    const { data } = await supabase
      .from('logs')
      .select(`
        *,
        profile:profiles(*),
        production:productions(*, play:plays(*))
      `)
      .in('user_id', ids)
      .order('created_at', { ascending: false })
      .limit(30)

    feedLogs = (data ?? []) as Log[]
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--gold)' }}>CurtainCall</h1>
          <p className="text-lg" style={{ color: 'var(--muted)' }}>
            Váš divadelný denník. Sledujte každé predstavenie, ktoré ste videli.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/signup"
            className="px-6 py-2.5 rounded-full font-medium text-sm transition-colors"
            style={{ background: 'var(--gold)', color: '#0f0f0f' }}
          >
            Začať
          </Link>
          <Link
            href="/plays"
            className="px-6 py-2.5 rounded-full font-medium text-sm border transition-colors hover:border-[var(--gold)]"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            Prezrieť hry
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Aktivita</h2>
      {feedLogs.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--muted)' }}>
          <p className="mb-4">Zatiaľ nič.</p>
          <p className="text-sm">
            <Link href="/plays" className="hover:text-[var(--gold)] underline underline-offset-2">
              Prezrite hry
            </Link>{' '}
            alebo{' '}
            <Link href="/plays/new" className="hover:text-[var(--gold)] underline underline-offset-2">
              zapíšte hru, ktorú ste videli
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {feedLogs.map((log) => (
            <LogCard key={log.id} log={log} showUser />
          ))}
        </div>
      )}
    </div>
  )
}
