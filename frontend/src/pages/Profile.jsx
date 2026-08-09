import { useState } from 'react'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { authAPI } from '../utils/api'

function Profile() {
  const { user, updateUser } = useAuth()
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('profile')
  const [editing, setEditing] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false, new: false, confirm: false,
  })
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState(null)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState(null)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value })
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setSaveMsg(null)
      const res = await authAPI.updateProfile(formData)
      updateUser({ ...user, ...res.data })
      setEditing(false)
      setSaveMsg({ type: 'success', text: t.profile.update_success })
      setTimeout(() => setSaveMsg(null), 3000)
    } catch (err) {
      setSaveMsg({ type: 'error', text: err.message || 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSubmit = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPwMsg({ type: 'error', text: 'New passwords do not match' })
      return
    }
    if (passwordData.newPassword.length < 6) {
      setPwMsg({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }
    try {
      setPwSaving(true)
      setPwMsg(null)
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })
      setPwMsg({ type: 'success', text: t.profile.password_success })
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setPwMsg(null), 3000)
    } catch (err) {
      setPwMsg({ type: 'error', text: err.message || 'Failed to change password' })
    } finally {
      setPwSaving(false)
    }
  }

  const inputStyle = (field) => ({
    width: '100%',
    padding: '13px 16px',
    borderRadius: 13,
    border: `2px solid ${focusedField === field ? 'var(--primary)' : '#ede8e0'}`,
    backgroundColor: focusedField === field ? 'rgba(255,107,53,0.03)' : '#fafafa',
    boxShadow: focusedField === field ? '0 0 0 4px rgba(255,107,53,0.08)' : 'none',
    outline: 'none',
    fontSize: 14,
    color: 'var(--text)',
    transition: 'all 0.25s ease',
    boxSizing: 'border-box',
    opacity: (!editing && activeTab === 'profile') ? 0.7 : 1,
  })

  const tabs = [
    { key: 'profile',  label: `👤 ${t.profile.tab_profile}` },
    { key: 'password', label: `🔐 ${t.profile.tab_password}` },
  ]

  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a0000 0%, #5a0e0e 50%, #c94a1a 100%)',
        padding: '48px 32px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute', top: -60, right: -60,
            width: 220, height: 220, borderRadius: '50%',
            background: 'rgba(247,201,72,0.06)',
          }}
        />
        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 800, color: 'white',
              border: '2px solid rgba(255,255,255,0.25)',
              flexShrink: 0,
            }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : '👤'}
            </div>
            <div>
              <h1 style={{ fontSize: 'clamp(22px, 2.5vw, 30px)', fontWeight: 900, color: 'white', marginBottom: 6 }}>
                {user?.name || 'Member'}
              </h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>
                {user?.email || ''}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 32px' }}>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            display: 'flex', gap: 10, marginBottom: 28,
            borderRadius: 14, padding: 6,
            background: 'rgba(255,255,255,0.92)',
            border: '1.5px solid rgba(255,107,53,0.08)',
            boxShadow: '0 4px 20px rgba(139,26,26,0.06)',
            width: 'fit-content',
          }}>
          {tabs.map((tab) => (
            <motion.button
              key={tab.key}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setActiveTab(tab.key); setEditing(false) }}
              style={{
                padding: '10px 22px', borderRadius: 10, border: 'none',
                cursor: 'pointer', fontSize: 14, fontWeight: 700,
                transition: 'all 0.25s ease',
                background: activeTab === tab.key
                  ? 'linear-gradient(135deg, #FF6B35, #8B1A1A)'
                  : 'transparent',
                color: activeTab === tab.key ? 'white' : '#9ca3af',
                boxShadow: activeTab === tab.key ? '0 4px 12px rgba(255,107,53,0.3)' : 'none',
              }}>
              {tab.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              borderRadius: 24, padding: '32px',
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(255,107,53,0.08)',
              boxShadow: '0 4px 20px rgba(139,26,26,0.06)',
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--maroon)' }}>
                {t.profile.tab_profile}
              </h3>
              {!editing ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setEditing(true)}
                  style={{
                    padding: '9px 20px', borderRadius: 11,
                    border: '1.5px solid rgba(255,107,53,0.3)',
                    cursor: 'pointer', fontSize: 13, fontWeight: 700,
                    color: 'var(--primary)', background: 'transparent',
                  }}>
                  ✏️ {t.profile.edit}
                </motion.button>
              ) : (
                <div style={{ display: 'flex', gap: 10 }}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setEditing(false)}
                    style={{
                      padding: '9px 20px', borderRadius: 11,
                      border: '1.5px solid #ede8e0',
                      cursor: 'pointer', fontSize: 13, fontWeight: 700,
                      color: '#6b7280', background: 'transparent',
                    }}>
                    {t.profile.cancel}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 8px 20px rgba(255,107,53,0.4)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      padding: '9px 20px', borderRadius: 11, border: 'none',
                      cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'white',
                      background: saving ? '#ccc' : 'linear-gradient(135deg, #FF6B35, #8B1A1A)',
                    }}>
                    {saving ? t.profile.saving : t.profile.save}
                  </motion.button>
                </div>
              )}
            </div>

            {saveMsg && (
              <div style={{
                margin: '0 0 20px',
                padding: '10px 14px', borderRadius: 10,
                background: saveMsg.type === 'success' ? 'rgba(5,150,105,0.08)' : 'rgba(220,38,38,0.08)',
                border: `1px solid ${saveMsg.type === 'success' ? 'rgba(5,150,105,0.2)' : 'rgba(220,38,38,0.2)'}`,
                fontSize: 13, fontWeight: 600,
                color: saveMsg.type === 'success' ? 'var(--success-text)' : 'var(--error-text)',
              }}>
                {saveMsg.type === 'success' ? '✅' : '⚠️'} {saveMsg.text}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {[
                { label: t.profile.name,  name: 'name',  type: 'text',  placeholder: t.profile.name },
                { label: t.profile.email, name: 'email', type: 'email', placeholder: 'your@email.com' },
                { label: t.profile.phone, name: 'phone', type: 'tel',   placeholder: '10-digit number' },
              ].map((field) => (
                <div key={field.name}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 7, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    disabled={!editing}
                    onFocus={() => setFocusedField(field.name)}
                    onBlur={() => setFocusedField(null)}
                    style={inputStyle(field.name)}
                  />
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 7, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  {t.profile.address}
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder={t.profile.address_placeholder}
                  disabled={!editing}
                  rows={3}
                  onFocus={() => setFocusedField('address')}
                  onBlur={() => setFocusedField(null)}
                  style={{ ...inputStyle('address'), resize: 'none', lineHeight: 1.6 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              borderRadius: 24, padding: '32px',
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(255,107,53,0.08)',
              boxShadow: '0 4px 20px rgba(139,26,26,0.06)',
            }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--maroon)', marginBottom: 28 }}>
              {t.profile.tab_password}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { label: t.profile.current_password, name: 'currentPassword', key: 'current' },
                { label: t.profile.new_password,     name: 'newPassword',     key: 'new' },
                { label: t.profile.confirm_password, name: 'confirmPassword', key: 'confirm' },
              ].map((field) => (
                <div key={field.name}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 7, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    {field.label}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPasswords[field.key] ? 'text' : 'password'}
                      name={field.name}
                      value={passwordData[field.name]}
                      onChange={handlePasswordChange}
                      placeholder="••••••••"
                      onFocus={() => setFocusedField(field.name)}
                      onBlur={() => setFocusedField(null)}
                      style={{ ...inputStyle(field.name), paddingRight: 48 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, [field.key]: !showPasswords[field.key] })}
                      style={{
                        position: 'absolute', right: 14, top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none', border: 'none',
                        cursor: 'pointer', fontSize: 18, color: '#9ca3af',
                      }}>
                      {showPasswords[field.key] ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              ))}
              {pwMsg && (
                <div style={{
                  padding: '10px 14px', borderRadius: 10, marginBottom: 8,
                  background: pwMsg.type === 'success' ? 'rgba(22,163,74,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${pwMsg.type === 'success' ? 'rgba(22,163,74,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  fontSize: 13, fontWeight: 600,
                  color: pwMsg.type === 'success' ? '#16a34a' : '#ef4444',
                }}>
                  {pwMsg.type === 'success' ? '✅' : '⚠️'} {pwMsg.text}
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 12px 30px rgba(255,107,53,0.4)' }}
                whileTap={{ scale: 0.97 }}
                onClick={handlePasswordSubmit}
                disabled={pwSaving}
                style={{
                  padding: '14px', borderRadius: 13, border: 'none',
                  cursor: 'pointer', fontSize: 15, fontWeight: 800, color: 'white',
                  background: pwSaving ? '#ccc' : 'linear-gradient(135deg, #FF6B35, #8B1A1A)',
                  boxShadow: '0 6px 20px rgba(255,107,53,0.35)',
                  marginTop: 8,
                }}>
                {pwSaving ? t.profile.updating : `🔐 ${t.profile.update_password}`}
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  )
}

export default Profile