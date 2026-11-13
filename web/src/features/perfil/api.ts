import { supabase } from '../../lib/supabase'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type PrestadorPublico = {
  perfil_id: string
  nombre: string
  oficio: string | null
  descripcion: string | null
  anios_experiencia: number
  tarifa_referencia: number | null
  ciudad: string | null
  verificado: boolean
  promedio: number
  total_valoraciones: number
}

export type FotoTrabajo = { id: string; url: string }

export type Resena = {
  id: string
  nombre_cliente: string
  puntualidad: number
  calidad: number
  precio: number
  trato: number
  comentario: string | null
  respuesta: string | null
  oculta: boolean
  creado_en: string
}

type FilaPrestador = {
  perfil_id: string
  nombre: string | null
  oficio: string | null
  descripcion: string | null
  anios_experiencia: number | null
  tarifa_referencia: number | null
  ciudad: string | null
  verificado: boolean | null
  promedio: number | string | null
  total_valoraciones: number | null
}

export async function cargarPerfilPublico(id: string) {
  if (!UUID.test(id)) return null

  const [pres, fotos, resenas] = await Promise.all([
    supabase.rpc('perfil_prestador_publico', { p_id: id }),
    supabase
      .from('fotos_trabajos')
      .select('id, url')
      .eq('prestador_id', id)
      .order('creado_en', { ascending: false }),
    supabase.rpc('resenas_prestador', { p_prestador: id }),
  ])

  if (pres.error) throw pres.error
  if (fotos.error) throw fotos.error
  if (resenas.error) throw resenas.error

  const fila = ((pres.data ?? []) as unknown as FilaPrestador[])[0]
  if (!fila) return null

  const prestador: PrestadorPublico = {
    perfil_id: fila.perfil_id,
    nombre: fila.nombre ?? 'Prestador',
    oficio: fila.oficio,
    descripcion: fila.descripcion,
    anios_experiencia: fila.anios_experiencia ?? 0,
    tarifa_referencia: fila.tarifa_referencia,
    ciudad: fila.ciudad,
    verificado: !!fila.verificado,
    promedio: Number(fila.promedio ?? 0),
    total_valoraciones: fila.total_valoraciones ?? 0,
  }

  return {
    prestador,
    fotos: (fotos.data ?? []) as FotoTrabajo[],
    resenas: (resenas.data ?? []) as unknown as Resena[],
  }
}