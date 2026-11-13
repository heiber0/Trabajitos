export const ACEPTA_IMAGENES =
  'image/*,.heic,.heif,.avif,.webp,.png,.jpg,.jpeg,.bmp,.gif,.tiff,.svg'

export function esImagen(archivo: File): boolean {
  if (!archivo) return false
  if (archivo.type && archivo.type.startsWith('image/')) return true
  return /\.(jpe?g|png|webp|avif|heic|heif|bmp|gif|tiff?|svg)$/i.test(archivo.name)
}

async function decodificarImagen(archivo: File): Promise<{
  width: number
  height: number
  dibujar: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
  liberar: () => void
}> {
  try {
    const bitmap = await createImageBitmap(archivo)
    return {
      width: bitmap.width,
      height: bitmap.height,
      dibujar: (ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h),
      liberar: () => bitmap.close(),
    }
  } catch {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(archivo)
      const img = new Image()
      img.onload = () => {
        resolve({
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
          dibujar: (ctx, w, h) => {
            ctx.drawImage(img, 0, 0, w, h)
            URL.revokeObjectURL(url)
          },
          liberar: () => URL.revokeObjectURL(url),
        })
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('No se pudo procesar la imagen. Verifica que el archivo sea una imagen válida.'))
      }
      img.src = url
    })
  }
}

export async function reducirImagen(archivo: File, ladoMax = 1280, calidad = 0.8): Promise<Blob> {
  const recurso = await decodificarImagen(archivo)
  try {
    const escala = Math.min(1, ladoMax / Math.max(recurso.width, recurso.height))
    const ancho = Math.max(1, Math.round(recurso.width * escala))
    const alto = Math.max(1, Math.round(recurso.height * escala))

    const lienzo = document.createElement('canvas')
    lienzo.width = ancho
    lienzo.height = alto
    const ctx = lienzo.getContext('2d')
    if (!ctx) throw new Error('No se pudo procesar la imagen')

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, ancho, alto)
    recurso.dibujar(ctx, ancho, alto)

    return await new Promise((resolve, reject) =>
      lienzo.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo generar la imagen reducida'))),
        'image/jpeg',
        calidad,
      ),
    )
  } finally {
    recurso.liberar()
  }
}
