import type { Rol } from '../../lib/useSesion'

export function rutaInicio(rol: Rol | null | undefined) {
  if (rol === 'admin') return '/admin'
  if (rol === 'prestador') return '/panel-prestador'
  if (rol === 'cliente') return '/panel-cliente'
  return '/'
}