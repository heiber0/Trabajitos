import { useState, type FormEvent } from 'react'
import { Boton } from '../../components/ui/Boton'
import { Campo } from '../../components/ui/Campos'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { Aviso } from '../../components/ui/Aviso'
import { mensajeError } from '../auth/mensajes'
import { codigoDe, textoDe } from '../valoraciones/api'
import { cambiarContrasena } from './api'

type Errores = Partial<Record<'actual' | 'nueva' | 'repetir', string>>
type Mensaje = { tipo: 'exito' | 'error'; texto: string } | null

function mensajeContrasena(err: unknown): string {
  const codigo = codigoDe(err)
  if (textoDe(err).includes('CONTRASENA_ACTUAL')) return 'La contraseña actual no es correcta.'
  if (codigo === 'same_password') return 'La contraseña nueva debe ser distinta de la actual.'
  if (codigo === 'weak_password')
    return 'Esa contraseña es muy fácil de adivinar. Prueba una más larga y variada.'
  if (codigo === 'reauthentication_needed')
    return 'Por seguridad, cierra sesión, vuelve a ingresar e intenta de nuevo.'
  return mensajeError(err)
}

export function FormContrasena({ correo }: { correo: string }) {
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [repetir, setRepetir] = useState('')
  const [ver, setVer] = useState(false)
  const [errores, setErrores] = useState<Errores>({})
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<Mensaje>(null)

  async function guardar(ev: FormEvent) {
    ev.preventDefault()
    setMensaje(null)

    const e: Errores = {}
    if (!actual) e.actual = 'Escribe tu contraseña actual.'
    if (nueva.length < 8) e.nueva = 'La contraseña nueva debe tener al menos 8 caracteres.'
    else if (nueva === actual) e.nueva = 'La contraseña nueva debe ser distinta de la actual.'
    if (repetir !== nueva) e.repetir = 'Las dos contraseñas nuevas no coinciden.'
    setErrores(e)
    if (Object.keys(e).length > 0) return

    setGuardando(true)
    try {
      await cambiarContrasena(correo, actual, nueva)
      setActual('')
      setNueva('')
      setRepetir('')
      setMensaje({ tipo: 'exito', texto: 'Tu contraseña se cambió.' })
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeContrasena(err) })
    } finally {
      setGuardando(false)
    }
  }

  const tipo = ver ? 'text' : 'password'

  return (
    <Tarjeta>
      <form onSubmit={guardar} noValidate className="space-y-5">
        <h2 className="text-2xl font-bold text-primario">Cambiar contraseña</h2>

        {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}

        <Campo
          etiqueta="Contraseña actual"
          type={tipo}
          autoComplete="current-password"
          value={actual}
          onChange={(e) => setActual(e.target.value)}
          error={errores.actual}
        />
        <Campo
          etiqueta="Contraseña nueva"
          ayuda="Mínimo 8 caracteres."
          type={tipo}
          autoComplete="new-password"
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          error={errores.nueva}
        />
        <Campo
          etiqueta="Repite la contraseña nueva"
          type={tipo}
          autoComplete="new-password"
          value={repetir}
          onChange={(e) => setRepetir(e.target.value)}
          error={errores.repetir}
        />

        <label className="flex items-center gap-3 text-base text-stone-800">
          <input
            type="checkbox"
            checked={ver}
            onChange={(e) => setVer(e.target.checked)}
            className="h-5 w-5 accent-accion"
          />
          Mostrar contraseñas
        </label>

        <Boton type="submit" cargando={guardando}>
          Cambiar contraseña
        </Boton>
      </form>
    </Tarjeta>
  )
}