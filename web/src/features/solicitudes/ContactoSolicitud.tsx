import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { EstadoSolicitud } from './estados'

type Contacto = { nombre: string; telefono: string | null; whatsapp: string | null }

const VISIBLES: EstadoSolicitud[] = ['aceptada', 'en_curso', 'finalizada']

type Props = { solicitudId: string; estado: EstadoSolicitud; descripcion: string }

export function ContactoSolicitud({ solicitudId, estado, descripcion }: Props) {
  const visible = VISIBLES.includes(estado)
  const [contacto, setContacto] = useState<Contacto | null>(null)
  const [fallo, setFallo] = useState(false)

  useEffect(() => {
    if (!visible) return
    let cancelado = false
    supabase.rpc('contacto_solicitud', { p_solicitud: solicitudId }).then(({ data, error }) => {
      if (cancelado) return
      if (error) {
        setFallo(true)
        return
      }
      setFallo(false)
      setContacto(((data ?? []) as unknown as Contacto[])[0] ?? null)
    })
    return () => {
      cancelado = true
    }
  }, [solicitudId, visible])

  if (!visible) return null
  if (fallo) {
    return (
      <p className="text-base text-stone-700">
        No pudimos cargar los datos de contacto. Recarga la página.
      </p>
    )
  }
  if (!contacto) return null

  const primerNombre = contacto.nombre.split(' ')[0]
  const texto = `Hola ${primerNombre}, te escribo por la solicitud de Trabajitos: ${descripcion.slice(0, 100)}`
  const enlace = contacto.whatsapp
    ? `https://wa.me/${contacto.whatsapp}?text=${encodeURIComponent(texto)}`
    : null

  return (
    <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <p className="text-base font-semibold text-emerald-900">Datos de contacto</p>
      <p className="text-base text-stone-900">
        {contacto.nombre} · {contacto.telefono ?? 'sin celular registrado'}
      </p>
      {enlace && (
        <a
          href={enlace}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accion px-5 text-base font-semibold text-white transition-colors hover:bg-accion-oscuro"
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
          <span>Hablar por WhatsApp</span>
        </a>
      )}
      <p className="text-base text-stone-800">
        Usa estos datos solo para coordinar este servicio. Esta persona también ve tu celular. Se
        abre WhatsApp en una pestaña nueva.
      </p>
    </div>
  )
}