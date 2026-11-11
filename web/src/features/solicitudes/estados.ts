export type EstadoSolicitud = 'pendiente' | 'aceptada' | 'en_curso' | 'finalizada' | 'cancelada'

export const ETIQUETAS_ESTADO: Record<EstadoSolicitud, string> = {
  pendiente: 'Pendiente de respuesta',
  aceptada: 'Aceptada',
  en_curso: 'En ejecución',
  finalizada: 'Finalizada',
  cancelada: 'Cancelada',
}

export const COLORES_ESTADO: Record<EstadoSolicitud, string> = {
  pendiente: 'border-amber-300 bg-amber-50 text-amber-900',
  aceptada: 'border-sky-300 bg-sky-50 text-sky-900',
  en_curso: 'border-indigo-300 bg-indigo-50 text-indigo-900',
  finalizada: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  cancelada: 'border-stone-300 bg-stone-100 text-stone-800',
}