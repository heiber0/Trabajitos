const pesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export const formatoPesos = (valor: number) => pesos.format(valor)

export function formatoDistancia(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}