import { motion } from 'framer-motion'

export function ButtonSpinner({ light = true, size = 13 }) {
  const track = light ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.12)'
  const head  = light ? 'white' : 'var(--text-secondary)'
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${track}`,
        borderTop: `2px solid ${head}`,
      }}
    />
  )
}
