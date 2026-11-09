export function Pasos({ actual, total }: { actual: number; total: number }) {
  return (
    <div>
      <p className="mb-2 text-base font-semibold text-stone-700">
        Paso {actual} de {total}
      </p>
      <div className="flex gap-2" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full ${i < actual ? 'bg-accion' : 'bg-stone-200'}`}
          />
        ))}
      </div>
    </div>
  )
}