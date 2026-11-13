import { useCallback, useEffect, useState } from 'react'
import { Boton, BotonEnlace } from '../components/ui/Boton'
import { Tarjeta } from '../components/ui/Tarjeta'
import { Aviso } from '../components/ui/Aviso'
import { EtiquetaEstado } from '../components/ui/EtiquetaEstado'
import { DialogoConfirmacion } from '../components/ui/Modal'
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
    : 'Sin fecha programada'
}

export function PanelCliente() {
  const { usuario } = useSesion()
  const userId = usuario?.id
  const [lista, setLista] = useState<Solicitud[]>([])
  const [valoradas, setValoradas] = useState<Set<string>>(new Set())
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando')
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [aviso, setAviso] = useState('')
  const [solicitudACancelar, setSolicitudACancelar] = useState<Solicitud | null>(null)
  const [cancelando, setCancelando] = useState(false)

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

  async function confirmarCancelacion() {
    if (!solicitudACancelar) return
    setCancelando(true)
    setAviso('')
    try {
      await cancelarSolicitud(solicitudACancelar.id)
      setSolicitudACancelar(null)
      await recargar()
    } catch (err) {
      setAviso(mensajeError(err))
    } finally {
      setCancelando(false)
    }
  }

  const grupo = GRUPOS[filtro]
  const visibles = grupo ? lista.filter((s) => grupo.includes(s.estado)) : lista

  return (
    <div className="mx-auto w-[90%] py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200/80">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-primario tracking-tight">
            Mis servicios solicitados
          </h1>
          <p className="mt-1 text-base text-stone-600">
            Revisa el estado de tus solicitudes, acuerda detalles y califica los trabajos.
          </p>
        </div>
        <BotonEnlace to="/buscar" variante="secundario">
          Buscar prestadores
        </BotonEnlace>
      </div>

      <div role="group" aria-label="Filtrar por estado" className="mt-8 flex flex-wrap gap-2.5">
        {(Object.keys(ETIQUETA_FILTRO) as Filtro[]).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filtro === f}
            onClick={() => setFiltro(f)}
            className={`h-11 rounded-full px-5 text-base font-semibold transition-all ${
              filtro === f
                ? 'bg-primario text-white shadow-xs'
                : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 hover:text-stone-900'
            }`}
          >
            {ETIQUETA_FILTRO[f]}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-5">
        {aviso && <Aviso tipo="error">{aviso}</Aviso>}
        {estado === 'cargando' && (
          <div className="py-16 text-center text-stone-500">
            <p className="text-base font-medium">Cargando tus solicitudes de servicio...</p>
          </div>
        )}
        {estado === 'error' && (
          <Aviso tipo="error">No pudimos cargar tus servicios. Por favor recarga la página.</Aviso>
        )}
        {estado === 'listo' && visibles.length === 0 && (
          <div className="rounded-3xl border border-stone-200/80 bg-white p-12 text-center shadow-xs">
            <p className="text-xl font-bold text-primario">
              Aún no tienes servicios en esta sección.
            </p>
            <p className="mt-2 text-base text-stone-600 max-w-md mx-auto">
              Cuando solicites un servicio a un prestador, podrás seguir su progreso y contactarlo desde aquí.
            </p>
            <div className="mt-6">
              <BotonEnlace to="/buscar">Explorar prestadores en Riohacha</BotonEnlace>
            </div>
          </div>
        )}
        {estado === 'listo' &&
          visibles.map((s) => (
            <Tarjeta key={s.id} className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8">
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <EtiquetaEstado estado={s.estado} />
                  <span className="text-sm text-stone-500 font-medium">
                    {fechaTexto(s.fecha_programada)}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-primario leading-snug">{s.descripcion}</h2>
                <p className="text-base text-stone-700">
                  Prestador: <strong className="font-semibold text-stone-900">{s.prestador_nombre}</strong>
                  {s.oficio && ` (${s.oficio})`} · Dirección: <span className="text-stone-800">{s.direccion ?? 'Sin dirección'}</span>
                </p>
                <div className="pt-1">
                  <ContactoSolicitud solicitudId={s.id} estado={s.estado} descripcion={s.descripcion} />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between border-t md:border-t-0 pt-4 md:pt-0 border-stone-100 gap-4 shrink-0">
                <div className="text-left md:text-right">
                  <span className="text-sm font-medium text-stone-500 block">Tarifa acordada</span>
                  <strong className="text-xl font-extrabold text-primario">
                    {s.precio_acordado ? formatoPesos(s.precio_acordado) : 'Por acordar'}
                  </strong>
                </div>

                <div className="flex items-center gap-3">
                  {s.estado === 'pendiente' && (
                    <Boton variante="secundario" onClick={() => setSolicitudACancelar(s)}>
                      Cancelar solicitud
                    </Boton>
                  )}
                  {s.estado === 'finalizada' &&
                    (valoradas.has(s.id) ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-3.5 py-1 text-sm font-semibold text-emerald-800">
                        Servicio valorado
                      </span>
                    ) : (
                      <BotonEnlace to={`/valorar/${s.id}`}>Valorar servicio</BotonEnlace>
                    ))}
                </div>
              </div>
            </Tarjeta>
          ))}
      </div>

      {/* Diálogo emergente moderno para cancelar */}
      <DialogoConfirmacion
        abierto={!!solicitudACancelar}
        alCerrar={() => setSolicitudACancelar(null)}
        alConfirmar={confirmarCancelacion}
        titulo="¿Cancelar esta solicitud?"
        mensaje="Si cancelas la solicitud, el prestador será notificado y no se llevará a cabo el servicio."
        textoConfirmar="Sí, cancelar solicitud"
        textoCancelar="Volver"
        peligroso
        cargando={cancelando}
      />
    </div>
  )
}
