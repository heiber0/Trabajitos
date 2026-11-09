import { useParams } from 'react-router-dom'

export function PerfilPrestador() {
  const { id } = useParams()
  return (
    <div className="mx-auto max-w-[1120px] px-6 py-12">
      <h1 className="text-3xl font-bold text-primario">Perfil del prestador</h1>
      <p className="mt-2 text-base text-stone-700">Próximamente. Identificador: {id}</p>
    </div>
  )
}