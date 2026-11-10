import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import { aNumero, aTexto } from './lib/formato'
import InmuebleCard from './InmuebleCard'
import DetalleInmueble from './DetalleInmueble'
import FormularioNuevo from './FormularioNuevo'
import Hoja from './Hoja'
import { IconoFlecha, IconoMas } from './iconos'

const SECCIONES = [
  {
    valor: 'candidata',
    titulo: 'Candidatas',
    vacio: 'Todavía no hay candidatas. Marca un inmueble como candidata cuando queráis seguirlo de cerca.',
  },
  {
    valor: 'por_ver',
    titulo: 'Por ver',
    vacio: 'Nada pendiente de ver. Añade un inmueble con el botón de abajo.',
  },
  {
    valor: 'descartada',
    titulo: 'Descartadas',
    vacio: 'Aquí aparecerán los inmuebles que descartéis. No se borran, por si cambiáis de idea.',
  },
]

export default function App() {
  const [inmuebles, setInmuebles] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [colapsadas, setColapsadas] = useState({ descartada: true })
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

  const enGrupo = (grupo) => inmuebles.filter((i) => i.grupo === grupo)
  const activos = inmuebles.length - enGrupo('descartada').length
  const candidatas = enGrupo('candidata').length
  const descartadas = enGrupo('descartada').length

  const resumen = [
    `${activos} en seguimiento`,
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
        <h1>Pipeline Albaicín</h1>
        <p className="resumen">{resumen}</p>
      </header>

      {error && (
        <div className="aviso aviso-error" role="alert">
          {error}
        </div>
      )}

      {SECCIONES.map(({ valor, titulo, vacio }) => {
        const items = enGrupo(valor)
        const cerrada = !!colapsadas[valor]
        return (
          <section className="seccion" key={valor}>
            <button
              type="button"
              className="seccion-cabecera"
              aria-expanded={!cerrada}
              onClick={() => setColapsadas((c) => ({ ...c, [valor]: !c[valor] }))}
            >
              <span className="seccion-titulo">{titulo}</span>
              <span className="seccion-cuenta">{items.length}</span>
              <span className={`seccion-flecha ${cerrada ? 'cerrada' : ''}`}>
                <IconoFlecha />
              </span>
            </button>

            {!cerrada &&
              (items.length === 0 ? (
                <p className="vacio">{vacio}</p>
              ) : (
                <div className="lista">
                  {items.map((inmueble) => (
                    <InmuebleCard
                      key={inmueble.id}
                      inmueble={inmueble}
                      onAbrir={(id) => setHoja({ tipo: 'detalle', id })}
                    />
                  ))}
                </div>
              ))}
          </section>
        )
      })}

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
