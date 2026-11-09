import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'

type Comunes = { etiqueta: string; ayuda?: string; error?: string }

const control =
  'w-full rounded-xl border bg-white px-4 text-base text-stone-900 placeholder:text-stone-500 focus:border-accion'

function Envoltorio({
  id,
  etiqueta,
  ayuda,
  error,
  children,
}: Comunes & { id: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-base font-semibold text-stone-900">
        {etiqueta}
      </label>
      {children}
      {ayuda && !error && (
        <p id={`${id}-ayuda`} className="text-base text-stone-600">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-base font-medium text-error">
          {error}
        </p>
      )}
    </div>
  )
}

const descrito = (id: string, ayuda?: string, error?: string) =>
  error ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined

export function Campo({
  etiqueta,
  ayuda,
  error,
  className = '',
  ...resto
}: Comunes & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <Envoltorio id={id} etiqueta={etiqueta} ayuda={ayuda} error={error}>
      <input
        id={id}
        {...resto}
        aria-invalid={!!error}
        aria-describedby={descrito(id, ayuda, error)}
        className={`${control} h-11 ${error ? 'border-error' : 'border-stone-300'} ${className}`}
      />
    </Envoltorio>
  )
}

export function CampoSelect({
  etiqueta,
  ayuda,
  error,
  className = '',
  children,
  ...resto
}: Comunes & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId()
  return (
    <Envoltorio id={id} etiqueta={etiqueta} ayuda={ayuda} error={error}>
      <select
        id={id}
        {...resto}
        aria-invalid={!!error}
        aria-describedby={descrito(id, ayuda, error)}
        className={`${control} h-11 ${error ? 'border-error' : 'border-stone-300'} ${className}`}
      >
        {children}
      </select>
    </Envoltorio>
  )
}

export function CampoTexto({
  etiqueta,
  ayuda,
  error,
  className = '',
  ...resto
}: Comunes & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  return (
    <Envoltorio id={id} etiqueta={etiqueta} ayuda={ayuda} error={error}>
      <textarea
        id={id}
        {...resto}
        aria-invalid={!!error}
        aria-describedby={descrito(id, ayuda, error)}
        className={`${control} min-h-28 py-3 ${error ? 'border-error' : 'border-stone-300'} ${className}`}
      />
    </Envoltorio>
  )
}