// Prueba de lectura de un anuncio desde el servidor de Vercel.
// Solo pide la cabecera de la página (etiquetas Open Graph). Idealista suele
// bloquear las peticiones desde servidores; si lo hace, devuelve bloqueado: true
// y la app sigue funcionando pegando el texto del anuncio.

const HOSTS_PERMITIDOS = ['idealista.com', 'www.idealista.com', 'grupotorres.com', 'www.grupotorres.com']

function etiqueta(html, propiedad) {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${propiedad}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${propiedad}["']`,
    'i',
  )
  const m = html.match(re)
  return m ? (m[1] ?? m[2] ?? '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim() : null
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  let destino
  try {
    destino = new URL(String(req.query.url ?? ''))
  } catch {
    return res.status(400).json({ ok: false, error: 'Falta una dirección web válida.' })
  }
  if (destino.protocol !== 'https:' || !HOSTS_PERMITIDOS.includes(destino.hostname)) {
    return res.status(400).json({ ok: false, error: 'Solo se leen anuncios de Idealista o Grupo Torres.' })
  }

  try {
    const respuesta = await fetch(destino.href, {
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
      headers: {
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'es-ES,es;q=0.9',
      },
    })
    const html = await respuesta.text()
    const og = {
      titulo: etiqueta(html, 'og:title'),
      descripcion: etiqueta(html, 'og:description'),
      imagen: etiqueta(html, 'og:image'),
    }
    const bloqueado = !respuesta.ok || (!og.titulo && !og.descripcion)
    return res.status(200).json({ ok: !bloqueado, bloqueado, estado: respuesta.status, og })
  } catch (e) {
    return res.status(200).json({ ok: false, bloqueado: true, estado: null, error: String(e.message ?? e) })
  }
}
