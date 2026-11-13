import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
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
    <div className="mx-auto w-[90%] py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <nav aria-label="Ruta" className="flex items-center gap-2 text-sm text-stone-500">
          <Link to="/panel-cliente" className="hover:text-accion transition-colors">
            Mis servicios
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-semibold text-stone-900">Calificar servicio</span>
        </nav>

        {estado === 'cargando' && (
          <div className="py-20 text-center text-stone-500">
            <p className="text-base font-medium">Cargando formulario de valoración...</p>
          </div>
        )}

        {estado === 'error' && (
          <div className="space-y-4 rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-xs">
            <Aviso tipo="error">No pudimos cargar los datos del servicio. Revisa tu conexión.</Aviso>
            <div className="pt-2">
              <Boton onClick={() => setIntento((n) => n + 1)}>Reintentar</Boton>
            </div>
          </div>
        )}

        {estado === 'no_encontrada' && (
          <div className="space-y-4 rounded-3xl border border-stone-200 bg-white p-10 text-center shadow-xs">
            <h1 className="text-2xl font-bold text-primario">No encontramos este servicio</h1>
            <p className="text-base text-stone-600">Solo puedes valorar solicitudes de tu propia cuenta.</p>
            <div className="pt-2">{volver}</div>
          </div>
        )}

        {estado === 'no_finalizada' && (
          <div className="space-y-4 rounded-3xl border border-stone-200 bg-white p-10 text-center shadow-xs">
            <h1 className="text-2xl font-bold text-primario">Aún no puedes valorarlo</h1>
            <p className="text-base text-stone-600">
              Este trabajo todavía no ha sido marcado como finalizado por el prestador.
            </p>
            <div className="pt-2">{volver}</div>
          </div>
        )}

        {estado === 'ya_valorada' && (
          <div className="space-y-4 rounded-3xl border border-stone-200 bg-white p-10 text-center shadow-xs">
            <h1 className="text-2xl font-bold text-primario">Ya valoraste este servicio</h1>
            <p className="text-base text-stone-600">
              Tu reseña ya fue registrada exitosamente y apoya a la comunidad de Trabajitos en Riohacha.
            </p>
            <div className="pt-2">{volver}</div>
          </div>
        )}

        {estado === 'lista' && solicitud && userId && (
          <FormValoracion solicitud={solicitud} clienteId={userId} />
        )}
      </div>
    </div>
  )
}
