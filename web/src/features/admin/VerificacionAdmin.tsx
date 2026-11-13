import { useCallback, useEffect, useState } from 'react'
import { Boton } from '../../components/ui/Boton'
import { CampoTexto } from '../../components/ui/Campos'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { Aviso } from '../../components/ui/Aviso'
import { formatoPesos } from '../../lib/formato'
import {
  decidirVerificacion,
  listarPrestadores,
  mensajeAdmin,
  urlDocumento,
  type EstadoVerificacion,
  type PrestadorPorVerificar,
} from './api'

type Pestana = Exclude<EstadoVerificacion, 'sin_enviar'>
type Mensaje = { tipo: 'exito' | 'error'; texto: string } | null

const PESTANAS: { id: Pestana; etiqueta: string }[] = [
  { id: 'en_revision', etiqueta: 'En revisión' },
  { id: 'verificado', etiqueta: 'Verificados' },
  { id: 'rechazado', etiqueta: 'Rechazados' },
]

export function VerificacionAdmin() {
  const [pestana, setPestana] = useState<Pestana>('en_revision')
  const [lista, setLista] = useState<PrestadorPorVerificar[]>([])
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando')
  const [mensaje, setMensaje] = useState<Mensaje>(null)
  const [accionando, setAccionando] = useState('')
  const [documento, setDocumento] = useState<{ id: string; url: string } | null>(null)
  const [rechazando, setRechazando] = useState('')
  const [motivo, setMotivo] = useState('')
  const [errorMotivo, setErrorMotivo] = useState('')

  const recargar = useCallback(async () => {
    try {
      setLista(await listarPrestadores(pestana))
      setEstado('listo')
    } catch {
      setEstado('error')
    }
  }, [pestana])

  useEffect(() => {
    setEstado('cargando')
    setDocumento(null)
    setRechazando('')
    setMotivo('')
    void recargar()
  }, [recargar])

  async function verDocumento(p: PrestadorPorVerificar) {
    if (!p.documento_ruta) return
    if (documento?.id === p.perfil_id) {
      setDocumento(null)
      return
    }
    setMensaje(null)
    try {
      setDocumento({ id: p.perfil_id, url: await urlDocumento(p.documento_ruta) })
    } catch {
      setMensaje({ tipo: 'error', texto: 'No pudimos abrir el documento. Intenta de nuevo.' })
    }
  }

  async function aprobar(p: PrestadorPorVerificar) {
    if (!window.confirm(`¿Aprobar a ${p.nombre}? Aparecerá en las búsquedas.`)) return
    setAccionando(p.perfil_id)
    setMensaje(null)
    try {
      await decidirVerificacion(p.perfil_id, true)
      setMensaje({ tipo: 'exito', texto: `${p.nombre} fue verificado.` })
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeAdmin(err) })
    } finally {
      setAccionando('')
      await recargar()
    }
  }

  async function rechazar(p: PrestadorPorVerificar) {
    if (motivo.trim().length < 10) {
      setErrorMotivo('Escribe el motivo con al menos 10 caracteres.')
      return
    }
    setErrorMotivo('')
    setAccionando(p.perfil_id)
    setMensaje(null)
    try {
      await decidirVerificacion(p.perfil_id, false, motivo.trim())
      setRechazando('')
      setMotivo('')
      setMensaje({ tipo: 'exito', texto: `La verificación de ${p.nombre} fue rechazada.` })
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeAdmin(err) })
    } finally {
      setAccionando('')
      await recargar()
    }
  }

  return (
    <div className="space-y-6">
      <div role="group" aria-label="Estado de verificación" className="flex flex-wrap gap-2">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={pestana === p.id}
            onClick={() => setPestana(p.id)}
            className={`h-11 rounded-lg px-5 text-base font-semibold ${
              pestana === p.id
                ? 'bg-primario text-white'
                : 'border border-stone-300 bg-white text-stone-800 hover:bg-stone-100'
            }`}
          >
            {p.etiqueta}
          </button>
        ))}
      </div>

      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}
      {estado === 'cargando' && <p className="text-base text-stone-700">Cargando...</p>}
      {estado === 'error' && (
        <Aviso tipo="error">No pudimos cargar la lista. Recarga la página.</Aviso>
      )}
      {estado === 'listo' && lista.length === 0 && (
        <Tarjeta className="text-center">
          <p className="text-lg font-semibold text-primario">No hay prestadores en esta lista.</p>
        </Tarjeta>
      )}

      {estado === 'listo' &&
        lista.map((p) => (
          <Tarjeta key={p.perfil_id} className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-primario">{p.nombre}</h2>
                <p className="text-base text-stone-800">
                  {p.oficio ?? 'Sin oficio'} · {p.anios_experiencia}{' '}
                  {p.anios_experiencia === 1 ? 'año' : 'años'} de experiencia ·{' '}
                  {p.tarifa_referencia ? formatoPesos(p.tarifa_referencia) : 'sin tarifa'}
                </p>
                <p className="text-base text-stone-700">
                  Celular: {p.telefono ?? 'sin dato'} · Ubicación guardada:{' '}
                  {p.tiene_ubicacion ? 'sí' : 'no'}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {p.documento_ruta && (
                  <Boton variante="secundario" onClick={() => void verDocumento(p)}>
                    {documento?.id === p.perfil_id ? 'Ocultar documento' : 'Ver documento'}
                  </Boton>
                )}
                {p.estado_verificacion === 'en_revision' && (
                  <>
                    <Boton
                      variante="secundario"
                      disabled={!!accionando}
                      onClick={() => {
                        setRechazando(p.perfil_id)
                        setMotivo('')
                        setErrorMotivo('')
                      }}
                    >
                      Rechazar
                    </Boton>
                    <Boton
                      cargando={accionando === p.perfil_id}
                      disabled={!!accionando}
                      onClick={() => void aprobar(p)}
                    >
                      Aprobar
                    </Boton>
                  </>
                )}
                {p.estado_verificacion === 'verificado' && (
                  <Boton
                    variante="secundario"
                    disabled={!!accionando}
                    onClick={() => {
                      setRechazando(p.perfil_id)
                      setMotivo('')
                      setErrorMotivo('')
                    }}
                  >
                    Revocar verificación
                  </Boton>
                )}
              </div>
            </div>

            {p.descripcion && <p className="text-base text-stone-800">{p.descripcion}</p>}

            {!p.documento_ruta && p.estado_verificacion === 'verificado' && (
              <Aviso tipo="info">
                Sin documento: fue verificado antes de que existiera este sistema.
              </Aviso>
            )}

            {p.estado_verificacion === 'en_revision' && !p.tiene_ubicacion && (
              <Aviso tipo="info">
                Aunque lo apruebes, no aparecerá en las búsquedas hasta que guarde su ubicación.
              </Aviso>
            )}

            {p.estado_verificacion === 'rechazado' && p.motivo_rechazo && (
              <Aviso tipo="info">Motivo del rechazo: {p.motivo_rechazo}</Aviso>
            )}

            {documento?.id === p.perfil_id && (
              <div className="space-y-2">
                <img
                  src={documento.url}
                  alt={`Documento de identidad de ${p.nombre}`}
                  className="max-h-[560px] rounded-xl border border-stone-200"
                />
                <p className="text-base text-stone-700">
                  Este enlace expira en 5 minutos. No compartas esta imagen.
                </p>
              </div>
            )}

            {rechazando === p.perfil_id && (
              <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
                <CampoTexto
                  etiqueta="Motivo (lo verá el prestador)"
                  ayuda="Explica qué debe corregir. Mínimo 10 caracteres."
                  maxLength={300}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  error={errorMotivo}
                />
                <div className="flex gap-3">
                  <Boton
                    variante="secundario"
                    disabled={accionando === p.perfil_id}
                    onClick={() => setRechazando('')}
                  >
                    Cancelar
                  </Boton>
                  <Boton cargando={accionando === p.perfil_id} onClick={() => void rechazar(p)}>
                    Confirmar
                  </Boton>
                </div>
              </div>
            )}
          </Tarjeta>
        ))}
    </div>
  )
}