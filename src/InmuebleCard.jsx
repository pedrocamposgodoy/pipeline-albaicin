import { useState } from 'react'

const GRUPOS = [
  { value: 'por_ver', label: 'Por ver' },
  { value: 'candidata', label: 'Candidata' },
  { value: 'descartada', label: 'Descartada' },
]

function formatoPrecio(n) {
  if (n === null || n === undefined || n === '') return null
  return new Intl.NumberFormat('es-ES').format(n) + ' €'
}

export default function InmuebleCard({ inmueble, onUpdate }) {
  const [nota, setNota] = useState(inmueble.nota || '')
  const [guardandoNota, setGuardandoNota] = useState(false)

  const datos = [
    inmueble.precio != null && formatoPrecio(inmueble.precio),
    inmueble.superficie != null && `${inmueble.superficie} m²`,
  ].filter(Boolean).join(' · ')

  function handleNotaBlur() {
    if (nota !== (inmueble.nota || '')) {
      setGuardandoNota(true)
      onUpdate(inmueble.id, { nota }).finally(() => setGuardandoNota(false))
    }
  }

  return (
    <div className={`card semaforo-${inmueble.semaforo}`}>
      <div className="card-top">
        <div>
          <div className="card-direccion">
            {inmueble.link ? (
              <a href={inmueble.link} target="_blank" rel="noopener noreferrer">
                {inmueble.direccion}
              </a>
            ) : (
              inmueble.direccion
            )}
          </div>
          {datos && <div className="card-datos">{datos}</div>}
        </div>
      </div>

      <div className="card-controls">
        <div className="semaforo-dots">
          {['verde', 'ambar', 'rojo'].map((color) => (
            <button
              key={color}
              className={`dot dot-${color} ${inmueble.semaforo === color ? 'active' : ''}`}
              aria-label={`Marcar ${color}`}
              onClick={() => onUpdate(inmueble.id, { semaforo: color })}
            />
          ))}
        </div>

        <select
          className="grupo-select"
          value={inmueble.grupo}
          onChange={(e) => onUpdate(inmueble.id, { grupo: e.target.value })}
        >
          {GRUPOS.map((g) => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>

        <label className="visto-toggle">
          <input
            type="checkbox"
            checked={!!inmueble.visto}
            onChange={(e) => onUpdate(inmueble.id, { visto: e.target.checked })}
          />
          Visto
        </label>
      </div>

      <textarea
        className="nota-edit"
        placeholder="Nota..."
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        onBlur={handleNotaBlur}
      />
      {guardandoNota && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Guardando…</div>}
    </div>
  )
}
