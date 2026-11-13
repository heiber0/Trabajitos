import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Sparkles, ArrowRight, ShieldCheck, Star } from 'lucide-react'
import { Boton, BotonEnlace } from '../components/ui/Boton'
import { CampoSelect } from '../components/ui/Campos'
import { Aviso } from '../components/ui/Aviso'
import { TarjetaPrestador } from '../features/busqueda/TarjetaPrestador'
import { iconoOficio } from '../features/busqueda/iconos'
import {
  buscarPrestadores,
  cargarOficios,
  CENTRO_RIOHACHA,
  type Oficio,
  type PrestadorCercano,
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
    <div className="space-y-16">
      {/* Hero principal */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primario via-slate-900 to-primario-suave text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(180,83,9,0.2),transparent_70%)] pointer-events-none" />
        <div className="mx-auto w-[90%] py-20 lg:py-28 relative z-10 flex flex-col items-center text-center">
          <div className="max-w-3xl flex flex-col items-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm font-semibold text-amber-300 shadow-sm">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>Servicios verificados en Riohacha, La Guajira</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-center">
              Encuentra al maestro que necesitas en <span className="text-amber-400">Riohacha</span>
            </h1>

            <p className="text-lg sm:text-xl text-stone-300 leading-relaxed max-w-2xl mx-auto text-center">
              Plomeros, electricistas, albañiles, carpinteros y más profesionales locales con identidad comprobada y opiniones reales.
            </p>

            <form
              onSubmit={buscar}
              className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-end gap-3 rounded-3xl bg-white p-3 sm:p-4 text-stone-900 shadow-2xl w-full max-w-2xl mx-auto text-left"
            >
              <div className="flex-1">
                <CampoSelect
                  etiqueta="¿Qué servicio necesitas?"
                  value={oficioId}
                  onChange={(e) => setOficioId(e.target.value)}
                  className="border-stone-200"
                >
                  <option value="">Todos los oficios disponibles</option>
                  {oficios.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nombre}
                    </option>
                  ))}
                </CampoSelect>
              </div>
              <Boton type="submit" className="sm:h-12 w-full sm:w-auto px-8">
                <Search className="h-5 w-5" aria-hidden="true" />
                <span>Buscar</span>
              </Boton>
            </form>
          </div>
        </div>
      </section>

      {/* Contenido centrado y amplio */}
      <div className="mx-auto w-[90%] space-y-20 pb-20">
        {error && (
          <Aviso tipo="error">
            No pudimos cargar algunos datos. Por favor revisa tu conexión y recarga la página.
          </Aviso>
        )}

        {/* Categorías de oficios */}
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-primario tracking-tight">
                Explora por oficio
              </h2>
              <p className="mt-1 text-base sm:text-lg text-stone-600">
                Selecciona la especialidad que buscas para encontrar expertos cercanos.
              </p>
            </div>
            <Link
              to="/buscar"
              className="inline-flex items-center gap-1.5 font-bold text-accion hover:text-accion-oscuro transition-colors"
            >
              <span>Ver todos los prestadores</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6">
            {oficios.map((o) => {
              const Icono = iconoOficio(o.nombre)
              return (
                <Link
                  key={o.id}
                  to={`/buscar?oficio=${o.id}`}
                  className="group flex flex-col items-center justify-center gap-3.5 rounded-3xl border border-stone-200/80 bg-white p-6 text-center transition-all duration-300 hover:shadow-lg hover:border-amber-300 hover:-translate-y-1"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-accion transition-transform group-hover:scale-110 group-hover:bg-amber-100">
                    <Icono className="h-7 w-7" aria-hidden="true" />
                  </span>
                  <span className="text-base font-bold text-primario group-hover:text-accion transition-colors">
                    {o.nombre}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Prestadores destacados */}
        {destacados.length > 0 && (
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-primario tracking-tight flex items-center gap-2">
                  <Star className="h-7 w-7 fill-amber-500 text-amber-500" />
                  <span>Mejor valorados en la comunidad</span>
                </h2>
                <p className="mt-1 text-base sm:text-lg text-stone-600">
                  Profesionales con las mejores calificaciones de clientes en Riohacha.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
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

        {/* Banner CTA para Prestadores */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primario to-slate-900 p-8 sm:p-12 lg:p-16 text-white shadow-xl">
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-amber-300">
                <ShieldCheck className="h-4 w-4" />
                Únete a la red
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                ¿Ofreces servicios profesionales o técnicos?
              </h2>
              <p className="text-base sm:text-lg text-stone-300 leading-relaxed">
                Crea tu perfil gratuito en Trabajitos, sube fotos de tus obras y recibe solicitudes de clientes en tu barrio y toda Riohacha.
              </p>
            </div>
            <BotonEnlace
              to="/auth?modo=registro&rol=prestador"
              className="text-base font-bold px-8 py-3.5 rounded-2xl shrink-0"
            >
              Registrarme como prestador
            </BotonEnlace>
          </div>
        </section>
      </div>
    </div>
  )
}
