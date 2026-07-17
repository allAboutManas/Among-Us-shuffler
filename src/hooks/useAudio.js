import { useCallback, useEffect, useRef } from 'react'

// Synthesized cues via Web Audio — no audio files, works in airplane mode.
//
// iOS requires an AudioContext to be created/resumed from a user gesture, so
// we lazily create it and resume on the first interaction. All cues respect
// the `muted` flag.
export function useAudio(muted) {
  const ctxRef = useRef(null)

  const getCtx = useCallback(() => {
    if (typeof window === 'undefined') return null
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    if (!ctxRef.current) ctxRef.current = new AC()
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume?.()
    return ctxRef.current
  }, [])

  // Prime the context on the first pointer/key event (satisfies autoplay
  // policy) so later cues actually make sound.
  useEffect(() => {
    const prime = () => getCtx()
    window.addEventListener('pointerdown', prime, { once: true })
    window.addEventListener('keydown', prime, { once: true })
    return () => {
      window.removeEventListener('pointerdown', prime)
      window.removeEventListener('keydown', prime)
    }
  }, [getCtx])

  // One beep. gain envelope avoids clicks.
  const blip = useCallback(
    (freq, duration = 0.12, type = 'sine', gain = 0.14) => {
      if (muted) return
      const ctx = getCtx()
      if (!ctx) return
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, now)
      g.gain.setValueAtTime(0.0001, now)
      g.gain.exponentialRampToValueAtTime(gain, now + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, now + duration)
      osc.connect(g).connect(ctx.destination)
      osc.start(now)
      osc.stop(now + duration + 0.02)
    },
    [muted, getCtx],
  )

  const tick = useCallback(() => blip(660, 0.06, 'triangle', 0.08), [blip])
  const beep = useCallback(() => blip(880, 0.12, 'square', 0.12), [blip])

  // A distinct, urgent alarm: a short two-tone warble repeated.
  const alarm = useCallback(() => {
    if (muted) return
    const ctx = getCtx()
    if (!ctx) return
    const now = ctx.currentTime
    ;[0, 0.18, 0.36, 0.54].forEach((t, i) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(i % 2 ? 520 : 780, now + t)
      g.gain.setValueAtTime(0.0001, now + t)
      g.gain.exponentialRampToValueAtTime(0.2, now + t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.16)
      osc.connect(g).connect(ctx.destination)
      osc.start(now + t)
      osc.stop(now + t + 0.18)
    })
  }, [muted, getCtx])

  return { tick, beep, alarm }
}
