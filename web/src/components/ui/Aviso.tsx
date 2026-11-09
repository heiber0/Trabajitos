import type { ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'

type Tipo = 'error' | 'exito' | 'info'

const estilos = {
  error: { caja: 'border-red-200 bg-red-50 text-red-900', Icono: AlertCircle },
  exito: { caja: 'border-emerald-200 bg-emerald-50 text-emerald-900', Icono: CheckCircle2 },
  info: { caja: 'border-stone-200 bg-stone-100 text-stone-900', Icono: Info },
}

export function Aviso({ tipo = 'info', children }: { tipo?: Tipo; children: ReactNode }) {
  const { caja, Icono } = estilos[tipo]
  return (
    <div
      role={tipo === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-xl border p-4 text-base ${caja}`}
    >
      <Icono className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  )
}