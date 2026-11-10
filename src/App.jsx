import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import InmuebleCard from './InmuebleCard'

const GRUPOS = [
  { value: 'candidata', label: 'Candidatas' },
  { value: 'por_ver', label: 'Por ver' },
  { value: 'descartada', label: 'Descartadas' },
]

export default function App() {
  const [inmuebles, setInmuebles] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [colapsados, setColapsados] = useState({ descartada: true })
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nuevo, setNuevo] = useState({ direccion: '', precio: '', superficie: '', link: '' })
  const [guardandoNuevo, setGuardandoNuevo] = useState(false)

  useEffect(() => {
    cargarInmuebles()

    // Se mantiene sincronizado en tiempo real entre Pedro y Ángel
    const canal = supabase
      .channel('inmuebles-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inmuebles' }, () => {
        cargarInmuebles()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [])

  async function cargarInmuebles() {
    const { data, error } = await supabase
      .from('inmuebles')
      .select('*')
      .order('creado', { ascending: false })

    if (error) {
      setError('No se pudo cargar la lista: ' + error.message)
    } else {
      setError(null)
      setInmuebles(data)
    }
    setCargando(false)
  }

  async function actualizarInmueble(id, cambios) {
    // Actualización optimista: se ve el cambio al instante en este dispositivo
    setInmuebles((prev) => prev.map((i) => (i.id === id ? { ...i, ...cambios } : i)))

    const { error } = await supabase.from('inmuebles').update(cambios).eq('id', id)
    if (error) {
      setError('No se pudo guardar el cambio: ' + error.message)
      cargarInmuebles() // revertir a lo real si falla
    }
  }

  async function crearInmueble(e) {
    e.preventDefault()
    if (!nuevo.direccion.trim()) return

    setGuardandoNuevo(true)
    const payload = {
      direccion: nuevo.direccion.trim(),
      precio: nuevo.precio ? Number(nuevo.precio) : null,
      superficie: nuevo.superficie ? Number(nuevo.superficie) : null,
      link: nuevo.link.trim() || null,
    }

    const { error } = await supabase.from('inmuebles').insert(payload)
    setGuardandoNuevo(false)

    if (error) {
      setError('No se pudo añadir: ' + error.message)
    } else {
      setNuevo({ direccion: '', precio: '', superficie: '', link: '' })
      setMostrarForm(false)
      cargarInmuebles()
    }
  }

  function toggleColapso(grupo) {
    setColapsados((prev) => ({ ...prev, [grupo]: !prev[grupo] }))
  }

  if (cargando) {
    return <div className="status-msg">Cargando…</div>
  }

  return (
    <div>
      <h1>Pipeline Albaicín</h1>
      <p className="subtitle">Inmuebles en seguimiento — Pedro y Ángel</p>

      {error && <div className="error-msg">{error}</div>}

      {!mostrarForm && (
        <button className="add-form-toggle" onClick={() => setMostrarForm(true)}>
          + Añadir inmueble
        </button>
      )}

      {mostrarForm && (
        <form className="add-form" onSubmit={crearInmueble}>
          <label>Dirección / zona</label>
          <input
            autoFocus
            value={nuevo.direccion}
            onChange={(e) => setNuevo({ ...nuevo, direccion: e.target.value })}
            placeholder="Ej. Calle Aljibe del Gato, Albaicín"
            required
          />
          <div className="field-row">
            <div>
              <label>Precio (€)</label>
              <input
                type="number"
                value={nuevo.precio}
                onChange={(e) => setNuevo({ ...nuevo, precio: e.target.value })}
                placeholder="320000"
              />
            </div>
            <div>
              <label>Superficie (m²)</label>
              <input
                type="number"
                value={nuevo.superficie}
                onChange={(e) => setNuevo({ ...nuevo, superficie: e.target.value })}
                placeholder="280"
              />
            </div>
          </div>
          <label>Link de Idealista</label>
          <input
            value={nuevo.link}
            onChange={(e) => setNuevo({ ...nuevo, link: e.target.value })}
            placeholder="https://www.idealista.com/inmueble/..."
          />
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setMostrarForm(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={guardandoNuevo}>
              {guardandoNuevo ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      )}

      {GRUPOS.map(({ value, label }) => {
        const items = inmuebles.filter((i) => i.grupo === value)
        const colapsado = !!colapsados[value]
        return (
          <div className="grupo-section" key={value}>
            <div className="grupo-header" onClick={() => toggleColapso(value)}>
              <span className="grupo-titulo">{label}</span>
              <span className="grupo-count">({items.length})</span>
              <span className={`grupo-chevron ${colapsado ? 'collapsed' : ''}`}>▾</span>
            </div>
            {!colapsado && (
              items.length === 0 ? (
                <div className="empty-grupo">Nada por aquí todavía.</div>
              ) : (
                items.map((inmueble) => (
                  <InmuebleCard key={inmueble.id} inmueble={inmueble} onUpdate={actualizarInmueble} />
                ))
              )
            )}
          </div>
        )
      })}
    </div>
  )
}
