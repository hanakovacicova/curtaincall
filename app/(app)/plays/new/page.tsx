'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const GENRES = ['Dráma', 'Komédia', 'Tragédia', 'Muzikál', 'Opera', 'Tanec', 'Fyzické divadlo', 'Experimentálne', 'Detské', 'Iné']

export default function NewPlayPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [playwright, setPlaywright] = useState('')
  const [genre, setGenre] = useState('')
  const [description, setDescription] = useState('')

  const [venue, setVenue] = useState('')
  const [director, setDirector] = useState('')
  const [year, setYear] = useState('')
  const [city, setCity] = useState('')

  const [watchedAt, setWatchedAt] = useState(new Date().toISOString().split('T')[0])
  const [rating, setRating] = useState<number>(0)
  const [review, setReview] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Názov je povinný'); return }
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()

    const { data: play, error: playError } = await supabase
      .from('plays')
      .insert({ title: title.trim(), playwright: playwright.trim() || null, genre: genre || null, description: description.trim() || null, created_by: user?.id ?? null })
      .select()
      .single()

    if (playError) { setError(playError.message); setLoading(false); return }

    const { data: production, error: prodError } = await supabase
      .from('productions')
      .insert({
        play_id: play.id,
        venue: venue.trim() || null,
        director: director.trim() || null,
        year: year ? parseInt(year) : null,
        city: city.trim() || null,
        created_by: user?.id ?? null,
      })
      .select()
      .single()

    if (prodError) { setError(prodError.message); setLoading(false); return }

    if (user) {
      await supabase.from('logs').insert({
        user_id: user.id,
        production_id: production.id,
        watched_at: watchedAt,
        rating: rating || null,
        review: review.trim() || null,
      })
    }

    router.push(`/plays/${play.id}`)
  }

  const fieldClass = "w-full px-4 py-2.5 rounded-lg text-sm border bg-transparent outline-none focus:border-[var(--gold)] transition-colors"
  const fieldStyle = { borderColor: 'var(--border)', color: 'var(--foreground)' }
  const labelClass = "block text-sm font-medium mb-1"
  const labelStyle = { color: 'var(--muted)' }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-6">Zapísať hru</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        <section>
          <h3 className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--gold)' }}>Hra</h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className={labelClass} style={labelStyle}>Názov *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="napr. Hamlet" className={fieldClass} style={fieldStyle} />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Dramatik</label>
              <input value={playwright} onChange={e => setPlaywright(e.target.value)} placeholder="napr. William Shakespeare" className={fieldClass} style={fieldStyle} />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Žáner</label>
              <select value={genre} onChange={e => setGenre(e.target.value)} className={fieldClass} style={{ ...fieldStyle, background: 'var(--surface)' }}>
                <option value="">Vybrať žáner</option>
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Popis</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Stručná synopsa alebo poznámky o hre…" className={fieldClass} style={fieldStyle} />
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--gold)' }}>Inscenácia</h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className={labelClass} style={labelStyle}>Miesto / Divadlo</label>
              <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="napr. Slovenské národné divadlo" className={fieldClass} style={fieldStyle} />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Réžia</label>
              <input value={director} onChange={e => setDirector(e.target.value)} placeholder="napr. Ján Novák" className={fieldClass} style={fieldStyle} />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={labelClass} style={labelStyle}>Rok</label>
                <input type="number" value={year} onChange={e => setYear(e.target.value)} placeholder={new Date().getFullYear().toString()} className={fieldClass} style={fieldStyle} />
              </div>
              <div className="flex-1">
                <label className={labelClass} style={labelStyle}>Mesto</label>
                <input value={city} onChange={e => setCity(e.target.value)} placeholder="napr. Bratislava" className={fieldClass} style={fieldStyle} />
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--gold)' }}>Vaša skúsenosť</h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className={labelClass} style={labelStyle}>Dátum návštevy</label>
              <input type="date" value={watchedAt} onChange={e => setWatchedAt(e.target.value)} className={fieldClass} style={fieldStyle} />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Hodnotenie</label>
              <div className="flex gap-1 mt-1">
                {[1,2,3,4,5].map(s => (
                  <button key={s} type="button" onClick={() => setRating(s === rating ? 0 : s)} className="text-2xl transition-transform hover:scale-110">
                    <span style={{ color: rating >= s ? 'var(--gold)' : 'var(--border)' }}>★</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Recenzia / poznámky</label>
              <textarea value={review} onChange={e => setReview(e.target.value)} rows={4} placeholder="Čo si myslíte?" className={fieldClass} style={fieldStyle} />
            </div>
          </div>
        </section>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-full font-medium text-sm transition-opacity disabled:opacity-50"
          style={{ background: 'var(--gold)', color: '#0f0f0f' }}
        >
          {loading ? 'Ukladám…' : 'Uložiť do denníka'}
        </button>
      </form>
    </div>
  )
}
