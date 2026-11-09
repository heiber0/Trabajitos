import { supabase } from '../../lib/supabase'

export const CENTRO_RIOHACHA: { lat: number; lng: number } = { lat: 11.5444, lng: -72.9072 }

export type Oficio = { id: number; nombre: string }

export type PrestadorCercano = {
  perfil_id: string
  nombre: string
  oficio_id: number
  tarifa_referencia: number | null
  promedio: number
  total_valoraciones: number
  distancia_km: number
}

export async function cargarOficios(): Promise<Oficio[]> {
  const { data, error } = await supabase.from('oficios').select('id, nombre').order('nombre')
  if (error) throw error
  return data ?? []
}

type Consulta = { lat: number; lng: number; oficioId?: number; radioKm: number }

export async function buscarPrestadores(c: Consulta): Promise<PrestadorCercano[]> {
  const { data, error } = await supabase.rpc('prestadores_cercanos', {
    p_lat: c.lat,
    p_lng: c.lng,
    p_oficio: c.oficioId,
    p_radio_km: c.radioKm,
  })
  if (error) throw error
  return ((data ?? []) as unknown as PrestadorCercano[]).map((p) => ({
    ...p,
    promedio: Number(p.promedio),
    distancia_km: Number(p.distancia_km),
  }))
}