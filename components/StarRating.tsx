'use client'

type Props = {
  value: number | null
  onChange?: (v: number) => void
  readonly?: boolean
  size?: number
}

export default function StarRating({ value, onChange, readonly = false, size = 20 }: Props) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
          style={{ fontSize: size, lineHeight: 1 }}
        >
          <span style={{ color: value && value >= star ? 'var(--gold)' : 'var(--border)' }}>★</span>
        </button>
      ))}
    </div>
  )
}
