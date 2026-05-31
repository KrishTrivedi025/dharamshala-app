import { motion, AnimatePresence } from 'framer-motion'

function RitualFloatingIcon({ ritualStatus, onClick }) {
  // Show only if user is logged in and hasn't paid
  if (!ritualStatus) return null
  const isPending = ritualStatus.isPending
  const hasPaid = ritualStatus.hasPaid
  const year = ritualStatus.year || new Date().getFullYear()

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0, x: 40 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        style={{
          position: 'fixed', bottom: 100, right: 24,
          zIndex: 8888, cursor: 'pointer', userSelect: 'none',
        }}
        onClick={onClick}
      >
        {/* Ripple rings (Only if not paid and not pending) */}
        {!isPending && !hasPaid && [1, 2, 3].map(i => (
          <motion.div
            key={i}
            animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }}
            style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'rgba(255,107,53,0.4)',
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Main button */}
        <motion.div
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.93 }}
          animate={
            !isPending && !hasPaid
              ? { boxShadow: ['0 0 0 0 rgba(255,107,53,0.5)', '0 0 0 16px rgba(255,107,53,0)', '0 0 0 0 rgba(255,107,53,0)'] }
              : {}
          }
          transition={!isPending && !hasPaid ? { duration: 2, repeat: Infinity } : {}}
          style={{
            width: 64, height: 64, borderRadius: '50%',
            background: hasPaid
              ? 'linear-gradient(135deg, #16a34a, #064e3b)'
              : isPending
                ? 'linear-gradient(135deg, #d97706, #92400e)'
                : 'linear-gradient(135deg, #FF6B35, #8B1A1A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28,
            boxShadow: hasPaid
              ? '0 8px 30px rgba(22,163,74,0.5)'
              : isPending
                ? '0 8px 30px rgba(217,119,6,0.5)'
                : '0 8px 30px rgba(255,107,53,0.55)',
            position: 'relative',
          }}
        >
          {hasPaid ? '📥' : isPending ? '⏳' : '🪔'}
        </motion.div>

        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            position: 'absolute', right: 74, top: '50%', transform: 'translateY(-50%)',
            background: hasPaid ? 'linear-gradient(135deg, #14532d, #064e3b)' : 'linear-gradient(135deg, #1a0000, #5a0e0e)',
            color: 'white', borderRadius: 12, padding: '8px 14px',
            whiteSpace: 'nowrap', pointerEvents: 'none',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800 }}>
            {hasPaid ? '📥 Download Receipt' : isPending ? '⏳ Cash Payment Pending' : `🪔 Annual Ritual ${year}`}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
            {hasPaid ? 'Payment confirmed' : isPending ? 'Awaiting admin approval' : 'Click to pay now'}
          </div>
          {/* Arrow */}
          <div style={{
            position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)',
            width: 0, height: 0,
            borderTop: '6px solid transparent', borderBottom: '6px solid transparent',
            borderLeft: `6px solid ${hasPaid ? '#064e3b' : '#5a0e0e'}`,
          }} />
        </motion.div>

        {/* Badge */}
        {!isPending && !hasPaid && (
          <div style={{
            position: 'absolute', top: 0, right: 0,
            width: 20, height: 20, borderRadius: '50%',
            background: '#ef4444', border: '2px solid white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 900, color: 'white',
          }}>!</div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default RitualFloatingIcon
