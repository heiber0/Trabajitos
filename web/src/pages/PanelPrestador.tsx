import { useState } from 'react'
import { useSesion } from '../lib/useSesion'
import { BotonEnlace } from '../components/ui/Boton'
import { FormPerfil } from '../features/perfil/FormPerfil'
import { GaleriaFotos } from '../features/perfil/GaleriaFotos'
import { BandejaPrestador } from '../features/solicitudes/BandejaPrestador'
import { OpinionesPrestador } from '../features/valoraciones/OpinionesPrestador'
import { VerificacionPrestador } from '../features/perfil/VerificacionPrestador'

type Pestana = 'solicitudes' | 'opiniones' | 'perfil'

const PESTANAS: { id: Pestana; etiqueta: string }[] = [
  { id: 'solicitudes', etiqueta: 'Solicitudes' },
  { id: 'opiniones', etiqueta: 'Opiniones' },
  { id: 'perfil', etiqueta: 'Mi perfil' },
]

export function PanelPrestador() {
  const { usuario } = useSesion()
  const [pestana, setPestana] = useState<Pestana>('solicitudes')

  if (!usuario) return null

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-primario">Mi panel</h1>
        <BotonEnlace to={`/prestador/${usuario.id}`} variante="secundario">
          Ver mi perfil público
        </BotonEnlace>
      </div>

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

      <div className="mt-6">
        {pestana === 'solicitudes' && <BandejaPrestador userId={usuario.id} />}
        {pestana === 'opiniones' && <OpinionesPrestador userId={usuario.id} />}
        {pestana === 'perfil' && (
          <div className="max-w-3xl space-y-6">
            <VerificacionPrestador userId={usuario.id} />
            <FormPerfil userId={usuario.id} />
            <GaleriaFotos userId={usuario.id} />
          </div>
        )}
      </div>
    </div>
  )
}