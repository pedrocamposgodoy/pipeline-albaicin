import { euros, mediana, miles, porcentaje, precioPorM2, rentabilidadBruta } from './lib/formato'

// Fila de cifras de los inmuebles que siguen vivos (los descartados no cuentan).
export default function PanelCifras({ activos }) {
  const precios = activos.map((i) => i.precio).filter(Boolean)
  const m2 = activos.map((i) => precioPorM2(i.precio, i.superficie)).filter(Boolean)
  const rentabs = activos.map((i) => rentabilidadBruta(i.precio, i.alquiler_mes)).filter((r) => r !== null)

  const candidatas = activos.filter((i) => i.grupo === 'candidata').length
  const rentabMedia = rentabs.length ? rentabs.reduce((a, b) => a + b, 0) / rentabs.length : null
  const medianaM2 = mediana(m2)

  return (
    <div className="panel-cifras">
      <div className="cifra">
        <p className="cifra-etiqueta">En seguimiento</p>
        <p className="cifra-valor">{activos.length}</p>
        <p className="cifra-nota">{candidatas === 1 ? '1 candidata' : `${candidatas} candidatas`}</p>
      </div>

      <div className="cifra">
        <p className="cifra-etiqueta">Rango de precios</p>
        <p className="cifra-valor">
          {precios.length ? `${miles(Math.min(...precios) / 1000)}–${miles(Math.max(...precios) / 1000)} mil €` : '—'}
        </p>
        <p className="cifra-nota">{precios.length ? `Más barato: ${euros(Math.min(...precios))}` : 'Sin precios'}</p>
      </div>

      <div className="cifra">
        <p className="cifra-etiqueta">Mediana por metro</p>
        <p className="cifra-valor">{medianaM2 ? `${miles(medianaM2)} €/m²` : '—'}</p>
        <p className="cifra-nota">{m2.length > 0 ? `Sobre ${m2.length} con precio y metros` : 'Faltan precio y metros'}</p>
      </div>

      <div className="cifra">
        <p className="cifra-etiqueta">Rentabilidad bruta media</p>
        <p className="cifra-valor">{rentabMedia !== null ? porcentaje(rentabMedia) : '—'}</p>
        <p className="cifra-nota">
          {rentabs.length > 0
            ? `Con alquiler estimado en ${rentabs.length} de ${activos.length}`
            : 'Pon el alquiler estimado en cada ficha'}
        </p>
      </div>
    </div>
  )
}
