import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
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
    return (
      <div className="mx-auto w-[90%] py-20 text-center text-stone-500">
        <p className="text-base font-medium">Preparando solicitud de servicio...</p>
      </div>
    )
  }

  if (estado === 'error') {
    return (
      <div className="mx-auto w-[90%] py-16">
        <div className="max-w-md mx-auto space-y-4">
          <Aviso tipo="error">No pudimos cargar al prestador. Revisa tu conexión a internet.</Aviso>
          <Boton onClick={() => setIntento((n) => n + 1)}>Reintentar</Boton>
        </div>
      </div>
    )
  }

  if (estado === 'no_disponible' || !prestador) {
    return (
      <div className="mx-auto w-[90%] py-16">
        <div className="max-w-lg mx-auto space-y-4 rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-xs">
          <h1 className="text-2xl font-bold text-primario">Este prestador no está disponible</h1>
          <p className="text-base text-stone-600">
            Solo puedes solicitar servicios a prestadores con identidad y ubicación verificada en Riohacha.
          </p>
          <div className="pt-2">
            <BotonEnlace to="/buscar">Buscar otros prestadores</BotonEnlace>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-[90%] py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <nav aria-label="Ruta" className="flex items-center gap-2 text-sm text-stone-500">
          <Link to="/buscar" className="hover:text-accion transition-colors">
            Buscar
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to={`/prestador/${prestador.perfil_id}`} className="hover:text-accion transition-colors">
            {prestador.nombre}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-semibold text-stone-900">Solicitar servicio</span>
        </nav>

        <FormSolicitud prestador={prestador} />
      </div>
    </div>
  )
}
