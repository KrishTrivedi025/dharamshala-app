import { motion } from 'framer-motion'
import { CheckCircle } from '@phosphor-icons/react'

const STEPS = ['Submitted', 'Under Review', 'Payment Received']

// Horizontal 3-dot progress indicator for the Annual Ritual cash-payment flow.
// `step` is the currently-active step (1-3); steps before it read as done,
// steps after it read as upcoming. Both call sites today render step={2}
// (submitted, awaiting admin confirmation) — written generically so all three
// states render correctly if ever needed.
//
// `dark` switches the palette for use on the Dashboard's dark amber banner —
// the default palette assumes a light/white card (e.g. RitualPaymentModal),
// where var(--text-muted)/var(--border) are too low-contrast against a dark
// gradient background.
function RitualProgressSteps({ step = 2, dark = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', width: '100%' }}>
      {STEPS.map((label, i) => {
        const idx = i + 1
        const state = idx < step ? 'done' : idx === step ? 'active' : 'upcoming'
        const isLast = idx === STEPS.length

        const dotBg = state === 'done' ? 'var(--success)'
          : state === 'active' ? (dark ? 'var(--secondary)' : 'var(--warning)')
          : 'transparent'
        const dotBorder = state === 'done' ? 'var(--success)'
          : state === 'active' ? (dark ? 'var(--secondary)' : 'var(--warning)')
          : (dark ? 'rgba(255,255,255,0.45)' : 'var(--border)')
        const dotText = state === 'upcoming' ? (dark ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)')
          : state === 'active' && dark ? 'var(--maroon)'
          : 'white'
        const labelColor = state === 'upcoming' ? (dark ? 'rgba(255,255,255,0.55)' : 'var(--text-muted)')
          : dark ? 'white'
          : state === 'active' ? 'var(--warning-text)' : 'var(--success-text)'
        const lineColor = idx < step ? 'var(--success)' : (dark ? 'rgba(255,255,255,0.25)' : 'var(--border)')

        return (
          <div key={label} style={{ display: 'flex', alignItems: 'flex-start', flex: isLast ? '0 0 auto' : 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 84 }}>
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.12, duration: 0.3 }}
                style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  background: dotBg, border: `2px solid ${dotBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: dotText,
                }}
              >
                {state === 'done' ? <CheckCircle size={13} weight="fill" /> : idx}
              </motion.div>
              <span style={{ fontSize: 10, fontWeight: 700, marginTop: 5, textAlign: 'center', lineHeight: 1.25, color: labelColor }}>
                {label}
              </span>
            </div>
            {!isLast && (
              <div style={{ flex: 1, height: 2, marginTop: 11, minWidth: 16, background: lineColor }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default RitualProgressSteps
