import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building, CreditCard, CheckCircle, XCircle, Bell, Info,
  BellSlash, CircleNotch,
} from '@phosphor-icons/react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { bookingAPI } from '../utils/api'

const NOTIF_TYPES = {
  booking: { icon: <Building size={20} weight="duotone" />, color: 'var(--primary)' },
  payment: { icon: <CreditCard size={20} weight="duotone" />, color: 'var(--success)' },
  approval: { icon: <CheckCircle size={20} weight="duotone" />, color: 'var(--success)' },
  rejection: { icon: <XCircle size={20} weight="duotone" />, color: 'var(--error)' },
  reminder: { icon: <Bell size={20} weight="duotone" />, color: 'var(--secondary)' },
  system: { icon: <Info size={20} weight="duotone" />, color: 'var(--text-muted)' },
}

function Notifications() {
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
        const notifs = bookings.map(b => {
          let type = 'booking', title = '', message = ''
          if (b.status === 'approved') {
            type = 'approval'; title = `Booking Approved: ${b.eventName}`
            message = `Your booking for ${new Date(b.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} has been approved. Total: ₹${b.totalAmount?.toLocaleString() || 'TBD'}`
          } else if (b.status === 'rejected') {
            type = 'rejection'; title = `Booking Rejected: ${b.eventName}`
            message = b.rejectionReason || 'Your booking request was not approved.'
          } else if (b.status === 'pending') {
            type = 'reminder'; title = `Booking Pending: ${b.eventName}`
            message = `Your booking for ${new Date(b.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} is awaiting admin review.`
          } else if (b.status === 'cancelled') {
            type = 'system'; title = `Booking Cancelled: ${b.eventName}`
            message = b.cancellationReason || 'This booking has been cancelled.'
          } else if (b.status === 'completed') {
            type = 'payment'; title = `Booking Completed: ${b.eventName}`
            message = `Your event on ${new Date(b.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} has been marked as completed.`
          }
          return { _id: b._id, type, title, message, createdAt: b.updatedAt || b.createdAt, read: ['completed', 'cancelled'].includes(b.status) }
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
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a0000 0%, #5a0e0e 50%, #c94a1a 100%)', padding: '44px 32px', position: 'relative', overflow: 'hidden' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(247,201,72,0.06)' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <h1 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 900, color: 'white', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
              Notifications
              {unreadCount > 0 && (
                <span style={{ fontSize: 'var(--text-sm)', background: 'var(--primary)', color: 'white', padding: '2px 10px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p style={{ fontSize: 'var(--text-base)', color: 'rgba(255,255,255,0.5)' }}>Stay updated with your booking alerts and reminders</p>
          </motion.div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '36px 28px' }}>
        {/* Filter pills */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
          style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {['All', 'Unread', 'Booking', 'Payment', 'Reminder'].map(f => (
            <motion.button key={f} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => { setFilter(f); setCurrentPage(1) }}
              style={{
                padding: '7px 16px', borderRadius: 'var(--radius-full)', border: 'none',
                cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 700, transition: 'all 0.2s',
                background: filter === f ? 'linear-gradient(135deg, var(--primary), var(--maroon))' : 'var(--surface-solid)',
                color: filter === f ? 'white' : 'var(--text-secondary)',
                boxShadow: filter === f ? '0 4px 14px var(--primary-border)' : 'var(--shadow-sm)',
                fontFamily: 'inherit',
              }}>
              {f}
            </motion.button>
          ))}
        </motion.div>

        {/* List */}
        <AnimatePresence>
          {loading ? (
            <div style={{ borderRadius: 'var(--radius-xl)', padding: '72px 32px', background: 'var(--surface-solid)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', textAlign: 'center' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                style={{ display: 'inline-block', color: 'var(--primary)', marginBottom: 16 }}>
                <CircleNotch size={44} weight="bold" />
              </motion.div>
              <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-muted)' }}>Loading notifications…</p>
            </div>
          ) : notifications.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              style={{ borderRadius: 'var(--radius-xl)', padding: '72px 32px', background: 'var(--surface-solid)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', textAlign: 'center' }}>
              <BellSlash size={60} weight="duotone" style={{ color: 'var(--neutral-300)', marginBottom: 18 }} />
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--maroon)', marginBottom: 8 }}>No notifications yet</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', maxWidth: 280, margin: '0 auto' }}>
                You will receive alerts here when your bookings are updated or payments are due
              </p>
            </motion.div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {currentNotifs.map((notif, i) => {
                const type = NOTIF_TYPES[notif.type] || NOTIF_TYPES.system
                return (
                  <motion.div key={notif._id || i}
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -2, boxShadow: 'var(--shadow-lg)' }}
                    style={{
                      borderRadius: 'var(--radius-lg)', padding: '16px 20px',
                      background: notif.read ? 'var(--surface-solid)' : 'var(--primary-subtle)',
                      border: notif.read ? '1px solid var(--border)' : '1px solid var(--primary-border)',
                      boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'flex-start', gap: 14,
                      transition: 'box-shadow 0.2s', cursor: 'pointer',
                    }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 'var(--radius-md)', flexShrink: 0,
                      background: `${type.color}10`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `1px solid ${type.color}20`, color: type.color,
                    }}>
                      {type.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--maroon)', marginBottom: 3 }}>{notif.title}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{notif.message}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 5 }}>
                        {new Date(notif.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {!notif.read && (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 5 }} />
                    )}
                  </motion.div>
                )
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                  <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--surface-solid)', color: currentPage === 1 ? 'var(--neutral-300)' : 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: 16 }}>
                    ‹
                  </motion.button>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[...Array(totalPages)].map((_, idx) => {
                      const pg = idx + 1; const active = pg === currentPage
                      return (
                        <motion.button key={pg} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={() => setCurrentPage(pg)}
                          style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', border: active ? 'none' : '1px solid var(--border)', background: active ? 'linear-gradient(135deg, var(--primary), var(--maroon))' : 'var(--surface-solid)', color: active ? 'white' : 'var(--text)', fontWeight: active ? 700 : 500, fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: active ? '0 4px 12px var(--primary-border)' : 'none' }}>
                          {pg}
                        </motion.button>
                      )
                    })}
                  </div>
                  <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--surface-solid)', color: currentPage === totalPages ? 'var(--neutral-300)' : 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: 16 }}>
                    ›
                  </motion.button>
                </div>
              )}
              <div style={{ textAlign: 'center', marginTop: 10 }}>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  Showing {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filteredNotifications.length)} of {filteredNotifications.length} notifications
                </p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  )
}

export default Notifications
