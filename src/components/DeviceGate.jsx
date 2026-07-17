import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Backdrop } from './ui.jsx'
import Crewmate from './Crewmate.jsx'

// Crew Call is a single-device, pass-the-phone game — meant to be held in a
// hand, not clicked with a mouse. So it runs on phones and tablets only.
//
// Detection is by input capability, not screen size: a desktop/laptop has a
// fine pointer that can hover, while phones and tablets (including an iPad with
// a keyboard, which Safari still reports as touch) have a coarse pointer and
// can't hover. This is strict — a mouse-driven machine is blocked at any window
// size, with no bypass.
function detectDesktop() {
  if (typeof window === 'undefined' || typeof matchMedia !== 'function') return false
  return (
    matchMedia('(pointer: fine)').matches && matchMedia('(hover: hover)').matches
  )
}

function GateScreen({ host }) {
  return (
    <div className="relative grid h-full w-full place-items-center px-6 text-center">
      <Backdrop />
      {/* Slide only — opacity stays up so the message is never invisible if an
          animation is interrupted (this is the sole thing a desktop shows). */}
      <motion.div initial={{ y: 10 }} animate={{ y: 0 }} className="max-w-sm">
        <div className="mb-6 flex items-end justify-center gap-1">
          <Crewmate color="#FF6B6B" size={52} />
          <Crewmate color="#4DABF7" size={72} />
          <Crewmate color="#A9E34B" size={52} />
        </div>

        <p className="text-xs uppercase tracking-[0.4em] text-signal">
          Made for phones &amp; tablets
        </p>
        <h1 className="mt-2 font-display text-5xl tracking-wide text-vapor">
          CREW CALL
        </h1>
        <p className="mx-auto mt-3 text-vapor/60">
          It's a pass-the-phone party game — one device, held in hand and passed
          around the room. Open it on your phone or tablet to play.
        </p>

        {host && (
          <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-xl border border-strut bg-hull px-4 py-2.5">
            <span className="text-lg">📱</span>
            <span className="font-display tracking-wide text-vapor">{host}</span>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default function DeviceGate({ children }) {
  const [isDesktop, setIsDesktop] = useState(detectDesktop)

  // Pointer/hover can change if peripherals are plugged/unplugged — react live.
  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const mqs = [matchMedia('(pointer: fine)'), matchMedia('(hover: hover)')]
    const onChange = () => setIsDesktop(detectDesktop())
    mqs.forEach((mq) => mq.addEventListener?.('change', onChange))
    return () => mqs.forEach((mq) => mq.removeEventListener?.('change', onChange))
  }, [])

  if (isDesktop) {
    return <GateScreen host={typeof window !== 'undefined' ? window.location.host : ''} />
  }
  return children
}
