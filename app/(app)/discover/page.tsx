import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { UpcomingShow } from '@/lib/types'

const SK_DAYS = ['nedeľa', 'pondelok', 'utorok', 'streda', 'štvrtok', 'piatok', 'sobota']
const SK_MONTHS = [
  'januára', 'februára', 'marca', 'apríla', 'mája', 'júna',
  'júla', 'augusta', 'septembra', 'októbra', 'novembra', 'decembra',
]

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${SK_DAYS[d.getDay()]} ${d.getDate()}. ${SK_MONTHS[d.getMonth()]}`
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function groupByDate(shows: UpcomingShow[]): Record<string, UpcomingShow[]> {
  const groups: Record<string, UpcomingShow[]> = {}
  for (const show of shows) {
    const key = show.starts_at.slice(0, 10)
    if (!groups[key]) groups[key] = []
    groups[key].push(show)
  }
  return groups
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ theatre?: string }>
}) {
  const supabase = await createClient()
  const { theatre: theatreFilter } = await searchParams

  const { data: theatres } = await supabase
    .from('theatres')
    .select('id, name, slug, city, website')
    .order('name')

  let query = supabase
    .from('upcoming_shows')
    .select('*, theatre:theatres(id, name, slug, city, website)')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at')
    .limit(200)

  if (theatreFilter) {
    const theatre = theatres?.find(t => t.slug === theatreFilter)
    if (theatre) query = query.eq('theatre_id', theatre.id)
  }

  const { data: shows } = await query

  const grouped = groupByDate((shows ?? []) as UpcomingShow[])
  const dates = Object.keys(grouped).sort()

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>
        Program
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
        Najbližšie predstavenia v bratislavských divadlách
      </p>

      {/* Theatre filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href="/discover"
          className="text-xs px-3 py-1 rounded-full border transition-colors"
          style={{
            borderColor: !theatreFilter ? 'var(--gold)' : 'var(--border)',
            color: !theatreFilter ? 'var(--gold)' : 'var(--muted)',
            background: !theatreFilter ? 'var(--gold)/10' : 'transparent',
          }}
        >
          Všetky
        </Link>
        {theatres?.map(t => (
          <Link
            key={t.id}
            href={`/discover?theatre=${t.slug}`}
            className="text-xs px-3 py-1 rounded-full border transition-colors"
            style={{
              borderColor: theatreFilter === t.slug ? 'var(--gold)' : 'var(--border)',
              color: theatreFilter === t.slug ? 'var(--gold)' : 'var(--muted)',
            }}
          >
            {t.name}
          </Link>
        ))}
      </div>

      {dates.length === 0 && (
        <p className="text-center py-12" style={{ color: 'var(--muted)' }}>
          Žiadne nadchádzajúce predstavenia
        </p>
      )}

      {dates.map(date => (
        <div key={date} className="mb-8">
          <h2
            className="text-xs font-semibold uppercase tracking-wider mb-3 pb-2 border-b"
            style={{ color: 'var(--gold)', borderColor: 'var(--border)' }}
          >
            {formatDate(grouped[date][0].starts_at)}
          </h2>
          <div className="space-y-3">
            {grouped[date].map(show => (
              <div
                key={show.id}
                className="flex items-start gap-4 rounded-lg p-3"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div
                  className="text-sm font-mono shrink-0 pt-0.5"
                  style={{ color: 'var(--gold)', minWidth: '3.5rem' }}
                >
                  {formatTime(show.starts_at)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-snug">{show.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    {show.theatre?.name}
                    {show.venue && show.venue !== show.theatre?.name && ` · ${show.venue}`}
                  </p>
                  {show.description && (
                    <p
                      className="text-xs mt-1 line-clamp-2"
                      style={{ color: 'var(--muted)' }}
                    >
                      {show.description}
                    </p>
                  )}
                </div>
                {show.ticket_url && (
                  <a
                    href={show.ticket_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-2 py-1 rounded shrink-0"
                    style={{
                      background: 'var(--gold)',
                      color: '#0f0f0f',
                      fontWeight: 600,
                    }}
                  >
                    Lístky
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
