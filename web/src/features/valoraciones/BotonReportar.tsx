import { useState } from 'react'
import { Boton } from '../../components/ui/Boton'
import { CampoTexto } from '../../components/ui/Campos'
import { Aviso } from '../../components/ui/Aviso'
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
    return <Aviso tipo={resultado.tipo}>{resultado.texto}</Aviso>
  }

  if (!abierto) {
    return (
      <Boton variante="fantasma" onClick={() => setAbierto(true)}>
        Reportar comentario
      </Boton>
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
      setResultado({
        tipo: 'exito',
        texto: 'Reporte enviado. Un administrador lo revisará.',
      })
    } catch (err) {
      if (codigoDe(err) === '23505') {
        setResultado({ tipo: 'info', texto: 'Ya habías reportado este comentario.' })
      } else {
        setResultado({ tipo: 'error', texto: mensajeError(err) })
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
      {resultado?.tipo === 'error' && <Aviso tipo="error">{resultado.texto}</Aviso>}
      <CampoTexto
        etiqueta="¿Por qué reportas este comentario?"
        ayuda="Entre 5 y 300 caracteres. Un administrador lo revisará."
        maxLength={300}
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        error={errorMotivo}
      />
      <div className="flex gap-3">
        <Boton variante="secundario" disabled={enviando} onClick={() => setAbierto(false)}>
          Cancelar
        </Boton>
        <Boton cargando={enviando} onClick={() => void enviar()}>
          Enviar reporte
        </Boton>
      </div>
    </div>
  )
}