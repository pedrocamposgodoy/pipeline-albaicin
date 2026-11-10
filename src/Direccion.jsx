// Muestra una dirección poniendo los números en la tipografía de interfaz.
// En la tipografía de placa el "11" se lee como "II", y el número de portal importa.
export default function Direccion({ texto }) {
  const partes = String(texto ?? '').split(/(\d+)/)
  return partes.map((parte, i) =>
    /^\d+$/.test(parte) ? (
      <span key={i} className="cifras">
        {parte}
      </span>
    ) : (
      parte
    ),
  )
}
