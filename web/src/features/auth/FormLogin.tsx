import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Rol } from '../../lib/useSesion'
import { Boton } from '../../components/ui/Boton'
import { Campo } from '../../components/ui/Campos'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { Aviso } from '../../components/ui/Aviso'
import { mensajeError } from './mensajes'
import { rutaInicio } from './rutaInicio'

export function FormLogin() {
  const navigate = useNavigate()
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [verContrasena, setVerContrasena] = useState(false)
  const [errores, setErrores] = useState<{ correo?: string; contrasena?: string }>({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(ev: FormEvent) {
    ev.preventDefault()
    const nuevos: { correo?: string; contrasena?: string } = {}
    if (!correo.trim()) nuevos.correo = 'Escribe tu correo.'
    if (!contrasena) nuevos.contrasena = 'Escribe tu contraseña.'
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    setEnviando(true)
    setErrorGeneral('')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: correo.trim(),
      password: contrasena,
    })
    if (error || !data.user) {
      setErrorGeneral(mensajeError(error))
      setEnviando(false)
      return
    }
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', data.user.id)
      .maybeSingle()
    navigate(rutaInicio(perfil?.rol as Rol | undefined), { replace: true })
  }

  return (
    <Tarjeta>
      <form onSubmit={enviar} noValidate className="space-y-5">
        <h1 className="text-3xl font-bold text-primario">Ingresar</h1>

        {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}

        <Campo
          etiqueta="Correo"
          type="email"
          autoComplete="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          error={errores.correo}
        />
        <Campo
          etiqueta="Contraseña"
          type={verContrasena ? 'text' : 'password'}
          autoComplete="current-password"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          error={errores.contrasena}
        />

        <label className="flex items-center gap-3 text-base text-stone-800">
          <input
            type="checkbox"
            checked={verContrasena}
            onChange={(e) => setVerContrasena(e.target.checked)}
            className="h-5 w-5 accent-accion"
          />
          Mostrar contraseña
        </label>

        <Boton type="submit" cargando={enviando} className="w-full">
          Ingresar
        </Boton>

        <p className="text-center text-base text-stone-700">
          ¿No tienes cuenta?{' '}
          <Link
            to="/auth?modo=registro"
            className="font-semibold text-accion-oscuro underline underline-offset-4"
          >
            Crear una cuenta
          </Link>
        </p>
      </form>
    </Tarjeta>
  )
}