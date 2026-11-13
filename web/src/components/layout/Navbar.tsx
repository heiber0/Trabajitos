import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ShieldCheck, Menu, X, User } from 'lucide-react'
import { useSesion } from '../../lib/useSesion'
import { Boton, BotonEnlace } from '../ui/Boton'

export function Navbar() {
  const { usuario, rol, cargando, cerrarSesion } = useSesion()
  const navigate = useNavigate()
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)

  const enlaces = [
    { to: '/', label: 'Inicio' },
    { to: '/buscar', label: 'Buscar prestadores' },
  ]
  if (rol === 'cliente') enlaces.push({ to: '/panel-cliente', label: 'Mis servicios' })
  if (rol === 'prestador') enlaces.push({ to: '/panel-prestador', label: 'Mi panel' })
  if (rol === 'admin') enlaces.push({ to: '/admin', label: 'Administración' })
  if (usuario) enlaces.push({ to: '/cuenta', label: 'Mi cuenta' })

  async function salir() {
    await cerrarSesion()
    setMenuMovilAbierto(false)
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-[74px] w-[90%] items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-3 text-xl font-extrabold tracking-tight text-primario transition-transform hover:scale-[1.02]"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primario text-white shadow-sm">
            <ShieldCheck className="h-6 w-6 text-amber-400" aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-tight">
            <span>Trabajitos</span>
            <span className="text-xs font-semibold text-stone-500 tracking-normal">Riohacha</span>
          </span>
        </Link>

        {/* Enlaces de escritorio */}
        <nav aria-label="Principal" className="hidden md:flex items-center gap-1.5">
          {enlaces.map((enlace) => (
            <NavLink
              key={enlace.to}
              to={enlace.to}
              end={enlace.to === '/'}
              className={({ isActive }) =>
                `flex h-11 items-center rounded-full px-5 text-base font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-500/15 text-accion-oscuro shadow-xs'
                    : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                }`
              }
            >
              {enlace.label}
            </NavLink>
          ))}
        </nav>

        {/* Acciones de usuario escritorio */}
        <div className="hidden md:flex items-center gap-3">
          {!cargando &&
            (usuario ? (
              <div className="flex items-center gap-3">
                {rol && (
                  <span className="hidden lg:inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3.5 py-1 text-sm font-semibold text-stone-700 capitalize">
                    <User className="h-3.5 w-3.5 text-stone-500" />
                    {rol}
                  </span>
                )}
                <Boton variante="secundario" onClick={salir}>
                  Salir
                </Boton>
              </div>
            ) : (
              <>
                <BotonEnlace to="/auth" variante="secundario">
                  Ingresar
                </BotonEnlace>
                <BotonEnlace to="/auth?modo=registro">Registrarme</BotonEnlace>
              </>
            ))}
        </div>

        {/* Botón hamburguesa móvil */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-200 text-stone-700 hover:bg-stone-100"
            aria-label="Abrir menú"
            aria-expanded={menuMovilAbierto}
          >
            {menuMovilAbierto ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Menú móvil desplegable */}
      {menuMovilAbierto && (
        <div className="border-b border-stone-200 bg-white px-6 py-6 md:hidden animate-modal-content space-y-4">
          <nav className="flex flex-col gap-2">
            {enlaces.map((enlace) => (
              <NavLink
                key={enlace.to}
                to={enlace.to}
                end={enlace.to === '/'}
                onClick={() => setMenuMovilAbierto(false)}
                className={({ isActive }) =>
                  `flex h-12 items-center rounded-2xl px-4 text-base font-semibold ${
                    isActive
                      ? 'bg-amber-500/15 text-accion-oscuro'
                      : 'text-stone-800 hover:bg-stone-100'
                  }`
                }
              >
                {enlace.label}
              </NavLink>
            ))}
          </nav>

          <div className="pt-4 border-t border-stone-100 flex flex-col gap-3">
            {!cargando &&
              (usuario ? (
                <Boton variante="secundario" onClick={salir} className="w-full">
                  Cerrar sesión
                </Boton>
              ) : (
                <>
                  <BotonEnlace
                    to="/auth"
                    variante="secundario"
                    onClick={() => setMenuMovilAbierto(false)}
                    className="w-full text-center"
                  >
                    Ingresar
                  </BotonEnlace>
                  <BotonEnlace
                    to="/auth?modo=registro"
                    onClick={() => setMenuMovilAbierto(false)}
                    className="w-full text-center"
                  >
                    Registrarme
                  </BotonEnlace>
                </>
              ))}
          </div>
        </div>
      )}
    </header>
  )
}
