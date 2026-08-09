import { motion } from 'framer-motion'

const variants = {
  primary: {
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--maroon) 100%)',
    color: '#ffffff',
    border: 'none',
    boxShadow: '0 4px 14px var(--primary-border)',
  },
  secondary: {
    background: 'transparent',
    color: 'var(--primary)',
    border: '1.5px solid var(--primary)',
    boxShadow: 'none',
  },
  ghost: {
    background: 'var(--primary-subtle)',
    color: 'var(--primary)',
    border: '1px solid var(--primary-border)',
    boxShadow: 'none',
  },
  danger: {
    background: 'var(--error)',
    color: '#ffffff',
    border: 'none',
    boxShadow: 'none',
  },
  neutral: {
    background: 'var(--neutral-100)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
    boxShadow: 'none',
  },
}

const sizes = {
  sm: { padding: '6px 14px', fontSize: 'var(--text-sm)', borderRadius: 'var(--radius-md)' },
  md: { padding: '10px 22px', fontSize: 'var(--text-base)', borderRadius: 'var(--radius-full)' },
  lg: { padding: '13px 28px', fontSize: 'var(--text-md)', borderRadius: 'var(--radius-full)' },
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  style = {},
  className = '',
  ...props
}) {
  const v = variants[variant] ?? variants.primary
  const s = sizes[size] ?? sizes.md

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.03 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
      className={className}
      style={{
        ...v,
        ...s,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        fontWeight: 600,
        fontFamily: 'inherit',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        transition: 'box-shadow 0.15s',
        ...style,
      }}
      {...props}
    >
      {children}
    </motion.button>
  )
}
