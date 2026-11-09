import { useEffect, useState, type FormEvent } from 'react'
import { LocateFixed } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Boton } from '../../components/ui/Boton'
import { Campo, CampoSelect, CampoTexto } from '../../components/ui/Campos'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { Aviso } from '../../components/ui/Aviso'
import { cargarOficios, CENTRO_RIOHACHA, type Oficio } from '../busqueda/api'
import { mensajeError } from '../auth/mensajes'

type Errores = Partial<Record<string, string>>
type Mensaje = { tipo: 'exito' | 'error'; texto: string } | null

type Perfil = { nombre: string; telefono: string | null }
type Fila = {
  oficio_id: number | null
  descripcion: string | null
  anios_experiencia: number | null
  tarifa_referencia: number | null
  lat: number | null
  lng: number | null
  verificado: boolean | null
  perfiles: Perfil | Perfil[] | null
}

// Unos 100 metros: protege la privacidad (CF-04) y sirve para buscar por distancia
const redondear = (n: number) => Number(n.toFixed(3))

export function FormPerfil({ userId }: { userId: string }) {
  const [oficios, setOficios] = useState<Oficio[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(false)
  const [sinPerfil, setSinPerfil] = useState(false)

  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [oficioId, setOficioId] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [anios, setAnios] = useState('')
  const [tarifa, setTarifa] = useState('')
  const [verificado, setVerificado] = useState(false)
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)

  const [errores, setErrores] = useState<Errores>({})
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<Mensaje>(null)
  const [guardandoUbi, setGuardandoUbi] = useState(false)
  const [mensajeUbi, setMensajeUbi] = useState<Mensaje>(null)

  useEffect(() => {
    let cancelado = false
    Promise.all([
      cargarOficios(),
      supabase
        .from('prestadores')
        .select(
          'oficio_id, descripcion, anios_experiencia, tarifa_referencia, lat, lng, verificado, perfiles(nombre, telefono)',
        )
        .eq('perfil_id', userId)
        .maybeSingle(),
    ])
      .then(([lista, res]) => {
        if (cancelado) return
        if (res.error) throw res.error
        setOficios(lista)
        if (!res.data) {
          setSinPerfil(true)
          return
        }
        const fila = res.data as unknown as Fila
        const perfil = Array.isArray(fila.perfiles) ? fila.perfiles[0] : fila.perfiles
        setNombre(perfil?.nombre ?? '')
        setTelefono(perfil?.telefono ?? '')
        setOficioId(fila.oficio_id ? String(fila.oficio_id) : '')
        setDescripcion(fila.descripcion ?? '')
        setAnios(String(fila.anios_experiencia ?? 0))
        setTarifa(fila.tarifa_referencia ? String(fila.tarifa_referencia) : '')
        setVerificado(!!fila.verificado)
        setLat(fila.lat)
        setLng(fila.lng)
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

  function validar(): Errores {
    const e: Errores = {}
    if (nombre.trim().length < 3) e.nombre = 'Escribe tu nombre completo.'
    if (!/^3\d{9}$/.test(telefono.trim()))
      e.telefono = 'Escribe tu celular con 10 números, sin espacios. Empieza por 3.'
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

  async function guardar(ev: FormEvent) {
    ev.preventDefault()
    setMensaje(null)
    const e = validar()
    setErrores(e)
    if (Object.keys(e).length > 0) return

    setGuardando(true)
    try {
      const { error: errPerfil } = await supabase
        .from('perfiles')
        .update({ nombre: nombre.trim(), telefono: telefono.trim() })
        .eq('id', userId)
      if (errPerfil) throw errPerfil

      const { error: errPrestador } = await supabase
        .from('prestadores')
        .update({
          oficio_id: Number(oficioId),
          descripcion: descripcion.trim(),
          anios_experiencia: Number(anios),
          tarifa_referencia: Number(tarifa),
        })
        .eq('perfil_id', userId)
      if (errPrestador) throw errPrestador

      setMensaje({ tipo: 'exito', texto: 'Cambios guardados.' })
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeError(err) })
    } finally {
      setGuardando(false)
    }
  }

  async function guardarUbicacion(nueva: { lat: number; lng: number }) {
    setGuardandoUbi(true)
    setMensajeUbi(null)
    const { error } = await supabase
      .from('prestadores')
      .update({ lat: redondear(nueva.lat), lng: redondear(nueva.lng) })
      .eq('perfil_id', userId)
    setGuardandoUbi(false)
    if (error) {
      setMensajeUbi({ tipo: 'error', texto: mensajeError(error) })
      return
    }
    setLat(redondear(nueva.lat))
    setLng(redondear(nueva.lng))
    setMensajeUbi({ tipo: 'exito', texto: 'Ubicación guardada.' })
  }

  function usarMiUbicacion() {
    if (!navigator.geolocation) {
      setMensajeUbi({ tipo: 'error', texto: 'Tu navegador no permite usar la ubicación.' })
      return
    }
    setGuardandoUbi(true)
    setMensajeUbi(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => void guardarUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        setGuardandoUbi(false)
        setMensajeUbi({
          tipo: 'error',
          texto:
            'No pudimos obtener tu ubicación. Permite el acceso en el navegador o usa el centro de Riohacha.',
        })
      },
      { timeout: 10000 },
    )
  }

  if (cargando) return <p className="py-8 text-base text-stone-700">Cargando tu perfil...</p>
  if (errorCarga)
    return <Aviso tipo="error">No pudimos cargar tu perfil. Recarga la página.</Aviso>
  if (sinPerfil)
    return (
      <Aviso tipo="error">
        No encontramos tu perfil de prestador. Si te registraste como cliente, esta sección no
        aplica.
      </Aviso>
    )

  const tieneUbicacion = lat !== null && lng !== null

  return (
    <div className="space-y-6">
      {verificado && tieneUbicacion ? (
        <Aviso tipo="exito">Tu perfil está verificado y aparece en las búsquedas.</Aviso>
      ) : (
        <Aviso tipo="info">
          Todavía no apareces en las búsquedas.{' '}
          {!verificado && 'Falta que verifiquemos tu identidad. '}
          {!tieneUbicacion && 'Falta guardar tu ubicación.'}
        </Aviso>
      )}

      <Tarjeta>
        <form onSubmit={guardar} noValidate className="space-y-5">
          <h2 className="text-2xl font-bold text-primario">Mis datos</h2>

          {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}

          <Campo
            etiqueta="Nombre completo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            error={errores.nombre}
          />
          <Campo
            etiqueta="Celular"
            inputMode="numeric"
            maxLength={10}
            value={telefono}
            onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))}
            error={errores.telefono}
          />
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

          <Boton type="submit" cargando={guardando}>
            Guardar cambios
          </Boton>
        </form>
      </Tarjeta>

      <Tarjeta>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-primario">Mi ubicación</h2>
          <p className="text-base text-stone-700">
            Sirve para que los clientes cercanos te encuentren. La guardamos de forma aproximada
            (unos 100 metros) para proteger tu privacidad.
          </p>
          <p className="text-base font-semibold text-stone-900">
            {tieneUbicacion ? 'Ubicación guardada.' : 'Aún no has guardado tu ubicación.'}
          </p>

          {mensajeUbi && <Aviso tipo={mensajeUbi.tipo}>{mensajeUbi.texto}</Aviso>}

          <div className="flex flex-wrap gap-3">
            <Boton onClick={usarMiUbicacion} cargando={guardandoUbi}>
              <LocateFixed className="h-5 w-5" aria-hidden="true" />
              Usar mi ubicación actual
            </Boton>
            <Boton
              variante="secundario"
              disabled={guardandoUbi}
              onClick={() => void guardarUbicacion(CENTRO_RIOHACHA)}
            >
              Usar el centro de Riohacha
            </Boton>
          </div>
        </div>
      </Tarjeta>
    </div>
  )
}