import { motion } from 'framer-motion'

export default function Card({
  children,
  glass = true,
  padding = '28px',
  style = {},
  animate = false,
  className = '',
  ...props
}) {
  const base = glass
    ? {
        background: 'var(--surface)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        boxShadow: 'var(--shadow-lg)',
      }
    : {
        background: 'var(--surface-solid)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)',
      }

  const containerStyle = {
    ...base,
    borderRadius: 'var(--radius-xl)',
    padding,
    ...style,
  }

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className={className}
        style={containerStyle}
        {...props}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div className={className} style={containerStyle} {...props}>
      {children}
    </div>
  )
}
