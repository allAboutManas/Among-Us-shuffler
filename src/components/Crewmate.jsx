// A recolourable crewmate avatar — the player token used everywhere a colour
// chip used to be. Pure vector, so it stays crisp at any size and accepts any
// fill (the 12 player colours, plus role colours). No raster assets.
export default function Crewmate({
  color = 'var(--signal)',
  size = 40,
  className = '',
  title,
  style,
}) {
  const outline = 'rgba(0,0,0,0.42)'
  return (
    <svg
      width={size}
      height={size}
      viewBox="7 8 50 50"
      className={className}
      style={style}
      role="img"
      aria-label={title || 'player'}
    >
      {title ? <title>{title}</title> : null}
      <g stroke={outline} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        {/* backpack */}
        <path d="M12 29 q0 -5 5 -5 h4 v20 h-4 q-5 0 -5 -5 z" fill={color} />
        {/* a touch of shade on the pack for depth */}
        <path
          d="M12 29 q0 -5 5 -5 h4 v20 h-4 q-5 0 -5 -5 z"
          fill="rgba(0,0,0,0.14)"
          stroke="none"
        />
        {/* body + legs silhouette */}
        <path
          d="M18 32 C18 18 26 12 33 12 C42 12 50 19 50 32 L50 52 C50 55 49 56 46 56 L42 56 C39 56 38 55 38 52 L30 52 C30 55 29 56 26 56 L22 56 C19 56 18 55 18 52 Z"
          fill={color}
        />
        {/* visor */}
        <path
          d="M32 20 h11 q5 0 5 5 q0 5 -5 5 h-13 q-4 0 -4 -5 q0 -5 4 -5 z"
          fill="#B8ECFF"
        />
      </g>
      {/* visor highlight */}
      <rect x="41.5" y="22.5" width="4.5" height="4" rx="2" fill="#ECFBFF" />
    </svg>
  )
}
