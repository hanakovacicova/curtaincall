import { createClient } from '@/lib/supabase/server'
import LogCard from '@/components/LogCard'
import { notFound } from 'next/navigation'
import { Log } from '@/lib/types'
import FollowButton from './FollowButton'

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const [logsRes, followersRes, followingRes, isFollowingRes] = await Promise.all([
    supabase
      .from('logs')
      .select('*, production:productions(*, play:plays(*))')
      .eq('user_id', profile.id)
      .order('watched_at', { ascending: false }),
    supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', profile.id),
    supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', profile.id),
    user && user.id !== profile.id
      ? supabase.from('follows').select('follower_id').eq('follower_id', user.id).eq('following_id', profile.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const logs = (logsRes.data ?? []) as Log[]
  const followerCount = followersRes.count ?? 0
  const followingCount = followingRes.count ?? 0
  const isFollowing = !!(isFollowingRes as { data: unknown }).data
  const isOwnProfile = user?.id === profile.id

  const byYear: Record<number, Log[]> = {}
  for (const log of logs) {
    const y = new Date(log.watched_at).getFullYear()
    if (!byYear[y]) byYear[y] = []
    byYear[y].push(log)
  }
  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a)

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-3">
        <div>
          <h1 className="text-xl font-bold">{profile.display_name || profile.username}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>@{profile.username}</p>
          {profile.bio && <p className="text-sm mt-2 leading-relaxed" style={{ color: '#bbb' }}>{profile.bio}</p>}
          <div className="flex gap-4 mt-3 text-sm" style={{ color: 'var(--muted)' }}>
            <span><strong style={{ color: 'var(--foreground)' }}>{logs.length}</strong> videných hier</span>
            <span><strong style={{ color: 'var(--foreground)' }}>{followerCount}</strong> sledovateľov</span>
            <span><strong style={{ color: 'var(--foreground)' }}>{followingCount}</strong> sledovaných</span>
          </div>
        </div>
        {!isOwnProfile && user && (
          <FollowButton followerId={user.id} followingId={profile.id} initialIsFollowing={isFollowing} />
        )}
      </div>

      {logs.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Zatiaľ žiadne záznamy.</p>
      ) : (
        years.map(year => (
          <section key={year} className="mb-6">
            <h2 className="text-sm uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--gold)' }}>
              {year}
              <span className="text-xs font-normal" style={{ color: 'var(--muted)' }}>
                ({byYear[year].length})
              </span>
            </h2>
            <div className="flex flex-col gap-3">
              {byYear[year].map(log => <LogCard key={log.id} log={log} />)}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
