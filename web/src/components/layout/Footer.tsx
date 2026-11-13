import { Link } from 'react-router-dom'
import { ShieldCheck, Heart } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-stone-200/80 bg-white">
      <div className="mx-auto w-[90%] py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primario text-white shadow-xs">
              <ShieldCheck className="h-5 w-5 text-amber-400" aria-hidden="true" />
            </span>
            <div>
              <p className="text-lg font-bold text-primario">Trabajitos</p>
              <p className="text-sm text-stone-500">Conectando servicios de confianza en Riohacha, La Guajira</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-base font-semibold text-stone-700">
            <Link to="/buscar" className="hover:text-accion transition-colors">
              Buscar prestadores
            </Link>
            <Link
              to="/auth?modo=registro&rol=prestador"
              className="text-accion hover:text-accion-oscuro underline underline-offset-4 transition-colors"
            >
              Registrarme como prestador
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-stone-500">
          <p>© {new Date().getFullYear()} Trabajitos. Todos los derechos reservados.</p>
          <p className="inline-flex items-center gap-1.5">
            Hecho con <Heart className="h-4 w-4 fill-red-500 text-red-500" aria-hidden="true" /> en Riohacha
          </p>
        </div>
      </div>
    </footer>
  )
}
