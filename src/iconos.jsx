const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export const IconoCerrar = () => (
  <svg {...base}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

export const IconoMas = () => (
  <svg {...base}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconoCheck = () => (
  <svg {...base} width={15} height={15} strokeWidth={2.6}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
)

export const IconoEnlace = () => (
  <svg {...base}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </svg>
)

export const IconoFlecha = () => (
  <svg {...base} width={16} height={16}>
    <path d="M6 9l6 6 6-6" />
  </svg>
)

export const IconoBuscar = () => (
  <svg {...base}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </svg>
)
