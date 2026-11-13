import { useSesion } from '../lib/useSesion'
import { BotonEnlace } from '../components/ui/Boton'
import { FormCuenta } from '../features/cuenta/FormCuenta'
import { FormContrasena } from '../features/cuenta/FormContrasena'

export function Cuenta() {
  const { usuario, rol } = useSesion()
  if (!usuario) return null

  const correo = usuario.email ?? ''

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-10">
      <h1 className="text-3xl font-bold text-primario">Mi cuenta</h1>

      <div className="mt-6 max-w-3xl space-y-6">
        <div className="flex flex-wrap gap-3">
          {rol === 'cliente' && (
            <>
              <BotonEnlace to="/panel-cliente" variante="secundario">
                Mis servicios
              </BotonEnlace>
              <BotonEnlace to="/buscar" variante="secundario">
                Buscar prestadores
              </BotonEnlace>
            </>
          )}
          {rol === 'prestador' && (
            <>
              <BotonEnlace to="/panel-prestador" variante="secundario">
                Mi panel
              </BotonEnlace>
              <BotonEnlace to={`/prestador/${usuario.id}`} variante="secundario">
                Ver mi perfil público
              </BotonEnlace>
            </>
          )}
          {rol === 'admin' && (
            <BotonEnlace to="/admin" variante="secundario">
              Administración
            </BotonEnlace>
          )}
        </div>

        {rol === 'prestador' && (
          <p className="text-base text-stone-700">
            Tu oficio, tarifa, ubicación, fotos y verificación se editan en Mi panel, pestaña Mi
            perfil.
          </p>
        )}

        <FormCuenta userId={usuario.id} correo={correo} />
        <FormContrasena correo={correo} />
      </div>
    </div>
  )
}