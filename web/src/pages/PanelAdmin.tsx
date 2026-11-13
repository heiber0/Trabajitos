import { useState } from 'react'
import { ShieldCheck, MessageSquareWarning } from 'lucide-react'
import { ModeracionAdmin } from '../features/admin/ModeracionAdmin'
import { VerificacionAdmin } from '../features/admin/VerificacionAdmin'

type Pestana = 'verificaciones' | 'moderacion'

const PESTANAS: { id: Pestana; etiqueta: string; icono: typeof ShieldCheck }[] = [
  { id: 'verificaciones', etiqueta: 'Verificaciones de identidad', icono: ShieldCheck },
  { id: 'moderacion', etiqueta: 'Moderación de comentarios', icono: MessageSquareWarning },
]

export function PanelAdmin() {
  const [pestana, setPestana] = useState<Pestana>('verificaciones')

  return (
    <div className="mx-auto w-[90%] py-10">
      <div className="pb-6 border-b border-stone-200/80">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-primario tracking-tight">
          Panel de Administración
        </h1>
        <p className="mt-1 text-base text-stone-600">
          Supervisa solicitudes de verificación de identidad y modera reportes de la comunidad.
        </p>
      </div>

      <div role="tablist" aria-label="Secciones administrativas" className="mt-8 flex flex-wrap gap-2.5">
        {PESTANAS.map((p) => {
          const Icono = p.icono
          return (
            <button
              key={p.id}
              role="tab"
              aria-selected={pestana === p.id}
              onClick={() => setPestana(p.id)}
              className={`inline-flex items-center gap-2 h-11 rounded-full px-6 text-base font-semibold transition-all ${
                pestana === p.id
                  ? 'bg-primario text-white shadow-xs'
                  : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <Icono className="h-4 w-4" />
              <span>{p.etiqueta}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-8 max-w-4xl">
        {pestana === 'verificaciones' ? <VerificacionAdmin /> : <ModeracionAdmin />}
      </div>
    </div>
  )
}
