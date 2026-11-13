import type { HTMLAttributes } from 'react'

export function Tarjeta({ className = '', ...resto }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...resto}
      className={`rounded-3xl border border-stone-200/80 bg-white p-6 sm:p-8 shadow-sm transition-all duration-200 ${className}`}
    />
  )
}
