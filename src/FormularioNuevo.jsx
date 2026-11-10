import { useState } from 'react'
import { parsearAnuncio } from './lib/parsearAnuncio'

const VACIO = {
  direccion: '',
  precio: '',
  superficie: '',
  link: '',
  nota: '',
  habitaciones: '',
  banos: '',
  estado: '',
  referencia: '',
  inmobiliaria: '',
}

// Formulario para añadir un inmueble. Lo más cómodo es pegar el texto del
// anuncio: los campos se rellenan solos y se pueden corregir antes de guardar.
export default function FormularioNuevo({ onGuardar, onCancelar, guardando }) {
  const [nuevo, setNuevo] = useState(VACIO)
  const [textoPegado, setTextoPegado] = useState('')
  const [aviso, setAviso] = useState(null)

  const poner = (campo) => (e) => setNuevo({ ...nuevo, [campo]: e.target.value })

  // Si lo pegado es solo un enlace, se intenta leer el anuncio desde el servidor.
  // Idealista suele bloquearlo: en ese caso se avisa y se sigue a mano.
  async function leerEnlace(enlace) {
    setAviso({ tipo: 'parcial', texto: 'Intentando leer el anuncio…' })
    try {
      const r = await fetch(`/api/importar?url=${encodeURIComponent(enlace)}`)
      const datos = await r.json()
      if (!datos.ok) throw new Error('bloqueado')
      const leido = parsearAnuncio(`${datos.og.titulo ?? ''}\n${datos.og.descripcion ?? ''}\n${enlace}`)
      setNuevo((previo) => {
        const siguiente = { ...previo }
        for (const campo of Object.keys(VACIO)) {
          if (campo !== 'nota' && leido[campo] != null) siguiente[campo] = leido[campo]
        }
        if (!siguiente.direccion && datos.og.titulo) siguiente.direccion = datos.og.titulo
        return siguiente
      })
      setAviso({ tipo: 'ok', texto: 'Anuncio leído. Revisa los datos antes de guardar.' })
    } catch {
      setAviso({
        tipo: 'parcial',
        texto:
          'Idealista no deja leer el anuncio desde aquí. Se ha guardado el enlace; para el resto, abre el anuncio, copia todo el texto y pégalo en el recuadro.',
      })
    }
  }

  function leerTexto(texto) {
    const datos = parsearAnuncio(texto)
    const soloEnlace = /^https:\/\/(www\.)?(idealista\.com|grupotorres\.com)\/\S+$/.test(texto.trim())
    if (soloEnlace) {
      setNuevo((previo) => ({ ...previo, link: datos.link ?? texto.trim() }))
      leerEnlace(texto.trim())
      return
    }

    setNuevo((previo) => {
      const siguiente = { ...previo }
      for (const campo of Object.keys(VACIO)) {
        if (campo !== 'nota' && datos[campo] !== null && datos[campo] !== undefined) {
          siguiente[campo] = datos[campo]
        }
      }
      return siguiente
    })

    if (datos.encontrados.length === 0) {
      setAviso({
        tipo: 'error',
        texto: 'No he reconocido ningún dato en ese texto. Rellena los campos a mano.',
      })
    } else if (!datos.precio || !datos.superficie) {
      setAviso({
        tipo: 'parcial',
        texto: `Solo he podido leer: ${datos.encontrados.join(', ')}. Completa el resto a mano. Si has copiado desde WhatsApp, copia mejor desde la página del anuncio.`,
      })
    } else {
      setAviso({
        tipo: 'ok',
        texto: `Leído: ${datos.encontrados.join(', ')}. Revisa los datos antes de guardar.`,
      })
    }
  }

  function enviar(e) {
    e.preventDefault()
    if (!nuevo.direccion.trim()) return
    onGuardar(nuevo)
  }

  return (
    <form className="detalle formulario" onSubmit={enviar}>
      <h2 className="titulo-formulario">Añadir inmueble</h2>

      <div className="bloque-pegar">
        <label htmlFor="n-pegar">Pega aquí el anuncio de Idealista</label>
        <p className="ayuda">
          Abre el anuncio, selecciona todo con Ctrl+A, copia con Ctrl+C y pega aquí con Ctrl+V.
          Los campos se rellenan solos.
        </p>
        <textarea
          id="n-pegar"
          className="area-pegar"
          value={textoPegado}
          placeholder="Texto del anuncio…"
          onChange={(e) => setTextoPegado(e.target.value)}
          onPaste={(e) => {
            const pegado = e.clipboardData.getData('text')
            if (pegado) {
              e.preventDefault()
              setTextoPegado(pegado)
              leerTexto(pegado)
            }
          }}
        />
        {textoPegado && (
          <button type="button" className="boton-secundario" onClick={() => leerTexto(textoPegado)}>
            Volver a leer el texto
          </button>
        )}
      </div>

      {aviso && <div className={`aviso aviso-${aviso.tipo}`}>{aviso.texto}</div>}

      <div className="campo">
        <label htmlFor="n-direccion">Dirección</label>
        <input
          id="n-direccion"
          value={nuevo.direccion}
          onChange={poner('direccion')}
          placeholder="Calle Aljibe del Gato, 11, Albaicín"
          required
        />
      </div>

      <div className="fila-campos">
        <div className="campo">
          <label htmlFor="n-precio">Precio (€)</label>
          <input id="n-precio" type="number" inputMode="numeric" value={nuevo.precio} onChange={poner('precio')} />
        </div>
        <div className="campo">
          <label htmlFor="n-superficie">Superficie (m²)</label>
          <input id="n-superficie" type="number" inputMode="numeric" value={nuevo.superficie} onChange={poner('superficie')} />
        </div>
      </div>

      <div className="fila-campos">
        <div className="campo">
          <label htmlFor="n-hab">Habitaciones</label>
          <input id="n-hab" type="number" inputMode="numeric" value={nuevo.habitaciones} onChange={poner('habitaciones')} />
        </div>
        <div className="campo">
          <label htmlFor="n-banos">Baños</label>
          <input id="n-banos" type="number" inputMode="numeric" value={nuevo.banos} onChange={poner('banos')} />
        </div>
      </div>

      <div className="campo">
        <label htmlFor="n-link">Enlace al anuncio</label>
        <input id="n-link" value={nuevo.link} onChange={poner('link')} placeholder="https://www.idealista.com/inmueble/…" />
      </div>

      <details className="mas-datos">
        <summary>Más datos</summary>
        <div className="campo">
          <label htmlFor="n-estado">Estado</label>
          <input id="n-estado" value={nuevo.estado} onChange={poner('estado')} placeholder="Para reformar, buen estado…" />
        </div>
        <div className="fila-campos">
          <div className="campo">
            <label htmlFor="n-ref">Referencia</label>
            <input id="n-ref" value={nuevo.referencia} onChange={poner('referencia')} />
          </div>
          <div className="campo">
            <label htmlFor="n-inmo">Inmobiliaria</label>
            <input id="n-inmo" value={nuevo.inmobiliaria} onChange={poner('inmobiliaria')} />
          </div>
        </div>
      </details>

      <div className="campo">
        <label htmlFor="n-nota">Nota</label>
        <textarea id="n-nota" className="notas" value={nuevo.nota} onChange={poner('nota')} placeholder="Lo que quieras recordar…" />
      </div>

      <div className="acciones">
        <button type="button" className="boton-secundario" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="boton-principal boton-compacto" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar inmueble'}
        </button>
      </div>
    </form>
  )
}
