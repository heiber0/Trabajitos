import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Aviso } from '../components/ui/Aviso'
import { Boton, BotonEnlace } from '../components/ui/Boton'
import { FormValoracion } from '../features/valoraciones/FormValoracion'
import { cargarValoradas } from '../features/valoraciones/api'
import { cargarMisSolicitudes, type Solicitud } from '../features/solicitudes/api'
import { useSesion } from '../lib/useSesion'

type Estado =
  | 'cargando'
  | 'error'
  | 'no_encontrada'
  | 'no_finalizada'
  | 'ya_valorada'
  | 'lista'

export default function Valorar() {
  const { solicitudId = '' } = useParams()
  const { usuario } = useSesion()
  const userId = usuario?.id
  const [estado, setEstado] = useState<Estado>('cargando')
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    if (!userId) return
    let cancelado = false
    setEstado('cargando')
    Promise.all([cargarMisSolicitudes(), cargarValoradas(userId)])
      .then(([lista, valoradas]) => {
        if (cancelado) return
        const s = lista.find((x) => x.id === solicitudId && x.rol_yo === 'cliente')
        if (!s) {
          setEstado('no_encontrada')
          return
        }
        setSolicitud(s)
        if (s.estado !== 'finalizada') setEstado('no_finalizada')
        else if (valoradas.has(s.id)) setEstado('ya_valorada')
        else setEstado('lista')
      })
      .catch(() => {
        if (!cancelado) setEstado('error')
      })
    return () => {
      cancelado = true
    }
  }, [solicitudId, userId, intento])

  const volver = (
    <BotonEnlace to="/panel-cliente" variante="secundario">
      Volver a mis servicios
    </BotonEnlace>
  )

  return (
    <div className="mx-auto max-w-[640px] px-6 py-10">
      {estado === 'cargando' && <p className="text-base text-stone-700">Cargando...</p>}

      {estado === 'error' && (
        <div className="space-y-4">
          <Aviso tipo="error">No pudimos cargar el servicio. Revisa tu conexión.</Aviso>
          <Boton onClick={() => setIntento((n) => n + 1)}>Reintentar</Boton>
        </div>
      )}

      {estado === 'no_encontrada' && (
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-primario">No encontramos este servicio</h1>
          <p className="text-base text-stone-700">Solo puedes valorar tus propios servicios.</p>
          {volver}
        </div>
      )}

      {estado === 'no_finalizada' && (
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-primario">Aún no puedes valorarlo</h1>
          <p className="text-base text-stone-700">
            Este servicio todavía no está finalizado, por eso no puedes valorarlo.
          </p>
          {volver}
        </div>
      )}

      {estado === 'ya_valorada' && (
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-primario">Ya valoraste este servicio</h1>
          <p className="text-base text-stone-700">Cada servicio se valora una sola vez.</p>
          {volver}
        </div>
      )}

      {estado === 'lista' && solicitud && userId && (
        <FormValoracion solicitud={solicitud} clienteId={userId} />
      )}
    </div>
  )
}