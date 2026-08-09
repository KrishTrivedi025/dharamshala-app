import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AdminLayout, useIsMobile } from './AdminDashboard'
import { ButtonSpinner } from '../../components/ButtonSpinner'
import { adminAPI } from '../../utils/api'
import { LockSimple, LockOpen, Clock } from '@phosphor-icons/react'
import { cardStyleSolid, adminCardStyle, modalOverlay, modalContent, inputStyle as themeInput } from '../../styles/theme'

function LockedDates() {
  const isMobile = useIsMobile()
  const [lockedDates, setLockedDates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [releasingId, setReleasingId] = useState(null)
  const [formData, setFormData] = useState({ startDate: '', endDate: '', reason: '', lockType: 'full' })

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

  return (
    <AdminLayout>
      
      <div style={{ padding: isMobile ? '20px 14px' : '40px 36px' }}>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--maroon)', marginBottom: 6 }}>Locked Dates</h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Block dates to prevent bookings during maintenance or events</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: 'var(--shadow-xl)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', borderRadius: 13, border: 'none',
              cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'white',
              background: 'linear-gradient(135deg, var(--primary), var(--maroon))',
              boxShadow: 'var(--shadow-md)',
            }}>
            <LockSimple size={16} weight="fill" /> Lock Dates
          </motion.button>
        </motion.div>

        {loading ? (
          <div style={{ ...cardStyleSolid, padding: '80px 32px', textAlign: 'center' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid var(--primary-subtle)', borderTop: '4px solid var(--primary)', margin: '0 auto 20px' }} />
            <p style={{ fontSize: 15, color: 'var(--text-muted)' }}>Loading locked dates...</p>
          </div>
        ) : lockedDates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ ...cardStyleSolid, padding: '80px 32px', textAlign: 'center' }}>
            <LockOpen size={56} weight="duotone" color="var(--text-muted)" style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--maroon)', marginBottom: 8 }}>No dates locked</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Lock dates to prevent bookings during specific periods</p>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              onClick={() => setShowModal(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', borderRadius: 12, border: 'none',
                cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'white',
                background: 'linear-gradient(135deg, var(--primary), var(--maroon))',
              }}>
              <LockSimple size={16} weight="fill" /> Lock Dates
            </motion.button>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {lockedDates.map((lock, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
                style={{
                  borderRadius: 14, padding: '12px 16px',
                  background: 'var(--surface-solid)', border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex', alignItems: 'center', gap: 12,
                  transition: 'box-shadow 0.2s ease',
                }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: 'var(--warning-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1.5px solid rgba(217,119,6,0.2)',
                }}>
                  <LockSimple size={16} weight="duotone" color="var(--warning-text)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--maroon)' }}>
                    {new Date(lock.startDate).toLocaleDateString('en-IN')} — {new Date(lock.endDate).toLocaleDateString('en-IN')}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lock.reason}</div>
                </div>
                <div style={{
                  padding: '3px 10px', borderRadius: 99, flexShrink: 0,
                  background: 'var(--warning-subtle)', color: 'var(--warning-text)',
                  fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {lock.lockType === 'full'
                    ? <><LockSimple size={10} weight="fill" /> Full Day</>
                    : <><Clock size={10} weight="fill" /> Partial</>
                  }
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                  onClick={() => handleRelease(lock._id)}
                  disabled={releasingId === lock._id}
                  style={{
                    padding: '5px 12px', borderRadius: 8, border: 'none', flexShrink: 0,
                    cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    color: 'var(--error-text)', background: 'var(--error-subtle)',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                  {releasingId === lock._id
                    ? <><ButtonSpinner light={false} size={11} /> <span>Releasing…</span></>
                    : 'Release'}
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
              style={modalOverlay}
              onClick={() => setShowModal(false)}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                style={{ ...modalContent, maxWidth: 480 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                  <LockSimple size={22} weight="duotone" color="var(--maroon)" />
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--maroon)' }}>Lock Dates</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Start Date
                      </label>
                      <input type="date" name="startDate" value={formData.startDate}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('startDate')}
                        onBlur={() => setFocusedField(null)}
                        style={themeInput(focusedField === 'startDate')} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        End Date
                      </label>
                      <input type="date" name="endDate" value={formData.endDate}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('endDate')}
                        onBlur={() => setFocusedField(null)}
                        style={themeInput(focusedField === 'endDate')} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Reason
                    </label>
                    <input type="text" name="reason" value={formData.reason}
                      onChange={handleChange} placeholder="e.g. Maintenance, Samaj Event"
                      onFocus={() => setFocusedField('reason')}
                      onBlur={() => setFocusedField(null)}
                      style={themeInput(focusedField === 'reason')} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Lock Type
                    </label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {[
                        { type: 'full', Icon: LockSimple, label: 'Full Day' },
                        { type: 'partial', Icon: Clock, label: 'Partial' },
                      ].map(({ type, Icon, label }) => (
                        <motion.div key={type} whileHover={{ scale: 1.02 }}
                          onClick={() => setFormData({ ...formData, lockType: type })}
                          style={{
                            flex: 1, padding: '12px', borderRadius: 12, cursor: 'pointer',
                            border: `2px solid ${formData.lockType === type ? 'var(--primary)' : 'var(--border)'}`,
                            background: formData.lockType === type ? 'var(--primary-subtle)' : 'white',
                            textAlign: 'center', fontSize: 14, fontWeight: 700,
                            color: formData.lockType === type ? 'var(--primary)' : 'var(--text-secondary)',
                            transition: 'all 0.2s ease',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          }}>
                          <Icon size={16} weight="fill" /> {label}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setShowModal(false)}
                    style={{ flex: 1, padding: '13px', borderRadius: 12, border: '2px solid var(--border)', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', background: 'white' }}>
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03, boxShadow: 'var(--shadow-xl)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit} disabled={submitting}
                    style={{
                      flex: 2, padding: '13px', borderRadius: 12, border: 'none',
                      cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      background: submitting ? 'var(--neutral-300)' : 'linear-gradient(135deg, var(--primary), var(--maroon))',
                    }}>
                    {submitting
                      ? <><ButtonSpinner /> <span>Locking…</span></>
                      : <><LockSimple size={16} weight="fill" /> Lock Dates</>}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  </AdminLayout>
  )
}

export default LockedDates
