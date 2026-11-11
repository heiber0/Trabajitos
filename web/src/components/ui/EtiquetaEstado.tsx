import {
  COLORES_ESTADO,
  ETIQUETAS_ESTADO,
  type EstadoSolicitud,
} from '../../features/solicitudes/estados'

export function EtiquetaEstado({ estado }: { estado: EstadoSolicitud }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-base font-semibold ${COLORES_ESTADO[estado]}`}
    >
      {ETIQUETAS_ESTADO[estado]}
    </span>
  )
}