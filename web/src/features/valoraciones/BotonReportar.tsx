import { useState } from 'react'
import { Flag } from 'lucide-react'
import { Boton } from '../../components/ui/Boton'
import { CampoTexto } from '../../components/ui/Campos'
import { Aviso } from '../../components/ui/Aviso'
import { Modal } from '../../components/ui/Modal'
import { mensajeError } from '../auth/mensajes'
import { codigoDe, reportarOpinion } from './api'

type Resultado = { tipo: 'exito' | 'info' | 'error'; texto: string }

export function BotonReportar({ valoracionId }: { valoracionId: string }) {
  const [abierto, setAbierto] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [errorMotivo, setErrorMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)

  if (resultado && resultado.tipo !== 'error') {
    return (
      <div className="pt-1">
        <Aviso tipo={resultado.tipo}>{resultado.texto}</Aviso>
      </div>
    )
  }

  async function enviar() {
    const t = motivo.trim()
    if (t.length < 5) {
      setErrorMotivo('Cuéntanos el motivo con al menos 5 caracteres.')
      return
    }
    setErrorMotivo('')
    setResultado(null)
    setEnviando(true)
    try {
      await reportarOpinion(valoracionId, t)
      setAbierto(false)
      setResultado({
        tipo: 'exito',
        texto: 'Reporte enviado. Un administrador de Trabajitos revisará el comentario.',
      })
    } catch (err) {
      if (codigoDe(err) === '23505') {
        setAbierto(false)
        setResultado({ tipo: 'info', texto: 'Ya habías reportado este comentario previamente.' })
      } else {
        setErrorMotivo(mensajeError(err))
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-red-600 transition-colors py-1"
      >
        <Flag className="h-3.5 w-3.5" />
        <span>Reportar comentario</span>
      </button>

      <Modal
        abierto={abierto}
        alCerrar={() => {
          if (!enviando) setAbierto(false)
        }}
        titulo="Reportar comentario"
        descripcion="Si este comentario contiene lenguaje ofensivo, spam o datos falsos, avísanos."
      >
        <div className="space-y-4">
          <CampoTexto
            etiqueta="¿Por qué reportas este comentario?"
            ayuda="Describe el motivo para que el equipo de moderación pueda evaluar el caso."
            error={errorMotivo}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ejemplo: Contiene ofensas personales o información que no corresponde con la realidad."
            rows={4}
          />

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <Boton
              type="button"
              variante="secundario"
              onClick={() => setAbierto(false)}
              disabled={enviando}
            >
              Cancelar
            </Boton>
            <Boton
              type="button"
              variante="peligro"
              onClick={() => void enviar()}
              cargando={enviando}
            >
              Enviar reporte
            </Boton>
          </div>
        </div>
      </Modal>
    </>
  )
}
