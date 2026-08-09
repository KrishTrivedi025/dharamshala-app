import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { bookingAPI, ritualAPI } from '../utils/api'
import RitualPaymentModal from '../components/RitualPaymentModal'

const STATUS_COLORS = {
  pending: { color: '#d97706', bg: 'rgba(247,201,72,0.12)', label: 'Pending' },
  approved: { color: '#16a34a', bg: 'rgba(22,163,74,0.1)', label: 'Approved' },
  rejected: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Rejected' },
  cancelled: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', label: 'Cancelled' },
  completed: { color: '#8B1A1A', bg: 'rgba(139,26,26,0.08)', label: 'Completed' },
}

function Dashboard() {
  const { user } = useAuth()
  const { t } = useLanguage()

  const quickActions = [
    { icon: '🏛️', label: t.dashboard.book_hall,     desc: t.dashboard.book_hall_desc,     path: '/booking',        color: '#FF6B35' },
    { icon: '📋', label: t.dashboard.my_bookings,   desc: t.dashboard.my_bookings_desc,   path: '/my-bookings',    color: '#8B1A1A' },
    { icon: '🔔', label: t.dashboard.notifications, desc: t.dashboard.notifications_desc, path: '/notifications',  color: '#F7C948' },
    { icon: '👤', label: t.dashboard.profile,       desc: t.dashboard.profile_desc,       path: '/profile',        color: '#16a34a' },
  ]
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [recentBookings, setRecentBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [ritualStatus, setRitualStatus] = useState(null)
  const [showRitualModal, setShowRitualModal] = useState(false)

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return t.dashboard.greeting_morning
    if (hour < 17) return t.dashboard.greeting_afternoon
    return t.dashboard.greeting_evening
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [statsRes, bookingsRes] = await Promise.all([
          bookingAPI.getStats(),
          bookingAPI.getMyBookings(),
        ])

        // Compute stats from byStatus array
        const byStatus = statsRes.data?.byStatus || []
        const getCount = (status) => {
          const found = byStatus.find(s => s._id === status)
          return found ? found.count : 0
        }

        setStats({
          total: statsRes.data?.total || 0,
          pending: getCount('pending'),
          approved: getCount('approved'),
          rejected: getCount('rejected'),
        })

        // Show 4 most recent bookings
        setRecentBookings((bookingsRes.data || []).slice(0, 4))
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    const fetchRitual = async () => {
      try {
        const res = await ritualAPI.getMyStatus()
        setRitualStatus(res.data)
      } catch { /* ignore */ }
    }
    fetchRitual()
  }, [])

  const statCards = [
    { icon: '📋', label: t.dashboard.total_bookings, value: stats.total,    color: '#FF6B35', bg: 'rgba(255,107,53,0.08)' },
    { icon: '⏳', label: t.dashboard.pending,         value: stats.pending,  color: '#d97706', bg: 'rgba(247,201,72,0.08)' },
    { icon: '✅', label: t.dashboard.approved,        value: stats.approved, color: '#16a34a', bg: 'rgba(22,163,74,0.08)' },
    { icon: '❌', label: t.booking.status_rejected,   value: stats.rejected, color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  ]

  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />

      {/* Ritual Payment Banner */}
      <AnimatePresence>
        {ritualStatus && (
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            style={{
              background: ritualStatus.hasPaid
                ? 'linear-gradient(135deg, #16a34a, #166534)'
                : ritualStatus.isPending
                  ? 'linear-gradient(135deg, #92400e, #d97706)'
                  : 'linear-gradient(135deg, #1a0000, #8B1A1A)',
              padding: '14px 32px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>
                {ritualStatus.hasPaid ? '🎉' : ritualStatus.isPending ? '⏳' : '🪔'}
              </span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'white' }}>
                  {ritualStatus.hasPaid
                    ? `Annual Paid! (${ritualStatus.year})`
                    : ritualStatus.isPending
                      ? 'Cash Payment Pending Admin Approval'
                      : `Annual Ritual Payment Due — ${ritualStatus.year}`}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                  {ritualStatus.hasPaid
                    ? 'Payment confirmed! Download your receipt below.'
                    : ritualStatus.isPending
                      ? 'Your cash payment request is being reviewed by admin.'
                      : `₹${(ritualStatus.fee || 1200).toLocaleString()} — Pooja Shulk for ${ritualStatus.year}`}
                </div>
              </div>
            </div>
            
            {/* Pay Now Button */}
            {!ritualStatus.isPending && !ritualStatus.hasPaid && (
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                onClick={() => setShowRitualModal(true)}
                style={{
                  padding: '10px 22px', borderRadius: 12, border: 'none',
                  cursor: 'pointer', fontSize: 14, fontWeight: 800, color: '#8B1A1A',
                  background: '#F7C948', boxShadow: '0 4px 14px rgba(247,201,72,0.4)',
                }}
              >
                💳 Pay Now
              </motion.button>
            )}

            {/* Download Receipt Button */}
            {ritualStatus.hasPaid && (
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                onClick={() => setShowRitualModal(true)}
                style={{
                  padding: '10px 22px', borderRadius: 12, border: 'none',
                  cursor: 'pointer', fontSize: 14, fontWeight: 800, color: '#064e3b',
                  background: '#a7f3d0', boxShadow: '0 4px 14px rgba(167,243,208,0.4)',
                }}
              >
                📥 Download Receipt
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Banner */}
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
            width: 250, height: 250, borderRadius: '50%',
            background: 'rgba(247,201,72,0.06)',
          }}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute', bottom: -40, left: -40,
            width: 180, height: 180, borderRadius: '50%',
            background: 'rgba(255,107,53,0.08)',
          }}
        />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 6, fontWeight: 500 }}>
              {getGreeting()} 👋
            </p>
            <h1 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 900, color: 'white', marginBottom: 8 }}>
              Welcome back, <span style={{ color: '#F7C948' }}>{user?.name || 'Member'}</span>!
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', maxWidth: 480 }}>
              Manage your hall bookings, check availability and stay updated with notifications.
            </p>
          </motion.div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px' }}>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 20,
            marginBottom: 40,
          }}>
          {statCards.map((card, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(139,26,26,0.1)' }}
              style={{
                borderRadius: 20,
                padding: '24px',
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(20px)',
                border: '1.5px solid rgba(255,107,53,0.08)',
                boxShadow: '0 4px 20px rgba(139,26,26,0.06)',
                transition: 'box-shadow 0.3s ease',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: card.bg, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 22,
                  border: `1.5px solid ${card.color}20`,
                }}>
                  {card.icon}
                </div>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: card.color }}>
                    {loading ? '—' : card.value}
                  </div>
                  <div style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>{card.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              borderRadius: 24,
              padding: '28px',
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(255,107,53,0.08)',
              boxShadow: '0 4px 20px rgba(139,26,26,0.06)',
            }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--maroon)', marginBottom: 20 }}>
              {t.dashboard.quick_actions}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {quickActions.map((action, i) => (
                <Link key={i} to={action.path} style={{ textDecoration: 'none' }}>
                  <motion.div
                    whileHover={{ scale: 1.03, boxShadow: `0 8px 24px ${action.color}20` }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: '16px',
                      borderRadius: 16,
                      background: `${action.color}08`,
                      border: `1.5px solid ${action.color}15`,
                      cursor: 'pointer',
                      transition: 'box-shadow 0.2s ease',
                    }}>
                    <div style={{ fontSize: 26, marginBottom: 8 }}>{action.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                      {action.label}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{action.desc}</div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Recent Bookings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{
              borderRadius: 24,
              padding: '28px',
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(255,107,53,0.08)',
              boxShadow: '0 4px 20px rgba(139,26,26,0.06)',
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--maroon)' }}>
                {t.dashboard.recent_activity}
              </h3>
              <Link to="/my-bookings" style={{ textDecoration: 'none', fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
                {t.dashboard.view_all}
              </Link>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{
                    height: 56, borderRadius: 12,
                    background: 'linear-gradient(90deg, #f5f5f5 25%, #eeeeee 50%, #f5f5f5 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite',
                  }} />
                ))}
              </div>
            ) : recentBookings.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '40px 20px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>📭</div>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--maroon)', marginBottom: 8 }}>
                  {t.dashboard.no_activity}
                </p>
                <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>
                  {t.dashboard.no_activity_sub}
                </p>
                <Link to="/booking" style={{ textDecoration: 'none' }}>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 8px 24px rgba(255,107,53,0.4)' }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      padding: '12px 24px', borderRadius: 12, border: 'none',
                      cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'white',
                      background: 'linear-gradient(135deg, #FF6B35, #8B1A1A)',
                      boxShadow: '0 4px 14px rgba(255,107,53,0.3)',
                    }}>
                    Book Now →
                  </motion.button>
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recentBookings.map((booking, i) => {
                  const st = STATUS_COLORS[booking.status] || STATUS_COLORS.pending
                  return (
                    <motion.div
                      key={booking._id || i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 14px', borderRadius: 12,
                        background: 'rgba(255,107,53,0.03)',
                        border: '1.5px solid rgba(255,107,53,0.06)',
                      }}>
                      <div style={{ fontSize: 18 }}>🏛️</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--maroon)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {booking.eventName}
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>
                          {new Date(booking.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      <div style={{
                        padding: '3px 10px', borderRadius: 99,
                        background: st.bg, color: st.color,
                        fontSize: 11, fontWeight: 700, flexShrink: 0,
                      }}>
                        {st.label}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Profile Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{
            marginTop: 28,
            borderRadius: 24,
            padding: '28px',
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(20px)',
            border: '1.5px solid rgba(255,107,53,0.08)',
            boxShadow: '0 4px 20px rgba(139,26,26,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            flexWrap: 'wrap',
          }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF6B35, #8B1A1A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 800, color: 'white', flexShrink: 0,
          }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : '👤'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--maroon)', marginBottom: 4 }}>
              {user?.name || 'Member'}
            </div>
            <div style={{ fontSize: 14, color: '#9ca3af', marginBottom: 2 }}>{user?.email || '-'}</div>
            <div style={{ fontSize: 14, color: '#9ca3af' }}>{user?.phone || '-'}</div>
          </div>
          <Link to="/profile" style={{ textDecoration: 'none' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '10px 22px', borderRadius: 12,
                border: '1.5px solid rgba(255,107,53,0.3)',
                cursor: 'pointer', fontSize: 14, fontWeight: 600,
                color: 'var(--primary)', background: 'transparent',
              }}>
              {t.profile.edit}
            </motion.button>
          </Link>
        </motion.div>
      </div>
      <Footer />
      <RitualPaymentModal
        isOpen={showRitualModal}
        onClose={() => setShowRitualModal(false)}
        ritualStatus={ritualStatus}
        onPaymentSuccess={async () => {
          try {
            const res = await ritualAPI.getMyStatus()
            setRitualStatus(res.data)
          } catch { /* ignore */ }
        }}
      />
    </div>
  )
}

export default Dashboard