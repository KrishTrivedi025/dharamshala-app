import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../utils/api'

function Signup() {
  const { t } = useLanguage()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [focusedField, setFocusedField] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '', password: '', confirmPassword: '',
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
    setError('')
  }

  const validateStep1 = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Full name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email'
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
    else if (!/^[0-9]{10}$/.test(formData.phone)) newErrors.phone = 'Enter valid 10-digit number'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors = {}
    if (!formData.password) newErrors.password = 'Password is required'
    else if (formData.password.length < 6) newErrors.password = 'Minimum 6 characters'
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm password'
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => { if (validateStep1()) setStep(2) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep2()) return
    setLoading(true)
    setError('')
    try {
      const { confirmPassword: _cp, ...registerData } = formData
      const res = await authAPI.register(registerData)
      login(res.data.user, res.data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (field) => ({
    width: '100%', padding: '14px 16px', borderRadius: 14, boxSizing: 'border-box',
    border: `2px solid ${focusedField === field ? 'var(--primary)' : errors[field] ? '#ef4444' : '#ede8e0'}`,
    backgroundColor: focusedField === field ? 'rgba(255,107,53,0.03)' : '#fafafa',
    boxShadow: focusedField === field ? '0 0 0 4px rgba(255,107,53,0.1)' : 'none',
    outline: 'none', fontSize: 14, color: 'var(--text)', transition: 'all 0.25s ease',
  })

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
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}
            className="w-full max-w-xs text-center">
            <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: 90, lineHeight: 1, marginBottom: 24 }}>🛕</motion.div>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Join Our Samaj</h1>
            <p style={{ fontSize: 14, opacity: 0.65, marginBottom: 36, lineHeight: 1.6 }}>
              Create your account and start booking our beautiful hall for your special occasions
            </p>
            <div style={{ marginBottom: 32 }}>
              {[{ n: 1, label: 'Personal Info' }, { n: 2, label: 'Security' }].map((s, i) => (
                <motion.div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  marginBottom: 16, padding: '12px 16px', borderRadius: 14,
                  background: step >= s.n ? 'rgba(247,201,72,0.15)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${step >= s.n ? 'rgba(247,201,72,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  transition: 'all 0.3s ease',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 14, transition: 'all 0.3s ease',
                    background: step >= s.n ? '#F7C948' : 'rgba(255,255,255,0.15)',
                    color: step >= s.n ? '#2D2D2D' : 'white',
                  }}>
                    {step > s.n ? '✓' : s.n}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, opacity: step >= s.n ? 1 : 0.5, transition: 'all 0.3s ease' }}>
                    {s.label}
                  </span>
                </motion.div>
              ))}
            </div>
            {['✅ Easy hall booking', '✅ Real-time availability', '✅ Secure payments', '✅ Instant notifications'].map((b, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                style={{ fontSize: 13, opacity: 0.75, marginBottom: 8, textAlign: 'left' }}>
                {b}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-1/2 flex items-center justify-center" style={{ padding: '40px 24px' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }} style={{ width: '100%', maxWidth: 460 }}>

          {/* Progress bar */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>Step {step} of 2</span>
              <span style={{ fontSize: 13, color: '#9ca3af' }}>{step === 1 ? 'Personal Info' : 'Security Setup'}</span>
            </div>
            <div style={{ height: 6, backgroundColor: '#ede8e0', borderRadius: 99, overflow: 'hidden' }}>
              <motion.div animate={{ width: step === 1 ? '50%' : '100%' }} transition={{ duration: 0.5, ease: 'easeInOut' }}
                style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, var(--primary), var(--maroon))' }} />
            </div>
          </div>

          <div style={{
            borderRadius: 28, padding: '40px',
            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(24px)',
            border: '1.5px solid rgba(255,107,53,0.13)',
            boxShadow: '0 30px 80px rgba(139,26,26,0.13), 0 8px 24px rgba(0,0,0,0.06)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <motion.div animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
                style={{ fontSize: 48, marginBottom: 12 }}>
                {step === 1 ? '👤' : '🔐'}
              </motion.div>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--maroon)', marginBottom: 6 }}>
                {step === 1 ? t.auth.signup_title : 'Setup Password'}
              </h2>
              <p style={{ fontSize: 13, color: '#9ca3af' }}>
                {step === 1 ? t.auth.signup_subtitle : 'Secure your account'}
              </p>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '12px 16px', borderRadius: 12, marginBottom: 20,
                  background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.2)',
                  fontSize: 13, color: '#ef4444', fontWeight: 600,
                }}>
                ⚠ {error}
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div key="step1"
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>

                  {/* Full Name */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 7 }}>{t.auth.name}</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange}
                      placeholder="Enter your full name"
                      onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)}
                      style={inputStyle('name')} />
                    {errors.name && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 5 }}>⚠ {errors.name}</p>}
                  </div>

                  {/* Email */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 7 }}>{t.auth.email}</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange}
                      placeholder="you@example.com"
                      onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
                      style={inputStyle('email')} />
                    {errors.email && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 5 }}>⚠ {errors.email}</p>}
                  </div>

                  {/* Phone */}
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 7 }}>{t.auth.phone}</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{
                        padding: '14px', borderRadius: 14, border: '2px solid #ede8e0',
                        backgroundColor: '#f5f5f5', fontSize: 14, fontWeight: 700,
                        color: 'var(--text)', whiteSpace: 'nowrap',
                      }}>
                        🇮🇳 +91
                      </div>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                        placeholder="10-digit number" maxLength={10}
                        onFocus={() => setFocusedField('phone')} onBlur={() => setFocusedField(null)}
                        style={{ ...inputStyle('phone'), flex: 1 }} />
                    </div>
                    {errors.phone && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 5 }}>⚠ {errors.phone}</p>}
                  </div>

                  <motion.button type="button" onClick={handleNext}
                    whileHover={{ scale: 1.025, boxShadow: '0 16px 40px rgba(255,107,53,0.5)' }}
                    whileTap={{ scale: 0.975 }}
                    style={{
                      width: '100%', padding: '16px', borderRadius: 14, border: 'none',
                      cursor: 'pointer', fontSize: 16, fontWeight: 800, color: 'white',
                      background: 'linear-gradient(135deg, #FF6B35 0%, #c94a1a 50%, #8B1A1A 100%)',
                      boxShadow: '0 8px 24px rgba(255,107,53,0.4)',
                    }}>
                    Continue →
                  </motion.button>
                </motion.div>
              ) : (
                <motion.form key="step2" onSubmit={handleSubmit}
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>

                  {/* Address — OPTIONAL */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 7 }}>
                      Address <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>(optional)</span>
                    </label>
                    <textarea name="address" value={formData.address} onChange={handleChange}
                      placeholder="Enter your full address (optional)"
                      rows={3}
                      onFocus={() => setFocusedField('address')} onBlur={() => setFocusedField(null)}
                      style={{ ...inputStyle('address'), resize: 'none', lineHeight: 1.6 }} />
                  </div>

                  {/* Password */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 7 }}>{t.auth.password}</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showPassword ? 'text' : 'password'} name="password"
                        value={formData.password} onChange={handleChange} placeholder="Min. 6 characters"
                        onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
                        style={{ ...inputStyle('password'), paddingRight: 48 }} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af' }}>
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                    {errors.password && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 5 }}>⚠ {errors.password}</p>}
                  </div>

                  {/* Confirm Password */}
                  <div style={{ marginBottom: 28 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 7 }}>{t.auth.confirm_password}</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword"
                        value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter password"
                        onFocus={() => setFocusedField('confirmPassword')} onBlur={() => setFocusedField(null)}
                        style={{ ...inputStyle('confirmPassword'), paddingRight: 48 }} />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af' }}>
                        {showConfirmPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                    {errors.confirmPassword && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 5 }}>⚠ {errors.confirmPassword}</p>}
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <motion.button type="button" onClick={() => setStep(1)}
                      whileHover={{ scale: 1.025 }} whileTap={{ scale: 0.975 }}
                      style={{
                        flex: 1, padding: '16px', borderRadius: 14, border: '2px solid #ede8e0',
                        cursor: 'pointer', fontSize: 15, fontWeight: 700,
                        color: 'var(--text)', backgroundColor: 'white', transition: 'all 0.2s ease',
                      }}>
                      ← Back
                    </motion.button>
                    <motion.button type="submit"
                      whileHover={{ scale: 1.025, boxShadow: '0 16px 40px rgba(255,107,53,0.5)' }}
                      whileTap={{ scale: 0.975 }}
                      disabled={loading}
                      style={{
                        flex: 2, padding: '16px', borderRadius: 14, border: 'none',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: 16, fontWeight: 800, color: 'white',
                        background: loading ? '#9ca3af' : 'linear-gradient(135deg, #FF6B35 0%, #c94a1a 50%, #8B1A1A 100%)',
                        boxShadow: loading ? 'none' : '0 8px 24px rgba(255,107,53,0.4)',
                      }}>
                      {loading ? '⏳ Creating...' : `🎉 ${t.auth.signup_btn}`}
                    </motion.button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <p style={{ textAlign: 'center', fontSize: 14, color: '#6b7280', marginTop: 24 }}>
              {t.auth.have_account}{' '}
              <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
                {t.auth.login_btn} →
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Signup
