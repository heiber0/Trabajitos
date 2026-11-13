import { useCallback, useEffect, useRef, useState } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { ACEPTA_IMAGENES, esImagen, reducirImagen } from '../../lib/imagen'
import { Boton } from '../../components/ui/Boton'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { Aviso } from '../../components/ui/Aviso'
import type { FotoTrabajo } from './api'

const BUCKET = 'trabajos'
const MAX_FOTOS = 12

export function GaleriaFotos({ userId }: { userId: string }) {
  const [fotos, setFotos] = useState<FotoTrabajo[]>([])
  const [cargando, setCargando] = useState(true)
  const [subiendo, setSubiendo] = useState('')
  const [error, setError] = useState('')
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
      setSubiendo(`Subiendo foto ${i + 1} de ${lista.length}...`)
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

  async function borrar(foto: FotoTrabajo) {
    if (!window.confirm('¿Eliminar esta foto?')) return
    setError('')
    const ruta = foto.url.split(`/${BUCKET}/`)[1]
    if (ruta) {
      const { error: errStorage } = await supabase.storage.from(BUCKET).remove([ruta])
      if (errStorage) {
        setError('No pudimos eliminar la foto. Intenta de nuevo.')
        return
      }
    }
    const { error: errFila } = await supabase.from('fotos_trabajos').delete().eq('id', foto.id)
    if (errFila) {
      setError('No pudimos eliminar la foto. Intenta de nuevo.')
      return
    }
    await recargar()
  }

  return (
    <Tarjeta>
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-primario">Fotos de mis trabajos</h2>
          <p className="mt-1 text-base text-stone-700">
            Muestra trabajos que hayas hecho. Hasta {MAX_FOTOS} fotos; las reducimos
            automáticamente para que carguen rápido.
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
        <Boton
          variante="secundario"
          disabled={!!subiendo || fotos.length >= MAX_FOTOS}
          onClick={() => entrada.current?.click()}
        >
          <ImagePlus className="h-5 w-5" aria-hidden="true" />
          Agregar fotos
        </Boton>

        {cargando ? (
          <p className="text-base text-stone-700">Cargando fotos...</p>
        ) : fotos.length === 0 ? (
          <p className="text-base text-stone-700">Aún no has subido fotos.</p>
        ) : (
          <ul className="grid grid-cols-3 gap-4">
            {fotos.map((f) => (
              <li key={f.id} className="relative overflow-hidden rounded-xl bg-stone-100">
                <img
                  src={f.url}
                  alt="Trabajo realizado"
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => void borrar(f)}
                  aria-label="Eliminar foto"
                  className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-white text-error shadow hover:bg-red-50"
                >
                  <Trash2 className="h-5 w-5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Tarjeta>
  )
}