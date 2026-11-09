export async function reducirImagen(archivo: File, ladoMax = 1280, calidad = 0.8): Promise<Blob> {
  const bitmap = await createImageBitmap(archivo)
  const escala = Math.min(1, ladoMax / Math.max(bitmap.width, bitmap.height))
  const ancho = Math.round(bitmap.width * escala)
  const alto = Math.round(bitmap.height * escala)

  const lienzo = document.createElement('canvas')
  lienzo.width = ancho
  lienzo.height = alto
  const ctx = lienzo.getContext('2d')
  if (!ctx) throw new Error('No se pudo procesar la imagen')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, ancho, alto)
  ctx.drawImage(bitmap, 0, 0, ancho, alto)
  bitmap.close()

  return new Promise((resolve, reject) =>
    lienzo.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo procesar la imagen'))),
      'image/jpeg',
      calidad,
    ),
  )
}