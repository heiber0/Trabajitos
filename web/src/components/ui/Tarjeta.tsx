import type { HTMLAttributes } from 'react'

export function Tarjeta({ className = '', ...resto }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...resto}
      className={`rounded-2xl border border-stone-200 bg-white p-8 shadow-sm ${className}`}
    />
  )
}