import { Star } from 'lucide-react'

const ETIQUETAS = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente']

type Props = {
  etiqueta: string
  valor: number
  onChange: (n: number) => void
  error?: string
}

export function SelectorEstrellas({ etiqueta, valor, onChange, error }: Props) {
  return (
    <div className="space-y-1 border-b border-stone-100 pb-4">
      <div className="flex items-center justify-between gap-4">
        <span className="text-base font-semibold text-stone-900">{etiqueta}</span>
        <div role="radiogroup" aria-label={etiqueta} className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={valor === n}
              aria-label={`${n} de 5: ${ETIQUETAS[n]}`}
              onClick={() => onChange(n)}
              className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-stone-100"
            >
              <Star
                className={`h-7 w-7 ${n <= valor ? 'fill-amber-500 text-amber-500' : 'text-stone-400'}`}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      </div>
      <p className="text-right text-base text-stone-700" aria-live="polite">
        {valor ? ETIQUETAS[valor] : 'Elige de 1 a 5 estrellas'}
      </p>
      {error && (
        <p role="alert" className="text-base font-medium text-error">
          {error}
        </p>
      )}
    </div>
  )
}