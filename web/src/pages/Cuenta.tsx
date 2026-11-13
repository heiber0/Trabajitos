import { useSesion } from '../lib/useSesion'
import { BotonEnlace } from '../components/ui/Boton'
import { FormCuenta } from '../features/cuenta/FormCuenta'
import { FormContrasena } from '../features/cuenta/FormContrasena'

export function Cuenta() {
  const { usuario, rol } = useSesion()
  if (!usuario) return null

  const correo = usuario.email ?? ''

  return (
    <div className="mx-auto w-[90%] py-10">
      <div className="pb-6 border-b border-stone-200/80">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-primario tracking-tight">Mi cuenta</h1>
        <p className="mt-1 text-base text-stone-600">
          Gestiona tus datos personales, información de contacto y seguridad de acceso.
        </p>
      </div>

      <div className="mt-8 max-w-3xl space-y-8">
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
          <div className="rounded-2xl bg-amber-50/80 border border-amber-200/60 p-4 text-base text-stone-700">
            Tu oficio, tarifa, ubicación, fotos y verificación se editan en{' '}
            <strong className="text-primario font-semibold">Mi panel</strong>, pestaña{' '}
            <strong className="text-primario font-semibold">Mi perfil</strong>.
          </div>
        )}

        <FormCuenta userId={usuario.id} correo={correo} />
        <FormContrasena correo={correo} />
      </div>
    </div>
  )
}