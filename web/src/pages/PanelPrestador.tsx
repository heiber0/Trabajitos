import { useState } from 'react'
import { useSesion } from '../lib/useSesion'
import { BotonEnlace } from '../components/ui/Boton'
import { FormPerfil } from '../features/perfil/FormPerfil'
import { GaleriaFotos } from '../features/perfil/GaleriaFotos'
import { BandejaPrestador } from '../features/solicitudes/BandejaPrestador'

type Pestana = 'solicitudes' | 'perfil'

export function PanelPrestador() {
  const { usuario } = useSesion()
  const [pestana, setPestana] = useState<Pestana>('solicitudes')

  if (!usuario) return null

  const clase = (activa: boolean) =>
    `h-11 rounded-lg px-5 text-base font-semibold ${
      activa ? 'bg-primario text-white' : 'bg-white text-stone-800 hover:bg-stone-100'
    }`

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-primario">Mi panel</h1>
        <BotonEnlace to={`/prestador/${usuario.id}`} variante="secundario">
          Ver mi perfil público
        </BotonEnlace>
      </div>

      <div role="tablist" aria-label="Secciones" className="mt-6 flex gap-2">
        <button
          role="tab"
          aria-selected={pestana === 'solicitudes'}
          onClick={() => setPestana('solicitudes')}
          className={clase(pestana === 'solicitudes')}
        >
          Solicitudes
        </button>
        <button
          role="tab"
          aria-selected={pestana === 'perfil'}
          onClick={() => setPestana('perfil')}
          className={clase(pestana === 'perfil')}
        >
          Mi perfil
        </button>
      </div>

      <div className="mt-6">
        {pestana === 'solicitudes' ? (
          <BandejaPrestador userId={usuario.id} />
        ) : (
          <div className="max-w-3xl space-y-6">
            <FormPerfil userId={usuario.id} />
            <GaleriaFotos userId={usuario.id} />
          </div>
        )}
      </div>
    </div>
  )
}