import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeSlash, WarningCircle, CircleNotch, ArrowRight } from '@phosphor-icons/react'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../utils/api'
import AuthLayout from '../components/AuthLayout'

const inputBase = (focused, hasError) => ({
  width: '100%',
  padding: '13px 16px',
  borderRadius: 'var(--radius-md)',
  boxSizing: 'border-box',
  border: `1.5px solid ${hasError ? 'var(--error)' : focused ? 'var(--primary)' : 'var(--border)'}`,
  background: focused ? 'var(--primary-subtle)' : 'var(--surface-solid)',
  boxShadow: hasError
    ? '0 0 0 3px var(--error-subtle)'
    : focused
    ? '0 0 0 3px var(--primary-subtle)'
    : 'none',
  outline: 'none',
  fontSize: 'var(--text-base)',
  color: 'var(--text)',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
})

const leftExtra = (
  <div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
      {[{ n: '100+', l: 'Members' }, { n: '50+', l: 'Events' }, { n: '5★', l: 'Rating' }].map((s, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + i * 0.12, ease: [0.4, 0, 0.2, 1] }}
          whileHover={{ y: -4, scale: 1.04 }}
          style={{
            borderRadius: 'var(--radius-md)',
            padding: '14px 8px',
            background: 'rgba(255,255,255,0.09)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--secondary)' }}>{s.n}</div>
          <div style={{ fontSize: 'var(--text-xs)', opacity: 0.6, marginTop: 3 }}>{s.l}</div>
        </motion.div>
      ))}
    </div>

    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 }}
      style={{
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px',
        textAlign: 'left',
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div style={{ fontSize: 'var(--text-xs)', opacity: 0.5, marginBottom: 5, letterSpacing: '0.5px' }}>
        FEATURED EVENT
      </div>
      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>Annual Samaj Gathering 2025</div>
      <div style={{ fontSize: 'var(--text-xs)', opacity: 0.5, marginTop: 3 }}>Hall available for booking</div>
    </motion.div>
  </div>
)

function Login() {
  const { t } = useLanguage()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await authAPI.login(formData)
      login(res.data.user, res.data.token)
      if (res.data.user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      heading="Dharamshala Booking"
      subtitle="Your trusted platform for community hall bookings"
      leftExtra={leftExtra}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        style={{ width: '100%', maxWidth: 420 }}
      >
        {/* Card */}
        <div style={{
          borderRadius: 'var(--radius-xl)',
          padding: '40px 36px',
          background: 'var(--surface-solid)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-xl)',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 6 }}
              style={{ fontSize: 48, marginBottom: 14, display: 'block' }}
            >
              🙏
            </motion.div>
            <h2 style={{
              fontSize: 'var(--text-3xl)', fontWeight: 800,
              color: 'var(--maroon)', marginBottom: 6, letterSpacing: '-0.3px',
            }}>
              {t.auth.login_title}
            </h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              {t.auth.login_subtitle}
            </p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '11px 14px', borderRadius: 'var(--radius-md)', marginBottom: 20,
                background: 'var(--error-subtle)',
                border: '1px solid var(--error)',
                fontSize: 'var(--text-sm)', color: 'var(--error-text)', fontWeight: 500,
              }}
            >
              <WarningCircle size={16} weight="fill" style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 18 }}>
              <label style={{
                display: 'block', fontSize: 'var(--text-sm)',
                fontWeight: 600, color: 'var(--text)', marginBottom: 7,
              }}>
                {t.auth.email}
              </label>
              <input
                type="email" name="email" value={formData.email}
                onChange={handleChange} placeholder="you@example.com" required
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                style={inputBase(focusedField === 'email', false)}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 12 }}>
              <label style={{
                display: 'block', fontSize: 'var(--text-sm)',
                fontWeight: 600, color: 'var(--text)', marginBottom: 7,
              }}>
                {t.auth.password}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'} name="password"
                  value={formData.password} onChange={handleChange}
                  placeholder="Enter your password" required
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  style={{ ...inputBase(focusedField === 'password', false), paddingRight: 46 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 2,
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword
                    ? <EyeSlash size={18} weight="regular" />
                    : <Eye size={18} weight="regular" />}
                </button>
              </div>
            </div>

            {/* Forgot */}
            <div style={{ textAlign: 'right', marginBottom: 26 }}>
              <button
                type="button"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--primary)',
                  fontFamily: 'inherit',
                }}
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit */}
            <motion.button
              whileHover={loading ? {} : { scale: 1.02, boxShadow: '0 12px 32px var(--primary-border)' }}
              whileTap={loading ? {} : { scale: 0.98 }}
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px',
                borderRadius: 'var(--radius-full)', border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 'var(--text-md)', fontWeight: 700,
                color: 'white', marginBottom: 22,
                background: loading
                  ? 'var(--neutral-400)'
                  : 'linear-gradient(135deg, var(--primary) 0%, var(--maroon) 100%)',
                boxShadow: loading ? 'none' : '0 6px 20px var(--primary-border)',
                transition: 'box-shadow 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: 'inherit',
              }}
            >
              {loading ? (
                <>
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}>
                    <CircleNotch size={17} weight="bold" />
                  </motion.span>
                  Logging in…
                </>
              ) : (
                <>
                  {t.auth.login_btn}
                  <ArrowRight size={16} weight="bold" />
                </>
              )}
            </motion.button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>OR</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              {t.auth.no_account}{' '}
              <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
                {t.auth.signup_btn}
              </Link>
            </p>
          </form>
        </div>
      </motion.div>
    </AuthLayout>
  )
}

export default Login
