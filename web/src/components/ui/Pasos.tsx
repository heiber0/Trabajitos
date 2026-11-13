export function Pasos({ actual, total }: { actual: number; total: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-base font-semibold">
        <span className="text-stone-800">Progreso</span>
        <span className="text-accion">Paso {actual} de {total}</span>
      </div>
      <div className="flex gap-2" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`h-2.5 flex-1 rounded-full transition-all duration-300 ${
              i < actual ? 'bg-accion shadow-sm shadow-amber-500/20' : 'bg-stone-200'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
