import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../utils/api'

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
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--background)' }}>

      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #2d0000 0%, #7a1010 45%, #d45a20 100%)' }}>
        <motion.div className="absolute rounded-full"
          style={{ width: 500, height: 500, top: '-15%', left: '-15%', background: 'rgba(247,201,72,0.07)' }}
          animate={{ scale: [1, 1.15, 1], rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} />
        <motion.div className="absolute rounded-full"
          style={{ width: 350, height: 350, bottom: '-10%', right: '-10%', background: 'rgba(255,107,53,0.1)' }}
          animate={{ scale: [1, 1.2, 1], rotate: [360, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }} />
        <motion.div className="absolute rounded-full"
          style={{ width: 200, height: 200, top: '40%', right: '5%', background: 'rgba(255,255,255,0.04)' }}
          animate={{ y: [-20, 20, -20] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 py-16 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
            className="w-full max-w-xs text-center">
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: 90, lineHeight: 1, marginBottom: 24 }}>
              🛕
            </motion.div>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.5px' }}>
              Dharamshala Booking
            </h1>
            <p style={{ fontSize: 14, opacity: 0.65, marginBottom: 36, lineHeight: 1.6 }}>
              Your trusted platform for hall bookings
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 28 }}>
              {[{ n: '100+', l: 'Members' }, { n: '50+', l: 'Events' }, { n: '5★', l: 'Rating' }].map((s, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.15 }} whileHover={{ y: -5, scale: 1.05 }}
                  style={{
                    borderRadius: 16, padding: '14px 8px',
                    background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#F7C948' }}>{s.n}</div>
                  <div style={{ fontSize: 11, opacity: 0.65, marginTop: 3 }}>{s.l}</div>
                </motion.div>
              ))}
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
              style={{
                borderRadius: 16, padding: '14px 16px', textAlign: 'left',
                background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}>
              <div style={{ fontSize: 11, opacity: 0.55, marginBottom: 5 }}>✨ Featured Event</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Annual Samaj Gathering 2025</div>
              <div style={{ fontSize: 12, opacity: 0.5, marginTop: 3 }}>Hall available for booking</div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-1/2 flex items-center justify-center" style={{ padding: '40px 24px' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          style={{ width: '100%', maxWidth: 440 }}>

          <div style={{
            borderRadius: 28, padding: '44px 40px',
            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(24px)',
            border: '1.5px solid rgba(255,107,53,0.13)',
            boxShadow: '0 30px 80px rgba(139,26,26,0.13), 0 8px 24px rgba(0,0,0,0.06)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
                style={{ fontSize: 52, marginBottom: 14 }}>
                🙏
              </motion.div>
              <h2 style={{ fontSize: 30, fontWeight: 800, color: 'var(--maroon)', marginBottom: 8 }}>
                {t.auth.login_title}
              </h2>
              <p style={{ fontSize: 14, color: '#9ca3af' }}>{t.auth.login_subtitle}</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '12px 16px', borderRadius: 12, marginBottom: 20,
                  background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.2)',
                  fontSize: 13, color: '#ef4444', fontWeight: 600,
                }}>
                ⚠ {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
                  {t.auth.email}
                </label>
                <input
                  type="email" name="email" value={formData.email}
                  onChange={handleChange} placeholder="you@example.com" required
                  onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: 14, boxSizing: 'border-box',
                    border: `2px solid ${focusedField === 'email' ? 'var(--primary)' : '#ede8e0'}`,
                    backgroundColor: focusedField === 'email' ? 'rgba(255,107,53,0.03)' : '#fafafa',
                    boxShadow: focusedField === 'email' ? '0 0 0 4px rgba(255,107,53,0.1)' : 'none',
                    outline: 'none', fontSize: 14, color: 'var(--text)', transition: 'all 0.25s ease',
                  }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
                  {t.auth.password}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'} name="password"
                    value={formData.password} onChange={handleChange}
                    placeholder="Enter your password" required
                    onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
                    style={{
                      width: '100%', padding: '14px 48px 14px 16px', borderRadius: 14, boxSizing: 'border-box',
                      border: `2px solid ${focusedField === 'password' ? 'var(--primary)' : '#ede8e0'}`,
                      backgroundColor: focusedField === 'password' ? 'rgba(255,107,53,0.03)' : '#fafafa',
                      boxShadow: focusedField === 'password' ? '0 0 0 4px rgba(255,107,53,0.1)' : 'none',
                      outline: 'none', fontSize: 14, color: 'var(--text)', transition: 'all 0.25s ease',
                    }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af' }}>
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div style={{ textAlign: 'right', marginBottom: 28 }}>
                <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>
                  Forgot Password?
                </button>
              </div>

              <motion.button
                whileHover={{ scale: 1.025, boxShadow: '0 16px 40px rgba(255,107,53,0.5)' }}
                whileTap={{ scale: 0.975 }}
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '16px', borderRadius: 14, border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer', fontSize: 16, fontWeight: 800,
                  color: 'white', marginBottom: 24,
                  background: loading
                    ? '#9ca3af'
                    : 'linear-gradient(135deg, #FF6B35 0%, #c94a1a 50%, #8B1A1A 100%)',
                  boxShadow: loading ? 'none' : '0 8px 24px rgba(255,107,53,0.4)',
                  transition: 'all 0.3s ease',
                }}>
                {loading ? '⏳ Logging in...' : `✨ ${t.auth.login_btn}`}
              </motion.button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ flex: 1, height: 1, backgroundColor: '#ede8e0' }} />
                <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>OR</span>
                <div style={{ flex: 1, height: 1, backgroundColor: '#ede8e0' }} />
              </div>

              <p style={{ textAlign: 'center', fontSize: 14, color: '#6b7280' }}>
                {t.auth.no_account}{' '}
                <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
                  {t.auth.signup_btn} →
                </Link>
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Login