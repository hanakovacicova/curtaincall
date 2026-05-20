'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Production } from '@/lib/types'

type Props = { productions: Production[]; userId: string }

export default function LogThisButton({ productions, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [selectedProd, setSelectedProd] = useState(productions[0]?.id ?? '')
  const [watchedAt, setWatchedAt] = useState(new Date().toISOString().split('T')[0])
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [loading, setLoading] = useState(false)

  async function save() {
    if (!selectedProd) return
    setLoading(true)
    await supabase.from('logs').upsert({
      user_id: userId,
      production_id: selectedProd,
      watched_at: watchedAt,
      rating: rating || null,
      review: review.trim() || null,
    }, { onConflict: 'user_id,production_id' })
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  const fieldClass = "w-full px-3 py-2 rounded-lg text-sm border bg-transparent outline-none focus:border-[var(--gold)] transition-colors"
  const fieldStyle = { borderColor: 'var(--border)', color: 'var(--foreground)' }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm px-3 py-1.5 rounded-full font-medium transition-colors"
        style={{ background: 'var(--gold)', color: '#0f0f0f' }}
      >
        Log this
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl p-5 flex flex-col gap-4"
            style={{ background: 'var(--surface-2)' }}
            onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold">Log this production</h3>

            {productions.length > 1 && (
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--muted)' }}>Production</label>
                <select value={selectedProd} onChange={e => setSelectedProd(e.target.value)}
                  className={fieldClass} style={{ ...fieldStyle, background: 'var(--surface)' }}>
                  {productions.map(p => (
                    <option key={p.id} value={p.id}>
                      {[p.venue, p.city, p.year].filter(Boolean).join(' · ') || 'Unknown production'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--muted)' }}>Date seen</label>
              <input type="date" value={watchedAt} onChange={e => setWatchedAt(e.target.value)} className={fieldClass} style={fieldStyle} />
            </div>

            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--muted)' }}>Rating</label>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(s => (
                  <button key={s} type="button" onClick={() => setRating(s === rating ? 0 : s)} className="text-xl">
                    <span style={{ color: rating >= s ? 'var(--gold)' : 'var(--border)' }}>★</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--muted)' }}>Review</label>
              <textarea value={review} onChange={e => setReview(e.target.value)} rows={3} className={fieldClass} style={fieldStyle} placeholder="What did you think?" />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setOpen(false)} className="flex-1 py-2 rounded-full text-sm border transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
                Cancel
              </button>
              <button onClick={save} disabled={loading} className="flex-1 py-2 rounded-full text-sm font-medium disabled:opacity-50"
                style={{ background: 'var(--gold)', color: '#0f0f0f' }}>
                {loading ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
