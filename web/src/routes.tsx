import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useSesion, type Rol } from './lib/useSesion'
import Layout from './components/layout/Layout'
import NoEncontrada from './pages/NoEncontrada'
import { Home } from './pages/Home'
import { Explorar } from './pages/Explorar'
import { PerfilPrestador } from './pages/PerfilPrestador'
import { PanelCliente } from './pages/PanelCliente'
import { PanelPrestador } from './pages/PanelPrestador'
import { PanelAdmin } from './pages/PanelAdmin'
import { Auth } from './pages/Auth'
import Solicitar from './pages/solicitudes/Solicitar'
import Valorar from './pages/Valorar'
import { Cuenta } from './pages/Cuenta'

function RutaProtegida({ roles }: { roles?: Rol[] }) {
  const { usuario, rol, cargando } = useSesion()

  if (cargando) return <p className="p-6 text-base">Cargando...</p>
  if (!usuario) return <Navigate to="/auth" replace />
  if (roles && (!rol || !roles.includes(rol))) return <Navigate to="/" replace />
  return <Outlet />
}

export default function RutasApp() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/buscar" element={<Explorar />} />
        <Route path="/prestador/:id" element={<PerfilPrestador />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/login" element={<Navigate to="/auth" replace />} />
        <Route path="/registro" element={<Navigate to="/auth?modo=registro" replace />} />

        <Route element={<RutaProtegida />}>
          <Route path="/cuenta" element={<Cuenta />} />
        </Route>

        <Route element={<RutaProtegida roles={['cliente']} />}>
          <Route path="/solicitar/:id" element={<Solicitar />} />
          <Route path="/panel-cliente" element={<PanelCliente />} />
          <Route path="/valorar/:solicitudId" element={<Valorar />} />
        </Route>
        <Route element={<RutaProtegida roles={['prestador']} />}>
          <Route path="/panel-prestador" element={<PanelPrestador />} />
        </Route>
        <Route element={<RutaProtegida roles={['admin']} />}>
          <Route path="/admin" element={<PanelAdmin />} />
        </Route>

        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  )
}