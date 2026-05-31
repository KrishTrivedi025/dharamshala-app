import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AdminSidebar } from './AdminDashboard'
import { adminAPI } from '../../utils/api'

function LockedDates() {
  const [lockedDates, setLockedDates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [releasingId, setReleasingId] = useState(null)
  const [formData, setFormData] = useState({
    startDate: '', endDate: '', reason: '', lockType: 'full',
  })

  const fetchLockedDates = async () => {
    try {
      setLoading(true)
      const res = await adminAPI.getLockedDates()
      setLockedDates(res.data || [])
    } catch (err) {
      console.error('Failed to fetch locked dates:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLockedDates() }, [])

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    if (!formData.startDate || !formData.endDate || !formData.reason) {
      alert('Please fill all required fields')
      return
    }
    try {
      setSubmitting(true)
      await adminAPI.createLockedDate(formData)
      setShowModal(false)
      setFormData({ startDate: '', endDate: '', reason: '', lockType: 'full' })
      await fetchLockedDates()
    } catch (err) {
      alert(err.message || 'Failed to lock dates')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRelease = async (id) => {
    try {
      setReleasingId(id)
      await adminAPI.releaseLockedDate(id)
      await fetchLockedDates()
    } catch (err) {
      alert(err.message || 'Failed to release lock')
    } finally {
      setReleasingId(null)
    }
  }

  const inputStyle = (field) => ({
    width: '100%', padding: '12px 16px', borderRadius: 12,
    border: `2px solid ${focusedField === field ? 'var(--primary)' : '#ede8e0'}`,
    backgroundColor: focusedField === field ? 'rgba(255,107,53,0.03)' : '#fafafa',
    boxShadow: focusedField === field ? '0 0 0 4px rgba(255,107,53,0.08)' : 'none',
    outline: 'none', fontSize: 14, color: 'var(--text)',
    transition: 'all 0.25s ease', boxSizing: 'border-box',
  })

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--background)' }}><AdminSidebar />
      <div style={{ flex: 1, padding: '40px 36px', height: '100vh', overflowY: 'auto'  }}>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--maroon)', marginBottom: 6 }}>Locked Dates</h1>
            <p style={{ fontSize: 14, color: '#9ca3af' }}>Block dates to prevent bookings during maintenance or events</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 8px 24px rgba(255,107,53,0.4)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowModal(true)}
            style={{
              padding: '12px 24px', borderRadius: 13, border: 'none',
              cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'white',
              background: 'linear-gradient(135deg, #FF6B35, #8B1A1A)',
              boxShadow: '0 4px 14px rgba(255,107,53,0.3)',
            }}>
            + Lock Dates
          </motion.button>
        </motion.div>

        {loading ? (
          <div style={{ borderRadius: 24, padding: '80px 32px', background: 'rgba(255,255,255,0.92)', border: '1.5px solid rgba(255,107,53,0.08)', textAlign: 'center' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid rgba(255,107,53,0.2)', borderTop: '4px solid #FF6B35', margin: '0 auto 20px' }} />
            <p style={{ fontSize: 15, color: '#9ca3af' }}>Loading locked dates...</p>
          </div>
        ) : lockedDates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              borderRadius: 24, padding: '80px 32px',
              background: 'rgba(255,255,255,0.92)',
              border: '1.5px solid rgba(255,107,53,0.08)',
              boxShadow: '0 4px 20px rgba(139,26,26,0.06)',
              textAlign: 'center',
            }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🔓</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--maroon)', marginBottom: 8 }}>No dates locked</h3>
            <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 24 }}>Lock dates to prevent bookings during specific periods</p>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              onClick={() => setShowModal(true)}
              style={{
                padding: '12px 24px', borderRadius: 12, border: 'none',
                cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'white',
                background: 'linear-gradient(135deg, #FF6B35, #8B1A1A)',
              }}>
              + Lock Dates
            </motion.button>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {lockedDates.map((lock, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -3, boxShadow: '0 16px 40px rgba(139,26,26,0.1)' }}
                style={{
                  borderRadius: 20, padding: '22px 26px',
                  background: 'rgba(255,255,255,0.92)',
                  border: '1.5px solid rgba(255,107,53,0.08)',
                  boxShadow: '0 4px 20px rgba(139,26,26,0.06)',
                  display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap',
                  transition: 'box-shadow 0.3s ease',
                }}>
                <div style={{
                  width: 50, height: 50, borderRadius: 14,
                  background: 'rgba(247,201,72,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, border: '1.5px solid rgba(247,201,72,0.2)', flexShrink: 0,
                }}>
                  🔒
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--maroon)', marginBottom: 4 }}>
                    {new Date(lock.startDate).toLocaleDateString('en-IN')} — {new Date(lock.endDate).toLocaleDateString('en-IN')}
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>{lock.reason}</div>
                </div>
                <div style={{
                  padding: '5px 14px', borderRadius: 99,
                  background: 'rgba(247,201,72,0.12)', color: '#d97706',
                  fontSize: 12, fontWeight: 700,
                }}>
                  {lock.lockType === 'full' ? 'Full Day' : 'Partial'}
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                  onClick={() => handleRelease(lock._id)}
                  disabled={releasingId === lock._id}
                  style={{
                    padding: '7px 16px', borderRadius: 10, border: 'none',
                    cursor: 'pointer', fontSize: 13, fontWeight: 700,
                    color: '#ef4444', background: 'rgba(239,68,68,0.08)',
                  }}>
                  {releasingId === lock._id ? 'Releasing...' : 'Release'}
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add Lock Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
              }}
              onClick={() => setShowModal(false)}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                style={{
                  borderRadius: 24, padding: '36px',
                  background: 'white', maxWidth: 480, width: '100%',
                  boxShadow: '0 40px 100px rgba(0,0,0,0.3)',
                }}>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--maroon)', marginBottom: 24 }}>
                  🔒 Lock Dates
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Start Date
                      </label>
                      <input type="date" name="startDate" value={formData.startDate}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('startDate')}
                        onBlur={() => setFocusedField(null)}
                        style={inputStyle('startDate')} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        End Date
                      </label>
                      <input type="date" name="endDate" value={formData.endDate}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('endDate')}
                        onBlur={() => setFocusedField(null)}
                        style={inputStyle('endDate')} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Reason
                    </label>
                    <input type="text" name="reason" value={formData.reason}
                      onChange={handleChange} placeholder="e.g. Maintenance, Samaj Event"
                      onFocus={() => setFocusedField('reason')}
                      onBlur={() => setFocusedField(null)}
                      style={inputStyle('reason')} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Lock Type
                    </label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {['full', 'partial'].map((type) => (
                        <motion.div key={type} whileHover={{ scale: 1.02 }}
                          onClick={() => setFormData({ ...formData, lockType: type })}
                          style={{
                            flex: 1, padding: '12px', borderRadius: 12, cursor: 'pointer',
                            border: `2px solid ${formData.lockType === type ? 'var(--primary)' : '#ede8e0'}`,
                            background: formData.lockType === type ? 'rgba(255,107,53,0.06)' : 'white',
                            textAlign: 'center', fontSize: 14, fontWeight: 700,
                            color: formData.lockType === type ? 'var(--primary)' : '#6b7280',
                            transition: 'all 0.2s ease',
                          }}>
                          {type === 'full' ? '🔒 Full Day' : '⏰ Partial'}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setShowModal(false)}
                    style={{
                      flex: 1, padding: '13px', borderRadius: 12,
                      border: '2px solid #ede8e0', cursor: 'pointer',
                      fontSize: 14, fontWeight: 700, color: '#6b7280', background: 'white',
                    }}>
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03, boxShadow: '0 8px 20px rgba(255,107,53,0.4)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit}
                    disabled={submitting}
                    style={{
                      flex: 2, padding: '13px', borderRadius: 12, border: 'none',
                      cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'white',
                      background: submitting ? '#ccc' : 'linear-gradient(135deg, #FF6B35, #8B1A1A)',
                    }}>
                    {submitting ? 'Locking...' : '🔒 Lock Dates'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default LockedDates
