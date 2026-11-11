import { useState } from 'react'
import { Boton, BotonEnlace } from '../../components/ui/Boton'
import { Campo, CampoSelect, CampoTexto } from '../../components/ui/Campos'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { Aviso } from '../../components/ui/Aviso'
import { Pasos } from '../../components/ui/Pasos'
import { formatoPesos } from '../../lib/formato'
import { useSesion } from '../../lib/useSesion'
import { mensajeError } from '../auth/mensajes'
import type { PrestadorPublico } from '../perfil/api'
import { BARRIOS, crearSolicitud } from './api'

type Franja = 'manana' | 'tarde'
type Datos = {
  descripcion: string
  barrio: string
  direccion: string
  fecha: string
  franja: Franja
}
type Errores = Partial<Record<'descripcion' | 'barrio' | 'direccion' | 'fecha', string>>

const TOTAL_PASOS = 4
const HORAS: Record<Franja, string> = { manana: '08:00', tarde: '14:00' }
const ETIQUETA_FRANJA: Record<Franja, string> = {
  manana: 'Mañana (8:00 a. m.)',
  tarde: 'Tarde (2:00 p. m.)',
}
const datosIniciales: Datos = { descripcion: '', barrio: '', direccion: '', fecha: '', franja: 'manana' }

function fechaLocal(d: Date) {
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

function fechaLarga(fecha: string) {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function validarPaso(paso: number, d: Datos): Errores {
  const e: Errores = {}
  if (paso === 1 && d.descripcion.trim().length < 10)
    e.descripcion = 'Describe el trabajo con al menos 10 caracteres.'
  if (paso === 2) {
    if (!d.barrio) e.barrio = 'Elige tu barrio.'
    if (d.direccion.trim().length < 5)
      e.direccion = 'Escribe la dirección, por ejemplo: Calle 15 # 10-25.'
  }
  if (paso === 3) {
    if (!d.fecha) e.fecha = 'Elige una fecha.'
    else if (new Date(`${d.fecha}T23:59:59`) < new Date())
      e.fecha = 'Elige hoy o una fecha posterior.'
  }
  return e
}

function Resumen({
  titulo,
  valor,
  onEditar,
}: {
  titulo: string
  valor: string
  onEditar: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-stone-200 p-4">
      <div>
        <p className="text-base font-semibold text-stone-900">{titulo}</p>
        <p className="mt-1 text-base text-stone-800">{valor}</p>
      </div>
      <Boton variante="fantasma" onClick={onEditar}>
        Editar
      </Boton>
    </div>
  )
}

export function FormSolicitud({ prestador }: { prestador: PrestadorPublico }) {
  const { usuario } = useSesion()
  const [paso, setPaso] = useState(1)
  const [d, setD] = useState<Datos>(datosIniciales)
  const [errores, setErrores] = useState<Errores>({})
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  const actualizar = (cambios: Partial<Datos>) => setD((previo) => ({ ...previo, ...cambios }))

  function siguiente() {
    const e = validarPaso(paso, d)
    setErrores(e)
    if (Object.keys(e).length === 0) setPaso(paso + 1)
  }

  function atras() {
    setErrores({})
    setPaso(paso - 1)
  }

  async function enviar() {
    if (!usuario) return
    setEnviando(true)
    setError('')
    try {
      await crearSolicitud({
        clienteId: usuario.id,
        prestadorId: prestador.perfil_id,
        descripcion: d.descripcion.trim(),
        direccion: `${d.barrio}, ${d.direccion.trim()}`,
        fecha: new Date(`${d.fecha}T${HORAS[d.franja]}:00`),
      })
      setPaso(5)
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setEnviando(false)
    }
  }

  if (paso === 5) {
    return (
      <Tarjeta className="space-y-6">
        <Aviso tipo="exito">
          Solicitud enviada a {prestador.nombre}. Puedes seguir su respuesta en Mis servicios.
        </Aviso>
        <div className="flex flex-col gap-3 sm:flex-row">
          <BotonEnlace to="/panel-cliente" className="flex-1">
            Ver mis servicios
          </BotonEnlace>
          <BotonEnlace to="/" variante="secundario" className="flex-1">
            Volver al inicio
          </BotonEnlace>
        </div>
      </Tarjeta>
    )
  }

  return (
    <Tarjeta className="space-y-6">
      <h1 className="text-3xl font-bold text-primario">Solicitar servicio</h1>

      <div className="rounded-xl bg-stone-100 p-4 text-base text-stone-900">
        <p className="font-semibold">
          {prestador.nombre}
          {prestador.oficio && ` · ${prestador.oficio}`}
        </p>
        <p className="text-stone-700">
          Tarifa de referencia:{' '}
          {prestador.tarifa_referencia ? formatoPesos(prestador.tarifa_referencia) : 'por acordar'}
        </p>
      </div>

      <Pasos actual={paso} total={TOTAL_PASOS} />

      {error && <Aviso tipo="error">{error}</Aviso>}

      {paso === 1 && (
        <CampoTexto
          etiqueta="¿Qué necesitas?"
          ayuda="Por ejemplo: reparar una fuga en el lavamanos del baño."
          value={d.descripcion}
          onChange={(e) => actualizar({ descripcion: e.target.value })}
          error={errores.descripcion}
        />
      )}

      {paso === 2 && (
        <div className="space-y-5">
          <CampoSelect
            etiqueta="Barrio"
            value={d.barrio}
            onChange={(e) => actualizar({ barrio: e.target.value })}
            error={errores.barrio}
          >
            <option value="">Elige tu barrio</option>
            {BARRIOS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </CampoSelect>
          <Campo
            etiqueta="Dirección"
            ayuda="Calle o carrera, número y una referencia."
            value={d.direccion}
            onChange={(e) => actualizar({ direccion: e.target.value })}
            error={errores.direccion}
          />
        </div>
      )}

      {paso === 3 && (
        <div className="space-y-5">
          <Campo
            etiqueta="Fecha preferida"
            type="date"
            min={fechaLocal(new Date())}
            value={d.fecha}
            onChange={(e) => actualizar({ fecha: e.target.value })}
            error={errores.fecha}
          />
          <CampoSelect
            etiqueta="Franja horaria"
            value={d.franja}
            onChange={(e) => actualizar({ franja: e.target.value as Franja })}
          >
            <option value="manana">{ETIQUETA_FRANJA.manana}</option>
            <option value="tarde">{ETIQUETA_FRANJA.tarde}</option>
          </CampoSelect>
        </div>
      )}

      {paso === 4 && (
        <div className="space-y-4">
          <p className="text-base text-stone-700">Revisa antes de enviar.</p>
          <Resumen titulo="¿Qué necesitas?" valor={d.descripcion} onEditar={() => setPaso(1)} />
          <Resumen
            titulo="¿Dónde?"
            valor={`${d.barrio}, ${d.direccion}`}
            onEditar={() => setPaso(2)}
          />
          <Resumen
            titulo="¿Cuándo?"
            valor={`${fechaLarga(d.fecha)} · ${ETIQUETA_FRANJA[d.franja]}`}
            onEditar={() => setPaso(3)}
          />
        </div>
      )}

      <div className="flex gap-3">
        {paso > 1 && (
          <Boton variante="secundario" onClick={atras} disabled={enviando}>
            Atrás
          </Boton>
        )}
        {paso < TOTAL_PASOS ? (
          <Boton className="flex-1" onClick={siguiente}>
            Continuar
          </Boton>
        ) : (
          <Boton className="flex-1" cargando={enviando} onClick={() => void enviar()}>
            Enviar solicitud
          </Boton>
        )}
      </div>
    </Tarjeta>
  )
}