import { supabase } from '../../lib/supabase'
import type { EstadoSolicitud } from './estados'

export type Solicitud = {
  id: string
  rol_yo: 'cliente' | 'prestador'
  cliente_nombre: string
  prestador_id: string
  prestador_nombre: string
  oficio: string | null
  descripcion: string
  direccion: string | null
  fecha_programada: string | null
  estado: EstadoSolicitud
  precio_acordado: number | null
  creado_en: string
}

export const BARRIOS = [
  'Centro',
  'Los Nogales',
  'Obrero',
  'Cooperativo',
  'Boca del Monte',
  'Arriba',
  'Otro barrio',
]

export async function crearSolicitud(input: {
  clienteId: string
  prestadorId: string
  descripcion: string
  direccion: string
  fecha: Date
}) {
  const { error } = await supabase.from('solicitudes').insert({
    cliente_id: input.clienteId,
    prestador_id: input.prestadorId,
    descripcion: input.descripcion,
    direccion: input.direccion,
    fecha_programada: input.fecha.toISOString(),
    estado: 'pendiente',
  })
  if (error) throw error
}

export async function cargarMisSolicitudes(): Promise<Solicitud[]> {
  const { data, error } = await supabase.rpc('mis_solicitudes')
  if (error) throw error
  return (data ?? []) as unknown as Solicitud[]
}

export async function cancelarSolicitud(id: string) {
  const { error } = await supabase
    .from('solicitudes')
    .update({ estado: 'cancelada' })
    .eq('id', id)
  if (error) throw error
}

// Cambia el estado de una solicitud. El precio solo se envía al aceptar.
export async function cambiarEstado(id: string, estado: EstadoSolicitud, precio?: number) {
  const cambios: { estado: EstadoSolicitud; precio_acordado?: number } = { estado }
  if (precio !== undefined) cambios.precio_acordado = precio

  const { data, error } = await supabase
    .from('solicitudes')
    .update(cambios)
    .eq('id', id)
    .select('id')
  if (error) throw error
  // Si las reglas de seguridad no dejan actualizar, Supabase responde sin error y sin filas
  if (!data || data.length === 0) throw new Error('No se pudo actualizar la solicitud')
}

export async function cargarResumenPrestador(userId: string) {
  const { data, error } = await supabase
    .from('prestadores')
    .select('promedio, total_valoraciones')
    .eq('perfil_id', userId)
    .maybeSingle()
  if (error) throw error
  return {
    promedio: Number(data?.promedio ?? 0),
    total: data?.total_valoraciones ?? 0,
  }
}