import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2, LocateFixed, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
import { Boton } from '../components/ui/Boton'
import { CampoSelect } from '../components/ui/Campos'
import { Aviso } from '../components/ui/Aviso'
import { TarjetaPrestador } from '../features/busqueda/TarjetaPrestador'
import {
  buscarPrestadores,
  cargarOficios,
  CENTRO_RIOHACHA,
  type Oficio,
  type PrestadorCercano,
} from '../features/busqueda/api'

const POR_PAGINA = 6

export function Explorar() {
  const [params, setParams] = useSearchParams()
  const oficio = params.get('oficio') ?? ''
  const radio = params.get('radio') ?? '5'
  const calificacion = params.get('calificacion') ?? ''
  const tarifa = params.get('tarifa') ?? ''
  const orden = params.get('orden') ?? 'cercania'

  const [oficios, setOficios] = useState<Oficio[]>([])
  const [resultados, setResultados] = useState<PrestadorCercano[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)
  const [intento, setIntento] = useState(0)
  const [pagina, setPagina] = useState(1)

  const [coords, setCoords] = useState(CENTRO_RIOHACHA)
  const [conMiUbicacion, setConMiUbicacion] = useState(false)
  const [avisoUbicacion, setAvisoUbicacion] = useState('')

  function cambiar(clave: string, valor: string) {
    setPagina(1)
    setParams((previos) => {
      const nuevos = new URLSearchParams(previos)
      if (valor) nuevos.set(clave, valor)
      else nuevos.delete(clave)
      return nuevos
    })
  }

  useEffect(() => {
    cargarOficios().then(setOficios).catch(() => setError(true))
  }, [])

  useEffect(() => {
    let cancelado = false
    setCargando(true)
    setError(false)
    buscarPrestadores({
      lat: coords.lat,
      lng: coords.lng,
      oficioId: oficio ? Number(oficio) : undefined,
      radioKm: Number(radio),
    })
      .then((r) => {
        if (!cancelado) setResultados(r)
      })
      .catch(() => {
        if (!cancelado) setError(true)
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [coords, oficio, radio, intento])

  function usarMiUbicacion() {
    if (!navigator.geolocation) {
      setAvisoUbicacion('Tu navegador no permite usar la ubicación.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setConMiUbicacion(true)
        setAvisoUbicacion('')
        setPagina(1)
      },
      () =>
        setAvisoUbicacion(
          'No pudimos obtener tu ubicación. Seguimos mostrando resultados desde el centro de Riohacha.',
        ),
      { timeout: 10000 },
    )
  }

  function volverAlCentro() {
    setCoords(CENTRO_RIOHACHA)
    setConMiUbicacion(false)
    setAvisoUbicacion('')
    setPagina(1)
  }

  const visibles = useMemo(() => {
    const minimo = Number(calificacion)
    const tope = Number(tarifa)
    const lista = resultados.filter(
      (p) =>
        (!minimo || p.promedio >= minimo) &&
        (!tope || (p.tarifa_referencia ?? 0) <= tope),
    )
    if (orden === 'calificacion') {
      lista.sort((a, b) => b.promedio - a.promedio || b.total_valoraciones - a.total_valoraciones)
    } else if (orden === 'tarifa') {
      lista.sort(
        (a, b) => (a.tarifa_referencia ?? Infinity) - (b.tarifa_referencia ?? Infinity),
      )
    } else {
      lista.sort((a, b) => a.distancia_km - b.distancia_km)
    }
    return lista
  }, [resultados, calificacion, tarifa, orden])

  const totalPaginas = Math.ceil(visibles.length / POR_PAGINA) || 1
  const inicioIndice = (pagina - 1) * POR_PAGINA
  const finIndice = Math.min(inicioIndice + POR_PAGINA, visibles.length)
  const paginados = visibles.slice(inicioIndice, finIndice)

  const cambiarPagina = (nueva: number) => {
    setPagina(nueva)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const nombreOficio = (id: number) => oficios.find((o) => o.id === id)?.nombre

  return (
    <div className="mx-auto w-[90%] py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-primario tracking-tight">
          Buscar prestadores
        </h1>
        <p className="text-base sm:text-lg text-stone-600">
          Encuentra profesionales calificados y cercanos para tus trabajos en Riohacha.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[300px_1fr] items-start gap-8">
        {/* Panel lateral de filtros */}
        <aside className="space-y-5 rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm sticky top-24">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100 text-primario font-bold text-lg">
            <SlidersHorizontal className="h-5 w-5 text-accion" />
            <span>Filtros de búsqueda</span>
          </div>

          <CampoSelect
            etiqueta="Oficio"
            value={oficio}
            onChange={(e) => cambiar('oficio', e.target.value)}
          >
            <option value="">Todos los oficios</option>
            {oficios.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombre}
              </option>
            ))}
          </CampoSelect>

          <CampoSelect
            etiqueta="Distancia máxima"
            value={radio}
            onChange={(e) => cambiar('radio', e.target.value)}
          >
            <option value="1">Hasta 1 km</option>
            <option value="3">Hasta 3 km</option>
            <option value="5">Hasta 5 km</option>
            <option value="10">Hasta 10 km</option>
            <option value="20">Hasta 20 km</option>
          </CampoSelect>

          <CampoSelect
            etiqueta="Calificación mínima"
            ayuda="Los prestadores nuevos aún no tienen calificación."
            value={calificacion}
            onChange={(e) => cambiar('calificacion', e.target.value)}
          >
            <option value="">Cualquiera</option>
            <option value="3">3 estrellas o más</option>
            <option value="4">4 estrellas o más</option>
            <option value="4.5">4.5 estrellas o más</option>
          </CampoSelect>

          <CampoSelect
            etiqueta="Tarifa máxima"
            value={tarifa}
            onChange={(e) => cambiar('tarifa', e.target.value)}
          >
            <option value="">Sin límite de tarifa</option>
            <option value="40000">Hasta $40.000</option>
            <option value="60000">Hasta $60.000</option>
            <option value="80000">Hasta $80.000</option>
            <option value="120000">Hasta $120.000</option>
          </CampoSelect>

          <CampoSelect
            etiqueta="Ordenar resultados por"
            value={orden}
            onChange={(e) => cambiar('orden', e.target.value)}
          >
            <option value="cercania">Más cercano primero</option>
            <option value="calificacion">Mejor calificado</option>
            <option value="tarifa">Menor tarifa</option>
          </CampoSelect>

          <Boton
            variante="secundario"
            className="w-full mt-2"
            onClick={() => {
              setPagina(1)
              setParams({})
            }}
          >
            Restablecer filtros
          </Boton>
        </aside>

        {/* Sección principal de resultados */}
        <section className="space-y-6">
          {/* Barra de estado y ubicación */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-stone-200/80 bg-white px-6 py-4 shadow-xs text-base text-stone-800">
            <p className="font-medium">
              <strong className="font-bold text-primario">{visibles.length}</strong>{' '}
              {visibles.length === 1 ? 'prestador disponible' : 'prestadores disponibles'} ·{' '}
              <span className="text-stone-600">
                {conMiUbicacion ? 'desde tu ubicación actual' : 'desde el centro de Riohacha'}
              </span>
            </p>
            {conMiUbicacion ? (
              <Boton variante="fantasma" onClick={volverAlCentro} className="text-sm">
                Volver al centro
              </Boton>
            ) : (
              <Boton variante="secundario" onClick={usarMiUbicacion} className="text-sm">
                <LocateFixed className="h-4 w-4 text-accion" aria-hidden="true" />
                <span>Usar mi ubicación</span>
              </Boton>
            )}
          </div>

          {avisoUbicacion && <Aviso tipo="info">{avisoUbicacion}</Aviso>}

          {cargando ? (
            <div className="flex flex-col items-center justify-center py-20 text-stone-500 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-accion" aria-hidden="true" />
              <p className="text-base font-semibold">Buscando prestadores verificados...</p>
            </div>
          ) : error ? (
            <div className="space-y-4 rounded-3xl border border-stone-200 bg-white p-8 text-center">
              <Aviso tipo="error">No pudimos cargar los resultados. Revisa tu conexión a internet.</Aviso>
              <div className="pt-2">
                <Boton onClick={() => setIntento((n) => n + 1)}>Reintentar búsqueda</Boton>
              </div>
            </div>
          ) : visibles.length === 0 ? (
            <div className="rounded-3xl border border-stone-200/80 bg-white p-12 text-center shadow-xs">
              <h2 className="text-2xl font-bold text-primario">No encontramos prestadores</h2>
              <p className="mt-2 text-base text-stone-600 max-w-md mx-auto">
                No hay profesionales con los filtros seleccionados. Intenta ampliar el radio de distancia o probar con otro oficio.
              </p>
            </div>
          ) : (
            <>
              {/* Grid de prestadores */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginados.map((p) => (
                  <TarjetaPrestador key={p.perfil_id} p={p} oficio={nombreOficio(p.oficio_id)} />
                ))}
              </div>

              {/* Barra de navegación por páginas */}
              {totalPaginas > 1 && (
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-stone-200/80 bg-white p-4 sm:p-5 shadow-xs">
                  <p className="text-base text-stone-600">
                    Mostrando del <strong className="font-semibold text-stone-900">{inicioIndice + 1}</strong> al{' '}
                    <strong className="font-semibold text-stone-900">{finIndice}</strong> de{' '}
                    <strong className="font-semibold text-stone-900">{visibles.length}</strong>
                  </p>

                  <div className="flex items-center gap-1.5" role="navigation" aria-label="Paginación de resultados">
                    <button
                      type="button"
                      disabled={pagina === 1}
                      onClick={() => cambiarPagina(pagina - 1)}
                      className="inline-flex h-10 items-center gap-1 rounded-xl border border-stone-200 px-3 text-base font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                      aria-label="Página anterior"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Anterior</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => cambiarPagina(num)}
                          aria-current={pagina === num ? 'page' : undefined}
                          className={`flex h-10 w-10 items-center justify-center rounded-xl text-base font-bold transition-all ${
                            pagina === num
                              ? 'bg-primario text-white shadow-xs'
                              : 'text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={pagina === totalPaginas}
                      onClick={() => cambiarPagina(pagina + 1)}
                      className="inline-flex h-10 items-center gap-1 rounded-xl border border-stone-200 px-3 text-base font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                      aria-label="Página siguiente"
                    >
                      <span className="hidden sm:inline">Siguiente</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
