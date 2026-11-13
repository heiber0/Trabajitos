import { useState } from 'react'
import { Briefcase, MessageSquareQuote, UserCircle, ExternalLink } from 'lucide-react'
import { useSesion } from '../lib/useSesion'
import { BotonEnlace } from '../components/ui/Boton'
import { FormPerfil } from '../features/perfil/FormPerfil'
import { GaleriaFotos } from '../features/perfil/GaleriaFotos'
import { BandejaPrestador } from '../features/solicitudes/BandejaPrestador'
import { OpinionesPrestador } from '../features/valoraciones/OpinionesPrestador'
import { VerificacionPrestador } from '../features/perfil/VerificacionPrestador'

type Pestana = 'solicitudes' | 'opiniones' | 'perfil'

const PESTANAS: { id: Pestana; etiqueta: string; icono: typeof Briefcase }[] = [
  { id: 'solicitudes', etiqueta: 'Solicitudes y trabajos', icono: Briefcase },
  { id: 'opiniones', etiqueta: 'Opiniones de clientes', icono: MessageSquareQuote },
  { id: 'perfil', etiqueta: 'Mi perfil profesional', icono: UserCircle },
]

export function PanelPrestador() {
  const { usuario } = useSesion()
  const [pestana, setPestana] = useState<Pestana>('solicitudes')

  if (!usuario) return null

  return (
    <div className="mx-auto w-[90%] py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200/80">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-primario tracking-tight">
            Panel del prestador
          </h1>
          <p className="mt-1 text-base text-stone-600">
            Gestiona tus solicitudes de trabajo, revisa tus valoraciones y mantén actualizado tu perfil.
          </p>
        </div>
        <BotonEnlace to={`/prestador/${usuario.id}`} variante="secundario" className="inline-flex items-center gap-2">
          <span>Ver mi perfil público</span>
          <ExternalLink className="h-4 w-4 text-stone-400" />
        </BotonEnlace>
      </div>

      <div role="tablist" aria-label="Secciones del panel" className="mt-8 flex flex-wrap gap-2.5">
        {PESTANAS.map((p) => {
          const Icono = p.icono
          return (
            <button
              key={p.id}
              role="tab"
              aria-selected={pestana === p.id}
              onClick={() => setPestana(p.id)}
              className={`inline-flex items-center gap-2 h-11 rounded-full px-5 text-base font-semibold transition-all ${
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

      <div className="mt-8">
        {pestana === 'solicitudes' && <BandejaPrestador userId={usuario.id} />}
        {pestana === 'opiniones' && <OpinionesPrestador userId={usuario.id} />}
        {pestana === 'perfil' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <VerificacionPrestador userId={usuario.id} />
            <FormPerfil userId={usuario.id} />
            <GaleriaFotos userId={usuario.id} />
          </div>
        )}
      </div>
    </div>
  )
}
