import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import { aNumero, aTexto, normalizar } from './lib/formato'
import InmuebleCard from './InmuebleCard'
import DetalleInmueble from './DetalleInmueble'
import FormularioNuevo from './FormularioNuevo'
import Hoja from './Hoja'
import PanelCifras from './PanelCifras'
import { IconoBuscar, IconoMas } from './iconos'

const SECCIONES = [
  {
    valor: 'candidata',
    titulo: 'Candidatas',
    vacio: 'Todavía no hay candidatas. Pasa aquí los que queráis seguir de cerca.',
  },
  {
    valor: 'por_ver',
    titulo: 'Por ver',
    vacio: 'Nada pendiente de ver. Añade un inmueble.',
  },
  {
    valor: 'descartada',
    titulo: 'Descartadas',
    vacio: 'Aquí irán los que descartéis. No se borran, por si cambiáis de idea.',
  },
]

export default function App() {
  const [inmuebles, setInmuebles] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [pestana, setPestana] = useState('por_ver') // solo se usa en pantallas estrechas
  const [busqueda, setBusqueda] = useState('')
  const [hoja, setHoja] = useState(null) // null | { tipo: 'nuevo' } | { tipo: 'detalle', id }
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
    // Se ve el cambio al instante en este dispositivo y luego se confirma
    setInmuebles((previos) => previos.map((i) => (i.id === id ? { ...i, ...cambios } : i)))

    const { error } = await supabase.from('inmuebles').update(cambios).eq('id', id)
    if (error) {
      setError('No se pudo guardar el cambio: ' + error.message)
      cargarInmuebles()
    }
  }

  async function crearInmueble(datos) {
    setGuardandoNuevo(true)

    const base = {
      direccion: datos.direccion.trim(),
      precio: aNumero(datos.precio),
      superficie: aNumero(datos.superficie),
      link: aTexto(datos.link),
      nota: aTexto(datos.nota),
    }
    const extras = {
      habitaciones: aNumero(datos.habitaciones),
      banos: aNumero(datos.banos),
      estado: aTexto(datos.estado),
      referencia: aTexto(datos.referencia),
      inmobiliaria: aTexto(datos.inmobiliaria),
    }

    let { error } = await supabase.from('inmuebles').insert({ ...base, ...extras })

    // Si la tabla todavía no tiene las columnas nuevas, se guardan dentro de la nota
    if (error && (error.code === 'PGRST204' || /column/i.test(error.message))) {
      const resumen = [
        extras.habitaciones != null && `${extras.habitaciones} hab.`,
        extras.banos != null && `${extras.banos} baños`,
        extras.estado,
        extras.referencia && `ref. ${extras.referencia}`,
        extras.inmobiliaria,
      ]
        .filter(Boolean)
        .join(', ')
      const nota = [base.nota, resumen].filter(Boolean).join('\n')
      ;({ error } = await supabase.from('inmuebles').insert({ ...base, nota: nota || null }))
    }

    setGuardandoNuevo(false)

    if (error) {
      setError('No se pudo añadir: ' + error.message)
      return
    }
    setHoja(null)
    cargarInmuebles()
  }

  const textoBusqueda = normalizar(busqueda).trim()
  const visibles = textoBusqueda
    ? inmuebles.filter((i) =>
        normalizar([i.direccion, i.nota, i.referencia, i.inmobiliaria, i.estado].filter(Boolean).join(' ')).includes(
          textoBusqueda,
        ),
      )
    : inmuebles

  const enGrupo = (grupo) => visibles.filter((i) => i.grupo === grupo)
  const activosTodos = inmuebles.filter((i) => i.grupo !== 'descartada')
  const candidatas = inmuebles.filter((i) => i.grupo === 'candidata').length
  const descartadas = inmuebles.filter((i) => i.grupo === 'descartada').length

  const resumen = [
    `${activosTodos.length} en seguimiento`,
    candidatas > 0 && `${candidatas} ${candidatas === 1 ? 'candidata' : 'candidatas'}`,
    descartadas > 0 && `${descartadas} ${descartadas === 1 ? 'descartada' : 'descartadas'}`,
  ]
    .filter(Boolean)
    .join(', ')

  const abierto = hoja?.tipo === 'detalle' ? inmuebles.find((i) => i.id === hoja.id) : null

  if (cargando) {
    return <div className="estado-carga">Cargando inmuebles…</div>
  }

  return (
    <div className="pagina">
      <header className="cabecera">
        <div>
          <h1>Pipeline Albaicín</h1>
          <p className="resumen">{resumen}</p>
        </div>

        <div className="cabecera-acciones">
          <label className="buscador">
            <IconoBuscar />
            <input
              type="search"
              value={busqueda}
              placeholder="Buscar calle, nota, referencia…"
              aria-label="Buscar inmuebles"
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </label>
          <button type="button" className="boton-cabecera" onClick={() => setHoja({ tipo: 'nuevo' })}>
            <IconoMas />
            Añadir inmueble
          </button>
        </div>
      </header>

      {error && (
        <div className="aviso aviso-error" role="alert">
          {error}
        </div>
      )}

      <PanelCifras activos={activosTodos} />

      {textoBusqueda && (
        <p className="resultado-busqueda" aria-live="polite">
          {visibles.length === 0
            ? `Ningún inmueble coincide con «${busqueda.trim()}».`
            : `${visibles.length} ${visibles.length === 1 ? 'resultado' : 'resultados'} para «${busqueda.trim()}».`}
        </p>
      )}

      <div className="pestanas" role="tablist" aria-label="Etapa">
        {SECCIONES.map(({ valor, titulo }) => (
          <button
            key={valor}
            type="button"
            role="tab"
            aria-selected={pestana === valor}
            className="pestana"
            onClick={() => setPestana(valor)}
          >
            {titulo} <span className="pestana-cuenta">{enGrupo(valor).length}</span>
          </button>
        ))}
      </div>

      <div className="tablero">
        {SECCIONES.map(({ valor, titulo, vacio }) => {
          const items = enGrupo(valor)
          return (
            <section className={`columna ${pestana === valor ? 'activa' : ''}`} key={valor} aria-label={titulo}>
              <h2 className="columna-cabecera">
                <span className="seccion-titulo">{titulo}</span>
                <span className="seccion-cuenta">{items.length}</span>
              </h2>

              {items.length === 0 ? (
                <p className="vacio">{textoBusqueda ? 'Nada en esta columna.' : vacio}</p>
              ) : (
                <div className="lista">
                  {items.map((inmueble) => (
                    <InmuebleCard
                      key={inmueble.id}
                      inmueble={inmueble}
                      onAbrir={(id) => setHoja({ tipo: 'detalle', id })}
                      onSemaforo={(id, semaforo) => actualizarInmueble(id, { semaforo })}
                    />
                  ))}
                </div>
              )}
            </section>
          )
        })}
      </div>

      <button type="button" className="boton-anadir" onClick={() => setHoja({ tipo: 'nuevo' })}>
        <IconoMas />
        Añadir inmueble
      </button>

      {hoja?.tipo === 'nuevo' && (
        <Hoja titulo="Añadir inmueble" onCerrar={() => setHoja(null)}>
          <FormularioNuevo
            guardando={guardandoNuevo}
            onGuardar={crearInmueble}
            onCancelar={() => setHoja(null)}
          />
        </Hoja>
      )}

      {abierto && (
        <Hoja titulo={abierto.direccion} onCerrar={() => setHoja(null)}>
          <DetalleInmueble key={abierto.id} inmueble={abierto} onUpdate={actualizarInmueble} />
        </Hoja>
      )}
    </div>
  )
}
