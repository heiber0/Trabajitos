import { useCallback, useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { Boton } from '../../components/ui/Boton'
import { CampoTexto } from '../../components/ui/Campos'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { Aviso } from '../../components/ui/Aviso'
import { mensajeError } from '../auth/mensajes'
import { BotonReportar } from './BotonReportar'
import { cargarOpiniones, responderOpinion, textoDe, type Opinion } from './api'

type Mensaje = { tipo: 'exito' | 'error'; texto: string } | null

export function OpinionesPrestador({ userId }: { userId: string }) {
  const [lista, setLista] = useState<Opinion[]>([])
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando')
  const [respondiendo, setRespondiendo] = useState('')
  const [texto, setTexto] = useState('')
  const [errorTexto, setErrorTexto] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<Mensaje>(null)

  const recargar = useCallback(async () => {
    try {
      setLista(await cargarOpiniones(userId))
      setEstado('listo')
    } catch {
      setEstado('error')
    }
  }, [userId])

  useEffect(() => {
    void recargar()
  }, [recargar])

  async function guardar(o: Opinion) {
    const t = texto.trim()
    if (t.length < 3) {
      setErrorTexto('Escribe al menos 3 caracteres.')
      return
    }
    setErrorTexto('')
    setGuardando(true)
    setMensaje(null)
    try {
      await responderOpinion(o.id, t)
      setRespondiendo('')
      setTexto('')
      setMensaje({ tipo: 'exito', texto: 'Tu respuesta ya aparece en tu perfil público.' })
    } catch (err) {
      if (textoDe(err).toLowerCase().includes('ya respondiste')) {
        setMensaje({ tipo: 'error', texto: 'Ya respondiste este comentario.' })
        setRespondiendo('')
      } else {
        setMensaje({ tipo: 'error', texto: mensajeError(err) })
      }
    } finally {
      await recargar()
      setGuardando(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-base text-stone-700">
        Aquí ves lo que opinan tus clientes. Puedes responder una vez a cada comentario, y
        reportar los que consideres ofensivos o falsos.
      </p>

      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}

      {estado === 'cargando' && <p className="text-base text-stone-700">Cargando opiniones...</p>}
      {estado === 'error' && (
        <Aviso tipo="error">No pudimos cargar tus opiniones. Recarga la página.</Aviso>
      )}

      {estado === 'listo' && lista.length === 0 && (
        <Tarjeta className="text-center">
          <p className="text-lg font-semibold text-primario">Aún no tienes opiniones.</p>
          <p className="mt-1 text-base text-stone-700">
            Aparecen cuando un cliente valora un servicio que marcaste como finalizado.
          </p>
        </Tarjeta>
      )}

      {estado === 'listo' &&
        lista.map((o) => {
          const prom = (o.puntualidad + o.calidad + o.precio + o.trato) / 4
          if (o.oculta) {
            return (
              <Tarjeta key={o.id} className="space-y-2">
                <p className="text-base font-semibold text-stone-900">{o.nombre_cliente}</p>
                <p className="text-base text-stone-700">
                  Este comentario fue ocultado por moderación. La calificación sigue contando.
                </p>
              </Tarjeta>
            )
          }
          return (
            <Tarjeta key={o.id} className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-base font-semibold text-stone-900">{o.nombre_cliente}</p>
                <p className="text-base text-stone-700">
                  {new Date(o.creado_en).toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <p className="inline-flex items-center gap-1.5 text-base font-semibold text-stone-900">
                <Star className="h-5 w-5 fill-amber-500 text-amber-500" aria-hidden="true" />
                {prom.toFixed(1)}
              </p>
              <p className="text-base text-stone-700">
                Puntualidad {o.puntualidad} · Calidad {o.calidad} · Precio {o.precio} · Trato{' '}
                {o.trato}
              </p>

              {o.comentario ? (
                <p className="text-base text-stone-800">{o.comentario}</p>
              ) : (
                <p className="text-base text-stone-700">El cliente no dejó comentario.</p>
              )}

              {o.respuesta ? (
                <div className="rounded-xl bg-stone-100 p-4 text-base text-stone-800">
                  <p className="font-semibold text-primario">Tu respuesta</p>
                  <p>{o.respuesta}</p>
                </div>
              ) : respondiendo === o.id ? (
                <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
                  <CampoTexto
                    etiqueta="Tu respuesta pública"
                    ayuda="Solo puedes responder una vez y no se puede editar. La verá cualquiera que mire tu perfil."
                    maxLength={500}
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    error={errorTexto}
                  />
                  <div className="flex gap-3">
                    <Boton
                      variante="secundario"
                      disabled={guardando}
                      onClick={() => {
                        setRespondiendo('')
                        setTexto('')
                        setErrorTexto('')
                      }}
                    >
                      Cancelar
                    </Boton>
                    <Boton cargando={guardando} onClick={() => void guardar(o)}>
                      Publicar respuesta
                    </Boton>
                  </div>
                </div>
              ) : (
                <Boton
                  variante="secundario"
                  onClick={() => {
                    setRespondiendo(o.id)
                    setTexto('')
                    setErrorTexto('')
                    setMensaje(null)
                  }}
                >
                  Responder
                </Boton>
              )}

              <BotonReportar valoracionId={o.id} />
            </Tarjeta>
          )
        })}
    </div>
  )
}