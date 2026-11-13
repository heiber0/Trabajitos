import { useCallback, useEffect, useState } from 'react'
import { Boton } from '../../components/ui/Boton'
import { CampoTexto } from '../../components/ui/Campos'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { Aviso } from '../../components/ui/Aviso'
import { listarReportes, mensajeAdmin, moderarReporte, type ReporteRevision } from './api'

type Mensaje = { tipo: 'exito' | 'error'; texto: string } | null

const RESULTADO = {
  abierto: 'Abierto',
  ocultado: 'Comentario ocultado',
  descartado: 'Reporte descartado',
} as const

function fecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function ModeracionAdmin() {
  const [abiertos, setAbiertos] = useState(true)
  const [lista, setLista] = useState<ReporteRevision[]>([])
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando')
  const [mensaje, setMensaje] = useState<Mensaje>(null)
  const [accionando, setAccionando] = useState('')
  const [ocultando, setOcultando] = useState('')
  const [nota, setNota] = useState('')
  const [errorNota, setErrorNota] = useState('')

  const recargar = useCallback(async () => {
    try {
      setLista(await listarReportes(abiertos))
      setEstado('listo')
    } catch {
      setEstado('error')
    }
  }, [abiertos])

  useEffect(() => {
    setEstado('cargando')
    setOcultando('')
    setNota('')
    void recargar()
  }, [recargar])

  async function ocultar(r: ReporteRevision) {
    if (nota.trim().length < 5) {
      setErrorNota('Escribe el motivo de la decisión con al menos 5 caracteres.')
      return
    }
    setErrorNota('')
    setAccionando(r.reporte_id)
    setMensaje(null)
    try {
      await moderarReporte(r.reporte_id, 'ocultar', nota.trim())
      setOcultando('')
      setNota('')
      setMensaje({ tipo: 'exito', texto: 'Comentario ocultado. La calificación se conserva.' })
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeAdmin(err) })
    } finally {
      setAccionando('')
      await recargar()
    }
  }

  async function descartar(r: ReporteRevision) {
    if (!window.confirm('¿Descartar este reporte? El comentario seguirá visible.')) return
    setAccionando(r.reporte_id)
    setMensaje(null)
    try {
      await moderarReporte(r.reporte_id, 'descartar')
      setMensaje({ tipo: 'exito', texto: 'Reporte descartado.' })
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeAdmin(err) })
    } finally {
      setAccionando('')
      await recargar()
    }
  }

  return (
    <div className="space-y-6">
      <div role="group" aria-label="Estado del reporte" className="flex gap-2">
        {[
          { valor: true, etiqueta: 'Abiertos' },
          { valor: false, etiqueta: 'Resueltos' },
        ].map((o) => (
          <button
            key={o.etiqueta}
            type="button"
            aria-pressed={abiertos === o.valor}
            onClick={() => setAbiertos(o.valor)}
            className={`h-11 rounded-lg px-5 text-base font-semibold ${
              abiertos === o.valor
                ? 'bg-primario text-white'
                : 'border border-stone-300 bg-white text-stone-800 hover:bg-stone-100'
            }`}
          >
            {o.etiqueta}
          </button>
        ))}
      </div>

      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}
      {estado === 'cargando' && <p className="text-base text-stone-700">Cargando...</p>}
      {estado === 'error' && (
        <Aviso tipo="error">No pudimos cargar los reportes. Recarga la página.</Aviso>
      )}
      {estado === 'listo' && lista.length === 0 && (
        <Tarjeta className="text-center">
          <p className="text-lg font-semibold text-primario">No hay reportes en esta lista.</p>
        </Tarjeta>
      )}

      {estado === 'listo' &&
        lista.map((r) => (
          <Tarjeta key={r.reporte_id} className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-base font-semibold text-stone-900">
                  {RESULTADO[r.estado]} · {fecha(r.creado_en)}
                </p>
                <p className="text-base text-stone-700">
                  Reportado por: {r.reportante ?? 'usuario eliminado'}
                </p>
              </div>
              {r.estado === 'abierto' && (
                <div className="flex flex-wrap gap-3">
                  <Boton
                    variante="secundario"
                    disabled={!!accionando}
                    onClick={() => void descartar(r)}
                  >
                    Descartar reporte
                  </Boton>
                  <Boton
                    disabled={!!accionando}
                    onClick={() => {
                      setOcultando(r.reporte_id)
                      setNota('')
                      setErrorNota('')
                    }}
                  >
                    Ocultar comentario
                  </Boton>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-stone-100 p-4 text-base text-stone-900">
              <p className="font-semibold">Motivo del reporte</p>
              <p>{r.motivo}</p>
            </div>

            <div className="space-y-1">
              <p className="text-base text-stone-700">
                Comentario de {r.autor} sobre {r.prestador}
              </p>
              <p className="text-base text-stone-900">
                {r.comentario ?? 'Sin comentario o ya oculto.'}
              </p>
              {r.respuesta && (
                <p className="text-base text-stone-700">Respuesta del prestador: {r.respuesta}</p>
              )}
            </div>

            {r.estado !== 'abierto' && r.resolucion && (
              <Aviso tipo="info">Nota de la decisión: {r.resolucion}</Aviso>
            )}

            {ocultando === r.reporte_id && (
              <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
                <CampoTexto
                  etiqueta="Motivo de la decisión"
                  ayuda="Queda registrado con tu nombre. Ocultar es definitivo y la calificación sigue contando."
                  maxLength={300}
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  error={errorNota}
                />
                <div className="flex gap-3">
                  <Boton
                    variante="secundario"
                    disabled={accionando === r.reporte_id}
                    onClick={() => setOcultando('')}
                  >
                    Cancelar
                  </Boton>
                  <Boton cargando={accionando === r.reporte_id} onClick={() => void ocultar(r)}>
                    Confirmar y ocultar
                  </Boton>
                </div>
              </div>
            )}
          </Tarjeta>
        ))}
    </div>
  )
}