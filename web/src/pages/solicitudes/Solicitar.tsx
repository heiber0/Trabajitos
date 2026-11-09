import { useParams } from 'react-router-dom'

export default function Solicitar() {
  const { id } = useParams()
  return (
    <div className="mx-auto max-w-[1120px] px-6 py-12">
      <h1 className="text-3xl font-bold text-primario">Solicitar servicio</h1>
      <p className="mt-2 text-base text-stone-700">
        Próximamente: el formulario de 5 pasos. Prestador: {id}
      </p>
    </div>
  )
}