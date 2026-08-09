import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { bookingAPI } from '../utils/api'
import { useLanguage } from '../context/LanguageContext'

const NOTIF_TYPES = {
  booking: { icon: '🏛️', color: '#FF6B35' },
  payment: { icon: '💳', color: '#16a34a' },
  approval: { icon: '✅', color: '#16a34a' },
  rejection: { icon: '❌', color: '#ef4444' },
  reminder: { icon: '🔔', color: '#F7C948' },
  system: { icon: 'ℹ️', color: '#6b7280' },
}

function Notifications() {
  const { t } = useLanguage()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true)
        const res = await bookingAPI.getMyBookings()
        const bookings = res.data || []
        // Derive notifications from booking statuses
        const notifs = bookings.map(b => {
          let type = 'booking', title = '', message = ''
          if (b.status === 'approved') {
            type = 'approval'
            title = `Booking Approved: ${b.eventName}`
            message = `Your booking for ${new Date(b.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} has been approved. Total: ₹${b.totalAmount?.toLocaleString() || 'TBD'}`
          } else if (b.status === 'rejected') {
            type = 'rejection'
            title = `Booking Rejected: ${b.eventName}`
            message = b.rejectionReason || 'Your booking request was not approved.'
          } else if (b.status === 'pending') {
            type = 'reminder'
            title = `Booking Pending: ${b.eventName}`
            message = `Your booking for ${new Date(b.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} is awaiting admin review.`
          } else if (b.status === 'cancelled') {
            type = 'system'
            title = `Booking Cancelled: ${b.eventName}`
            message = b.cancellationReason || 'This booking has been cancelled.'
          } else if (b.status === 'completed') {
            type = 'payment'
            title = `Booking Completed: ${b.eventName}`
            message = `Your event on ${new Date(b.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} has been marked as completed.`
          }
          return {
            _id: b._id,
            type,
            title,
            message,
            createdAt: b.updatedAt || b.createdAt,
            read: ['completed', 'cancelled'].includes(b.status),
          }
        }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        setNotifications(notifs)
      } catch (err) {
        console.error('Failed to load notifications:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'All') return true
    if (filter === 'Unread') return !n.read
    if (filter === 'Reminder') return n.type === 'reminder'
    if (filter === 'Payment') return n.type === 'payment' || (n.message && n.message.includes('₹'))
    if (filter === 'Booking') return ['approval', 'rejection', 'booking', 'system'].includes(n.type)
    return true
  })

  const itemsPerPage = 5
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage)
  const currentNotifs = filteredNotifications.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh', overflow: 'hidden' }}>
      <Navbar />

      {/* Only this middle area scrolls */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

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
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 900, color: 'white', marginBottom: 8 }}>
                {t.notifications.title}
                {unreadCount > 0 && (
                  <span style={{
                    marginLeft: 12, fontSize: 14,
                    background: '#FF6B35', color: 'white',
                    padding: '2px 10px', borderRadius: 99, fontWeight: 700,
                  }}>
                    {unreadCount} {t.notifications.new}
                  </span>
                )}
              </h1>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)' }}>
                {t.notifications.subtitle}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 32px' }}>

        {/* Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
          {[
            { key: 'All',      label: t.notifications.filter_all },
            { key: 'Unread',   label: t.notifications.filter_unread },
            { key: 'Booking',  label: t.notifications.filter_booking },
            { key: 'Payment',  label: t.notifications.filter_payment },
            { key: 'Reminder', label: t.notifications.filter_reminder },
          ].map(({ key: f, label }) => (
            <motion.button
              key={f}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setFilter(f); setCurrentPage(1); }}
              style={{
                padding: '8px 18px', borderRadius: 99, border: 'none',
                cursor: 'pointer', fontSize: 13, fontWeight: 700,
                transition: 'all 0.25s ease',
                background: filter === f
                  ? 'linear-gradient(135deg, #FF6B35, #8B1A1A)'
                  : 'rgba(255,255,255,0.9)',
                color: filter === f ? 'white' : '#6b7280',
                boxShadow: filter === f
                  ? '0 4px 14px rgba(255,107,53,0.35)'
                  : '0 2px 8px rgba(0,0,0,0.06)',
              }}>
              {label}
            </motion.button>
          ))}
        </motion.div>

        {/* Notifications List */}
        <AnimatePresence>
          {loading ? (
            <div style={{ borderRadius: 24, padding: '80px 32px', background: 'rgba(255,255,255,0.92)', border: '1.5px solid rgba(255,107,53,0.08)', textAlign: 'center' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid rgba(255,107,53,0.2)', borderTop: '4px solid #FF6B35', margin: '0 auto 20px' }} />
              <p style={{ fontSize: 15, color: '#9ca3af' }}>Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                borderRadius: 24, padding: '80px 32px',
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(20px)',
                border: '1.5px solid rgba(255,107,53,0.08)',
                boxShadow: '0 4px 20px rgba(139,26,26,0.06)',
                textAlign: 'center',
              }}>
              <div style={{ fontSize: 64, marginBottom: 20 }}>🔕</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--maroon)', marginBottom: 10 }}>
                {t.notifications.empty}
              </h3>
              <p style={{ fontSize: 14, color: '#9ca3af', maxWidth: 300, margin: '0 auto' }}>
                {t.notifications.empty_sub}
              </p>
            </motion.div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {currentNotifs.map((notif, i) => {
                const type = NOTIF_TYPES[notif.type] || NOTIF_TYPES.system
                return (
                  <motion.div
                    key={notif._id || i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ y: -2, boxShadow: '0 12px 32px rgba(139,26,26,0.1)' }}
                    style={{
                      borderRadius: 18, padding: '18px 22px',
                      background: notif.read ? 'rgba(255,255,255,0.92)' : 'rgba(255,107,53,0.04)',
                      backdropFilter: 'blur(20px)',
                      border: notif.read
                        ? '1.5px solid rgba(255,107,53,0.08)'
                        : '1.5px solid rgba(255,107,53,0.2)',
                      boxShadow: '0 4px 16px rgba(139,26,26,0.06)',
                      display: 'flex', alignItems: 'flex-start', gap: 16,
                      transition: 'box-shadow 0.3s ease',
                      cursor: 'pointer',
                    }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 13, flexShrink: 0,
                      background: `${type.color}12`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, border: `1.5px solid ${type.color}20`,
                    }}>
                      {type.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--maroon)', marginBottom: 4 }}>
                        {notif.title}
                      </div>
                      <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
                        {notif.message}
                      </div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>
                        {new Date(notif.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>
                    {!notif.read && (
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: '#FF6B35', flexShrink: 0, marginTop: 4,
                      }} />
                    )}
                  </motion.div>
                )
              })}

              {/* Pagination UI */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 12, marginTop: 40, padding: '20px 0',
                  borderTop: '1px solid rgba(255,107,53,0.08)'
                }}>
                  <motion.button
                    whileHover={{ scale: 1.1, backgroundColor: '#f9fafb' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    style={{
                      width: 40, height: 40, borderRadius: 12, border: '1px solid rgba(255,107,53,0.1)',
                      background: 'white', color: currentPage === 1 ? '#d1d5db' : '#374151',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: 18,
                      transition: 'all 0.2s ease',
                    }}>
                    ‹
                  </motion.button>
                  
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[...Array(totalPages)].map((_, idx) => {
                      const pg = idx + 1
                      const active = pg === currentPage
                      return (
                        <motion.button
                          key={pg}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setCurrentPage(pg)}
                          style={{
                            width: 40, height: 40, borderRadius: 12,
                            border: active ? 'none' : '1px solid rgba(255,107,53,0.1)',
                            background: active ? 'linear-gradient(135deg, #FF6B35, #8B1A1A)' : 'white',
                            color: active ? 'white' : '#374151',
                            fontWeight: active ? 700 : 500,
                            fontSize: 14,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: active ? '0 4px 12px rgba(255,107,53,0.3)' : 'none',
                            transition: 'all 0.2s ease',
                          }}>
                          {pg}
                        </motion.button>
                      )
                    })}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.1, backgroundColor: '#f9fafb' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      width: 40, height: 40, borderRadius: 12, border: '1px solid rgba(255,107,53,0.1)',
                      background: 'white', color: currentPage === totalPages ? '#d1d5db' : '#374151',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: 18,
                      transition: 'all 0.2s ease',
                    }}>
                    ›
                  </motion.button>
                </div>
              )}
              
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <p style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>
                  Showing {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filteredNotifications.length)} of {filteredNotifications.length} notifications
                </p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      </div>{/* end scrollable area */}

      <Footer />
    </div>
  )
}

export default Notifications