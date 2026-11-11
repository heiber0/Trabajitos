import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Aviso } from '../../components/ui/Aviso'
import { BotonEnlace, Boton } from '../../components/ui/Boton'
import { cargarPerfilPublico, type PrestadorPublico } from '../../features/perfil/api'
import { FormSolicitud } from '../../features/solicitudes/FormSolicitud'

export default function Solicitar() {
  const { id = '' } = useParams()
  const [prestador, setPrestador] = useState<PrestadorPublico | null>(null)
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'no_disponible' | 'error'>(
    'cargando',
  )
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let cancelado = false
    setEstado('cargando')
    cargarPerfilPublico(id)
      .then((datos) => {
        if (cancelado) return
        if (datos?.prestador.verificado) {
          setPrestador(datos.prestador)
          setEstado('listo')
        } else {
          setEstado('no_disponible')
        }
      })
      .catch(() => {
        if (!cancelado) setEstado('error')
      })
    return () => {
      cancelado = true
    }
  }, [id, intento])

  if (estado === 'cargando') {
    return <p className="mx-auto max-w-[1120px] px-6 py-12 text-base">Cargando...</p>
  }

  if (estado === 'error') {
    return (
      <div className="mx-auto max-w-[1120px] space-y-4 px-6 py-12">
        <Aviso tipo="error">No pudimos cargar al prestador. Revisa tu conexión.</Aviso>
        <Boton onClick={() => setIntento((n) => n + 1)}>Reintentar</Boton>
      </div>
    )
  }

  if (estado === 'no_disponible' || !prestador) {
    return (
      <div className="mx-auto max-w-[1120px] space-y-4 px-6 py-12">
        <h1 className="text-3xl font-bold text-primario">Este prestador no está disponible</h1>
        <p className="text-base text-stone-700">
          Solo puedes solicitar servicios a prestadores verificados.
        </p>
        <BotonEnlace to="/buscar">Buscar prestadores</BotonEnlace>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[640px] px-6 py-10">
      <FormSolicitud prestador={prestador} />
    </div>
  )
}