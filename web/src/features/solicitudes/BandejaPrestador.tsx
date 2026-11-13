import { useCallback, useEffect, useMemo, useState } from 'react'
import { Inbox, CheckCircle2, Clock, Star } from 'lucide-react'
import { Boton } from '../../components/ui/Boton'
import { Campo } from '../../components/ui/Campos'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { Aviso } from '../../components/ui/Aviso'
import { EtiquetaEstado } from '../../components/ui/EtiquetaEstado'
import { DialogoConfirmacion } from '../../components/ui/Modal'
import { formatoPesos } from '../../lib/formato'
import { mensajeError } from '../auth/mensajes'
import {
  cambiarEstado,
  cargarMisSolicitudes,
  cargarResumenPrestador,
  type Solicitud,
} from './api'
import type { EstadoSolicitud } from './estados'
import { ContactoSolicitud } from './ContactoSolicitud'

type Filtro = 'nuevas' | 'activas' | 'finalizadas' | 'canceladas' | 'todas'
type Mensaje = { tipo: 'exito' | 'error'; texto: string } | null

const GRUPOS: Record<Filtro, EstadoSolicitud[] | null> = {
  nuevas: ['pendiente'],
  activas: ['aceptada', 'en_curso'],
  finalizadas: ['finalizada'],
  canceladas: ['cancelada'],
  todas: null,
}

const ETIQUETA_FILTRO: Record<Filtro, string> = {
  nuevas: 'Nuevas solicitudes',
  activas: 'En curso',
  finalizadas: 'Finalizadas',
  canceladas: 'Canceladas',
  todas: 'Todas',
}

const EXITO: Partial<Record<EstadoSolicitud, string>> = {
  aceptada: 'Aceptaste la solicitud y fijaste el valor del trabajo.',
  en_curso: 'Marcaste el trabajo como iniciado.',
  finalizada: 'Marcaste el trabajo como terminado. El cliente ya puede valorarlo.',
  cancelada: 'Rechazaste la solicitud.',
}

function textoDe(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message)
  }
  return ''
}

function fechaTexto(iso: string | null) {
  return iso
    ? new Date(iso).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })
    : 'Sin fecha programada'
}

export function BandejaPrestador({ userId }: { userId: string }) {
  const [lista, setLista] = useState<Solicitud[]>([])
  const [resumen, setResumen] = useState({ promedio: 0, total: 0 })
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando')
  const [filtro, setFiltro] = useState<Filtro>('nuevas')
  const [aceptando, setAceptando] = useState<string>('')
  const [precio, setPrecio] = useState('')
  const [errorPrecio, setErrorPrecio] = useState('')
  const [accionando, setAccionando] = useState<string>('')
  const [mensaje, setMensaje] = useState<Mensaje>(null)

  // Modales de confirmación
  const [solicitudARechazar, setSolicitudARechazar] = useState<Solicitud | null>(null)
  const [solicitudAFinalizar, setSolicitudAFinalizar] = useState<Solicitud | null>(null)

  const recargar = useCallback(async () => {
    try {
      const [datos, res] = await Promise.all([cargarMisSolicitudes(), cargarResumenPrestador(userId)])
      setLista(datos.filter((s) => s.rol_yo === 'prestador'))
      setResumen(res)
      setEstado('listo')
    } catch {
      setEstado('error')
    }
  }, [userId])

  useEffect(() => {
    void recargar()
  }, [recargar])

  const cuenta = useMemo(() => {
    const contar = (f: Filtro) => {
      const grupo = GRUPOS[f]
      return grupo ? lista.filter((s) => grupo.includes(s.estado)).length : lista.length
    }
    return {
      nuevas: contar('nuevas'),
      activas: contar('activas'),
      finalizadas: contar('finalizadas'),
      canceladas: contar('canceladas'),
      todas: lista.length,
    }
  }, [lista])

  async function ejecutar(s: Solicitud, nuevo: EstadoSolicitud, valor?: number) {
    setAccionando(s.id)
    setMensaje(null)
    try {
      await cambiarEstado(s.id, nuevo, valor)
      setAceptando('')
      setPrecio('')
      setErrorPrecio('')
      setMensaje({ tipo: 'exito', texto: EXITO[nuevo] ?? 'Estado actualizado correctamente.' })
    } catch (err) {
      const t = textoDe(err).toLowerCase()
      if (t.includes('no permitido') || t.includes('no se pudo actualizar')) {
        setMensaje({
          tipo: 'error',
          texto:
            'Esta solicitud cambió mientras la mirabas (por ejemplo, el cliente la canceló). Actualizamos la lista.',
        })
        setAceptando('')
      } else {
        setMensaje({ tipo: 'error', texto: mensajeError(err) })
      }
    } finally {
      await recargar()
      setAccionando('')
    }
  }

  function abrirAceptar(id: string) {
    setAceptando(id)
    setPrecio('')
    setErrorPrecio('')
    setMensaje(null)
  }

  function cerrarAceptar() {
    setAceptando('')
    setPrecio('')
    setErrorPrecio('')
  }

  function confirmarAceptar(s: Solicitud) {
    const n = Number(precio)
    if (precio === '' || !Number.isInteger(n) || n < 10000) {
      setErrorPrecio('Escribe un valor desde $10.000, solo números sin puntos ni comas.')
      return
    }
    setErrorPrecio('')
    void ejecutar(s, 'aceptada', n)
  }

  const grupo = GRUPOS[filtro]
  const visibles = grupo ? lista.filter((s) => grupo.includes(s.estado)) : lista

  return (
    <div className="space-y-8">
      {/* Tarjetas de estadísticas superiores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Tarjeta className="p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-sm font-semibold">Nuevas por responder</span>
            <Inbox className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-3xl sm:text-4xl font-extrabold text-primario">{cuenta.nuevas}</p>
        </Tarjeta>

        <Tarjeta className="p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-sm font-semibold">Trabajos en curso</span>
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-3xl sm:text-4xl font-extrabold text-primario">{cuenta.activas}</p>
        </Tarjeta>

        <Tarjeta className="p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-sm font-semibold">Finalizados</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-3xl sm:text-4xl font-extrabold text-primario">{cuenta.finalizadas}</p>
        </Tarjeta>

        <Tarjeta className="p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-sm font-semibold">Calificación general</span>
            <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-primario">{resumen.promedio.toFixed(1)}</span>
            <span className="text-sm text-stone-500 font-medium">({resumen.total} opiniones)</span>
          </div>
        </Tarjeta>
      </div>

      {/* Selector de pestañas de filtro */}
      <div role="group" aria-label="Filtrar por estado" className="flex flex-wrap gap-2.5">
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
            {ETIQUETA_FILTRO[f]} ({cuenta[f]})
          </button>
        ))}
      </div>

      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}

      {estado === 'cargando' && (
        <div className="py-16 text-center text-stone-500">
          <p className="text-base font-medium">Cargando solicitudes de trabajo...</p>
        </div>
      )}

      {estado === 'error' && (
        <Aviso tipo="error">No pudimos cargar tus solicitudes. Por favor recarga la página.</Aviso>
      )}

      {estado === 'listo' && visibles.length === 0 && (
        <div className="rounded-3xl border border-stone-200/80 bg-white p-12 text-center shadow-xs">
          <p className="text-xl font-bold text-primario">
            No tienes solicitudes en esta categoría.
          </p>
          <p className="mt-2 text-base text-stone-600 max-w-md mx-auto">
            Cuando los clientes te envíen solicitudes o avancen los trabajos, los verás organizados aquí.
          </p>
        </div>
      )}

      {estado === 'listo' &&
        visibles.map((s) => (
          <Tarjeta key={s.id} className="space-y-6 p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <EtiquetaEstado estado={s.estado} />
                  <span className="text-sm font-medium text-stone-500">
                    {fechaTexto(s.fecha_programada)}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-primario leading-snug">{s.descripcion}</h2>
                <p className="text-base text-stone-700">
                  Cliente: <strong className="font-semibold text-stone-900">{s.cliente_nombre}</strong> · Dirección: <span className="text-stone-800">{s.direccion ?? 'Sin dirección'}</span>
                </p>
                <div className="pt-1">
                  <ContactoSolicitud solicitudId={s.id} estado={s.estado} descripcion={s.descripcion} />
                </div>
                <p className="text-base text-stone-700">
                  Valor del servicio:{' '}
                  <strong className="text-stone-900 font-bold">
                    {s.precio_acordado ? formatoPesos(s.precio_acordado) : 'Por acordar con el cliente'}
                  </strong>
                </p>
              </div>

              <div className="flex flex-col items-start md:items-end gap-3 shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-stone-100">
                {s.estado === 'pendiente' && aceptando !== s.id && (
                  <div className="flex gap-3">
                    <Boton
                      variante="secundario"
                      disabled={!!accionando}
                      onClick={() => setSolicitudARechazar(s)}
                    >
                      Rechazar
                    </Boton>
                    <Boton disabled={!!accionando} onClick={() => abrirAceptar(s.id)}>
                      Aceptar y fijar precio
                    </Boton>
                  </div>
                )}

                {s.estado === 'aceptada' && (
                  <Boton
                    cargando={accionando === s.id}
                    disabled={!!accionando}
                    onClick={() => void ejecutar(s, 'en_curso')}
                  >
                    Iniciar trabajo
                  </Boton>
                )}

                {s.estado === 'en_curso' && (
                  <Boton
                    cargando={accionando === s.id}
                    disabled={!!accionando}
                    onClick={() => setSolicitudAFinalizar(s)}
                  >
                    Marcar trabajo terminado
                  </Boton>
                )}

                {s.estado === 'finalizada' && (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-3.5 py-1 text-sm font-semibold text-emerald-800">
                    Trabajo completado
                  </span>
                )}
              </div>
            </div>

            {/* Formulario desplegable para acordar precio al aceptar */}
            {s.estado === 'pendiente' && aceptando === s.id && (
              <div className="space-y-4 rounded-3xl border border-amber-200/80 bg-amber-50/50 p-6 animate-modal-content">
                <h3 className="text-base font-bold text-primario">
                  Fija el valor total pactado para este servicio
                </h3>
                <Campo
                  etiqueta="Valor acordado (en pesos COP)"
                  ayuda="Mínimo $10.000 pesos. Este valor se mostrará en el resumen del cliente."
                  type="number"
                  inputMode="numeric"
                  min={10000}
                  step={1000}
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  error={errorPrecio}
                  placeholder="Ej: 50000"
                />
                <div className="flex gap-3 justify-end pt-2">
                  <Boton
                    variante="secundario"
                    disabled={accionando === s.id}
                    onClick={cerrarAceptar}
                  >
                    Cancelar
                  </Boton>
                  <Boton cargando={accionando === s.id} onClick={() => confirmarAceptar(s)}>
                    Confirmar y aceptar solicitud
                  </Boton>
                </div>
              </div>
            )}
          </Tarjeta>
        ))}

      {/* Diálogo emergente para rechazar solicitud */}
      <DialogoConfirmacion
        abierto={!!solicitudARechazar}
        alCerrar={() => setSolicitudARechazar(null)}
        alConfirmar={() => {
          if (solicitudARechazar) {
            const s = solicitudARechazar
            setSolicitudARechazar(null)
            void ejecutar(s, 'cancelada')
          }
        }}
        titulo="¿Rechazar esta solicitud?"
        mensaje="La solicitud quedará cancelada y el cliente será informado para que pueda contactar a otro profesional."
        textoConfirmar="Sí, rechazar"
        textoCancelar="Volver"
        peligroso
      />

      {/* Diálogo emergente para finalizar trabajo */}
      <DialogoConfirmacion
        abierto={!!solicitudAFinalizar}
        alCerrar={() => setSolicitudAFinalizar(null)}
        alConfirmar={() => {
          if (solicitudAFinalizar) {
            const s = solicitudAFinalizar
            setSolicitudAFinalizar(null)
            void ejecutar(s, 'finalizada')
          }
        }}
        titulo="¿Confirmar trabajo terminado?"
        mensaje="Al marcar el trabajo como finalizado, el cliente podrá calificar tu puntualidad, calidad, precio y trato."
        textoConfirmar="Sí, trabajo terminado"
        textoCancelar="Continuar trabajando"
      />
    </div>
  )
}
