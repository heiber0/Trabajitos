import { useCallback, useEffect, useMemo, useState } from 'react'
import { Boton } from '../../components/ui/Boton'
import { Campo } from '../../components/ui/Campos'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { Aviso } from '../../components/ui/Aviso'
import { Estrellas } from '../../components/ui/Estrellas'
import { EtiquetaEstado } from '../../components/ui/EtiquetaEstado'
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
  nuevas: 'Nuevas',
  activas: 'En proceso',
  finalizadas: 'Finalizadas',
  canceladas: 'Canceladas',
  todas: 'Todas',
}

const EXITO: Record<EstadoSolicitud, string> = {
  pendiente: 'Listo.',
  aceptada: 'Solicitud aceptada. El cliente verá el valor acordado.',
  en_curso: 'Trabajo iniciado.',
  finalizada: 'Trabajo finalizado. El cliente ya puede valorarlo.',
  cancelada: 'Solicitud rechazada.',
}

function fechaTexto(iso: string | null) {
  return iso
    ? new Date(iso).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })
    : 'Sin fecha'
}

function textoDe(err: unknown) {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message)
  }
  return ''
}

export function BandejaPrestador({ userId }: { userId: string }) {
  const [lista, setLista] = useState<Solicitud[]>([])
  const [resumen, setResumen] = useState({ promedio: 0, total: 0 })
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando')
  const [filtro, setFiltro] = useState<Filtro>('nuevas')
  const [mensaje, setMensaje] = useState<Mensaje>(null)
  const [accionando, setAccionando] = useState('')
  const [aceptando, setAceptando] = useState('')
  const [precio, setPrecio] = useState('')
  const [errorPrecio, setErrorPrecio] = useState('')

  const recargar = useCallback(async () => {
    try {
      const [solicitudes, datos] = await Promise.all([
        cargarMisSolicitudes(),
        cargarResumenPrestador(userId),
      ])
      setLista(solicitudes.filter((s) => s.rol_yo === 'prestador'))
      setResumen(datos)
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
      setMensaje({ tipo: 'exito', texto: EXITO[nuevo] })
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
      setErrorPrecio('Escribe un valor desde 10000, solo números.')
      return
    }
    setErrorPrecio('')
    void ejecutar(s, 'aceptada', n)
  }

  function rechazar(s: Solicitud) {
    if (!window.confirm('¿Rechazar esta solicitud? No se puede deshacer.')) return
    void ejecutar(s, 'cancelada')
  }

  function finalizar(s: Solicitud) {
    if (!window.confirm('¿Confirmas que el trabajo terminó? El cliente podrá valorarlo.')) return
    void ejecutar(s, 'finalizada')
  }

  const grupo = GRUPOS[filtro]
  const visibles = grupo ? lista.filter((s) => grupo.includes(s.estado)) : lista

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Tarjeta className="p-5">
          <p className="text-base text-stone-700">Solicitudes nuevas</p>
          <p className="text-3xl font-bold text-primario">{cuenta.nuevas}</p>
        </Tarjeta>
        <Tarjeta className="p-5">
          <p className="text-base text-stone-700">Trabajos en proceso</p>
          <p className="text-3xl font-bold text-primario">{cuenta.activas}</p>
        </Tarjeta>
        <Tarjeta className="p-5">
          <p className="text-base text-stone-700">Finalizados</p>
          <p className="text-3xl font-bold text-primario">{cuenta.finalizadas}</p>
        </Tarjeta>
        <Tarjeta className="p-5">
          <p className="mb-1 text-base text-stone-700">Tu calificación</p>
          <Estrellas promedio={resumen.promedio} total={resumen.total} />
        </Tarjeta>
      </div>

      <div role="group" aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
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
            {ETIQUETA_FILTRO[f]} ({cuenta[f]})
          </button>
        ))}
      </div>

      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}

      {estado === 'cargando' && (
        <p className="text-base text-stone-700">Cargando tus solicitudes...</p>
      )}
      {estado === 'error' && (
        <Aviso tipo="error">No pudimos cargar tus solicitudes. Recarga la página.</Aviso>
      )}

      {estado === 'listo' && visibles.length === 0 && (
        <Tarjeta className="text-center">
          <p className="text-lg font-semibold text-primario">
            No tienes solicitudes en esta lista.
          </p>
          <p className="mt-1 text-base text-stone-700">
            Cuando un cliente te solicite un servicio, aparecerá aquí.
          </p>
        </Tarjeta>
      )}

      {estado === 'listo' &&
        visibles.map((s) => (
          <Tarjeta key={s.id} className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="min-w-0 flex-1 space-y-2">
                <EtiquetaEstado estado={s.estado} />
                <h2 className="text-lg font-bold text-primario">{s.descripcion}</h2>
                <p className="text-base text-stone-700">
                  Cliente: {s.cliente_nombre} · {s.direccion ?? 'Sin dirección'}
                </p>
                <p className="text-base text-stone-700">{fechaTexto(s.fecha_programada)}</p>
                <ContactoSolicitud solicitudId={s.id} estado={s.estado} descripcion={s.descripcion} />
                <p className="text-base text-stone-700">
                  Valor acordado:{' '}
                  <strong className="text-stone-900">
                    {s.precio_acordado ? formatoPesos(s.precio_acordado) : 'Por definir'}
                  </strong>
                </p>
              </div>

              <div className="flex flex-col items-end gap-3">
                {s.estado === 'pendiente' && aceptando !== s.id && (
                  <div className="flex gap-3">
                    <Boton
                      variante="secundario"
                      disabled={!!accionando}
                      onClick={() => rechazar(s)}
                    >
                      Rechazar
                    </Boton>
                    <Boton disabled={!!accionando} onClick={() => abrirAceptar(s.id)}>
                      Aceptar
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
                    onClick={() => finalizar(s)}
                  >
                    Finalizar trabajo
                  </Boton>
                )}

                {s.estado === 'finalizada' && (
                  <p className="max-w-56 text-right text-base text-stone-700">
                    El cliente ya puede valorar este trabajo.
                  </p>
                )}
              </div>
            </div>

            {s.estado === 'pendiente' && aceptando === s.id && (
              <div className="space-y-4 rounded-xl border border-stone-200 bg-stone-50 p-5">
                <Campo
                  etiqueta="Valor acordado del trabajo (en pesos)"
                  ayuda="Es el valor que verá el cliente en su solicitud."
                  type="number"
                  inputMode="numeric"
                  min={10000}
                  step={1000}
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  error={errorPrecio}
                />
                <div className="flex gap-3">
                  <Boton
                    variante="secundario"
                    disabled={accionando === s.id}
                    onClick={cerrarAceptar}
                  >
                    Volver
                  </Boton>
                  <Boton cargando={accionando === s.id} onClick={() => confirmarAceptar(s)}>
                    Confirmar y aceptar
                  </Boton>
                </div>
              </div>
            )}
          </Tarjeta>
        ))}
    </div>
  )
}