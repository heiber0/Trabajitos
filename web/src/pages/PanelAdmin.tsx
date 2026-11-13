import { useState } from 'react'
import { ModeracionAdmin } from '../features/admin/ModeracionAdmin'
import { VerificacionAdmin } from '../features/admin/VerificacionAdmin'

type Pestana = 'verificaciones' | 'moderacion'

const PESTANAS: { id: Pestana; etiqueta: string }[] = [
  { id: 'verificaciones', etiqueta: 'Verificaciones' },
  { id: 'moderacion', etiqueta: 'Moderación' },
]

export function PanelAdmin() {
  const [pestana, setPestana] = useState<Pestana>('verificaciones')

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-10">
      <h1 className="text-3xl font-bold text-primario">Administración</h1>

      <div role="tablist" aria-label="Secciones" className="mt-6 flex gap-2">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={pestana === p.id}
            onClick={() => setPestana(p.id)}
            className={`h-11 rounded-lg px-5 text-base font-semibold ${
              pestana === p.id
                ? 'bg-primario text-white'
                : 'bg-white text-stone-800 hover:bg-stone-100'
            }`}
          >
            {p.etiqueta}
          </button>
        ))}
      </div>

      <div className="mt-6 max-w-3xl">
        {pestana === 'verificaciones' ? <VerificacionAdmin /> : <ModeracionAdmin />}
      </div>
    </div>
  )
}