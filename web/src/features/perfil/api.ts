import { supabase } from '../../lib/supabase'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function uno<T>(valor: T | T[] | null | undefined): T | null {
  if (Array.isArray(valor)) return valor[0] ?? null
  return valor ?? null
}

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

type Fila = {
  perfil_id: string
  descripcion: string | null
  anios_experiencia: number | null
  tarifa_referencia: number | null
  ciudad: string | null
  verificado: boolean | null
  promedio: number | string | null
  total_valoraciones: number | null
  oficios: { nombre: string } | { nombre: string }[] | null
  perfiles: { nombre: string } | { nombre: string }[] | null
}

export async function cargarPerfilPublico(id: string) {
  if (!UUID.test(id)) return null

  const [pres, fotos, resenas] = await Promise.all([
    supabase
      .from('prestadores')
      .select(
        'perfil_id, descripcion, anios_experiencia, tarifa_referencia, ciudad, verificado, promedio, total_valoraciones, oficios(nombre), perfiles(nombre)',
      )
      .eq('perfil_id', id)
      .maybeSingle(),
    supabase
      .from('fotos_trabajos')
      .select('id, url')
      .eq('prestador_id', id)
      .order('creado_en', { ascending: false }),
    supabase.rpc('resenas_prestador', { p_prestador: id }),
  ])

  if (pres.error) throw pres.error
  if (!pres.data) return null
  if (fotos.error) throw fotos.error
  if (resenas.error) throw resenas.error

  const fila = pres.data as unknown as Fila
  const prestador: PrestadorPublico = {
    perfil_id: fila.perfil_id,
    nombre: uno(fila.perfiles)?.nombre ?? 'Prestador',
    oficio: uno(fila.oficios)?.nombre ?? null,
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