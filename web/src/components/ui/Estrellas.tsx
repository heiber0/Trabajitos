import { Star } from 'lucide-react'

export function Estrellas({ promedio, total }: { promedio: number; total: number }) {
  if (total === 0) {
    return <span className="text-base text-stone-700">Aún sin valoraciones</span>
  }
  const llenas = Math.round(promedio)
  return (
    <span
      role="img"
      aria-label={`Calificación ${promedio.toFixed(1)} de 5, ${total} valoraciones`}
      className="inline-flex items-center gap-2"
    >
      <span className="flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={`h-5 w-5 ${n <= llenas ? 'fill-amber-500 text-amber-500' : 'text-stone-300'}`}
          />
        ))}
      </span>
      <span className="text-base font-semibold text-stone-900">{promedio.toFixed(1)}</span>
      <span className="text-base text-stone-700">({total})</span>
    </span>
  )
}