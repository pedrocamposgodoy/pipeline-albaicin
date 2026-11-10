import { useState } from 'react'
import {
  ETAPAS,
  SEMAFOROS,
  aNumero,
  aTexto,
  euros,
  miles,
  precioPorM2,
} from './lib/formato'
import { IconoEnlace } from './iconos'
import Direccion from './Direccion'

// Ficha completa de un inmueble: datos, enlace al anuncio y seguimiento.
export default function DetalleInmueble({ inmueble, onUpdate }) {
  const [editando, setEditando] = useState(false)
  const [nota, setNota] = useState(inmueble.nota || '')
  const [guardandoNota, setGuardandoNota] = useState(false)

  const m2 = precioPorM2(inmueble.precio, inmueble.superficie)
  const tieneCamposExtra = 'habitaciones' in inmueble

  const datos = [
    ['Superficie', inmueble.superficie != null ? `${miles(inmueble.superficie)} m²` : null],
    ['Habitaciones', inmueble.habitaciones],
    ['Baños', inmueble.banos],
    ['Estado', inmueble.estado],
    ['Referencia', inmueble.referencia],
    ['Inmobiliaria', inmueble.inmobiliaria],
  ].filter(([, valor]) => valor !== null && valor !== undefined && valor !== '')

  function guardarNota() {
    if (nota === (inmueble.nota || '')) return
    setGuardandoNota(true)
    onUpdate(inmueble.id, { nota }).finally(() => setGuardandoNota(false))
  }

  const fechaAlta = inmueble.creado
    ? new Date(inmueble.creado).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
    : null

  if (editando) {
    return (
      <FormularioEdicion
        inmueble={inmueble}
        conExtras={tieneCamposExtra}
        onCancelar={() => setEditando(false)}
        onGuardar={(cambios) => {
          onUpdate(inmueble.id, cambios)
          setEditando(false)
        }}
      />
    )
  }

  return (
    <div className="detalle">
      <div className="placa">
        <h2 className="placa-texto">
          <Direccion texto={inmueble.direccion} />
        </h2>
      </div>

      <p className="detalle-precio">{euros(inmueble.precio) ?? 'Precio sin indicar'}</p>
      {m2 && <p className="detalle-m2">{miles(m2)} € por metro cuadrado</p>}

      {datos.length > 0 && (
        <dl className="datos">
          {datos.map(([etiqueta, valor]) => (
            <div key={etiqueta}>
              <dt>{etiqueta}</dt>
              <dd>{valor}</dd>
            </div>
          ))}
        </dl>
      )}

      {inmueble.link ? (
        <a className="boton-principal" href={inmueble.link} target="_blank" rel="noopener noreferrer">
          <IconoEnlace />
          Abrir anuncio en Idealista
        </a>
      ) : (
        <p className="sin-enlace">Este inmueble no tiene enlace. Puedes añadirlo en Editar datos.</p>
      )}

      <div className="control">
        <h3>Valoración</h3>
        <div className="semaforo-opciones" role="radiogroup" aria-label="Valoración">
          {SEMAFOROS.map((s) => (
            <button
              key={s.valor}
              type="button"
              role="radio"
              aria-checked={inmueble.semaforo === s.valor}
              className={`opcion-semaforo semaforo-${s.valor}`}
              onClick={() => onUpdate(inmueble.id, { semaforo: s.valor })}
            >
              <i className="punto" />
              {s.etiqueta}
            </button>
          ))}
        </div>
      </div>

      <div className="control">
        <h3>Etapa</h3>
        <div className="segmentos" role="radiogroup" aria-label="Etapa">
          {ETAPAS.map((e) => (
            <button
              key={e.valor}
              type="button"
              role="radio"
              aria-checked={inmueble.grupo === e.valor}
              className="segmento"
              onClick={() => onUpdate(inmueble.id, { grupo: e.valor })}
            >
              {e.etiqueta}
            </button>
          ))}
        </div>
      </div>

      <label className="fila-visto">
        <input
          type="checkbox"
          checked={!!inmueble.visto}
          onChange={(e) => onUpdate(inmueble.id, { visto: e.target.checked })}
        />
        Ya lo hemos visto
      </label>

      <div className="control">
        <h3>Notas</h3>
        <textarea
          className="notas"
          value={nota}
          placeholder="Qué os gusta, dudas, qué preguntar a la inmobiliaria…"
          onChange={(e) => setNota(e.target.value)}
          onBlur={guardarNota}
        />
        <p className="estado-guardado" aria-live="polite">
          {guardandoNota ? 'Guardando…' : ''}
        </p>
      </div>

      <div className="detalle-pie">
        <span>{fechaAlta ? `Añadido el ${fechaAlta}` : ''}</span>
        <button type="button" className="boton-secundario" onClick={() => setEditando(true)}>
          Editar datos
        </button>
      </div>
    </div>
  )
}

function FormularioEdicion({ inmueble, conExtras, onGuardar, onCancelar }) {
  const [b, setB] = useState({
    direccion: inmueble.direccion ?? '',
    precio: inmueble.precio ?? '',
    superficie: inmueble.superficie ?? '',
    link: inmueble.link ?? '',
    habitaciones: inmueble.habitaciones ?? '',
    banos: inmueble.banos ?? '',
    estado: inmueble.estado ?? '',
    referencia: inmueble.referencia ?? '',
    inmobiliaria: inmueble.inmobiliaria ?? '',
  })

  const poner = (campo) => (e) => setB({ ...b, [campo]: e.target.value })

  function enviar(e) {
    e.preventDefault()
    if (!b.direccion.trim()) return
    const cambios = {
      direccion: b.direccion.trim(),
      precio: aNumero(b.precio),
      superficie: aNumero(b.superficie),
      link: aTexto(b.link),
    }
    if (conExtras) {
      cambios.habitaciones = aNumero(b.habitaciones)
      cambios.banos = aNumero(b.banos)
      cambios.estado = aTexto(b.estado)
      cambios.referencia = aTexto(b.referencia)
      cambios.inmobiliaria = aTexto(b.inmobiliaria)
    }
    onGuardar(cambios)
  }

  return (
    <form className="detalle formulario" onSubmit={enviar}>
      <h2 className="titulo-formulario">Editar datos</h2>

      <div className="campo">
        <label htmlFor="e-direccion">Dirección</label>
        <input id="e-direccion" value={b.direccion} onChange={poner('direccion')} required />
      </div>

      <div className="fila-campos">
        <div className="campo">
          <label htmlFor="e-precio">Precio (€)</label>
          <input id="e-precio" type="number" inputMode="numeric" value={b.precio} onChange={poner('precio')} />
        </div>
        <div className="campo">
          <label htmlFor="e-superficie">Superficie (m²)</label>
          <input id="e-superficie" type="number" inputMode="numeric" value={b.superficie} onChange={poner('superficie')} />
        </div>
      </div>

      {conExtras && (
        <>
          <div className="fila-campos">
            <div className="campo">
              <label htmlFor="e-hab">Habitaciones</label>
              <input id="e-hab" type="number" inputMode="numeric" value={b.habitaciones} onChange={poner('habitaciones')} />
            </div>
            <div className="campo">
              <label htmlFor="e-banos">Baños</label>
              <input id="e-banos" type="number" inputMode="numeric" value={b.banos} onChange={poner('banos')} />
            </div>
          </div>
          <div className="campo">
            <label htmlFor="e-estado">Estado</label>
            <input id="e-estado" value={b.estado} onChange={poner('estado')} placeholder="Para reformar, buen estado…" />
          </div>
          <div className="fila-campos">
            <div className="campo">
              <label htmlFor="e-ref">Referencia</label>
              <input id="e-ref" value={b.referencia} onChange={poner('referencia')} />
            </div>
            <div className="campo">
              <label htmlFor="e-inmo">Inmobiliaria</label>
              <input id="e-inmo" value={b.inmobiliaria} onChange={poner('inmobiliaria')} />
            </div>
          </div>
        </>
      )}

      <div className="campo">
        <label htmlFor="e-link">Enlace al anuncio</label>
        <input id="e-link" value={b.link} onChange={poner('link')} placeholder="https://www.idealista.com/inmueble/…" />
      </div>

      <div className="acciones">
        <button type="button" className="boton-secundario" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="boton-principal boton-compacto">
          Guardar cambios
        </button>
      </div>
    </form>
  )
}
