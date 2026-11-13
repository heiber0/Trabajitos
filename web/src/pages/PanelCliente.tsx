import { useCallback, useEffect, useState } from 'react'
import { Boton, BotonEnlace } from '../components/ui/Boton'
import { Tarjeta } from '../components/ui/Tarjeta'
import { Aviso } from '../components/ui/Aviso'
import { EtiquetaEstado } from '../components/ui/EtiquetaEstado'
import { mensajeError } from '../features/auth/mensajes'
import {
  cancelarSolicitud,
  cargarMisSolicitudes,
  type Solicitud,
} from '../features/solicitudes/api'
import type { EstadoSolicitud } from '../features/solicitudes/estados'
import { ContactoSolicitud } from '../features/solicitudes/ContactoSolicitud'
import { cargarValoradas } from '../features/valoraciones/api'
import { formatoPesos } from '../lib/formato'
import { useSesion } from '../lib/useSesion'

type Filtro = 'todas' | 'activas' | 'finalizadas' | 'canceladas'

const ETIQUETA_FILTRO: Record<Filtro, string> = {
  todas: 'Todas',
  activas: 'En proceso',
  finalizadas: 'Finalizadas',
  canceladas: 'Canceladas',
}

const GRUPOS: Record<Filtro, EstadoSolicitud[] | null> = {
  todas: null,
  activas: ['pendiente', 'aceptada', 'en_curso'],
  finalizadas: ['finalizada'],
  canceladas: ['cancelada'],
}

function fechaTexto(iso: string | null) {
  return iso
    ? new Date(iso).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })
    : 'Sin fecha'
}

export function PanelCliente() {
  const { usuario } = useSesion()
  const userId = usuario?.id
  const [lista, setLista] = useState<Solicitud[]>([])
  const [valoradas, setValoradas] = useState<Set<string>>(new Set())
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando')
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [aviso, setAviso] = useState('')

  const recargar = useCallback(async () => {
    if (!userId) return
    try {
      const [datos, vals] = await Promise.all([cargarMisSolicitudes(), cargarValoradas(userId)])
      setLista(datos.filter((s) => s.rol_yo === 'cliente'))
      setValoradas(vals)
      setEstado('listo')
    } catch {
      setEstado('error')
    }
  }, [userId])

  useEffect(() => {
    void recargar()
  }, [recargar])

  async function cancelar(s: Solicitud) {
    if (!window.confirm('¿Seguro que quieres cancelar esta solicitud?')) return
    setAviso('')
    try {
      await cancelarSolicitud(s.id)
      await recargar()
    } catch (err) {
      setAviso(mensajeError(err))
    }
  }

  const grupo = GRUPOS[filtro]
  const visibles = grupo ? lista.filter((s) => grupo.includes(s.estado)) : lista

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-primario">Mis servicios</h1>
        <BotonEnlace to="/buscar" variante="secundario">
          Buscar prestadores
        </BotonEnlace>
      </div>

      <div role="group" aria-label="Filtrar por estado" className="mt-6 flex flex-wrap gap-2">
        {(Object.keys(ETIQUETA_FILTRO) as Filtro[]).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filtro === f}
            onClick={() => setFiltro(f)}
            className={`h-11 rounded-lg px-5 text-base font-semibold ${
              filtro === f
                ? 'bg-primario text-white'
                : 'border border-stone-300 bg-white text-stone-800 hover:bg-stone-100'
            }`}
          >
            {ETIQUETA_FILTRO[f]}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {aviso && <Aviso tipo="error">{aviso}</Aviso>}
        {estado === 'cargando' && (
          <p className="text-base text-stone-700">Cargando tus servicios...</p>
        )}
        {estado === 'error' && (
          <Aviso tipo="error">No pudimos cargar tus servicios. Recarga la página.</Aviso>
        )}
        {estado === 'listo' && visibles.length === 0 && (
          <Tarjeta className="text-center">
            <p className="text-lg font-semibold text-primario">
              Aún no tienes servicios en esta lista.
            </p>
            <div className="mt-4">
              <BotonEnlace to="/buscar">Buscar prestadores</BotonEnlace>
            </div>
          </Tarjeta>
        )}
        {estado === 'listo' &&
          visibles.map((s) => (
            <Tarjeta key={s.id} className="flex flex-wrap items-center justify-between gap-6">
              <div className="min-w-0 flex-1 space-y-2">
                <EtiquetaEstado estado={s.estado} />
                <h2 className="text-lg font-bold text-primario">{s.descripcion}</h2>
                <p className="text-base text-stone-700">
                  {s.prestador_nombre}
                  {s.oficio && ` · ${s.oficio}`} · {s.direccion ?? 'Sin dirección'}
                </p>
                <p className="text-base text-stone-700">{fechaTexto(s.fecha_programada)}</p>
                <ContactoSolicitud solicitudId={s.id} estado={s.estado} descripcion={s.descripcion} />
              </div>
              <div className="flex flex-col items-end gap-3">
                <p className="text-base text-stone-700">
                  Precio:{' '}
                  <strong className="text-stone-900">
                    {s.precio_acordado ? formatoPesos(s.precio_acordado) : 'Por acordar'}
                  </strong>
                </p>
                {s.estado === 'pendiente' && (
                  <Boton variante="secundario" onClick={() => void cancelar(s)}>
                    Cancelar solicitud
                  </Boton>
                )}
                {s.estado === 'finalizada' &&
                  (valoradas.has(s.id) ? (
                    <p className="text-base font-semibold text-emerald-800">
                      Ya valoraste este servicio
                    </p>
                  ) : (
                    <BotonEnlace to={`/valorar/${s.id}`}>Valorar servicio</BotonEnlace>
                  ))}
              </div>
            </Tarjeta>
          ))}
      </div>
    </div>
  )
}