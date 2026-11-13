import { supabase } from '../../lib/supabase'
import { mensajeError } from '../auth/mensajes'
import { textoDe } from '../valoraciones/api'

export type EstadoVerificacion = 'sin_enviar' | 'en_revision' | 'verificado' | 'rechazado'

export type PrestadorPorVerificar = {
  perfil_id: string
  nombre: string
  telefono: string | null
  oficio: string | null
  descripcion: string | null
  anios_experiencia: number
  tarifa_referencia: number | null
  tiene_ubicacion: boolean
  estado_verificacion: EstadoVerificacion
  motivo_rechazo: string | null
  documento_ruta: string | null
  verificado_en: string | null
  creado_en: string
}

export type ReporteRevision = {
  reporte_id: string
  estado: 'abierto' | 'ocultado' | 'descartado'
  motivo: string
  creado_en: string
  reportante: string | null
  valoracion_id: string
  comentario: string | null
  respuesta: string | null
  oculta: boolean
  autor: string
  prestador: string
  resuelto_en: string | null
  resolucion: string | null
}

// Mensajes de las reglas de la base que sí conviene mostrar tal cual
const CONOCIDOS = [
  'Escribe el motivo',
  'Solo se aprueba',
  'Solo un administrador',
  'Este reporte ya',
  'Este prestador no tiene',
  'Prestador no encontrado',
  'Reporte no encontrado',
]

export function mensajeAdmin(err: unknown): string {
  const t = textoDe(err)
  return CONOCIDOS.some((c) => t.includes(c)) ? t : mensajeError(err)
}

export async function listarPrestadores(estado: EstadoVerificacion) {
  const { data, error } = await supabase.rpc('prestadores_por_verificar', { p_estado: estado })
  if (error) throw error
  return (data ?? []) as unknown as PrestadorPorVerificar[]
}

// Enlace temporal (5 minutos) al documento privado
export async function urlDocumento(ruta: string) {
  const { data, error } = await supabase.storage.from('documentos').createSignedUrl(ruta, 300)
  if (error || !data) throw error ?? new Error('No se pudo abrir el documento')
  return data.signedUrl
}

export async function decidirVerificacion(id: string, aprobar: boolean, motivo?: string) {
  const { error } = await supabase.rpc('decidir_verificacion', {
    p_prestador: id,
    p_aprobar: aprobar,
    p_motivo: motivo,
  })
  if (error) throw error
}

export async function listarReportes(abiertos: boolean) {
  const { data, error } = await supabase.rpc('reportes_para_revisar', {
    p_estado: abiertos ? 'abierto' : 'resuelto',
  })
  if (error) throw error
  return (data ?? []) as unknown as ReporteRevision[]
}

export async function moderarReporte(id: string, accion: 'ocultar' | 'descartar', nota?: string) {
  const { error } = await supabase.rpc('moderar_reporte', {
    p_reporte: id,
    p_accion: accion,
    p_nota: nota,
  })
  if (error) throw error
}