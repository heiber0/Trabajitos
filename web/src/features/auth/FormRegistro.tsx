import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useSesion } from '../../lib/useSesion'
import { Boton, BotonEnlace } from '../../components/ui/Boton'
import { Campo, CampoSelect, CampoTexto } from '../../components/ui/Campos'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { Aviso } from '../../components/ui/Aviso'
import { Pasos } from '../../components/ui/Pasos'
import { mensajeError } from './mensajes'

type RolNuevo = 'cliente' | 'prestador'
type Errores = Partial<Record<string, string>>
type Oficio = { id: number; nombre: string }

type Props = { rolInicial: RolNuevo; alTerminar: () => void }

export function FormRegistro({ rolInicial, alTerminar }: Props) {
  const { refrescar } = useSesion()
  const [etapa, setEtapa] = useState<1 | 2 | 3>(1)
  const [rol, setRol] = useState<RolNuevo>(rolInicial)

  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [telefono, setTelefono] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [consentimiento, setConsentimiento] = useState(false)

  const [oficioId, setOficioId] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [anios, setAnios] = useState('')
  const [tarifa, setTarifa] = useState('')

  const [oficios, setOficios] = useState<Oficio[]>([])
  const [errores, setErrores] = useState<Errores>({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)

  const total = rol === 'prestador' ? 2 : 1

  useEffect(() => {
    if (rol !== 'prestador' || oficios.length > 0) return
    supabase
      .from('oficios')
      .select('id, nombre')
      .order('nombre')
      .then(({ data }) => setOficios(data ?? []))
  }, [rol, oficios.length])

  function validarCuenta(): Errores {
    const e: Errores = {}
    if (nombre.trim().length < 3) e.nombre = 'Escribe tu nombre completo.'
    if (!/^\S+@\S+\.\S+$/.test(correo.trim()))
      e.correo = 'Escribe un correo válido, por ejemplo nombre@correo.com.'
    if (!/^3\d{9}$/.test(telefono.trim()))
      e.telefono = 'Escribe tu celular con 10 números, sin espacios. Empieza por 3.'
    if (contrasena.length < 8) e.contrasena = 'La contraseña debe tener al menos 8 caracteres.'
    if (!consentimiento)
      e.consentimiento = 'Debes aceptar el tratamiento de tus datos para crear la cuenta.'
    return e
  }

  function validarPerfil(): Errores {
    const e: Errores = {}
    if (!oficioId) e.oficioId = 'Elige tu oficio.'
    if (descripcion.trim().length < 20)
      e.descripcion = 'Cuéntanos un poco más: escribe al menos 20 caracteres.'
    const a = Number(anios)
    if (anios === '' || !Number.isInteger(a) || a < 0 || a > 60)
      e.anios = 'Escribe un número entre 0 y 60.'
    const t = Number(tarifa)
    if (tarifa === '' || !Number.isFinite(t) || t < 10000)
      e.tarifa = 'Escribe un valor desde 10000, solo números.'
    return e
  }

  async function crearCuenta() {
    setEnviando(true)
    setErrorGeneral('')
    try {
      // Si quedó una sesión de un intento anterior, se reutiliza
      let userId = (await supabase.auth.getSession()).data.session?.user.id
      if (!userId) {
        const { data, error } = await supabase.auth.signUp({
          email: correo.trim(),
          password: contrasena,
        })
        if (error) throw error
        if (!data.user || !data.session) throw new Error('SIN_SESION')
        userId = data.user.id
      }

      const { error: errPerfil } = await supabase
        .from('perfiles')
        .upsert({ id: userId, rol, nombre: nombre.trim(), telefono: telefono.trim() })
      if (errPerfil) throw errPerfil

      if (rol === 'prestador') {
        const { error: errPrestador } = await supabase.from('prestadores').upsert({
          perfil_id: userId,
          oficio_id: Number(oficioId),
          descripcion: descripcion.trim(),
          anios_experiencia: Number(anios),
          tarifa_referencia: Number(tarifa),
        })
        if (errPrestador) throw errPrestador
      }

      alTerminar() // antes de refrescar, para que la pantalla final no se salte
      await refrescar()
      setEtapa(3)
    } catch (err) {
      setErrorGeneral(mensajeError(err))
    } finally {
      setEnviando(false)
    }
  }

  async function enviarCuenta(ev: FormEvent) {
    ev.preventDefault()
    const e = validarCuenta()
    setErrores(e)
    if (Object.keys(e).length > 0) return
    if (rol === 'prestador') {
      setEtapa(2)
      return
    }
    await crearCuenta()
  }

  async function enviarPerfil(ev: FormEvent) {
    ev.preventDefault()
    const e = validarPerfil()
    setErrores(e)
    if (Object.keys(e).length > 0) return
    await crearCuenta()
  }

  if (etapa === 3) {
    return (
      <Tarjeta className="space-y-5">
        <Aviso tipo="exito">
          {rol === 'prestador'
            ? 'Tu perfil está en revisión. Aparecerá en las búsquedas cuando lo verifiquemos.'
            : 'Tu cuenta fue creada.'}
        </Aviso>
        <BotonEnlace
          to={rol === 'prestador' ? '/panel-prestador' : '/buscar'}
          className="w-full"
        >
          {rol === 'prestador' ? 'Ir a mi panel' : 'Buscar prestadores'}
        </BotonEnlace>
      </Tarjeta>
    )
  }

  if (etapa === 2) {
    return (
      <Tarjeta>
        <form onSubmit={enviarPerfil} noValidate className="space-y-5">
          <h1 className="text-3xl font-bold text-primario">Cuéntanos sobre tu oficio</h1>
          <Pasos actual={2} total={total} />

          {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}

          <CampoSelect
            etiqueta="Oficio"
            value={oficioId}
            onChange={(e) => setOficioId(e.target.value)}
            error={errores.oficioId}
          >
            <option value="">Elige tu oficio</option>
            {oficios.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombre}
              </option>
            ))}
          </CampoSelect>

          <CampoTexto
            etiqueta="Descripción"
            ayuda="Cuenta qué trabajos haces y en qué eres bueno."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            error={errores.descripcion}
          />

          <Campo
            etiqueta="Años de experiencia"
            type="number"
            inputMode="numeric"
            min={0}
            max={60}
            value={anios}
            onChange={(e) => setAnios(e.target.value)}
            error={errores.anios}
          />

          <Campo
            etiqueta="Tarifa de referencia por visita (en pesos)"
            ayuda="Es solo una guía para el cliente. El valor final se acuerda antes del trabajo."
            type="number"
            inputMode="numeric"
            min={0}
            step={1000}
            value={tarifa}
            onChange={(e) => setTarifa(e.target.value)}
            error={errores.tarifa}
          />

          <div className="flex gap-3">
            <Boton
              type="button"
              variante="secundario"
              onClick={() => {
                setErrores({})
                setEtapa(1)
              }}
            >
              Atrás
            </Boton>
            <Boton type="submit" cargando={enviando} className="flex-1">
              Crear mi perfil
            </Boton>
          </div>
        </form>
      </Tarjeta>
    )
  }

  return (
    <Tarjeta>
      <form onSubmit={enviarCuenta} noValidate className="space-y-5">
        <div>
          <h1 className="text-3xl font-bold text-primario">Crea tu cuenta</h1>
          <p className="mt-1 text-base text-stone-700">Es gratis y toma un par de minutos.</p>
        </div>

        <Pasos actual={1} total={total} />

        {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}

        <div
          role="radiogroup"
          aria-label="Tipo de cuenta"
          className="grid grid-cols-2 gap-3"
        >
          {(['cliente', 'prestador'] as const).map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={rol === r}
              onClick={() => setRol(r)}
              className={`h-14 rounded-xl border-2 text-base font-semibold transition-colors ${
                rol === r
                  ? 'border-accion bg-amber-50 text-primario'
                  : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              {r === 'cliente' ? 'Soy cliente' : 'Soy prestador'}
            </button>
          ))}
        </div>

        <Campo
          etiqueta="Nombre completo"
          autoComplete="name"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          error={errores.nombre}
        />
        <Campo
          etiqueta="Correo"
          type="email"
          autoComplete="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          error={errores.correo}
        />
        <Campo
          etiqueta="Celular"
          inputMode="numeric"
          maxLength={10}
          autoComplete="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))}
          error={errores.telefono}
        />
        <Campo
          etiqueta="Contraseña"
          ayuda="Mínimo 8 caracteres."
          type="password"
          autoComplete="new-password"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          error={errores.contrasena}
        />

        <div>
          <label className="flex items-start gap-3 text-base text-stone-800">
            <input
              type="checkbox"
              checked={consentimiento}
              onChange={(e) => setConsentimiento(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 accent-accion"
            />
            <span>
              Autorizo el tratamiento de mis datos personales para usar Trabajitos, conforme
              a la Ley 1581 de 2012.
            </span>
          </label>
          {errores.consentimiento && (
            <p role="alert" className="mt-1 text-base font-medium text-error">
              {errores.consentimiento}
            </p>
          )}
        </div>

        <Boton type="submit" cargando={enviando} className="w-full">
          {rol === 'prestador' ? 'Continuar' : 'Crear mi cuenta'}
        </Boton>

        <p className="text-center text-base text-stone-700">
          ¿Ya tienes cuenta?{' '}
          <Link to="/auth" className="font-semibold text-accion-oscuro underline underline-offset-4">
            Ingresar
          </Link>
        </p>
      </form>
    </Tarjeta>
  )
}