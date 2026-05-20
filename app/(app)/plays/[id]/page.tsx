import { createClient } from '@/lib/supabase/server'
import LogCard from '@/components/LogCard'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Log } from '@/lib/types'
import AddToWatchlistButton from './AddToWatchlistButton'
import LogThisButton from './LogThisButton'

export default async function PlayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: play } = await supabase.from('plays').select('*').eq('id', id).single()
  if (!play) notFound()

  const { data: productions } = await supabase
    .from('productions')
    .select('*')
    .eq('play_id', id)
    .order('year', { ascending: false })

  const { data: logs } = await supabase
    .from('logs')
    .select('*, profile:profiles(*), production:productions(*, play:plays(*))')
    .eq('production.play_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  const typedLogs = (logs ?? []) as Log[]
  const avgRating = typedLogs.filter(l => l.rating).reduce((a, l, _, arr) => a + (l.rating ?? 0) / arr.length, 0)

  let onWatchlist = false
  if (user) {
    const { data } = await supabase.from('watchlist').select('id').eq('user_id', user.id).eq('play_id', id).maybeSingle()
    onWatchlist = !!data
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold leading-snug">{play.title}</h1>
            {play.playwright && (
              <p className="text-base mt-1" style={{ color: 'var(--muted)' }}>{play.playwright}</p>
            )}
          </div>
          {play.genre && (
            <span className="text-xs px-2 py-1 rounded-full border shrink-0 mt-1"
              style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
              {play.genre}
            </span>
          )}
        </div>

        {avgRating > 0 && (
          <div className="flex items-center gap-2 mt-3">
            <span className="text-lg" style={{ color: 'var(--gold)' }}>{'★'.repeat(Math.round(avgRating))}</span>
            <span className="text-sm" style={{ color: 'var(--muted)' }}>
              {avgRating.toFixed(1)} · {typedLogs.filter(l => l.rating).length} hodnotení
            </span>
          </div>
        )}

        {play.description && (
          <p className="text-sm mt-3 leading-relaxed" style={{ color: '#bbb' }}>{play.description}</p>
        )}

        {user && (
          <div className="flex gap-2 mt-4">
            <LogThisButton productions={productions ?? []} userId={user.id} />
            <AddToWatchlistButton playId={play.id} userId={user.id} initialOnWatchlist={onWatchlist} />
          </div>
        )}
      </div>

      {productions && productions.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm uppercase tracking-widest mb-3" style={{ color: 'var(--gold)' }}>Inscenácie</h2>
          <div className="flex flex-col gap-2">
            {productions.map(prod => (
              <div key={prod.id} className="p-3 rounded-lg border text-sm"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                {[prod.venue, prod.city, prod.year].filter(Boolean).join(' · ')}
                {prod.director && <span style={{ color: 'var(--muted)' }}> · réž. {prod.director}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm uppercase tracking-widest mb-3" style={{ color: 'var(--gold)' }}>
          Záznamy ({typedLogs.length})
        </h2>
        {typedLogs.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Zatiaľ žiadne záznamy. Buďte prvý!</p>
        ) : (
          <div className="flex flex-col gap-3">
            {typedLogs.map(log => <LogCard key={log.id} log={log} showUser />)}
          </div>
        )}
      </section>
    </div>
  )
}
