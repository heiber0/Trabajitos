import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Boton, BotonEnlace } from '../components/ui/Boton'
import { CampoSelect } from '../components/ui/Campos'
import { Aviso } from '../components/ui/Aviso'
import { TarjetaPrestador } from '../features/busqueda/TarjetaPrestador'
import { iconoOficio } from '../features/busqueda/iconos'
import {
  buscarPrestadores, cargarOficios, CENTRO_RIOHACHA,
  type Oficio, type PrestadorCercano,
} from '../features/busqueda/api'

export function Home() {
  const navigate = useNavigate()
  const [oficios, setOficios] = useState<Oficio[]>([])
  const [destacados, setDestacados] = useState<PrestadorCercano[]>([])
  const [error, setError] = useState(false)
  const [oficioId, setOficioId] = useState('')

  useEffect(() => {
    Promise.all([
      cargarOficios(),
      buscarPrestadores({ lat: CENTRO_RIOHACHA.lat, lng: CENTRO_RIOHACHA.lng, radioKm: 50 }),
    ])
      .then(([listaOficios, prestadores]) => {
        setOficios(listaOficios)
        setDestacados(
          prestadores
            .filter((p) => p.total_valoraciones > 0)
            .sort((a, b) => b.promedio - a.promedio || b.total_valoraciones - a.total_valoraciones)
            .slice(0, 3),
        )
      })
      .catch(() => setError(true))
  }, [])

  const nombreOficio = (id: number) => oficios.find((o) => o.id === id)?.nombre

  function buscar(ev: FormEvent) {
    ev.preventDefault()
    navigate(oficioId ? `/buscar?oficio=${oficioId}` : '/buscar')
  }

  return (
    <div>
      <section className="bg-primario text-white">
        <div className="mx-auto max-w-[1120px] px-6 py-16">
          <h1 className="max-w-3xl text-4xl font-bold leading-tight">
            Encuentra al maestro que necesitas en Riohacha
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-stone-200">
            Plomeros, electricistas, albañiles y más, con perfiles verificados y opiniones de
            clientes que ya contrataron.
          </p>

          <form
            onSubmit={buscar}
            className="mt-8 grid max-w-3xl grid-cols-[1fr_auto] items-end gap-3 rounded-2xl bg-white p-5 text-stone-900"
          >
            <CampoSelect
              etiqueta="¿Qué necesitas?"
              value={oficioId}
              onChange={(e) => setOficioId(e.target.value)}
            >
              <option value="">Todos los oficios</option>
              {oficios.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nombre}
                </option>
              ))}
            </CampoSelect>
            <Boton type="submit">
              <Search className="h-5 w-5" aria-hidden="true" />
              Buscar
            </Boton>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-[1120px] space-y-16 px-6 py-14">
        {error && (
          <Aviso tipo="error">
            No pudimos cargar los datos. Revisa tu conexión y recarga la página.
          </Aviso>
        )}

        <section>
          <h2 className="mb-6 text-2xl font-bold text-primario">Oficios</h2>
          <div className="grid grid-cols-5 gap-4">
            {oficios.map((o) => {
              const Icono = iconoOficio(o.nombre)
              return (
                <Link
                  key={o.id}
                  to={`/buscar?oficio=${o.id}`}
                  className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-center transition-shadow hover:shadow-md"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-accion">
                    <Icono className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="text-base font-semibold text-primario">{o.nombre}</span>
                </Link>
              )
            })}
          </div>
        </section>

        {destacados.length > 0 && (
          <section>
            <h2 className="mb-6 text-2xl font-bold text-primario">Mejor valorados</h2>
            <div className="grid grid-cols-3 gap-6">
              {destacados.map((p) => (
                <TarjetaPrestador
                  key={p.perfil_id}
                  p={p}
                  oficio={nombreOficio(p.oficio_id)}
                  mostrarDistancia={false}
                />
              ))}
            </div>
          </section>
        )}

        <section className="flex items-center justify-between gap-8 rounded-2xl bg-primario p-10 text-white">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold">¿Eres prestador de un oficio?</h2>
            <p className="mt-2 text-base text-stone-200">
              Crea tu perfil, muestra tus trabajos y recibe solicitudes de clientes en Riohacha.
            </p>
          </div>
          <BotonEnlace to="/auth?modo=registro&rol=prestador">Registrarme</BotonEnlace>
        </section>
      </div>
    </div>
  )
}