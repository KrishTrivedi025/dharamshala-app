import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye, EyeSlash, WarningCircle, CircleNotch,
  ArrowRight, ArrowLeft, CheckCircle, User, Lock,
} from '@phosphor-icons/react'
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

const BENEFITS = [
  'Easy hall booking in minutes',
  'Real-time availability calendar',
  'Secure payments & receipts',
  'Instant booking notifications',
]

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

  const leftExtra = (
    <div>
      {/* Step indicators */}
      <div style={{ marginBottom: 28 }}>
        {[{ n: 1, label: 'Personal Info', icon: <User size={14} weight="bold" /> },
          { n: 2, label: 'Security Setup', icon: <Lock size={14} weight="bold" /> }].map((s) => (
          <motion.div
            key={s.n}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              marginBottom: 12, padding: '11px 14px', borderRadius: 'var(--radius-md)',
              background: step >= s.n ? 'rgba(247,201,72,0.13)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${step >= s.n ? 'rgba(247,201,72,0.28)' : 'rgba(255,255,255,0.09)'}`,
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 'var(--text-sm)',
              background: step > s.n ? 'var(--secondary)' : step === s.n ? 'var(--secondary)' : 'rgba(255,255,255,0.12)',
              color: step >= s.n ? '#2D2D2D' : 'white',
              transition: 'all 0.3s ease',
            }}>
              {step > s.n ? <CheckCircle size={16} weight="fill" /> : s.icon}
            </div>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, opacity: step >= s.n ? 1 : 0.45, transition: 'opacity 0.3s' }}>
              {s.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Benefits */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {BENEFITS.map((b, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 + i * 0.1, ease: [0.4, 0, 0.2, 1] }}
            style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 'var(--text-sm)', opacity: 0.75 }}
          >
            <CheckCircle size={14} weight="fill" style={{ color: 'var(--secondary)', flexShrink: 0 }} />
            {b}
          </motion.div>
        ))}
      </div>
    </div>
  )

  return (
    <AuthLayout
      heading="Join Our Samaj"
      subtitle="Create your account and start booking our beautiful hall"
      leftExtra={leftExtra}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        style={{ width: '100%', maxWidth: 440 }}
      >
        {/* Progress bar */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--primary)' }}>
              Step {step} of 2
            </span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              {step === 1 ? 'Personal Info' : 'Security Setup'}
            </span>
          </div>
          <div style={{ height: 5, background: 'var(--neutral-200)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            <motion.div
              animate={{ width: step === 1 ? '50%' : '100%' }}
              transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
              style={{
                height: '100%', borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(90deg, var(--primary), var(--maroon))',
              }}
            />
          </div>
        </div>

        {/* Card */}
        <div style={{
          borderRadius: 'var(--radius-xl)',
          padding: '36px',
          background: 'var(--surface-solid)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-xl)',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 'var(--radius-md)',
              background: 'var(--primary-subtle)',
              border: '1px solid var(--primary-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px', color: 'var(--primary)',
            }}>
              {step === 1
                ? <User size={24} weight="duotone" />
                : <Lock size={24} weight="duotone" />}
            </div>
            <h2 style={{
              fontSize: 'var(--text-2xl)', fontWeight: 800,
              color: 'var(--maroon)', marginBottom: 5, letterSpacing: '-0.2px',
            }}>
              {step === 1 ? t.auth.signup_title : 'Setup Password'}
            </h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              {step === 1 ? t.auth.signup_subtitle : 'Secure your account'}
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
                padding: '11px 14px', borderRadius: 'var(--radius-md)', marginBottom: 18,
                background: 'var(--error-subtle)', border: '1px solid var(--error)',
                fontSize: 'var(--text-sm)', color: 'var(--error-text)', fontWeight: 500,
              }}
            >
              <WarningCircle size={16} weight="fill" style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div key="step1"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              >
                {/* Full Name */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)', marginBottom: 7 }}>
                    {t.auth.name}
                  </label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange}
                    placeholder="Enter your full name"
                    onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)}
                    style={inputBase(focusedField === 'name', !!errors.name)} />
                  {errors.name && (
                    <p style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-xs)', color: 'var(--error-text)', marginTop: 5 }}>
                      <WarningCircle size={12} weight="fill" /> {errors.name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)', marginBottom: 7 }}>
                    {t.auth.email}
                  </label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange}
                    placeholder="you@example.com"
                    onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
                    style={inputBase(focusedField === 'email', !!errors.email)} />
                  {errors.email && (
                    <p style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-xs)', color: 'var(--error-text)', marginTop: 5 }}>
                      <WarningCircle size={12} weight="fill" /> {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)', marginBottom: 7 }}>
                    {t.auth.phone}
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{
                      padding: '13px 12px', borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--border)', background: 'var(--neutral-100)',
                      fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap',
                    }}>
                      🇮🇳 +91
                    </div>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                      placeholder="10-digit number" maxLength={10}
                      onFocus={() => setFocusedField('phone')} onBlur={() => setFocusedField(null)}
                      style={{ ...inputBase(focusedField === 'phone', !!errors.phone), flex: 1 }} />
                  </div>
                  {errors.phone && (
                    <p style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-xs)', color: 'var(--error-text)', marginTop: 5 }}>
                      <WarningCircle size={12} weight="fill" /> {errors.phone}
                    </p>
                  )}
                </div>

                <motion.button type="button" onClick={handleNext}
                  whileHover={{ scale: 1.02, boxShadow: '0 12px 28px var(--primary-border)' }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 'var(--radius-full)', border: 'none',
                    cursor: 'pointer', fontSize: 'var(--text-md)', fontWeight: 700, color: 'white',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--maroon) 100%)',
                    boxShadow: '0 6px 20px var(--primary-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontFamily: 'inherit',
                  }}>
                  Continue
                  <ArrowRight size={16} weight="bold" />
                </motion.button>
              </motion.div>
            ) : (
              <motion.form key="step2" onSubmit={handleSubmit}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              >
                {/* Address */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)', marginBottom: 7 }}>
                    Address{' '}
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <textarea name="address" value={formData.address} onChange={handleChange}
                    placeholder="Enter your full address" rows={2}
                    onFocus={() => setFocusedField('address')} onBlur={() => setFocusedField(null)}
                    style={{ ...inputBase(focusedField === 'address', false), resize: 'none', lineHeight: 1.6 }} />
                </div>

                {/* Password */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)', marginBottom: 7 }}>
                    {t.auth.password}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} name="password"
                      value={formData.password} onChange={handleChange} placeholder="Min. 6 characters"
                      onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
                      style={{ ...inputBase(focusedField === 'password', !!errors.password), paddingRight: 46 }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 2 }}>
                      {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-xs)', color: 'var(--error-text)', marginTop: 5 }}>
                      <WarningCircle size={12} weight="fill" /> {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div style={{ marginBottom: 26 }}>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)', marginBottom: 7 }}>
                    {t.auth.confirm_password}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword"
                      value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter password"
                      onFocus={() => setFocusedField('confirmPassword')} onBlur={() => setFocusedField(null)}
                      style={{ ...inputBase(focusedField === 'confirmPassword', !!errors.confirmPassword), paddingRight: 46 }} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 2 }}>
                      {showConfirmPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-xs)', color: 'var(--error-text)', marginTop: 5 }}>
                      <WarningCircle size={12} weight="fill" /> {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <motion.button type="button" onClick={() => setStep(1)}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    style={{
                      flex: 1, padding: '14px', borderRadius: 'var(--radius-full)',
                      border: '1.5px solid var(--border)', cursor: 'pointer',
                      fontSize: 'var(--text-base)', fontWeight: 600,
                      color: 'var(--text-secondary)', background: 'var(--surface-solid)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      fontFamily: 'inherit',
                    }}>
                    <ArrowLeft size={15} weight="bold" />
                    Back
                  </motion.button>
                  <motion.button type="submit"
                    whileHover={loading ? {} : { scale: 1.02, boxShadow: '0 12px 28px var(--primary-border)' }}
                    whileTap={loading ? {} : { scale: 0.98 }}
                    disabled={loading}
                    style={{
                      flex: 2, padding: '14px', borderRadius: 'var(--radius-full)', border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: 'var(--text-base)', fontWeight: 700, color: 'white',
                      background: loading ? 'var(--neutral-400)' : 'linear-gradient(135deg, var(--primary) 0%, var(--maroon) 100%)',
                      boxShadow: loading ? 'none' : '0 6px 20px var(--primary-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      fontFamily: 'inherit',
                    }}>
                    {loading ? (
                      <>
                        <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}>
                          <CircleNotch size={16} weight="bold" />
                        </motion.span>
                        Creating…
                      </>
                    ) : (
                      <>
                        {t.auth.signup_btn}
                        <ArrowRight size={15} weight="bold" />
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 22 }}>
            {t.auth.have_account}{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
              {t.auth.login_btn}
            </Link>
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  )
}

export default Signup
