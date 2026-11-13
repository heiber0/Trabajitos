import { useCallback, useEffect, useRef, useState } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { ACEPTA_IMAGENES, esImagen, reducirImagen } from '../../lib/imagen'
import { Boton } from '../../components/ui/Boton'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { Aviso } from '../../components/ui/Aviso'
import { DialogoConfirmacion } from '../../components/ui/Modal'
import type { FotoTrabajo } from './api'

const BUCKET = 'trabajos'
const MAX_FOTOS = 12

export function GaleriaFotos({ userId }: { userId: string }) {
  const [fotos, setFotos] = useState<FotoTrabajo[]>([])
  const [cargando, setCargando] = useState(true)
  const [subiendo, setSubiendo] = useState('')
  const [error, setError] = useState('')
  const [fotoABorrar, setFotoABorrar] = useState<FotoTrabajo | null>(null)
  const [borrando, setBorrando] = useState(false)
  const entrada = useRef<HTMLInputElement>(null)

  const recargar = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('fotos_trabajos')
      .select('id, url')
      .eq('prestador_id', userId)
      .order('creado_en', { ascending: false })
    if (err) setError('No pudimos cargar tus fotos. Recarga la página.')
    else setFotos((data ?? []) as FotoTrabajo[])
    setCargando(false)
  }, [userId])

  useEffect(() => {
    void recargar()
  }, [recargar])

  async function subir(archivos: FileList | null) {
    if (!archivos || archivos.length === 0) return
    const lista = Array.from(archivos)
    if (fotos.length + lista.length > MAX_FOTOS) {
      setError(`Puedes tener máximo ${MAX_FOTOS} fotos. Elimina alguna para subir más.`)
      return
    }
    setError('')
    const fallidas: string[] = []

    for (let i = 0; i < lista.length; i++) {
      const archivo = lista[i]
      setSubiendo(`Optimizando y subiendo foto ${i + 1} de ${lista.length}...`)
      try {
        if (!esImagen(archivo)) throw new Error('tipo')
        if (archivo.size > 25 * 1024 * 1024) throw new Error('tamano')
        const blob = await reducirImagen(archivo)
        const ruta = `${userId}/${crypto.randomUUID()}.jpg`

        const { error: errSubida } = await supabase.storage
          .from(BUCKET)
          .upload(ruta, blob, { contentType: 'image/jpeg' })
        if (errSubida) throw errSubida

        const { data } = supabase.storage.from(BUCKET).getPublicUrl(ruta)
        const { error: errFila } = await supabase
          .from('fotos_trabajos')
          .insert({ prestador_id: userId, url: data.publicUrl })
        if (errFila) {
          await supabase.storage.from(BUCKET).remove([ruta])
          throw errFila
        }
      } catch {
        fallidas.push(archivo.name)
      }
    }

    setSubiendo('')
    if (fallidas.length > 0) {
      setError(
        `No se pudieron subir: ${fallidas.join(', ')}. Verifica que sean archivos de imagen válidos de menos de 25 MB.`,
      )
    }
    if (entrada.current) entrada.current.value = ''
    await recargar()
  }

  async function confirmarBorrado() {
    if (!fotoABorrar) return
    setBorrando(true)
    setError('')
    const ruta = fotoABorrar.url.split(`/${BUCKET}/`)[1]
    if (ruta) {
      const { error: errStorage } = await supabase.storage.from(BUCKET).remove([ruta])
      if (errStorage) {
        setError('No pudimos eliminar la foto del almacenamiento. Intenta de nuevo.')
        setBorrando(false)
        return
      }
    }
    const { error: errFila } = await supabase.from('fotos_trabajos').delete().eq('id', fotoABorrar.id)
    setBorrando(false)
    setFotoABorrar(null)
    if (errFila) {
      setError('No pudimos eliminar el registro de la foto. Intenta de nuevo.')
      return
    }
    await recargar()
  }

  return (
    <Tarjeta className="p-6 sm:p-8">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-primario">Fotos de mis trabajos</h2>
          <p className="mt-1 text-base text-stone-600">
            Muestra trabajos reales que hayas hecho. Hasta {MAX_FOTOS} fotos; las optimizamos
            automáticamente para que carguen rápido y se vean nítidas.
          </p>
        </div>

        {error && <Aviso tipo="error">{error}</Aviso>}
        {subiendo && <Aviso tipo="info">{subiendo}</Aviso>}

        <input
          ref={entrada}
          type="file"
          accept={ACEPTA_IMAGENES}
          multiple
          className="hidden"
          onChange={(e) => void subir(e.target.files)}
        />

        <div>
          <Boton
            variante="secundario"
            disabled={!!subiendo || fotos.length >= MAX_FOTOS}
            onClick={() => entrada.current?.click()}
          >
            <ImagePlus className="h-5 w-5 text-accion" aria-hidden="true" />
            <span>Agregar fotos de trabajos</span>
          </Boton>
        </div>

        {cargando ? (
          <div className="py-8 text-center text-stone-500">
            <p className="text-base font-medium">Cargando galería...</p>
          </div>
        ) : fotos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 p-8 text-center">
            <p className="text-base text-stone-600 font-medium">Aún no has subido fotos a tu galería.</p>
            <p className="text-sm text-stone-500 mt-1">Los prestadores con fotos reciben hasta 3 veces más contactos.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {fotos.map((f) => (
              <li key={f.id} className="group relative overflow-hidden rounded-2xl bg-stone-100 shadow-xs">
                <img
                  src={f.url}
                  alt="Trabajo realizado"
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <button
                  type="button"
                  onClick={() => setFotoABorrar(f)}
                  aria-label="Eliminar foto"
                  className="absolute right-2.5 top-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-stone-700 shadow-md backdrop-blur-xs transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Diálogo emergente para confirmar borrado */}
      <DialogoConfirmacion
        abierto={!!fotoABorrar}
        alCerrar={() => setFotoABorrar(null)}
        alConfirmar={confirmarBorrado}
        titulo="¿Eliminar esta foto de tu galería?"
        mensaje="Esta imagen dejará de mostrarse en tu perfil público de forma permanente."
        textoConfirmar="Sí, eliminar foto"
        textoCancelar="Conservar"
        peligroso
        cargando={borrando}
      />
    </Tarjeta>
  )
}
