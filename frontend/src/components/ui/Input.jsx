import { useState } from 'react'

export default function Input({
  label,
  error,
  type = 'text',
  style = {},
  containerStyle = {},
  ...props
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...containerStyle }}>
      {label && (
        <label style={{
          fontSize: 'var(--text-sm)',
          fontWeight: 600,
          color: error ? 'var(--error-text)' : 'var(--text)',
          letterSpacing: '0.01em',
        }}>
          {label}
        </label>
      )}
      <input
        type={type}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          border: `1.5px solid ${error ? 'var(--error)' : focused ? 'var(--primary)' : 'var(--border)'}`,
          boxShadow: error
            ? '0 0 0 3px var(--error-subtle)'
            : focused
            ? '0 0 0 3px var(--primary-subtle)'
            : 'none',
          outline: 'none',
          fontSize: 'var(--text-base)',
          fontFamily: 'inherit',
          color: 'var(--text)',
          background: 'var(--surface-solid)',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxSizing: 'border-box',
          ...style,
        }}
        {...props}
      />
      {error && (
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--error-text)' }}>
          {error}
        </span>
      )}
    </div>
  )
}
