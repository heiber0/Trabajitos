import { Link } from 'react-router-dom'
import { useSesion } from '../lib/useSesion'

export default function Inicio() {
  const { usuario, rol, cargando, cerrarSesion } = useSesion()

  return (
    <div className="space-y-3 p-6">
      <h1 className="text-2xl font-bold">Trabajitos</h1>
      <p>
        {cargando
          ? 'Cargando sesión...'
          : usuario
            ? `Sesión: ${usuario.email} (rol: ${rol ?? 'sin perfil'})`
            : 'Sin sesión'}
      </p>
      <nav className="flex flex-wrap gap-4 underline">
        <Link to="/login">Login</Link>
        <Link to="/registro">Registro</Link>
        <Link to="/buscar">Buscar</Link>
        <Link to="/solicitudes">Mis solicitudes</Link>
        <Link to="/perfil">Mi perfil</Link>
        <Link to="/admin">Admin</Link>
      </nav>
      {usuario && (
        <button className="border px-3 py-1" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      )}
    </div>
  )
}