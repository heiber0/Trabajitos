import { useEffect, useState, type FormEvent } from 'react'
import { Boton } from '../../components/ui/Boton'
import { Campo } from '../../components/ui/Campos'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { Aviso } from '../../components/ui/Aviso'
import { mensajeError } from '../auth/mensajes'
import { codigoDe } from '../valoraciones/api'
import { cargarMiPerfil, guardarMiPerfil, type MiPerfil } from './api'

type Errores = Partial<Record<'nombre' | 'telefono', string>>
type Mensaje = { tipo: 'exito' | 'error'; texto: string } | null

const ETIQUETA_ROL: Record<string, string> = {
  cliente: 'Cliente',
  prestador: 'Prestador',
  admin: 'Administrador',
}

export function FormCuenta({ userId, correo }: { userId: string; correo: string }) {
  const [perfil, setPerfil] = useState<MiPerfil | null>(null)
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(false)
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [errores, setErrores] = useState<Errores>({})
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<Mensaje>(null)

  useEffect(() => {
    let cancelado = false
    cargarMiPerfil(userId)
      .then((p) => {
        if (cancelado) return
        if (!p) {
          setErrorCarga(true)
          return
        }
        setPerfil(p)
        setNombre(p.nombre)
        setTelefono(p.telefono ?? '')
      })
      .catch(() => {
        if (!cancelado) setErrorCarga(true)
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [userId])

  async function guardar(ev: FormEvent) {
    ev.preventDefault()
    setMensaje(null)

    const e: Errores = {}
    const n = nombre.trim()
    if (n.length < 3 || n.length > 80) e.nombre = 'Escribe tu nombre completo (entre 3 y 80 letras).'
    if (!/^3\d{9}$/.test(telefono.trim()))
      e.telefono = 'Escribe tu celular con 10 números, sin espacios. Empieza por 3.'
    setErrores(e)
    if (Object.keys(e).length > 0) return

    setGuardando(true)
    try {
      await guardarMiPerfil(userId, n, telefono.trim())
      setMensaje({ tipo: 'exito', texto: 'Tus datos se guardaron.' })
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto:
          codigoDe(err) === '23514'
            ? 'Revisa tu nombre y tu celular: alguno no tiene el formato correcto.'
            : mensajeError(err),
      })
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <p className="text-base text-stone-700">Cargando tus datos...</p>
  if (errorCarga || !perfil) {
    return <Aviso tipo="error">No pudimos cargar tus datos. Recarga la página.</Aviso>
  }

  return (
    <Tarjeta>
      <form onSubmit={guardar} noValidate className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-primario">Mis datos</h2>
          <p className="mt-1 text-base text-stone-700">
            {ETIQUETA_ROL[perfil.rol] ?? perfil.rol}
            {perfil.creado_en &&
              ` · miembro desde ${new Date(perfil.creado_en).toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'long',
              })}`}
          </p>
        </div>

        {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}

        <Campo
          etiqueta="Nombre completo"
          autoComplete="name"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          error={errores.nombre}
        />
        <Campo
          etiqueta="Celular"
          ayuda="Se comparte con la otra persona cuando se acepta un servicio entre ustedes."
          inputMode="numeric"
          maxLength={10}
          autoComplete="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))}
          error={errores.telefono}
        />
        <Campo
          etiqueta="Correo"
          ayuda="Por ahora el correo no se puede cambiar."
          value={correo}
          readOnly
        />

        <Boton type="submit" cargando={guardando}>
          Guardar cambios
        </Boton>
      </form>
    </Tarjeta>
  )
}