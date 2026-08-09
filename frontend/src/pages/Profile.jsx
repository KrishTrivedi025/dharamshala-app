import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Lock, PencilSimple, Eye, EyeSlash, CheckCircle, WarningCircle, ArrowRight } from '@phosphor-icons/react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../utils/api'

const fieldBase = (focused, disabled) => ({
  width: '100%', padding: '12px 15px', borderRadius: 'var(--radius-md)', boxSizing: 'border-box',
  border: `1.5px solid ${focused ? 'var(--primary)' : 'var(--border)'}`,
  boxShadow: focused ? '0 0 0 3px var(--primary-subtle)' : 'none',
  background: disabled ? 'var(--neutral-50)' : 'var(--surface-solid)',
  outline: 'none', fontSize: 'var(--text-base)', color: 'var(--text)',
  transition: 'border-color 0.18s, box-shadow 0.18s, background 0.18s', fontFamily: 'inherit',
  opacity: disabled ? 0.65 : 1,
})

function Profile() {
  const { user, updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [editing, setEditing] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
  const [formData, setFormData] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', address: user?.address || '' })
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false })
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState(null)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState(null)

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })
  const handlePasswordChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value })

  const handleSave = async () => {
    try {
      setSaving(true); setSaveMsg(null)
      const res = await authAPI.updateProfile(formData)
      updateUser({ ...user, ...res.data }); setEditing(false)
      setSaveMsg({ type: 'success', text: 'Profile updated successfully!' })
      setTimeout(() => setSaveMsg(null), 3000)
    } catch (err) {
      setSaveMsg({ type: 'error', text: err.message || 'Failed to update profile' })
    } finally { setSaving(false) }
  }

  const handlePasswordSubmit = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) { setPwMsg({ type: 'error', text: 'New passwords do not match' }); return }
    if (passwordData.newPassword.length < 6) { setPwMsg({ type: 'error', text: 'Password must be at least 6 characters' }); return }
    try {
      setPwSaving(true); setPwMsg(null)
      await authAPI.changePassword({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword })
      setPwMsg({ type: 'success', text: 'Password changed successfully!' })
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setPwMsg(null), 3000)
    } catch (err) {
      setPwMsg({ type: 'error', text: err.message || 'Failed to change password' })
    } finally { setPwSaving(false) }
  }

  const tabs = [
    { key: 'profile', label: 'Profile', icon: <User size={15} weight="duotone" /> },
    { key: 'password', label: 'Password', icon: <Lock size={15} weight="duotone" /> },
  ]

  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a0000 0%, #5a0e0e 50%, #c94a1a 100%)', padding: '44px 32px', position: 'relative', overflow: 'hidden' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(247,201,72,0.06)' }} />
        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}
            style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'white', border: '2px solid rgba(255,255,255,0.22)', flexShrink: 0 }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <h1 style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 900, color: 'white', marginBottom: 4 }}>{user?.name || 'Member'}</h1>
              <p style={{ fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.5)' }}>{user?.email || ''}</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '36px 28px' }}>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
          style={{ display: 'flex', gap: 8, marginBottom: 24, borderRadius: 'var(--radius-lg)', padding: 5, background: 'var(--surface-solid)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', width: 'fit-content' }}>
          {tabs.map((tab) => (
            <motion.button key={tab.key} whileTap={{ scale: 0.97 }}
              onClick={() => { setActiveTab(tab.key); setEditing(false) }}
              style={{
                padding: '9px 20px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
                fontSize: 'var(--text-sm)', fontWeight: 700, transition: 'all 0.2s',
                background: activeTab === tab.key ? 'linear-gradient(135deg, var(--primary), var(--maroon))' : 'transparent',
                color: activeTab === tab.key ? 'white' : 'var(--text-muted)',
                boxShadow: activeTab === tab.key ? '0 4px 12px var(--primary-border)' : 'none',
                display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'inherit',
              }}>
              {tab.icon} {tab.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Profile tab */}
        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            style={{ borderRadius: 'var(--radius-xl)', padding: '28px', background: 'var(--surface-solid)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--maroon)' }}>Personal Information</h3>
              {saveMsg && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', fontWeight: 600, color: saveMsg.type === 'success' ? 'var(--success)' : 'var(--error-text)' }}>
                  {saveMsg.type === 'success' ? <CheckCircle size={15} weight="fill" /> : <WarningCircle size={15} weight="fill" />}
                  {saveMsg.text}
                </div>
              )}
              {!editing ? (
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => setEditing(true)}
                  style={{ padding: '8px 18px', borderRadius: 'var(--radius-full)', border: '1.5px solid var(--primary-border)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--primary)', background: 'transparent', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
                  <PencilSimple size={14} weight="bold" /> Edit
                </motion.button>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => setEditing(false)}
                    style={{ padding: '8px 18px', borderRadius: 'var(--radius-full)', border: '1.5px solid var(--border)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-secondary)', background: 'transparent', fontFamily: 'inherit' }}>
                    Cancel
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.04, boxShadow: '0 8px 20px var(--primary-border)' }} whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving}
                    style={{ padding: '8px 18px', borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'white', background: saving ? 'var(--neutral-400)' : 'linear-gradient(135deg, var(--primary), var(--maroon))', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
                    {saving ? 'Saving…' : <><ArrowRight size={13} weight="bold" /> Save Changes</>}
                  </motion.button>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              {[
                { label: 'Full Name', name: 'name', type: 'text', placeholder: 'Your full name' },
                { label: 'Email Address', name: 'email', type: 'email', placeholder: 'your@email.com' },
                { label: 'Phone Number', name: 'phone', type: 'tel', placeholder: '10-digit number' },
              ].map((field) => (
                <div key={field.name}>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                    {field.label}
                  </label>
                  <input type={field.type} name={field.name} value={formData[field.name]} onChange={handleChange}
                    placeholder={field.placeholder} disabled={!editing}
                    onFocus={() => setFocusedField(field.name)} onBlur={() => setFocusedField(null)}
                    style={fieldBase(focusedField === field.name, !editing)} />
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.6px', textTransform: 'uppercase' }}>Address</label>
                <textarea name="address" value={formData.address} onChange={handleChange}
                  placeholder="Your full address" disabled={!editing} rows={3}
                  onFocus={() => setFocusedField('address')} onBlur={() => setFocusedField(null)}
                  style={{ ...fieldBase(focusedField === 'address', !editing), resize: 'none', lineHeight: 1.6 }} />
              </div>
            </div>
          </motion.div>
        )}

        {/* Password tab */}
        {activeTab === 'password' && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            style={{ borderRadius: 'var(--radius-xl)', padding: '28px', background: 'var(--surface-solid)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--maroon)', marginBottom: 24 }}>Change Password</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {[
                { label: 'Current Password', name: 'currentPassword', key: 'current' },
                { label: 'New Password', name: 'newPassword', key: 'new' },
                { label: 'Confirm New Password', name: 'confirmPassword', key: 'confirm' },
              ].map((field) => (
                <div key={field.name}>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                    {field.label}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPasswords[field.key] ? 'text' : 'password'} name={field.name}
                      value={passwordData[field.name]} onChange={handlePasswordChange} placeholder="••••••••"
                      onFocus={() => setFocusedField(field.name)} onBlur={() => setFocusedField(null)}
                      style={{ ...fieldBase(focusedField === field.name, false), paddingRight: 46 }} />
                    <button type="button" onClick={() => setShowPasswords({ ...showPasswords, [field.key]: !showPasswords[field.key] })}
                      aria-label={showPasswords[field.key] ? 'Hide password' : 'Show password'}
                      style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 2 }}>
                      {showPasswords[field.key] ? <EyeSlash size={17} weight="regular" /> : <Eye size={17} weight="regular" />}
                    </button>
                  </div>
                </div>
              ))}

              {pwMsg && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 13px', borderRadius: 'var(--radius-md)', background: pwMsg.type === 'success' ? 'var(--success-subtle)' : 'var(--error-subtle)', border: `1px solid ${pwMsg.type === 'success' ? 'var(--success)' : 'var(--error)'}`, fontSize: 'var(--text-sm)', fontWeight: 600, color: pwMsg.type === 'success' ? 'var(--success-text)' : 'var(--error-text)' }}>
                  {pwMsg.type === 'success' ? <CheckCircle size={15} weight="fill" /> : <WarningCircle size={15} weight="fill" />}
                  {pwMsg.text}
                </div>
              )}

              <motion.button whileHover={{ scale: 1.02, boxShadow: '0 10px 26px var(--primary-border)' }} whileTap={{ scale: 0.97 }}
                onClick={handlePasswordSubmit} disabled={pwSaving}
                style={{ padding: '13px', borderRadius: 'var(--radius-full)', border: 'none', cursor: pwSaving ? 'not-allowed' : 'pointer', fontSize: 'var(--text-base)', fontWeight: 700, color: 'white', background: pwSaving ? 'var(--neutral-400)' : 'linear-gradient(135deg, var(--primary), var(--maroon))', boxShadow: '0 6px 18px var(--primary-border)', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}>
                <Lock size={15} weight="bold" />
                {pwSaving ? 'Updating…' : 'Update Password'}
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
