import { useEffect, useRef } from 'react'
import { IconoCerrar } from './iconos'

// Panel que se desliza desde abajo en el móvil y desde la derecha en el
// ordenador. Se cierra con la X, con Escape o pulsando fuera.
export default function Hoja({ titulo, onCerrar, children }) {
  const botonCerrar = useRef(null)

  useEffect(() => {
    const anterior = document.activeElement
    botonCerrar.current?.focus()
    document.body.style.overflow = 'hidden'

    const alPulsarTecla = (e) => {
      if (e.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', alPulsarTecla)

    return () => {
      document.removeEventListener('keydown', alPulsarTecla)
      document.body.style.overflow = ''
      anterior?.focus?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className="hoja-fondo"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar()
      }}
    >
      <section className="hoja" role="dialog" aria-modal="true" aria-label={titulo}>
        <button
          ref={botonCerrar}
          type="button"
          className="hoja-cerrar"
          onClick={onCerrar}
          aria-label="Cerrar"
        >
          <IconoCerrar />
        </button>
        {children}
      </section>
    </div>
  )
}
