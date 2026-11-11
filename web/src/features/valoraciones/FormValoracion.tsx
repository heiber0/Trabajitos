import { useState, type FormEvent } from 'react'
import { Boton, BotonEnlace } from '../../components/ui/Boton'
import { CampoTexto } from '../../components/ui/Campos'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { Aviso } from '../../components/ui/Aviso'
import { SelectorEstrellas } from '../../components/ui/SelectorEstrellas'
import { mensajeError } from '../auth/mensajes'
import type { Solicitud } from '../solicitudes/api'
import { codigoDe, crearValoracion, type Calificacion } from './api'

type Clave = keyof Calificacion

const CRITERIOS: { clave: Clave; etiqueta: string }[] = [
  { clave: 'puntualidad', etiqueta: 'Puntualidad en la cita' },
  { clave: 'calidad', etiqueta: 'Calidad del trabajo' },
  { clave: 'precio', etiqueta: 'Precio justo y claro' },
  { clave: 'trato', etiqueta: 'Trato y respeto' },
]

const VACIO: Calificacion = { puntualidad: 0, calidad: 0, precio: 0, trato: 0 }

export function FormValoracion({
  solicitud,
  clienteId,
}: {
  solicitud: Solicitud
  clienteId: string
}) {
  const [notas, setNotas] = useState<Calificacion>(VACIO)
  const [comentario, setComentario] = useState('')
  const [errores, setErrores] = useState<Partial<Record<Clave, string>>>({})
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [listo, setListo] = useState(false)

  async function enviar(ev: FormEvent) {
    ev.preventDefault()
    if (enviando) return

    const e: Partial<Record<Clave, string>> = {}
    for (const { clave } of CRITERIOS) {
      if (notas[clave] === 0) e[clave] = 'Elige de 1 a 5 estrellas.'
    }
    setErrores(e)
    if (Object.keys(e).length > 0) return

    setEnviando(true)
    setError('')
    try {
      await crearValoracion({
        solicitudId: solicitud.id,
        clienteId,
        prestadorId: solicitud.prestador_id,
        notas,
        comentario,
      })
      setListo(true)
    } catch (err) {
      const codigo = codigoDe(err)
      if (codigo === '23505') setError('Ya valoraste este servicio.')
      else if (codigo === '42501')
        setError('No puedes valorar este servicio. Solo se valoran servicios finalizados.')
      else setError(mensajeError(err))
    } finally {
      setEnviando(false)
    }
  }

  if (listo) {
    return (
      <Tarjeta className="space-y-6">
        <Aviso tipo="exito">
          ¡Gracias! Tu valoración ya aparece en el perfil de {solicitud.prestador_nombre}.
        </Aviso>
        <div className="flex gap-3">
          <BotonEnlace to="/panel-cliente" className="flex-1">
            Volver a mis servicios
          </BotonEnlace>
          <BotonEnlace
            to={`/prestador/${solicitud.prestador_id}`}
            variante="secundario"
            className="flex-1"
          >
            Ver el perfil
          </BotonEnlace>
        </div>
      </Tarjeta>
    )
  }

  return (
    <Tarjeta>
      <form onSubmit={enviar} noValidate className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primario">Valorar servicio</h1>
          <p className="mt-2 text-base font-semibold text-stone-900">
            {solicitud.prestador_nombre}
            {solicitud.oficio && ` · ${solicitud.oficio}`}
          </p>
          <p className="text-base text-stone-700">{solicitud.descripcion}</p>
        </div>

        <Aviso tipo="info">
          Solo se valoran servicios finalizados. Tu opinión ayuda a otros vecinos y, una vez
          publicada, no se puede cambiar.
        </Aviso>

        {error && <Aviso tipo="error">{error}</Aviso>}

        <div className="space-y-4">
          {CRITERIOS.map(({ clave, etiqueta }) => (
            <SelectorEstrellas
              key={clave}
              etiqueta={etiqueta}
              valor={notas[clave]}
              onChange={(n) => setNotas((previo) => ({ ...previo, [clave]: n }))}
              error={errores[clave]}
            />
          ))}
        </div>

        <CampoTexto
          etiqueta="Comentario (opcional)"
          ayuda="Cuenta cómo fue el trabajo. Máximo 500 caracteres."
          maxLength={500}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
        />

        <div className="flex gap-3">
          <BotonEnlace to="/panel-cliente" variante="secundario">
            Cancelar
          </BotonEnlace>
          <Boton type="submit" cargando={enviando} className="flex-1">
            Publicar valoración
          </Boton>
        </div>
      </form>
    </Tarjeta>
  )
}