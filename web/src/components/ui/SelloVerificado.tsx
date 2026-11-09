import { BadgeCheck } from 'lucide-react'

export function SelloVerificado() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-base font-semibold text-emerald-800">
      <BadgeCheck className="h-5 w-5" aria-hidden="true" />
      Verificado
    </span>
  )
}