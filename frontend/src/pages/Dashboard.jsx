import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building, ClipboardText, Bell, UserCircle,
  Hourglass, CheckCircle, XCircle, DownloadSimple,
  CreditCard, ArrowRight,
} from '@phosphor-icons/react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { bookingAPI, ritualAPI } from '../utils/api'
import RitualPaymentModal from '../components/RitualPaymentModal'
import { STATUS_COLORS, cardStyle } from '../styles/theme'

const quickActions = [
  { icon: <Building size={24} weight="duotone" />, label: 'Book Hall', desc: 'Request a new booking', path: '/booking', color: 'var(--primary)', colorRaw: '#FF6B35' },
  { icon: <ClipboardText size={24} weight="duotone" />, label: 'My Bookings', desc: 'View all your bookings', path: '/my-bookings', color: 'var(--maroon)', colorRaw: '#8B1A1A' },
  { icon: <Bell size={24} weight="duotone" />, label: 'Notifications', desc: 'Check your alerts', path: '/notifications', color: 'var(--secondary)', colorRaw: '#F7C948' },
  { icon: <UserCircle size={24} weight="duotone" />, label: 'Profile', desc: 'Update your details', path: '/profile', color: 'var(--success)', colorRaw: '#059669' },
]

function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [recentBookings, setRecentBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [ritualStatus, setRitualStatus] = useState(null)
  const [showRitualModal, setShowRitualModal] = useState(false)

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning'
    if (h < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [statsRes, bookingsRes] = await Promise.all([bookingAPI.getStats(), bookingAPI.getMyBookings()])
        const byStatus = statsRes.data?.byStatus || []
        const getCount = (s) => (byStatus.find(x => x._id === s) || {}).count || 0
        setStats({ total: statsRes.data?.total || 0, pending: getCount('pending'), approved: getCount('approved'), rejected: getCount('rejected') })
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
    { icon: <ClipboardText size={22} weight="duotone" />, label: 'Total Bookings', value: stats.total, color: 'var(--primary)', bg: 'var(--primary-subtle)' },
    { icon: <Hourglass size={22} weight="duotone" />, label: 'Pending', value: stats.pending, color: 'var(--warning)', bg: 'var(--warning-subtle)' },
    { icon: <CheckCircle size={22} weight="duotone" />, label: 'Approved', value: stats.approved, color: 'var(--success)', bg: 'var(--success-subtle)' },
    { icon: <XCircle size={22} weight="duotone" />, label: 'Rejected', value: stats.rejected, color: 'var(--error)', bg: 'var(--error-subtle)' },
  ]

  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />

      {/* Ritual banner */}
      <AnimatePresence>
        {ritualStatus && (
          <motion.div
            initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            style={{
              background: ritualStatus.hasPaid
                ? 'linear-gradient(135deg, var(--success), #166534)'
                : ritualStatus.isPending
                ? 'linear-gradient(135deg, #92400e, var(--warning))'
                : 'linear-gradient(135deg, #1a0000, var(--maroon))',
              padding: '13px 28px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22 }}>
                {ritualStatus.hasPaid ? '✓' : ritualStatus.isPending ? '' : '🪔'}
              </span>
              <div>
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'white' }}>
                  {ritualStatus.hasPaid ? `Annual Paid! (${ritualStatus.year})` : ritualStatus.isPending ? 'Cash Payment Pending Admin Approval' : `Annual Ritual Payment Due — ${ritualStatus.year}`}
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.65)' }}>
                  {ritualStatus.hasPaid ? 'Payment confirmed! Download your receipt below.' : ritualStatus.isPending ? 'Your cash payment request is being reviewed.' : `₹${(ritualStatus.fee || 1200).toLocaleString()} — Pooja Shulk for ${ritualStatus.year}`}
                </div>
              </div>
            </div>
            {!ritualStatus.isPending && !ritualStatus.hasPaid && (
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={() => setShowRitualModal(true)}
                style={{
                  padding: '9px 20px', borderRadius: 'var(--radius-full)', border: 'none',
                  cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--maroon)',
                  background: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'inherit',
                }}>
                <CreditCard size={15} weight="bold" /> Pay Now
              </motion.button>
            )}
            {ritualStatus.hasPaid && (
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={() => setShowRitualModal(true)}
                style={{
                  padding: '9px 20px', borderRadius: 'var(--radius-full)', border: 'none',
                  cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 800, color: '#064e3b',
                  background: '#a7f3d0', display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'inherit',
                }}>
                <DownloadSimple size={15} weight="bold" /> Download Receipt
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a0000 0%, #5a0e0e 50%, #c94a1a 100%)',
        padding: '44px 32px', position: 'relative', overflow: 'hidden',
      }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(247,201,72,0.06)' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.5)', marginBottom: 5, fontWeight: 500 }}>
              {getGreeting()} 👋
            </p>
            <h1 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 900, color: 'white', marginBottom: 6 }}>
              Welcome back, <span style={{ color: 'var(--secondary)' }}>{user?.name || 'Member'}</span>!
            </h1>
            <p style={{ fontSize: 'var(--text-base)', color: 'rgba(255,255,255,0.5)', maxWidth: 480 }}>
              Manage your hall bookings, check availability and stay updated with notifications.
            </p>
          </motion.div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 32px' }}>

        {/* Stat cards */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginBottom: 32 }}>
          {statCards.map((card, i) => (
            <motion.div key={i} whileHover={{ y: -4, boxShadow: 'var(--shadow-lg)' }}
              style={{ ...cardStyle, glass: false, transition: 'box-shadow 0.25s ease, transform 0.25s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                  {card.icon}
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, color: card.color }}>
                    {loading ? '—' : card.value}
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontWeight: 500 }}>{card.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Two-column grid — responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 24 }}>

          {/* Quick actions */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={cardStyle}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--maroon)', marginBottom: 18 }}>
              Quick Actions
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {quickActions.map((action, i) => (
                <Link key={i} to={action.path} style={{ textDecoration: 'none' }}>
                  <motion.div whileHover={{ scale: 1.03, boxShadow: `0 8px 20px ${action.colorRaw}18` }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: '16px', borderRadius: 'var(--radius-lg)',
                      background: `${action.colorRaw}08`, border: `1px solid ${action.colorRaw}14`,
                      cursor: 'pointer', transition: 'box-shadow 0.2s',
                    }}>
                    <div style={{ color: action.color, marginBottom: 8 }}>{action.icon}</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{action.label}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{action.desc}</div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Recent bookings */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--maroon)' }}>Recent Bookings</h3>
              <Link to="/my-bookings" style={{ textDecoration: 'none' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  View All <ArrowRight size={13} weight="bold" />
                </span>
              </Link>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ height: 52, borderRadius: 'var(--radius-md)', background: 'var(--neutral-100)', animation: 'pulse 1.5s infinite' }} />
                ))}
              </div>
            ) : recentBookings.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 20px', textAlign: 'center' }}>
                <Building size={52} weight="duotone" style={{ color: 'var(--neutral-300)', marginBottom: 14 }} />
                <p style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--maroon)', marginBottom: 6 }}>No bookings yet</p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 18 }}>Your booking history will appear here</p>
                <Link to="/booking" style={{ textDecoration: 'none' }}>
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    style={{
                      padding: '10px 22px', borderRadius: 'var(--radius-full)', border: 'none',
                      cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'white',
                      background: 'linear-gradient(135deg, var(--primary), var(--maroon))',
                      display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'inherit',
                    }}>
                    Book Now <ArrowRight size={13} weight="bold" />
                  </motion.button>
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentBookings.map((booking, i) => {
                  const st = STATUS_COLORS[booking.status] || STATUS_COLORS.pending
                  return (
                    <motion.div key={booking._id || i}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '11px 13px', borderRadius: 'var(--radius-md)',
                        background: 'var(--neutral-50)', border: '1px solid var(--border)',
                      }}>
                      <Building size={18} weight="duotone" style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--maroon)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {booking.eventName}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                          {new Date(booking.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-full)', background: st.bg, color: st.text, fontSize: 'var(--text-xs)', fontWeight: 700, flexShrink: 0 }}>
                        {st.label}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Profile summary */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ marginTop: 24, ...cardStyle, display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
          <div style={{
            width: 68, height: 68, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--maroon))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'white', flexShrink: 0,
          }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--maroon)', marginBottom: 3 }}>{user?.name || 'Member'}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 1 }}>{user?.email || '—'}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{user?.phone || '—'}</div>
          </div>
          <Link to="/profile" style={{ textDecoration: 'none' }}>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              style={{
                padding: '9px 20px', borderRadius: 'var(--radius-full)',
                border: '1.5px solid var(--primary-border)',
                cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 600,
                color: 'var(--primary)', background: 'transparent', fontFamily: 'inherit',
              }}>
              Edit Profile
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
          try { const res = await ritualAPI.getMyStatus(); setRitualStatus(res.data) } catch { /* ignore */ }
        }}
      />
    </div>
  )
}

export default Dashboard
