import { Compass, Home, Search } from 'lucide-react'
import { BotonEnlace } from '../components/ui/Boton'

export default function NoEncontrada() {
  return (
    <div className="mx-auto w-[90%] py-20 flex flex-col items-center justify-center text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 text-accion shadow-sm">
        <Compass className="h-10 w-10" aria-hidden="true" />
      </div>

      <span className="mt-6 text-sm font-bold uppercase tracking-wider text-accion">Error 404</span>
      <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-primario tracking-tight">
        Página no encontrada
      </h1>
      <p className="mt-3 max-w-md text-base sm:text-lg text-stone-600 leading-relaxed">
        La dirección que intentas abrir no existe o cambió de lugar. Puedes volver al inicio o buscar un prestador.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <BotonEnlace to="/" className="inline-flex items-center gap-2">
          <Home className="h-4 w-4" />
          <span>Ir al inicio</span>
        </BotonEnlace>
        <BotonEnlace to="/buscar" variante="secundario" className="inline-flex items-center gap-2">
          <Search className="h-4 w-4" />
          <span>Buscar prestadores</span>
        </BotonEnlace>
      </div>
    </div>
  )
}
