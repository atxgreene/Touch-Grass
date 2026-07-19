interface Props {
  value: number
  count?: number
  showNumber?: boolean
}

export function StarRating({ value, count, showNumber = true }: Props) {
  const rounded = Math.round(value)
  return (
    <span className="stars" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`star${n <= rounded ? '' : ' empty'}`}>
          ★
        </span>
      ))}
      {showNumber && (
        <span className="stars__num">
          {value.toFixed(1)}
          {count != null ? ` (${count})` : ''}
        </span>
      )}
    </span>
  )
}
