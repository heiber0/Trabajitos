import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useSesion } from '../../lib/useSesion'
import { Boton, BotonEnlace } from '../ui/Boton'

export function Navbar() {
  const { usuario, rol, cargando, cerrarSesion } = useSesion()
  const navigate = useNavigate()

  const enlaces = [
    { to: '/', label: 'Inicio' },
    { to: '/buscar', label: 'Buscar prestadores' },
  ]
  if (rol === 'cliente') enlaces.push({ to: '/panel-cliente', label: 'Mis servicios' })
  if (rol === 'prestador') enlaces.push({ to: '/panel-prestador', label: 'Mi panel' })
  if (rol === 'admin') enlaces.push({ to: '/admin', label: 'Administración' })

  async function salir() {
    await cerrarSesion()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-[1120px] items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5 text-xl font-bold text-primario">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primario text-white">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          Trabajitos
        </Link>

        <nav aria-label="Principal" className="flex items-center gap-1">
          {enlaces.map((enlace) => (
            <NavLink
              key={enlace.to}
              to={enlace.to}
              end={enlace.to === '/'}
              className={({ isActive }) =>
                `flex h-11 items-center rounded-lg px-4 text-base font-medium ${
                  isActive
                    ? 'bg-amber-50 text-accion-oscuro'
                    : 'text-stone-700 hover:bg-stone-100'
                }`
              }
            >
              {enlace.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {!cargando &&
            (usuario ? (
              <Boton variante="secundario" onClick={salir}>
                Salir
              </Boton>
            ) : (
              <>
                <BotonEnlace to="/auth" variante="secundario">
                  Ingresar
                </BotonEnlace>
                <BotonEnlace to="/auth?modo=registro">Registrarme</BotonEnlace>
              </>
            ))}
        </div>
      </div>
    </header>
  )
}