import { createClient } from '@/lib/supabase/server'
import PlayCard from '@/components/PlayCard'
import Link from 'next/link'

export default async function PlaysPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('plays')
    .select('*')
    .order('title')
    .limit(50)

  if (q) {
    query = query.or(`title.ilike.%${q}%,playwright.ilike.%${q}%`)
  }

  const { data: plays } = await query

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Hry</h2>
        <Link
          href="/plays/new"
          className="text-sm px-3 py-1.5 rounded-full border transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
        >
          + Pridať hru
        </Link>
      </div>

      <form className="mb-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="Hľadať podľa názvu alebo dramatika…"
          className="w-full px-4 py-2.5 rounded-lg text-sm border bg-transparent outline-none focus:border-[var(--gold)] transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
        />
      </form>

      {plays && plays.length > 0 ? (
        <div className="flex flex-col gap-3">
          {plays.map((play) => (
            <PlayCard key={play.id} play={play} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16" style={{ color: 'var(--muted)' }}>
          <p>{q ? `Nenašli sa žiadne hry pre „${q}"` : 'Zatiaľ žiadne hry.'}</p>
          <Link
            href="/plays/new"
            className="mt-3 inline-block text-sm hover:text-[var(--gold)] underline underline-offset-2"
          >
            Pridajte prvú
          </Link>
        </div>
      )}
    </div>
  )
}
