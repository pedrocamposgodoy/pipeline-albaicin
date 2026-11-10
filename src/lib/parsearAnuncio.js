// Extrae los datos de un anuncio de Idealista a partir del TEXTO que pega
// el usuario (lo que se obtiene al seleccionar y copiar en la página).
// No hace peticiones de red ni usa IA: son reglas de coincidencia de patrones,
// así que Idealista no puede bloquearlo y funciona igual para cualquiera.

export function parsearAnuncio(texto) {
  const resultado = {
    direccion: null,
    precio: null,
    superficie: null,
    habitaciones: null,
    banos: null,
    estado: null,
    referencia: null,
    link: null,
    encontrados: [],
  }

  if (!texto || texto.trim().length < 20) return resultado

  resultado.link = extraerLink(texto)
  resultado.precio = extraerPrecio(texto)
  resultado.superficie = extraerSuperficie(texto)
  resultado.direccion = extraerDireccion(texto)
  resultado.habitaciones = extraerHabitaciones(texto)
  resultado.banos = extraerBanos(texto)
  resultado.estado = extraerEstado(texto)
  resultado.referencia = extraerReferencia(texto)

  const etiquetas = [
    ['direccion', 'dirección'],
    ['precio', 'precio'],
    ['superficie', 'metros'],
    ['habitaciones', 'habitaciones'],
    ['banos', 'baños'],
    ['estado', 'estado'],
    ['referencia', 'referencia'],
    ['link', 'enlace'],
  ]
  for (const [campo, etiqueta] of etiquetas) {
    if (resultado[campo]) resultado.encontrados.push(etiqueta)
  }

  return resultado
}

function extraerLink(texto) {
  const match = texto.match(/https?:\/\/[^\s)"'<>]*(?:idealista|grupotorres)\.com[^\s)"'<>]*/i)
  if (!match) return null
  // Quita los parámetros de seguimiento para dejar el enlace limpio
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
  let match = texto.match(/(\d+)\s*m[²2]\s*construidos/i)
  if (match) return Number(match[1])

  // Si no, el primer "280 m²" suelto
  match = texto.match(/(\d+)\s*m[²2]\b/i)
  if (match) return Number(match[1])

  return null
}

function extraerHabitaciones(texto) {
  const match = texto.match(/(\d+)\s*habitaciones?/i) || texto.match(/(\d+)\s*hab\./i)
  return match ? Number(match[1]) : null
}

function extraerBanos(texto) {
  const match = texto.match(/(\d+)\s*baños?/i)
  return match ? Number(match[1]) : null
}

function extraerEstado(texto) {
  if (/obra nueva/i.test(texto)) return 'Obra nueva'
  if (/para reformar/i.test(texto)) return 'Para reformar'
  if (/buen estado/i.test(texto)) return 'Buen estado'
  return null
}

function extraerReferencia(texto) {
  const match = texto.match(/Referencia del anuncio\s*\n?\s*([A-Za-z0-9_-]+)/i)
  return match ? match[1] : null
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
  // parece una dirección y no un mensaje con un enlace pegado (caso WhatsApp)
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
