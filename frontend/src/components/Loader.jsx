import { motion } from 'framer-motion'

function Loader({ message = 'Loading...' }) {
  return (
    <div
      role="status"
      aria-label={message}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--background)',
        gap: 24,
      }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '3px solid var(--primary-subtle)',
          borderTop: '3px solid var(--primary)',
        }}
      />
      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontWeight: 500, margin: 0 }}
      >
        {message}
      </motion.p>
    </div>
  )
}

export default Loader
