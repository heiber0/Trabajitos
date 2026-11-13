import { MapPin, ArrowRight } from 'lucide-react'
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
    <article className="flex flex-col justify-between rounded-3xl border border-stone-200/80 bg-white p-6 sm:p-7 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-amber-200 hover:-translate-y-0.5">
      <div>
        <div className="flex items-start gap-4">
          <div
            aria-hidden="true"
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primario text-xl font-bold text-white shadow-xs"
          >
            {iniciales}
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <h3 className="text-lg font-bold text-primario truncate">{p.nombre}</h3>
            {oficio && <p className="text-base font-medium text-stone-600">{oficio}</p>}
            <SelloVerificado />
          </div>
        </div>

        <div className="mt-5">
          <Estrellas promedio={p.promedio} total={p.total_valoraciones} />
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4 text-base text-stone-600">
          {mostrarDistancia ? (
            <span className="inline-flex items-center gap-1.5 font-medium">
              <MapPin className="h-4 w-4 text-amber-600" aria-hidden="true" />
              A {formatoDistancia(p.distancia_km)}
            </span>
          ) : (
            <span />
          )}
          <span>
            {p.tarifa_referencia ? (
              <>
                Desde <strong className="text-stone-900 font-bold">{formatoPesos(p.tarifa_referencia)}</strong>
              </>
            ) : (
              <span className="italic">Tarifa por acordar</span>
            )}
          </span>
        </div>
      </div>

      <BotonEnlace
        to={`/prestador/${p.perfil_id}`}
        variante="secundario"
        className="mt-6 w-full justify-between group"
      >
        <span>Ver perfil</span>
        <ArrowRight className="h-4 w-4 text-stone-400 transition-transform group-hover:translate-x-1 group-hover:text-accion" />
      </BotonEnlace>
    </article>
  )
}
