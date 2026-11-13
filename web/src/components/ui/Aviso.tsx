import type { ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'

type Tipo = 'error' | 'exito' | 'info'

const estilos = {
  error: { caja: 'border-red-200/80 bg-red-50/90 text-red-900', Icono: AlertCircle, iconoColor: 'text-red-600' },
  exito: { caja: 'border-emerald-200/80 bg-emerald-50/90 text-emerald-900', Icono: CheckCircle2, iconoColor: 'text-emerald-600' },
  info: { caja: 'border-amber-200/70 bg-amber-50/70 text-amber-950', Icono: Info, iconoColor: 'text-amber-700' },
}

export function Aviso({ tipo = 'info', children }: { tipo?: Tipo; children: ReactNode }) {
  const { caja, Icono, iconoColor } = estilos[tipo]
  return (
    <div
      role={tipo === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-2xl border p-4 text-base shadow-sm/50 ${caja}`}
    >
      <Icono className={`mt-0.5 h-5 w-5 shrink-0 ${iconoColor}`} aria-hidden="true" />
      <div className="leading-relaxed">{children}</div>
    </div>
  )
}
