import { useEffect } from 'react'

// Keep the screen awake while `active` (i.e. during a meeting) so the phone
// doesn't sleep mid-argument. Re-acquires on visibility regain because the
// lock is auto-released when the tab is hidden. Silently no-ops where
// navigator.wakeLock is unsupported (older iOS).
export function useWakeLock(active) {
  useEffect(() => {
    if (!active) return
    if (!('wakeLock' in navigator)) return

    let sentinel = null
    let released = false

    const acquire = async () => {
      try {
        sentinel = await navigator.wakeLock.request('screen')
      } catch {
        // User agent may reject (low battery, permissions) — ignore.
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !released) acquire()
    }

    acquire()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      released = true
      document.removeEventListener('visibilitychange', onVisibility)
      sentinel?.release?.().catch(() => {})
    }
  }, [active])
}
