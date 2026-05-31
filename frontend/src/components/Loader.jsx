import { motion } from 'framer-motion'

function Loader({ message = 'Loading...' }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--background)',
      gap: 24,
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: '4px solid rgba(255,107,53,0.15)',
          borderTop: '4px solid var(--primary)',
        }}
      />
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ fontSize: 14, color: '#9ca3af', fontWeight: 500 }}>
        {message}
      </motion.div>
    </div>
  )
}

export default Loader