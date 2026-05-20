'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Heart } from 'lucide-react'

type Props = { playId: string; userId: string; initialOnWatchlist: boolean }

export default function AddToWatchlistButton({ playId, userId, initialOnWatchlist }: Props) {
  const [on, setOn] = useState(initialOnWatchlist)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function toggle() {
    setLoading(true)
    if (on) {
      await supabase.from('watchlist').delete().eq('user_id', userId).eq('play_id', playId)
    } else {
      await supabase.from('watchlist').insert({ user_id: userId, play_id: playId })
    }
    setOn(!on)
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50"
      style={{
        borderColor: on ? 'var(--gold)' : 'var(--border)',
        color: on ? 'var(--gold)' : 'var(--muted)',
      }}
    >
      <Heart size={14} fill={on ? 'var(--gold)' : 'none'} />
      {on ? 'V zozname prianí' : 'Chcem vidieť'}
    </button>
  )
}
