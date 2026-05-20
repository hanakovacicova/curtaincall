'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Props = { followerId: string; followingId: string; initialIsFollowing: boolean }

export default function FollowButton({ followerId, followingId, initialIsFollowing }: Props) {
  const [following, setFollowing] = useState(initialIsFollowing)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function toggle() {
    setLoading(true)
    if (following) {
      await supabase.from('follows').delete().eq('follower_id', followerId).eq('following_id', followingId)
    } else {
      await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId })
    }
    setFollowing(!following)
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="text-sm px-4 py-1.5 rounded-full border transition-colors disabled:opacity-50 shrink-0"
      style={{
        borderColor: following ? 'var(--gold)' : 'var(--border)',
        color: following ? 'var(--gold)' : 'var(--muted)',
        background: following ? 'transparent' : 'transparent',
      }}
    >
      {following ? 'Following' : 'Follow'}
    </button>
  )
}
