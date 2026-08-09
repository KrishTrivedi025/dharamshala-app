import { motion, AnimatePresence } from 'framer-motion'
import { DownloadSimple, Hourglass } from '@phosphor-icons/react'

function RitualFloatingIcon({ ritualStatus, onClick }) {
  if (!ritualStatus) return null
  const { isPending, hasPaid, year = new Date().getFullYear() } = ritualStatus

  const bgGradient = hasPaid
    ? 'linear-gradient(135deg, var(--success), #064e3b)'
    : isPending
    ? 'linear-gradient(135deg, var(--warning), #92400e)'
    : 'linear-gradient(135deg, var(--primary), var(--maroon))'

  const shadow = hasPaid
    ? '0 8px 28px rgba(22,163,74,0.5)'
    : isPending
    ? '0 8px 28px rgba(217,119,6,0.5)'
    : '0 8px 28px rgba(255,107,53,0.55)'

  const tooltipBg = hasPaid
    ? 'linear-gradient(135deg, #14532d, #064e3b)'
    : 'linear-gradient(135deg, #1a0000, #5a0e0e)'

  const tooltipArrow = hasPaid ? '#064e3b' : '#5a0e0e'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0, x: 40 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        style={{
          position: 'fixed', bottom: 100, right: 24,
          zIndex: 'var(--z-floating-cta)', cursor: 'pointer', userSelect: 'none',
        }}
        onClick={onClick}
      >
        {/* Ripple rings — only when unpaid and not pending */}
        {!isPending && !hasPaid && [1, 2, 3].map(i => (
          <motion.div key={i}
            animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }}
            style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'rgba(255,107,53,0.4)', pointerEvents: 'none',
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
            width: 62, height: 62, borderRadius: '50%',
            background: bgGradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: shadow, position: 'relative',
          }}
        >
          {hasPaid
            ? <DownloadSimple size={26} weight="bold" color="white" />
            : isPending
            ? <Hourglass size={26} weight="duotone" color="white" />
            : <span style={{ fontSize: 26 }}>🪔</span>}
        </motion.div>

        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            position: 'absolute', right: 72, top: '50%', transform: 'translateY(-50%)',
            background: tooltipBg, color: 'white',
            borderRadius: 'var(--radius-md)', padding: '8px 13px',
            whiteSpace: 'nowrap', pointerEvents: 'none',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          }}
        >
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800 }}>
            {hasPaid ? 'Download Receipt' : isPending ? 'Cash Payment Pending' : `Annual Ritual ${year}`}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
            {hasPaid ? 'Payment confirmed' : isPending ? 'Awaiting admin approval' : 'Click to pay now — 🪔'}
          </div>
          <div style={{
            position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)',
            width: 0, height: 0,
            borderTop: '6px solid transparent', borderBottom: '6px solid transparent',
            borderLeft: `6px solid ${tooltipArrow}`,
          }} />
        </motion.div>

        {/* Urgent badge */}
        {!isPending && !hasPaid && (
          <div style={{
            position: 'absolute', top: 0, right: 0,
            width: 20, height: 20, borderRadius: '50%',
            background: 'var(--error)', border: '2px solid var(--surface-solid)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'var(--text-xs)', fontWeight: 900, color: 'white',
          }}>!</div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default RitualFloatingIcon
