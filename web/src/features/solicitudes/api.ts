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