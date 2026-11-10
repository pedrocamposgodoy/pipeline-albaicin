// Función serverless de Vercel: recibe un link de Idealista y devuelve
// dirección, precio y superficie extraídos del propio HTML del anuncio.
// Si Idealista bloquea la petición o no encuentra los datos, devuelve
// un error claro para que la app ofrezca el relleno manual como alternativa.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const { link } = req.body || {}

  if (!link || typeof link !== 'string' || !link.includes('idealista.com')) {
    return res.status(400).json({ error: 'Pega un link válido de idealista.com' })
  }

  try {
    const respuesta = await fetch(link, {
      headers: {
        // Idealista bloquea peticiones sin cabeceras de navegador real
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })

    if (!respuesta.ok) {
      return res.status(502).json({
        error: `Idealista no ha dejado leer el anuncio (código ${respuesta.status}). Rellena los datos a mano.`,
      })
    }

    const html = await respuesta.text()
    const datos = extraerDatos(html)

    if (!datos.direccion && !datos.precio) {
      return res.status(422).json({
        error: 'No se han podido extraer los datos de esta página. Rellena a mano.',
      })
    }

    return res.status(200).json(datos)
  } catch (err) {
    return res.status(502).json({
      error: 'No se ha podido conectar con Idealista. Rellena los datos a mano.',
    })
  }
}

function extraerDatos(html) {
  const direccion = extraerMeta(html, 'og:title') || extraerTitulo(html)
  const precio = extraerPrecio(html)
  const superficie = extraerSuperficie(html)

  return {
    direccion: limpiarDireccion(direccion),
    precio,
    superficie,
  }
}

function extraerMeta(html, propiedad) {
  const regex = new RegExp(
    `<meta[^>]+property=["']${propiedad}["'][^>]+content=["']([^"']+)["']`,
    'i'
  )
  const match = html.match(regex)
  return match ? decodeEntities(match[1]) : null
}

function extraerTitulo(html) {
  const match = html.match(/<title>([^<]+)<\/title>/i)
  return match ? decodeEntities(match[1]) : null
}

function limpiarDireccion(texto) {
  if (!texto) return null
  // Quita el sufijo habitual "— idealista" del título/og:title
  return texto.replace(/\s*[-—]\s*idealista.*$/i, '').trim()
}

function extraerPrecio(html) {
  // Idealista incluye el precio en JSON-LD como "price":320000
  let match = html.match(/"price"\s*:\s*"?(\d+)"?/i)
  if (match) return Number(match[1])

  // Alternativa: texto visible tipo "320.000 €"
  match = html.match(/(\d{1,3}(?:\.\d{3})*)\s*€/)
  if (match) return Number(match[1].replace(/\./g, ''))

  return null
}

function extraerSuperficie(html) {
  // Texto habitual: "280 m² construidos"
  let match = html.match(/(\d+)\s*m²\s*construidos/i)
  if (match) return Number(match[1])

  match = html.match(/"floorSize"[^}]*"value"\s*:\s*"?(\d+)"?/i)
  if (match) return Number(match[1])

  return null
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}
