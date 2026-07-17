import { useEffect, useRef, useState } from 'react'

// Drift-free countdown.
//
// We NEVER decrement a counter on setInterval — browsers throttle intervals in
// background tabs and the value drifts. Instead we store an absolute `endsAt`
// and derive secondsLeft from the wall clock on a 250ms tick, re-syncing on
// visibilitychange. Pausing stores the remaining ms; resuming recomputes endsAt
// in the reducer. This hook is read-only over the meeting state.
//
// @param meeting { endsAt: number|null, pausedRemainingMs: number|null }
// @returns { secondsLeft, msLeft, isPaused, isDone }
export function useTimer(meeting) {
  const { endsAt, pausedRemainingMs } = meeting
  const isPaused = pausedRemainingMs != null

  const compute = () => {
    if (isPaused) return Math.max(0, pausedRemainingMs)
    if (endsAt == null) return 0
    return Math.max(0, endsAt - Date.now())
  }

  const [msLeft, setMsLeft] = useState(compute)
  const raf = useRef(null)

  useEffect(() => {
    // Immediately sync when meeting state changes.
    setMsLeft(compute())

    if (isPaused || endsAt == null) return

    let cancelled = false
    const tick = () => {
      if (cancelled) return
      setMsLeft(Math.max(0, endsAt - Date.now()))
    }
    tick()
    const id = setInterval(tick, 250)

    const onVis = () => tick() // re-sync the instant we regain focus
    document.addEventListener('visibilitychange', onVis)

    return () => {
      cancelled = true
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endsAt, pausedRemainingMs])

  const secondsLeft = Math.ceil(msLeft / 1000)
  return {
    msLeft,
    secondsLeft,
    isPaused,
    isDone: !isPaused && endsAt != null && msLeft <= 0,
  }
}
