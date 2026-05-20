import Link from 'next/link'
import { Play } from '@/lib/types'

type Props = {
  play: Play
  logCount?: number
}

export default function PlayCard({ play, logCount }: Props) {
  return (
    <Link
      href={`/plays/${play.id}`}
      className="block rounded-lg p-4 border transition-colors hover:border-[var(--gold)]/40"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <h3 className="font-semibold text-base leading-snug">{play.title}</h3>
      {play.playwright && (
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          {play.playwright}
        </p>
      )}
      <div className="flex items-center gap-2 mt-2">
        {play.genre && (
          <span
            className="text-xs px-2 py-0.5 rounded-full border"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            {play.genre}
          </span>
        )}
        {logCount !== undefined && (
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {logCount} {logCount === 1 ? 'záznam' : logCount < 5 ? 'záznamy' : 'záznamov'}
          </span>
        )}
      </div>
      {play.description && (
        <p className="text-sm mt-2 line-clamp-2 leading-relaxed" style={{ color: '#aaa' }}>
          {play.description}
        </p>
      )}
    </Link>
  )
}
