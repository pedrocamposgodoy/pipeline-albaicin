import { SEMAFOROS, euros, miles, precioPorM2 } from './lib/formato'
import { IconoCheck } from './iconos'
import Direccion from './Direccion'

// Tarjeta resumen: lo justo para reconocer el inmueble sin abrir el enlace.
// Al pulsarla se abre la ficha con todos los datos.
export default function InmuebleCard({ inmueble, onAbrir }) {
  const m2 = precioPorM2(inmueble.precio, inmueble.superficie)
  const etiqueta = SEMAFOROS.find((s) => s.valor === inmueble.semaforo)?.etiqueta
  const primeraLineaNota = (inmueble.nota || '').split('\n')[0]

  return (
    <button
      type="button"
      className={`ficha semaforo-${inmueble.semaforo} ${inmueble.grupo === 'descartada' ? 'ficha-descartada' : ''}`}
      onClick={() => onAbrir(inmueble.id)}
    >
      <span className="ficha-precio">{euros(inmueble.precio) ?? 'Precio sin indicar'}</span>
      <span className="ficha-direccion">
        <Direccion texto={inmueble.direccion} />
      </span>

      <span className="ficha-datos">
        {inmueble.superficie != null && <span>{miles(inmueble.superficie)} m²</span>}
        {m2 && <span>{miles(m2)} €/m²</span>}
        {inmueble.habitaciones != null && <span>{inmueble.habitaciones} hab.</span>}
        {inmueble.banos != null && (
          <span>
            {inmueble.banos} {inmueble.banos === 1 ? 'baño' : 'baños'}
          </span>
        )}
      </span>

      {primeraLineaNota && <span className="ficha-nota">{primeraLineaNota}</span>}

      <span className="ficha-pie">
        <span className="estado-semaforo">
          <i className="punto" />
          {etiqueta}
        </span>
        {inmueble.visto && (
          <span className="marca-visto">
            <IconoCheck />
            Visto
          </span>
        )}
      </span>
    </button>
  )
}
