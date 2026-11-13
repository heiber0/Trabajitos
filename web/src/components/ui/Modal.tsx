import { useEffect, useRef, type ReactNode } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { Boton } from './Boton'

export type ModalProps = {
  abierto: boolean
  alCerrar: () => void
  titulo?: string
  descripcion?: string
  children: ReactNode
  anchoMax?: 'sm' | 'md' | 'lg' | 'xl'
}

const ANCHOS = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
}

export function Modal({
  abierto,
  alCerrar,
  titulo,
  descripcion,
  children,
  anchoMax = 'md',
}: ModalProps) {
  const cuadroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) return

    function manejarTecla(e: KeyboardEvent) {
      if (e.key === 'Escape') alCerrar()
    }

    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    document.body.style.overflowY = 'scroll'

    window.addEventListener('keydown', manejarTecla)

    return () => {
      window.removeEventListener('keydown', manejarTecla)
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflowY = ''
      window.scrollTo(0, scrollY)
    }
  }, [abierto, alCerrar])

  if (!abierto) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titulo ? 'modal-titulo' : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div
        className="animate-modal-backdrop fixed inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity"
        onClick={alCerrar}
        aria-hidden="true"
      />

      <div
        ref={cuadroRef}
        className={`animate-modal-content relative z-10 w-full ${ANCHOS[anchoMax]} overflow-hidden rounded-3xl border border-stone-200/80 bg-white p-6 shadow-2xl sm:p-8`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            {titulo && (
              <h3 id="modal-titulo" className="text-xl font-bold text-primario sm:text-2xl">
                {titulo}
              </h3>
            )}
            {descripcion && (
              <p className="mt-1 text-base text-stone-600 sm:text-base">{descripcion}</p>
            )}
          </div>
          <button
            type="button"
            onClick={alCerrar}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
            aria-label="Cerrar ventana"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5">{children}</div>
      </div>
    </div>
  )
}

export type DialogoConfirmacionProps = {
  abierto: boolean
  alCerrar: () => void
  alConfirmar: () => void | Promise<void>
  titulo: string
  mensaje: string
  textoConfirmar?: string
  textoCancelar?: string
  peligroso?: boolean
  cargando?: boolean
}

export function DialogoConfirmacion({
  abierto,
  alCerrar,
  alConfirmar,
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  peligroso = false,
  cargando = false,
}: DialogoConfirmacionProps) {
  return (
    <Modal abierto={abierto} alCerrar={alCerrar} anchoMax="sm">
      <div className="flex flex-col items-center text-center">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
            peligroso ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
          }`}
        >
          <AlertCircle className="h-7 w-7" aria-hidden="true" />
        </div>

        <h3 className="mt-4 text-xl font-bold text-primario">{titulo}</h3>
        <p className="mt-2 text-base text-stone-600">{mensaje}</p>

        <div className="mt-6 flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Boton
            type="button"
            variante="secundario"
            onClick={alCerrar}
            disabled={cargando}
            className="w-full sm:w-auto"
          >
            {textoCancelar}
          </Boton>
          <Boton
            type="button"
            variante={peligroso ? 'peligro' : 'primario'}
            onClick={() => void alConfirmar()}
            cargando={cargando}
            className="w-full sm:w-auto"
          >
            {textoConfirmar}
          </Boton>
        </div>
      </div>
    </Modal>
  )
}
