import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Briefcase, MapPin, Star } from 'lucide-react'
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
    return <p className="mx-auto max-w-[1120px] px-6 py-12 text-base">Cargando perfil...</p>
  }

  if (estado === 'error') {
    return (
      <div className="mx-auto max-w-[1120px] space-y-4 px-6 py-12">
        <Aviso tipo="error">No pudimos cargar este perfil. Revisa tu conexión.</Aviso>
        <Boton onClick={() => setIntento((n) => n + 1)}>Reintentar</Boton>
      </div>
    )
  }

  if (!datos) {
    return (
      <div className="mx-auto max-w-[1120px] space-y-4 px-6 py-12">
        <h1 className="text-3xl font-bold text-primario">Este prestador no está disponible</h1>
        <p className="text-base text-stone-700">
          Puede que el perfil no exista o que todavía esté en revisión.
        </p>
        <BotonEnlace to="/buscar">Buscar prestadores</BotonEnlace>
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
    <div className="mx-auto max-w-[1120px] px-6 py-10">
      <nav aria-label="Ruta" className="mb-6 text-base text-stone-700">
        <Link to="/buscar" className="underline underline-offset-4">
          Prestadores
        </Link>{' '}
        / <span className="font-semibold text-stone-900">{p.nombre}</span>
      </nav>

      {esDueno && !p.verificado && (
        <div className="mb-6">
          <Aviso tipo="info">
            Así verán tu perfil los clientes cuando lo verifiquemos. Por ahora solo tú lo ves.
          </Aviso>
        </div>
      )}

      <div className="grid grid-cols-[1fr_320px] items-start gap-8">
        <div className="space-y-6">
          <Tarjeta>
            <div className="flex items-start gap-6">
              <div
                aria-hidden="true"
                className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-primario text-3xl font-bold text-white"
              >
                {iniciales}
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-primario">{p.nombre}</h1>
                {p.oficio && <p className="text-lg text-stone-800">{p.oficio}</p>}
                {p.verificado && <SelloVerificado />}
                <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-base text-stone-700">
                  {p.ciudad && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-5 w-5" aria-hidden="true" />
                      {p.ciudad}, La Guajira
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase className="h-5 w-5" aria-hidden="true" />
                    {p.anios_experiencia}{' '}
                    {p.anios_experiencia === 1 ? 'año' : 'años'} de experiencia
                  </span>
                </p>
              </div>
            </div>

            {p.descripcion && (
              <div className="mt-6 border-t border-stone-100 pt-6">
                <h2 className="mb-2 text-xl font-bold text-primario">Sobre el profesional</h2>
                <p className="text-base leading-relaxed text-stone-800">{p.descripcion}</p>
              </div>
            )}
          </Tarjeta>

          <Tarjeta>
            <h2 className="mb-5 text-xl font-bold text-primario">Reputación</h2>
            {p.total_valoraciones === 0 ? (
              <p className="text-base text-stone-700">
                Aún no tiene valoraciones. Las opiniones aparecen aquí cuando un cliente califica un
                servicio finalizado.
              </p>
            ) : (
              <div className="grid grid-cols-[200px_1fr] items-center gap-8">
                <div className="text-center">
                  <p className="text-5xl font-bold text-primario">{p.promedio.toFixed(1)}</p>
                  <div className="mt-2 flex justify-center">
                    <Estrellas promedio={p.promedio} total={p.total_valoraciones} />
                  </div>
                  <p className="mt-2 text-base text-stone-700">
                    Basado en {p.total_valoraciones}{' '}
                    {p.total_valoraciones === 1 ? 'servicio finalizado' : 'servicios finalizados'}
                  </p>
                </div>
                <ul className="space-y-3">
                  {CRITERIOS.map(({ clave, etiqueta }) => {
                    const valor = media(resenas, clave)
                    return (
                      <li key={clave} className="grid grid-cols-[170px_1fr_40px] items-center gap-3">
                        <span className="text-base font-medium text-stone-800">{etiqueta}</span>
                        <div className="h-3 overflow-hidden rounded-full bg-stone-200" aria-hidden="true">
                          <div
                            className="h-full rounded-full bg-accion"
                            style={{ width: `${(valor / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-right text-base font-semibold text-stone-900">
                          {valor.toFixed(1)}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </Tarjeta>

          <Tarjeta>
            <h2 className="mb-4 text-xl font-bold text-primario">Fotos de trabajos</h2>
            {fotos.length === 0 ? (
              <p className="text-base text-stone-700">Aún no ha subido fotos de sus trabajos.</p>
            ) : (
              <ul className="grid grid-cols-3 gap-4">
                {fotos.map((f) => (
                  <li key={f.id} className="overflow-hidden rounded-xl bg-stone-100">
                    <img
                      src={f.url}
                      alt={`Trabajo realizado por ${p.nombre}`}
                      loading="lazy"
                      className="aspect-[4/3] w-full object-cover"
                    />
                  </li>
                ))}
              </ul>
            )}
          </Tarjeta>

          <Tarjeta>
            <h2 className="mb-4 text-xl font-bold text-primario">Opiniones de clientes</h2>
            {resenas.length === 0 ? (
              <p className="text-base text-stone-700">Todavía no hay opiniones.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {resenas.map((r) => {
                  const prom = (r.puntualidad + r.calidad + r.precio + r.trato) / 4
                  return (
                    <li key={r.id} className="space-y-2 py-5 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-semibold text-stone-900">
                          {r.nombre_cliente}
                        </span>
                        <span className="text-base text-stone-700">
                          {new Date(r.creado_en).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'long',
                          })}
                        </span>
                      </div>
                      <p className="inline-flex items-center gap-1.5 text-base font-semibold text-stone-900">
                        <Star className="h-5 w-5 fill-amber-500 text-amber-500" aria-hidden="true" />
                        {prom.toFixed(1)}
                      </p>
                      {r.oculta ? (
                        <p className="text-base italic text-stone-700">
                          Este comentario fue ocultado por moderación.
                        </p>
                      ) : (
                        r.comentario && <p className="text-base text-stone-800">{r.comentario}</p>
                      )}
                      {r.respuesta && (
                        <div className="rounded-xl bg-stone-100 p-4 text-base text-stone-800">
                          <p className="font-semibold text-primario">Respuesta de {p.nombre}</p>
                          <p>{r.respuesta}</p>
                        </div>
                      )}
                      {usuario && !esDueno && !r.oculta && <BotonReportar valoracionId={r.id} />}
                    </li>
                  )
                })}
              </ul>
            )}
          </Tarjeta>
        </div>

        <aside className="sticky top-24">
          <Tarjeta className="space-y-5 p-6">
            <div>
              <p className="text-base text-stone-700">Tarifa de referencia por visita</p>
              <p className="text-3xl font-bold text-primario">
                {p.tarifa_referencia ? formatoPesos(p.tarifa_referencia) : 'Por acordar'}
              </p>
              <p className="mt-1 text-base text-stone-700">
                El valor final se acuerda según el trabajo, antes de empezar.
              </p>
            </div>

            {cargandoSesion ? null : rol === 'cliente' ? (
              <BotonEnlace to={`/solicitar/${p.perfil_id}`} className="w-full">
                Solicitar servicio
              </BotonEnlace>
            ) : !usuario ? (
              <BotonEnlace to="/auth" className="w-full">
                Ingresar para solicitar
              </BotonEnlace>
            ) : (
              <p className="text-base text-stone-700">
                Solo las cuentas de cliente pueden solicitar servicios.
              </p>
            )}
          </Tarjeta>
        </aside>
      </div>
    </div>
  )
}