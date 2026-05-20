import Link from 'next/link'
import StarRating from './StarRating'
import { Log } from '@/lib/types'

type Props = {
  log: Log
  showUser?: boolean
}

export default function LogCard({ log, showUser = false }: Props) {
  const play = log.production?.play
  const production = log.production
  if (!play) return null

  return (
    <div
      className="rounded-lg p-4 border transition-colors hover:border-[var(--gold)]/40"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {showUser && log.profile && (
        <Link
          href={`/profile/${log.profile.username}`}
          className="text-xs font-medium mb-2 block hover:text-[var(--gold)] transition-colors"
          style={{ color: 'var(--muted)' }}
        >
          @{log.profile.username}
        </Link>
      )}
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <Link
            href={`/plays/${play.id}`}
            className="font-semibold text-base hover:text-[var(--gold)] transition-colors truncate block"
          >
            {play.title}
          </Link>
          {play.playwright && (
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
              {play.playwright}
            </p>
          )}
          {production && (
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              {[production.venue, production.city, production.year].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {log.rating && <StarRating value={log.rating} readonly size={14} />}
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {new Date(log.watched_at).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </span>
        </div>
      </div>
      {log.review && (
        <p className="text-sm mt-3 leading-relaxed line-clamp-3" style={{ color: '#bbb' }}>
          &ldquo;{log.review}&rdquo;
        </p>
      )}
    </div>
  )
}
