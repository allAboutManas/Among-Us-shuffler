import { useEffect, useState } from 'react'

// Live-reactive prefers-reduced-motion. Framer Motion has its own hook, but
// we also need this value in plain logic (e.g. skipping the shuffle timing).
export function useReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof matchMedia === 'function'
      ? matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  )

  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const mq = matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  return reduced
}
