import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Briefcase, MapPin, Star, ChevronRight, ShieldCheck } from 'lucide-react'
import { useSesion } from '../lib/useSesion'
import { formatoPesos } from '../lib/formato'
import { Boton, BotonEnlace } from '../components/ui/Boton'
import { Tarjeta } from '../components/ui/Tarjeta'
import { Aviso } from '../components/ui/Aviso'
import { Estrellas } from '../components/ui/Estrellas'
import { SelloVerificado } from '../components/ui/SelloVerificado'
import { cargarPerfilPublico, type Resena } from '../features/perfil/api'
import { BotonReportar } from '../features/valoraciones/BotonReportar'

type Datos = Awaited<ReturnType<typeof cargarPerfilPublico>>
type Criterio = 'puntualidad' | 'calidad' | 'precio' | 'trato'

const CRITERIOS: { clave: Criterio; etiqueta: string }[] = [
  { clave: 'puntualidad', etiqueta: 'Puntualidad' },
  { clave: 'calidad', etiqueta: 'Calidad del trabajo' },
  { clave: 'precio', etiqueta: 'Precio justo' },
  { clave: 'trato', etiqueta: 'Trato y respeto' },
]

function media(resenas: Resena[], campo: Criterio) {
  if (resenas.length === 0) return 0
  return resenas.reduce((suma, r) => suma + r[campo], 0) / resenas.length
}

export function PerfilPrestador() {
  const { id = '' } = useParams()
  const { usuario, rol, cargando: cargandoSesion } = useSesion()
  const [datos, setDatos] = useState<Datos>(null)
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando')
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let cancelado = false
    setEstado('cargando')
    cargarPerfilPublico(id)
      .then((d) => {
        if (cancelado) return
        setDatos(d)
        setEstado('listo')
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
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-20 text-center text-stone-500">
        <p className="text-lg font-medium">Cargando perfil del profesional...</p>
      </div>
    )
  }

  if (estado === 'error') {
    return (
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-16">
        <div className="max-w-xl mx-auto space-y-4">
          <Aviso tipo="error">No pudimos cargar este perfil. Revisa tu conexión a internet.</Aviso>
          <Boton onClick={() => setIntento((n) => n + 1)}>Reintentar</Boton>
        </div>
      </div>
    )
  }

  if (!datos) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-20 text-center">
        <div className="max-w-md mx-auto space-y-4 rounded-3xl border border-stone-200 bg-white p-10 shadow-xs">
          <h1 className="text-2xl font-bold text-primario">Perfil no encontrado</h1>
          <p className="text-base text-stone-600">
            El prestador que buscas no existe o aún no está disponible públicamente.
          </p>
          <div className="pt-2">
            <BotonEnlace to="/buscar">Volver a la búsqueda</BotonEnlace>
          </div>
        </div>
      </div>
    )
  }

  const { prestador: p, fotos, resenas } = datos
  const esDueno = usuario?.id === p.perfil_id

  const iniciales = p.nombre
    .split(' ')
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase()

  return (
    <div className="mx-auto w-[90%] py-10">
      {/* Breadcrumb */}
      <nav aria-label="Ruta de navegación" className="mb-6 flex items-center gap-2 text-base text-stone-600">
        <Link to="/buscar" className="hover:text-accion transition-colors font-medium">
          Prestadores
        </Link>
        <ChevronRight className="h-4 w-4 text-stone-400" />
        <span className="font-semibold text-stone-900 truncate">{p.nombre}</span>
      </nav>

      {esDueno && !p.verificado && (
        <div className="mb-8">
          <Aviso tipo="info">
            Vista previa de tu perfil. Así lo verán los clientes una vez verifiquemos tu cuenta y ubicación.
          </Aviso>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] items-start gap-8">
        <div className="space-y-8">
          {/* Tarjeta de encabezado de perfil */}
          <Tarjeta className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div
                aria-hidden="true"
                className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-primario text-3xl font-extrabold text-white shadow-sm"
              >
                {iniciales}
              </div>
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-primario tracking-tight">{p.nombre}</h1>
                  {p.verificado && <SelloVerificado />}
                </div>
                {p.oficio && <p className="text-lg font-bold text-accion">{p.oficio}</p>}
                <p className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-base text-stone-600">
                  {p.ciudad && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-stone-500" aria-hidden="true" />
                      {p.ciudad}, La Guajira
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4 text-stone-500" aria-hidden="true" />
                    {p.anios_experiencia} {p.anios_experiencia === 1 ? 'año' : 'años'} de experiencia
                  </span>
                </p>
              </div>
            </div>

            {p.descripcion && (
              <div className="mt-8 border-t border-stone-100 pt-6">
                <h2 className="text-lg font-bold text-primario mb-2">Sobre el profesional</h2>
                <p className="text-base sm:text-lg leading-relaxed text-stone-700 whitespace-pre-line">
                  {p.descripcion}
                </p>
              </div>
            )}
          </Tarjeta>

          {/* Calificaciones y desglose */}
          <Tarjeta className="p-6 sm:p-8">
            <h2 className="mb-6 text-xl font-bold text-primario">Reputación y opiniones</h2>
            {p.total_valoraciones === 0 ? (
              <div className="rounded-2xl bg-stone-50 p-6 text-center text-stone-600">
                <p className="text-base font-medium">
                  Este profesional es nuevo en Trabajitos y aún no tiene valoraciones.
                </p>
                <p className="text-sm text-stone-500 mt-1">
                  Las opiniones aparecerán aquí cuando un cliente califique un servicio completado.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-center gap-8">
                <div className="text-center md:border-r md:border-stone-100 md:pr-8">
                  <p className="text-5xl font-extrabold text-primario tracking-tight">{p.promedio.toFixed(1)}</p>
                  <div className="mt-2.5 flex justify-center">
                    <Estrellas promedio={p.promedio} total={p.total_valoraciones} />
                  </div>
                  <p className="mt-2 text-sm font-medium text-stone-500">
                    Basado en {p.total_valoraciones}{' '}
                    {p.total_valoraciones === 1 ? 'servicio calificado' : 'servicios calificados'}
                  </p>
                </div>

                <ul className="space-y-3.5">
                  {CRITERIOS.map(({ clave, etiqueta }) => {
                    const valor = media(resenas, clave)
                    return (
                      <li key={clave} className="grid grid-cols-[160px_1fr_40px] items-center gap-3">
                        <span className="text-base font-medium text-stone-700">{etiqueta}</span>
                        <div className="h-3 overflow-hidden rounded-full bg-stone-100" aria-hidden="true">
                          <div
                            className="h-full rounded-full bg-amber-500 transition-all duration-500"
                            style={{ width: `${(valor / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-right text-base font-bold text-stone-900">
                          {valor.toFixed(1)}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </Tarjeta>

          {/* Galería de fotos */}
          <Tarjeta className="p-6 sm:p-8">
            <h2 className="mb-5 text-xl font-bold text-primario">Fotos de trabajos realizados</h2>
            {fotos.length === 0 ? (
              <p className="text-base text-stone-500 italic">El prestador aún no ha subido fotos de sus trabajos.</p>
            ) : (
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {fotos.map((f) => (
                  <li key={f.id} className="group overflow-hidden rounded-2xl bg-stone-100 shadow-xs">
                    <img
                      src={f.url}
                      alt={`Trabajo realizado por ${p.nombre}`}
                      loading="lazy"
                      className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </li>
                ))}
              </ul>
            )}
          </Tarjeta>

          {/* Reseñas públicas */}
          <Tarjeta className="p-6 sm:p-8">
            <h2 className="mb-6 text-xl font-bold text-primario">Comentarios de clientes</h2>
            {resenas.length === 0 ? (
              <p className="text-base text-stone-500 italic">Todavía no hay reseñas escritas.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {resenas.map((r) => {
                  const prom = (r.puntualidad + r.calidad + r.precio + r.trato) / 4
                  return (
                    <li key={r.id} className="space-y-3 py-6 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-primario">{r.nombre_cliente}</span>
                        <span className="text-sm text-stone-500 font-medium">
                          {new Date(r.creado_en).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="inline-flex items-center gap-1.5 text-base font-bold text-stone-900">
                        <Star className="h-4 w-4 fill-amber-500 text-amber-500" aria-hidden="true" />
                        <span>{prom.toFixed(1)}</span>
                      </div>

                      {r.oculta ? (
                        <p className="text-base italic text-stone-500 bg-stone-50 p-3 rounded-xl border border-stone-100">
                          Este comentario fue ocultado por moderación.
                        </p>
                      ) : (
                        r.comentario && <p className="text-base text-stone-800 leading-relaxed">{r.comentario}</p>
                      )}

                      {r.respuesta && (
                        <div className="rounded-2xl bg-amber-50/70 border border-amber-200/50 p-4 text-base text-stone-800">
                          <p className="font-bold text-primario text-sm mb-1">Respuesta de {p.nombre}</p>
                          <p className="text-stone-700 leading-relaxed">{r.respuesta}</p>
                        </div>
                      )}

                      {usuario && !esDueno && !r.oculta && (
                        <div className="pt-1">
                          <BotonReportar valoracionId={r.id} />
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </Tarjeta>
        </div>

        {/* Tarjeta lateral fija de acción */}
        <aside className="sticky top-24">
          <Tarjeta className="space-y-6 p-6 sm:p-7 shadow-lg border-stone-200">
            <div>
              <span className="text-sm font-semibold uppercase tracking-wider text-stone-500 block mb-1">
                Tarifa de referencia
              </span>
              <p className="text-3xl font-extrabold text-primario">
                {p.tarifa_referencia ? formatoPesos(p.tarifa_referencia) : 'Por acordar'}
              </p>
              <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                El valor exacto y alcance se acuerdan directamente con el maestro al cotizar tu requerimiento.
              </p>
            </div>

            <div className="pt-2">
              {cargandoSesion ? null : rol === 'cliente' ? (
                <BotonEnlace to={`/solicitar/${p.perfil_id}`} className="w-full h-12 text-base font-bold shadow-md">
                  Solicitar servicio
                </BotonEnlace>
              ) : !usuario ? (
                <BotonEnlace to="/auth" className="w-full h-12 text-base font-bold">
                  Ingresar para solicitar
                </BotonEnlace>
              ) : (
                <div className="rounded-2xl bg-stone-50 p-4 text-center text-sm font-medium text-stone-600 border border-stone-200">
                  Estás conectado como prestador. Solo clientes pueden solicitar servicios.
                </div>
              )}
            </div>

            <div className="border-t border-stone-100 pt-4 space-y-2 text-xs text-stone-500">
              <p className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Contacto directo sin intermediarios</span>
              </p>
              <p className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Evaluado por la comunidad de Riohacha</span>
              </p>
            </div>
          </Tarjeta>
        </aside>
      </div>
    </div>
  )
}
