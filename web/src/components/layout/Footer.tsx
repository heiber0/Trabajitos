import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-6 px-6 py-8 text-base text-stone-700">
        <p>Trabajitos · Riohacha, La Guajira</p>
        <Link
          to="/auth?modo=registro&rol=prestador"
          className="font-semibold text-accion-oscuro underline underline-offset-4"
        >
          Registrarme como prestador
        </Link>
      </div>
    </footer>
  )
}