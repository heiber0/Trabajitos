import type { ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

export type Variante = 'primario' | 'secundario' | 'fantasma' | 'peligro'

const base =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-base font-semibold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 shadow-sm'

const variantes: Record<Variante, string> = {
  primario:
    'bg-accion text-white hover:bg-accion-oscuro hover:shadow-md focus-visible:ring-4 focus-visible:ring-amber-500/20',
  secundario:
    'border border-stone-200 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-300 hover:text-stone-900',
  fantasma:
    'shadow-none text-stone-700 hover:bg-stone-100/80 hover:text-stone-900',
  peligro:
    'bg-red-600 text-white hover:bg-red-700 hover:shadow-md focus-visible:ring-4 focus-visible:ring-red-500/20',
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
  children,
  ...resto
}: LinkProps & { variante?: Variante }) {
  return (
    <Link {...resto} className={`${base} ${variantes[variante]} ${className}`}>
      {children}
    </Link>
  )
}
