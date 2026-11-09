import { MapPin } from 'lucide-react'
import { BotonEnlace } from '../../components/ui/Boton'
import { Estrellas } from '../../components/ui/Estrellas'
import { SelloVerificado } from '../../components/ui/SelloVerificado'
import { formatoDistancia, formatoPesos } from '../../lib/formato'
import type { PrestadorCercano } from './api'

type Props = { p: PrestadorCercano; oficio?: string; mostrarDistancia?: boolean }

export function TarjetaPrestador({ p, oficio, mostrarDistancia = true }: Props) {
  const iniciales = p.nombre
    .split(' ')
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase()

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div>
        <div className="flex items-start gap-4">
          <div
            aria-hidden="true"
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primario text-xl font-bold text-white"
          >
            {iniciales}
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <h3 className="text-lg font-bold text-primario">{p.nombre}</h3>
            {oficio && <p className="text-base text-stone-700">{oficio}</p>}
            <SelloVerificado />
          </div>
        </div>

        <div className="mt-4">
          <Estrellas promedio={p.promedio} total={p.total_valoraciones} />
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-4 text-base text-stone-700">
          {mostrarDistancia ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-5 w-5" aria-hidden="true" />A {formatoDistancia(p.distancia_km)}
            </span>
          ) : (
            <span />
          )}
          <span>
            {p.tarifa_referencia ? (
              <>
                Tarifa: <strong className="text-stone-900">{formatoPesos(p.tarifa_referencia)}</strong>
              </>
            ) : (
              'Tarifa por acordar'
            )}
          </span>
        </div>
      </div>

      <BotonEnlace to={`/prestador/${p.perfil_id}`} variante="secundario" className="mt-5 w-full">
        Ver perfil
      </BotonEnlace>
    </article>
  )
}