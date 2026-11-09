import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2, LocateFixed } from 'lucide-react'
import { Boton } from '../components/ui/Boton'
import { CampoSelect } from '../components/ui/Campos'
import { Aviso } from '../components/ui/Aviso'
import { TarjetaPrestador } from '../features/busqueda/TarjetaPrestador'
import {
  buscarPrestadores, cargarOficios, CENTRO_RIOHACHA,
  type Oficio, type PrestadorCercano,
} from '../features/busqueda/api'

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

  const [coords, setCoords] = useState(CENTRO_RIOHACHA)
  const [conMiUbicacion, setConMiUbicacion] = useState(false)
  const [avisoUbicacion, setAvisoUbicacion] = useState('')

  function cambiar(clave: string, valor: string) {
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

  const nombreOficio = (id: number) => oficios.find((o) => o.id === id)?.nombre

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-10">
      <h1 className="text-3xl font-bold text-primario">Buscar prestadores</h1>

      <div className="mt-8 grid grid-cols-[280px_1fr] items-start gap-8">
        <aside className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6">
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
            <option value="1">1 km</option>
            <option value="3">3 km</option>
            <option value="5">5 km</option>
            <option value="10">10 km</option>
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
            <option value="">Sin límite</option>
            <option value="40000">Hasta $40.000</option>
            <option value="60000">Hasta $60.000</option>
            <option value="80000">Hasta $80.000</option>
          </CampoSelect>

          <CampoSelect
            etiqueta="Ordenar por"
            value={orden}
            onChange={(e) => cambiar('orden', e.target.value)}
          >
            <option value="cercania">Más cercano</option>
            <option value="calificacion">Mejor calificado</option>
            <option value="tarifa">Menor tarifa</option>
          </CampoSelect>

          <Boton variante="secundario" className="w-full" onClick={() => setParams({})}>
            Limpiar filtros
          </Boton>
        </aside>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-stone-200 bg-white px-5 py-3 text-base text-stone-800">
            <p>
              <strong>{visibles.length}</strong>{' '}
              {visibles.length === 1 ? 'prestador' : 'prestadores'} ·{' '}
              {conMiUbicacion ? 'desde tu ubicación' : 'desde el centro de Riohacha'}
            </p>
            {conMiUbicacion ? (
              <Boton variante="fantasma" onClick={volverAlCentro}>
                Usar el centro
              </Boton>
            ) : (
              <Boton variante="secundario" onClick={usarMiUbicacion}>
                <LocateFixed className="h-5 w-5" aria-hidden="true" />
                Usar mi ubicación
              </Boton>
            )}
          </div>

          {avisoUbicacion && <Aviso tipo="info">{avisoUbicacion}</Aviso>}

          {cargando ? (
            <p className="flex items-center gap-3 py-12 text-base text-stone-700">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              Buscando prestadores...
            </p>
          ) : error ? (
            <div className="space-y-4">
              <Aviso tipo="error">No pudimos cargar los resultados. Revisa tu conexión.</Aviso>
              <Boton onClick={() => setIntento((n) => n + 1)}>Reintentar</Boton>
            </div>
          ) : visibles.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center">
              <h2 className="text-xl font-bold text-primario">No encontramos prestadores</h2>
              <p className="mt-2 text-base text-stone-700">
                Prueba con otro oficio o aumenta la distancia.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {visibles.map((p) => (
                <TarjetaPrestador key={p.perfil_id} p={p} oficio={nombreOficio(p.oficio_id)} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}