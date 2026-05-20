import { createClient } from '@/lib/supabase/server'
import PlayCard from '@/components/PlayCard'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function WatchlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: items } = await supabase
    .from('watchlist')
    .select('*, play:plays(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Wishlist</h2>
      {!items || items.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--muted)' }}>
          <p className="mb-3">Your wishlist is empty.</p>
          <Link href="/plays" className="text-sm hover:text-[var(--gold)] underline underline-offset-2">
            Browse plays to add some
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => item.play && <PlayCard key={item.id} play={item.play} />)}
        </div>
      )}
    </div>
  )
}
