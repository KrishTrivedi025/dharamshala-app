import { motion } from 'framer-motion'

export default function AuthLayout({ heading, subtitle, leftExtra, children }) {
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--background)' }}>

      {/* ── Left panel — desktop only ── */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1a0000 0%, #6b0f0f 45%, #c14f1a 100%)' }}
      >
        {/* Floating orbs */}
        <motion.div className="absolute rounded-full"
          style={{ width: 480, height: 480, top: '-12%', left: '-12%', background: 'rgba(247,201,72,0.06)' }}
          animate={{ scale: [1, 1.12, 1], rotate: [0, 360] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'linear' }} />
        <motion.div className="absolute rounded-full"
          style={{ width: 320, height: 320, bottom: '-8%', right: '-8%', background: 'rgba(255,107,53,0.09)' }}
          animate={{ scale: [1, 1.18, 1], rotate: [360, 0] }}
          transition={{ duration: 17, repeat: Infinity, ease: 'linear' }} />
        <motion.div className="absolute rounded-full"
          style={{ width: 180, height: 180, top: '42%', right: '6%', background: 'rgba(255,255,255,0.03)' }}
          animate={{ y: [-16, 16, -16] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 py-16 text-white">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="w-full max-w-xs text-center"
          >
            {/* Temple mark — culturally load-bearing, keep */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: 88, lineHeight: 1, marginBottom: 22 }}
            >
              🛕
            </motion.div>

            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 8, letterSpacing: '-0.3px' }}>
              {heading}
            </h1>
            <p style={{ fontSize: 'var(--text-sm)', opacity: 0.6, marginBottom: 36, lineHeight: 1.7 }}>
              {subtitle}
            </p>

            {leftExtra}
          </motion.div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div
        className="w-full lg:w-1/2 flex items-center justify-center"
        style={{ padding: '40px 24px' }}
      >
        {children}
      </div>
    </div>
  )
}
