import { useCallback, useEffect, useRef, useState } from 'react'
import { FileUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { ACEPTA_IMAGENES, esImagen, reducirImagen } from '../../lib/imagen'
import { Boton } from '../../components/ui/Boton'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { Aviso } from '../../components/ui/Aviso'
import { mensajeError } from '../auth/mensajes'

type Estado = 'sin_enviar' | 'en_revision' | 'verificado' | 'rechazado'
type Mensaje = { tipo: 'exito' | 'error'; texto: string } | null

export function VerificacionPrestador({ userId }: { userId: string }) {
  const [estado, setEstado] = useState<Estado | null>(null)
  const [motivo, setMotivo] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [mensaje, setMensaje] = useState<Mensaje>(null)
  const entrada = useRef<HTMLInputElement>(null)

  const recargar = useCallback(async () => {
    const { data, error } = await supabase
      .from('prestadores')
      .select('estado_verificacion, motivo_rechazo')
      .eq('perfil_id', userId)
      .maybeSingle()
    if (error) {
      setErrorCarga(true)
    } else {
      setErrorCarga(false)
      setEstado((data?.estado_verificacion as Estado | undefined) ?? null)
      setMotivo(data?.motivo_rechazo ?? null)
    }
    setCargando(false)
  }, [userId])

  useEffect(() => {
    void recargar()
  }, [recargar])

  async function subir(archivos: FileList | null) {
    const archivo = archivos?.[0]
    if (!archivo) return
    setMensaje(null)

    if (!esImagen(archivo)) {
      setMensaje({ tipo: 'error', texto: 'El archivo seleccionado debe ser una foto o imagen válida.' })
      return
    }
    if (archivo.size > 25 * 1024 * 1024) {
      setMensaje({ tipo: 'error', texto: 'La foto pesa demasiado. Usa una de menos de 25 MB.' })
      return
    }

    setSubiendo(true)
    try {
      const blob = await reducirImagen(archivo, 1600, 0.85)
      const ruta = `${userId}/cedula-${crypto.randomUUID()}.jpg`

      const { error: errSubida } = await supabase.storage
        .from('documentos')
        .upload(ruta, blob, { contentType: 'image/jpeg' })
      if (errSubida) throw errSubida

      const { data, error } = await supabase
        .from('prestadores')
        .update({ documento_ruta: ruta, estado_verificacion: 'en_revision' })
        .eq('perfil_id', userId)
        .select('perfil_id')
      if (error) throw error
      if (!data || data.length === 0) throw new Error('No se pudo registrar el documento')

      setMensaje({
        tipo: 'exito',
        texto: 'Recibimos tu documento. Aquí verás el resultado de la revisión.',
      })
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeError(err) })
    } finally {
      setSubiendo(false)
      if (entrada.current) entrada.current.value = ''
      await recargar()
    }
  }

  if (cargando) return <p className="text-base text-stone-700">Cargando verificación...</p>
  if (errorCarga || !estado) {
    return <Aviso tipo="error">No pudimos cargar el estado de tu verificación.</Aviso>
  }

  const puedeEnviar = estado === 'sin_enviar' || estado === 'rechazado'

  return (
    <Tarjeta className="space-y-4">
      <h2 className="text-2xl font-bold text-primario">Verificación de identidad</h2>

      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}

      {estado === 'verificado' && (
        <Aviso tipo="exito">
          Tu identidad está verificada. Para aparecer en las búsquedas también debes guardar tu
          ubicación.
        </Aviso>
      )}

      {estado === 'en_revision' && (
        <Aviso tipo="info">
          Tu documento está en revisión. No necesitas hacer nada más; aquí verás el resultado.
        </Aviso>
      )}

      {estado === 'rechazado' && (
        <Aviso tipo="error">
          No pudimos verificar tu identidad.{motivo ? ` Motivo: ${motivo}` : ''} Puedes enviar otra
          foto.
        </Aviso>
      )}

      {puedeEnviar && (
        <>
          <p className="text-base text-stone-800">
            Para aparecer en las búsquedas necesitamos comprobar tu identidad. Sube una foto clara
            de tu cédula, donde se lean tu nombre y se vea tu foto. Solo tú y el equipo de
            Trabajitos podrán verla, y la usamos únicamente para esta verificación (Ley 1581 de
            2012).
          </p>
          <input
            ref={entrada}
            type="file"
            accept={ACEPTA_IMAGENES}
            className="hidden"
            onChange={(e) => void subir(e.target.files)}
          />
          <Boton cargando={subiendo} onClick={() => entrada.current?.click()}>
            <FileUp className="h-5 w-5" aria-hidden="true" />
            {estado === 'rechazado' ? 'Enviar otra foto' : 'Subir foto de mi cédula'}
          </Boton>
        </>
      )}
    </Tarjeta>
  )
}