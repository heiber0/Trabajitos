import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useSesion, type Rol } from './lib/useSesion'

import Inicio from './pages/Inicio'
import NoEncontrada from './pages/NoEncontrada'
import Login from './pages/auth/Login'
import Registro from './pages/auth/Registro'
import Perfil from './pages/perfil/Perfil'
import PrestadorPublico from './pages/perfil/PrestadorPublico'
import Buscar from './pages/buscar/Buscar'
import Solicitudes from './pages/solicitudes/Solicitudes'
import Solicitar from './pages/solicitudes/Solicitar'
import Admin from './pages/admin/Admin'
import Valorar from './features/valoraciones/Valorar'

function RutaProtegida({ roles }: { roles?: Rol[] }) {
  const { usuario, rol, cargando } = useSesion()

  if (cargando) return <p className="p-6">Cargando...</p>
  if (!usuario) return <Navigate to="/login" replace />
  if (roles && (!rol || !roles.includes(rol))) return <Navigate to="/" replace />
  return <Outlet />
}

export default function RutasApp() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/prestador/:id" element={<PrestadorPublico />} />

      <Route element={<RutaProtegida />}>
        <Route path="/buscar" element={<Buscar />} />
        <Route path="/solicitudes" element={<Solicitudes />} />
        <Route path="/solicitar/:prestadorId" element={<Solicitar />} />
        <Route path="/valorar/:solicitudId" element={<Valorar />} />
        <Route path="/perfil" element={<Perfil />} />
      </Route>

      <Route element={<RutaProtegida roles={['admin']} />}>
        <Route path="/admin" element={<Admin />} />
      </Route>

      <Route path="*" element={<NoEncontrada />} />
    </Routes>
  )
}