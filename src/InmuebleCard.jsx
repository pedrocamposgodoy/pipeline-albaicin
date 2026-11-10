import { SEMAFOROS, euros, miles, porcentaje, precioPorM2, rentabilidadBruta } from './lib/formato'
import { IconoCheck } from './iconos'
import Direccion from './Direccion'

// Tarjeta resumen: lo justo para reconocer el inmueble sin abrir el enlace.
// Al pulsar el cuerpo se abre la ficha; el semáforo se cambia sin abrirla.
export default function InmuebleCard({ inmueble, onAbrir, onSemaforo }) {
  const m2 = precioPorM2(inmueble.precio, inmueble.superficie)
  const rentab = rentabilidadBruta(inmueble.precio, inmueble.alquiler_mes)
  const primeraLineaNota = (inmueble.nota || '').split('\n')[0]

  return (
    <article
      className={`ficha semaforo-${inmueble.semaforo} ${inmueble.grupo === 'descartada' ? 'ficha-descartada' : ''}`}
    >
      <button type="button" className="ficha-cuerpo" onClick={() => onAbrir(inmueble.id)}>
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
          {rentab !== null && <span className="dato-rentab">{porcentaje(rentab)} bruta</span>}
        </span>

        {primeraLineaNota && <span className="ficha-nota">{primeraLineaNota}</span>}
      </button>

      <div className="ficha-pie">
        <div className="semaforo-rapido" role="radiogroup" aria-label="Valoración">
          {SEMAFOROS.map((s) => (
            <button
              key={s.valor}
              type="button"
              role="radio"
              aria-checked={inmueble.semaforo === s.valor}
              aria-label={s.etiqueta}
              className={`bola-semaforo semaforo-${s.valor}`}
              onClick={() => onSemaforo(inmueble.id, s.valor)}
            >
              <i className="punto" />
            </button>
          ))}
          <span className="estado-semaforo">
            {SEMAFOROS.find((s) => s.valor === inmueble.semaforo)?.etiqueta}
          </span>
        </div>
        {inmueble.visto && (
          <span className="marca-visto">
            <IconoCheck />
            Visto
          </span>
        )}
      </div>
    </article>
  )
}
