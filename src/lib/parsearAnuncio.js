// Extrae dirección, precio, superficie y detalles del TEXTO de un anuncio
// de Idealista (lo que se obtiene al seleccionar todo en la página y copiar).
// No hace peticiones de red: trabaja sobre el texto que pega el usuario,
// así que Idealista no puede bloquearlo.

export function parsearAnuncio(texto) {
  const resultado = {
    direccion: null,
    precio: null,
    superficie: null,
    link: null,
    nota: null,
    encontrados: [],
  }

  if (!texto || texto.trim().length < 20) return resultado

  resultado.link = extraerLink(texto)
  resultado.precio = extraerPrecio(texto)
  resultado.superficie = extraerSuperficie(texto)
  resultado.direccion = extraerDireccion(texto)
  resultado.nota = construirNota(texto)

  if (resultado.direccion) resultado.encontrados.push('dirección')
  if (resultado.precio) resultado.encontrados.push('precio')
  if (resultado.superficie) resultado.encontrados.push('metros')
  if (resultado.link) resultado.encontrados.push('link')

  return resultado
}

function extraerLink(texto) {
  const match = texto.match(/https?:\/\/[^\s)"'<>]*idealista\.com[^\s)"'<>]*/i)
  if (!match) return null
  // Quita los parámetros de seguimiento para dejar el link limpio
  return match[0].split('?')[0]
}

function extraerPrecio(texto) {
  // Precios tipo "320.000 €", excluyendo el precio por metro ("1.143 €/m²")
  const candidatos = [...texto.matchAll(/(\d{1,3}(?:\.\d{3})+)\s*€(?!\s*\/)/g)]
    .map((m) => Number(m[1].replace(/\./g, '')))
    .filter((n) => n >= 20000)

  return candidatos.length ? candidatos[0] : null
}

function extraerSuperficie(texto) {
  // "280 m² construidos" es el dato más fiable
  let match = texto.match(/(\d+)\s*m²\s*construidos/i)
  if (match) return Number(match[1])

  // Si no, el primer "280 m²" suelto (el patrón "€/m²" no cuela porque
  // antes de m² hay una barra, no un número)
  match = texto.match(/(\d+)\s*m²/i)
  if (match) return Number(match[1])

  return null
}

function extraerDireccion(texto) {
  const lineas = texto
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  let direccion = null

  // El título del anuncio es tipo "Casa en venta en Calle San Martín"
  for (const linea of lineas) {
    const match = linea.match(/\ben\s+(?:venta|alquiler)\s+en\s+(.+)$/i)
    if (match) {
      direccion = match[1]
      break
    }
  }

  // Si no hay título reconocible, usamos la primera línea, pero solo si
  // parece una dirección y no un mensaje con un link pegado (caso WhatsApp)
  if (!direccion && lineas.length) {
    const primera = lineas[0]
    if (!/https?:\/\//i.test(primera) && primera.length <= 120) direccion = primera
  }
  if (!direccion) return null

  direccion = direccion
    .replace(/\s*[-—|]\s*idealista.*$/i, '')
    .replace(/\s*Ver mapa\s*$/i, '')
    .trim()

  // Añade el barrio si aparece y no está ya en la dirección
  const zona = extraerZona(texto)
  if (zona && !direccion.toLowerCase().includes(zona.toLowerCase())) {
    direccion = `${direccion}, ${zona}`
  }

  return direccion.slice(0, 150)
}

function extraerZona(texto) {
  let match = texto.match(/Distrito\s+([^\n,]{3,40})/i)
  if (match) return match[1].trim()

  match = texto.match(/\n\s*([^\n,]{3,40}),\s*Granada\b/i)
  if (match) return match[1].trim()

  return null
}

function construirNota(texto) {
  const partes = []

  let match = texto.match(/(\d+)\s*habitaciones?/i) || texto.match(/(\d+)\s*hab\./i)
  if (match) partes.push(`${match[1]} hab.`)

  match = texto.match(/(\d+)\s*baños?/i)
  if (match) partes.push(`${match[1]} ${match[1] === '1' ? 'baño' : 'baños'}`)

  match = texto.match(/(\d+)\s*plantas?/i)
  if (match) partes.push(`${match[1]} plantas`)

  if (/para reformar/i.test(texto)) partes.push('para reformar')
  else if (/buen estado/i.test(texto)) partes.push('buen estado')

  match = texto.match(/Referencia del anuncio\s*\n?\s*([A-Za-z0-9_\-]+)/i)
  if (match) partes.push(`ref. ${match[1]}`)

  return partes.length ? partes.join(' · ') : null
}
