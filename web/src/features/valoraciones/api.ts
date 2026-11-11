import { supabase } from '../../lib/supabase'

export type Calificacion = {
  puntualidad: number
  calidad: number
  precio: number
  trato: number
}

export type Opinion = Calificacion & {
  id: string
  nombre_cliente: string
  comentario: string | null
  respuesta: string | null
  creado_en: string
}

export function codigoDe(err: unknown): string {
  return typeof err === 'object' && err !== null && 'code' in err
    ? String((err as { code: unknown }).code)
    : ''
}

export function textoDe(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message)
  }
  return ''
}

// Ids de las solicitudes que este cliente ya valoró
export async function cargarValoradas(clienteId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('valoraciones')
    .select('solicitud_id')
    .eq('cliente_id', clienteId)
  if (error) throw error
  return new Set((data ?? []).map((v) => v.solicitud_id))
}

export async function crearValoracion(input: {
  solicitudId: string
  clienteId: string
  prestadorId: string
  notas: Calificacion
  comentario: string
}) {
  const { error } = await supabase.from('valoraciones').insert({
    solicitud_id: input.solicitudId,
    cliente_id: input.clienteId,
    prestador_id: input.prestadorId,
    puntualidad: input.notas.puntualidad,
    calidad: input.notas.calidad,
    precio: input.notas.precio,
    trato: input.notas.trato,
    comentario: input.comentario.trim() || null,
  })
  if (error) throw error
}

export async function cargarOpiniones(prestadorId: string): Promise<Opinion[]> {
  const { data, error } = await supabase.rpc('resenas_prestador', { p_prestador: prestadorId })
  if (error) throw error
  return (data ?? []) as unknown as Opinion[]
}

export async function responderOpinion(id: string, texto: string) {
  const { data, error } = await supabase
    .from('valoraciones')
    .update({ respuesta: texto })
    .eq('id', id)
    .select('id')
  if (error) throw error
  if (!data || data.length === 0) throw new Error('No se pudo guardar la respuesta')
}

export async function reportarOpinion(valoracionId: string, motivo: string) {
  const { error } = await supabase
    .from('reportes')
    .insert({ valoracion_id: valoracionId, motivo: motivo.trim() })
  if (error) throw error
}