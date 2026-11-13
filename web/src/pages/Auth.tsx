import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useSesion } from '../lib/useSesion'
import { FormLogin } from '../features/auth/FormLogin'
import { FormRegistro } from '../features/auth/FormRegistro'
import { rutaInicio } from '../features/auth/rutaInicio'

export function Auth() {
  const [params] = useSearchParams()
  const { usuario, rol } = useSesion()
  const [enFinal, setEnFinal] = useState(false)

  const registro = params.get('modo') === 'registro'
  const rolInicial = params.get('rol') === 'prestador' ? 'prestador' : 'cliente'

  // Quien ya tiene sesión no necesita ver esta pantalla
  if (usuario && rol && !enFinal) return <Navigate to={rutaInicio(rol)} replace />

  return (
    <div className="mx-auto w-[90%] py-16 sm:py-20 flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className={`w-full ${registro ? 'max-w-[540px]' : 'max-w-[460px]'}`}>
        {registro ? (
          <FormRegistro rolInicial={rolInicial} alTerminar={() => setEnFinal(true)} />
        ) : (
          <FormLogin />
        )}
      </div>
    </div>
  )
}
