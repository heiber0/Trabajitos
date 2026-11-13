import {
  COLORES_ESTADO,
  ETIQUETAS_ESTADO,
  type EstadoSolicitud,
} from '../../features/solicitudes/estados'

const PUNTOS: Record<EstadoSolicitud, string> = {
  pendiente: 'bg-amber-500',
  aceptada: 'bg-blue-500',
  en_curso: 'bg-indigo-500 animate-pulse',
  finalizada: 'bg-emerald-500',
  cancelada: 'bg-stone-400',
}

export function EtiquetaEstado({ estado }: { estado: EstadoSolicitud }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-sm font-semibold tracking-wide ${COLORES_ESTADO[estado]}`}
    >
      <span className={`h-2 w-2 rounded-full ${PUNTOS[estado] || 'bg-stone-400'}`} aria-hidden="true" />
      {ETIQUETAS_ESTADO[estado]}
    </span>
  )
}
