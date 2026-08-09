// Shared style-object constants built from CSS custom properties.
// Use these instead of hardcoding hex values in component files.
// For layout/responsive, prefer Tailwind classes. For color/shadow/radius,
// use these objects so there is one source of truth.

// ── Input ─────────────────────────────────────────────────────────────
export const inputStyle = (focused = false) => ({
  width: '100%',
  padding: '10px 14px',
  borderRadius: 'var(--radius-md)',
  border: `1.5px solid ${focused ? 'var(--primary)' : 'var(--border)'}`,
  boxShadow: focused ? '0 0 0 3px var(--primary-subtle)' : 'none',
  outline: 'none',
  fontSize: 'var(--text-base)',
  fontFamily: 'inherit',
  color: 'var(--text)',
  background: 'var(--surface-solid)',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  boxSizing: 'border-box',
})

// ── Card ──────────────────────────────────────────────────────────────
export const cardStyle = {
  borderRadius: 'var(--radius-xl)',
  padding: '28px',
  background: 'var(--surface)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.6)',
  boxShadow: 'var(--shadow-lg)',
}

export const cardStyleSolid = {
  borderRadius: 'var(--radius-xl)',
  padding: '28px',
  background: 'var(--surface-solid)',
  border: '1px solid var(--border)',
  boxShadow: 'var(--shadow-md)',
}

// ── Buttons ───────────────────────────────────────────────────────────
export const btnPrimary = {
  padding: '10px 22px',
  borderRadius: 'var(--radius-full)',
  border: 'none',
  cursor: 'pointer',
  fontSize: 'var(--text-base)',
  fontWeight: 600,
  color: '#ffffff',
  background: 'linear-gradient(135deg, var(--primary) 0%, var(--maroon) 100%)',
  boxShadow: '0 4px 14px var(--primary-border)',
  transition: 'transform 0.15s, box-shadow 0.15s',
  fontFamily: 'inherit',
}

export const btnSecondary = {
  padding: '10px 22px',
  borderRadius: 'var(--radius-full)',
  border: '1.5px solid var(--primary)',
  cursor: 'pointer',
  fontSize: 'var(--text-base)',
  fontWeight: 600,
  color: 'var(--primary)',
  background: 'transparent',
  transition: 'background 0.15s, transform 0.15s',
  fontFamily: 'inherit',
}

export const btnDanger = {
  padding: '10px 22px',
  borderRadius: 'var(--radius-full)',
  border: 'none',
  cursor: 'pointer',
  fontSize: 'var(--text-base)',
  fontWeight: 600,
  color: '#ffffff',
  background: 'var(--error)',
  transition: 'opacity 0.15s, transform 0.15s',
  fontFamily: 'inherit',
}

export const btnSmall = {
  padding: '6px 14px',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
  color: '#ffffff',
  background: 'linear-gradient(135deg, var(--primary) 0%, var(--maroon) 100%)',
  transition: 'transform 0.12s',
  fontFamily: 'inherit',
}

// ── Status / Semantic Colors ──────────────────────────────────────────
// Replaces the STATUS_COLORS object copy-pasted in 4 files.
export const STATUS_COLORS = {
  pending:   { bg: 'var(--warning-subtle)', text: 'var(--warning-text)', label: 'Pending' },
  approved:  { bg: 'var(--success-subtle)', text: 'var(--success-text)', label: 'Approved' },
  rejected:  { bg: 'var(--error-subtle)',   text: 'var(--error-text)',   label: 'Rejected' },
  completed: { bg: 'var(--success-subtle)', text: 'var(--success-text)', label: 'Completed' },
  cancelled: { bg: 'var(--error-subtle)',   text: 'var(--error-text)',   label: 'Cancelled' },
  locked:    { bg: 'var(--neutral-100)',    text: 'var(--text-secondary)', label: 'Locked' },
  credit:    { bg: 'var(--success-subtle)', text: 'var(--success-text)', label: 'Credit' },
  debit:     { bg: 'var(--error-subtle)',   text: 'var(--error-text)',   label: 'Debit' },
}

// ── Modal ─────────────────────────────────────────────────────────────
export const modalOverlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(26, 20, 16, 0.55)',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 'var(--z-modal)',
  padding: '16px',
}

export const modalContent = {
  background: 'var(--surface-solid)',
  borderRadius: 'var(--radius-xl)',
  boxShadow: '0 30px 80px rgba(0, 0, 0, 0.25)',
  width: '100%',
  maxWidth: '520px',
  maxHeight: '90vh',
  overflowY: 'auto',
  padding: '32px',
}

// ── Admin Card (compact) ──────────────────────────────────────────────
export const adminCardStyle = {
  borderRadius: 'var(--radius-lg)',
  padding: '20px 24px',
  background: 'var(--surface-solid)',
  border: '1px solid var(--border)',
  boxShadow: 'var(--shadow-sm)',
}
