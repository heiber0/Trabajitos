import type { ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

type Variante = 'primario' | 'secundario' | 'fantasma'

const base =
  'inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60'

const variantes: Record<Variante, string> = {
  primario: 'bg-accion text-white hover:bg-accion-oscuro',
  secundario: 'border border-stone-300 bg-white text-primario hover:bg-stone-100',
  fantasma: 'text-primario hover:bg-stone-100',
}

type BotonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante
  cargando?: boolean
}

export function Boton({
  variante = 'primario',
  cargando = false,
  disabled,
  className = '',
  children,
  ...resto
}: BotonProps) {
  return (
    <button
      {...resto}
      disabled={disabled || cargando}
      className={`${base} ${variantes[variante]} ${className}`}
    >
      {cargando && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
      <span>{children}</span>
    </button>
  )
}

export function BotonEnlace({
  variante = 'primario',
  className = '',
  ...resto
}: LinkProps & { variante?: Variante }) {
  return <Link {...resto} className={`${base} ${variantes[variante]} ${className}`} />
}