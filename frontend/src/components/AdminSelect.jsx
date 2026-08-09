import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function CustomSelect({ value, onChange, options, minWidth = 120 }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef(null)
  const selected = options.find(o => String(o.value) === String(value))

  useEffect(() => {
    const handler = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div style={{ position: 'relative', minWidth }}>
      <button
        ref={btnRef}
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 10, padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
          border: `1.5px solid ${open ? 'var(--primary)' : 'var(--border)'}`,
          background: open ? 'var(--primary-subtle)' : 'white',
          fontSize: 13.5, fontWeight: 500, color: 'var(--text)',
          transition: 'all 0.18s ease', whiteSpace: 'nowrap',
          boxShadow: open ? '0 0 0 3px var(--primary-subtle)' : 'none',
        }}>
        <span>{selected?.label}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', opacity: 0.4, flexShrink: 0 }}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="var(--text)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0,
              minWidth: '100%', zIndex: 9999,
              background: 'white', borderRadius: 12, padding: '5px',
              maxHeight: 280, overflowY: 'auto',
              boxShadow: '0 8px 8px rgba(0,0,0,0.04), 0 16px 48px rgba(0,0,0,0.13)',
              border: '1px solid var(--border)',
            }}>
            {options.map(opt => {
              const active = String(opt.value) === String(value)
              return (
                <div key={opt.value}
                  onMouseDown={e => { e.preventDefault(); onChange(opt.value); setOpen(false) }}
                  style={{
                    padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                    fontSize: 13.5, fontWeight: active ? 700 : 400,
                    color: active ? 'var(--primary)' : 'var(--text)',
                    background: active ? 'var(--primary-subtle)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'background 0.1s ease',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--neutral-100)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <span>{opt.label}</span>
                  {active && (
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M2 6.5L5.5 10L11 3" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
