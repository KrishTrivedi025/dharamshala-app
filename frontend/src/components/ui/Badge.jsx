import { STATUS_COLORS } from '../../styles/theme'

// StatusBadge consolidates the STATUS_COLORS pattern from 4 files
export function StatusBadge({ status, style = {} }) {
  const colors = STATUS_COLORS[status?.toLowerCase()] ?? {
    bg: 'var(--neutral-100)',
    text: 'var(--text-secondary)',
    label: status ?? 'Unknown',
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 10px',
      borderRadius: 'var(--radius-full)',
      fontSize: 'var(--text-xs)',
      fontWeight: 600,
      letterSpacing: '0.02em',
      background: colors.bg,
      color: colors.text,
      whiteSpace: 'nowrap',
      ...style,
    }}>
      {colors.label}
    </span>
  )
}

// Generic badge for arbitrary labels
export default function Badge({ children, color, bg, style = {} }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 10px',
      borderRadius: 'var(--radius-full)',
      fontSize: 'var(--text-xs)',
      fontWeight: 600,
      letterSpacing: '0.02em',
      background: bg ?? 'var(--neutral-100)',
      color: color ?? 'var(--text-secondary)',
      whiteSpace: 'nowrap',
      ...style,
    }}>
      {children}
    </span>
  )
}
