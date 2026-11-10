// Utilidades de formato y listas compartidas por los componentes.

export const SEMAFOROS = [
  { valor: 'verde', etiqueta: 'Interesa' },
  { valor: 'ambar', etiqueta: 'Dudosa' },
  { valor: 'rojo', etiqueta: 'No encaja' },
]

export const ETAPAS = [
  { valor: 'por_ver', etiqueta: 'Por ver' },
  { valor: 'candidata', etiqueta: 'Candidata' },
  { valor: 'descartada', etiqueta: 'Descartada' },
]

// 320000 -> "320.000" (también agrupa los números de cuatro cifras)
export function miles(n) {
  if (n === null || n === undefined || n === '') return ''
  return String(Math.round(Number(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export function euros(n) {
  if (n === null || n === undefined || n === '') return null
  return `${miles(n)} €`
}

export function precioPorM2(precio, superficie) {
  if (!precio || !superficie) return null
  return Math.round(Number(precio) / Number(superficie))
}

export function aNumero(texto) {
  const limpio = String(texto ?? '').trim()
  return limpio === '' ? null : Number(limpio)
}

export function aTexto(texto) {
  const limpio = String(texto ?? '').trim()
  return limpio === '' ? null : limpio
}

// Rentabilidad bruta anual en %: alquiler de 12 meses sobre el precio de compra.
// Es antes de impuestos, gastos, huecos sin inquilino e IBI. Orientativa.
export function rentabilidadBruta(precio, alquilerMes, gastosCompraPct = 0) {
  if (!precio || !alquilerMes) return null
  const coste = Number(precio) * (1 + gastosCompraPct / 100)
  return (Number(alquilerMes) * 12 * 100) / coste
}

// 6.0449 -> "6,0 %"
export function porcentaje(n) {
  if (n === null || n === undefined) return null
  return `${n.toFixed(1).replace('.', ',')} %`
}
