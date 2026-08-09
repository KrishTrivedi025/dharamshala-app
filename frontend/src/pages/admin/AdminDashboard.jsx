import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { adminAPI } from '../../utils/api'
import {
  ChartBar, ClipboardText, CalendarBlank, LockSimple, Users,
  CurrencyCircleDollar, BookOpen, House, HourglassMedium,
  CheckCircle, Building, Tray,
} from '@phosphor-icons/react'
import { cardStyleSolid, STATUS_COLORS } from '../../styles/theme'

const adminLinks = [
  { path: '/admin',              label: 'Dashboard',        Icon: ChartBar },
  { path: '/admin/requests',    label: 'Booking Requests', Icon: ClipboardText },
  { path: '/admin/calendar',    label: 'Calendar View',    Icon: CalendarBlank },
  { path: '/admin/locked-dates',label: 'Locked Dates',     Icon: LockSimple },
  { path: '/admin/users',       label: 'User Management',  Icon: Users },
  { path: '/admin/refunds',     label: 'Refund Manager',   Icon: CurrencyCircleDollar },
  { path: '/admin/cashbook',    label: 'Cashbook',         Icon: BookOpen },
]

function AdminSidebar() {
  const location = useLocation()
  return (
    <div style={{
      width: 260, flexShrink: 0,
      background: 'linear-gradient(160deg, #1a0000 0%, #5a0e0e 60%, #8B1A1A 100%)',
      height: '100vh', overflowY: 'auto', padding: '32px 16px',
    }}>
      <div style={{ marginBottom: 36, paddingLeft: 12 }}>
        <div style={{ fontSize: 28, marginBottom: 6 }}>🛕</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>Admin Panel</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Dharamshala Booking</div>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {adminLinks.map(({ path, label, Icon }) => {
          const active = location.pathname === path
          return (
            <Link key={path} to={path} style={{ textDecoration: 'none' }}>
              <motion.div
                whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.1)' }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 12,
                  background: active ? 'rgba(255,107,53,0.25)' : 'transparent',
                  border: active ? '1px solid rgba(255,107,53,0.3)' : '1px solid transparent',
                  transition: 'all 0.2s ease', cursor: 'pointer',
                }}>
                <Icon
                  size={20}
                  weight={active ? 'fill' : 'regular'}
                  color={active ? '#F7C948' : 'rgba(255,255,255,0.6)'}
                />
                <span style={{
                  fontSize: 14, fontWeight: active ? 700 : 500,
                  color: active ? '#F7C948' : 'rgba(255,255,255,0.7)',
                }}>
                  {label}
                </span>
                {active && (
                  <div style={{
                    marginLeft: 'auto', width: 6, height: 6,
                    borderRadius: '50%', background: '#F7C948',
                  }} />
                )}
              </motion.div>
            </Link>
          )
        })}
      </nav>
      <Link to="/" style={{ textDecoration: 'none', marginTop: 'auto', display: 'block', paddingTop: 32 }}>
        <motion.div
          whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.08)' }}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', borderRadius: 12,
            border: '1px solid transparent',
            transition: 'all 0.2s ease', cursor: 'pointer',
          }}>
          <House size={20} color="rgba(255,255,255,0.5)" />
          <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>Back to Site</span>
        </motion.div>
      </Link>
    </div>
  )
}

const STAT_META = [
  { Icon: ClipboardText, color: 'var(--primary)',       bg: 'var(--primary-subtle)',  label: 'Total Bookings' },
  { Icon: HourglassMedium, color: 'var(--warning)',     bg: 'var(--warning-subtle)',  label: 'Pending Requests' },
  { Icon: CheckCircle,   color: 'var(--success)',       bg: 'var(--success-subtle)',  label: 'Approved' },
  { Icon: Users,         color: 'var(--maroon)',        bg: 'var(--maroon-subtle)',   label: 'Total Users' },
]

function AdminDashboard() {
  const { user } = useAuth()
  const [statsData, setStatsData] = useState({
    total: 0, pending: 0, approved: 0, totalUsers: 0,
    monthlyRevenue: 0, recentBookings: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const [statsRes, usersRes] = await Promise.all([
          adminAPI.getAdminStats(),
          adminAPI.getAllUsers(),
        ])
        const data = statsRes.data || {}
        const byStatus = data.byStatus || []
        const getCount = (status) => (byStatus.find(s => s._id === status)?.count ?? 0)
        setStatsData({
          total: data.total || 0,
          pending: data.pending || getCount('pending'),
          approved: getCount('approved'),
          totalUsers: usersRes.count || 0,
          monthlyRevenue: data.monthlyRevenue || 0,
          recentBookings: data.recentBookings || [],
        })
      } catch (err) {
        console.error('Admin stats error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const statValues = [statsData.total, statsData.pending, statsData.approved, statsData.totalUsers]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--background)' }}>
      <AdminSidebar />
      <div style={{ flex: 1, padding: '40px 36px', height: '100vh', overflowY: 'auto' }}>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }} style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--maroon)', marginBottom: 6 }}>
            Admin Dashboard
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Welcome back, <strong>{user?.name || 'Admin'}</strong> — here is your overview
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 36 }}>
          {STAT_META.map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4, boxShadow: 'var(--shadow-xl)' }}
              style={{ ...cardStyleSolid, padding: '24px', transition: 'box-shadow 0.3s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 50, height: 50, borderRadius: 14,
                  background: s.bg, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <s.Icon size={24} weight="duotone" color={s.color} />
                </div>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>
                    {loading ? '—' : statValues[i]}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Monthly Revenue Banner */}
        {!loading && statsData.monthlyRevenue > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            style={{
              borderRadius: 20, padding: '20px 28px',
              background: 'var(--success-subtle)',
              border: '1.5px solid rgba(5,150,105,0.2)',
              marginBottom: 24,
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
            <CurrencyCircleDollar size={32} weight="duotone" color="var(--success-text)" />
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--success-text)' }}>
                ₹{statsData.monthlyRevenue.toLocaleString()}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Revenue this month</div>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ ...cardStyleSolid, marginBottom: 24 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--maroon)', marginBottom: 20 }}>
            Quick Actions
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
            {adminLinks.slice(1).map(({ path, label, Icon }, i) => (
              <Link key={i} to={path} style={{ textDecoration: 'none' }}>
                <motion.div
                  whileHover={{ scale: 1.03, boxShadow: 'var(--shadow-lg)' }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: '18px 16px', borderRadius: 16,
                    background: 'var(--primary-subtle)',
                    border: '1.5px solid var(--primary-border)',
                    cursor: 'pointer', textAlign: 'center',
                    transition: 'box-shadow 0.2s ease',
                    position: 'relative',
                  }}>
                  {label === 'Booking Requests' && statsData.pending > 0 && (
                    <div style={{
                      position: 'absolute', top: 8, right: 8,
                      width: 20, height: 20, borderRadius: '50%',
                      background: 'var(--primary)', color: 'white',
                      fontSize: 10, fontWeight: 900,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {statsData.pending}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                    <Icon size={28} weight="duotone" color="var(--maroon)" />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--maroon)' }}>{label}</div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Recent Bookings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={cardStyleSolid}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--maroon)' }}>Recent Booking Requests</h3>
            <Link to="/admin/requests" style={{ textDecoration: 'none', fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
              View All →
            </Link>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  border: '3px solid var(--primary-subtle)',
                  borderTop: '3px solid var(--primary)',
                  margin: '0 auto',
                }}
              />
            </div>
          ) : statsData.recentBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Tray size={48} weight="duotone" color="var(--text-muted)" style={{ marginBottom: 14 }} />
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No booking requests yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {statsData.recentBookings.map((booking, i) => {
                const st = STATUS_COLORS[booking.status] || STATUS_COLORS.pending
                return (
                  <div key={booking._id || i} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', borderRadius: 14,
                    background: 'var(--primary-subtle)',
                    border: '1px solid var(--border)',
                  }}>
                    <Building size={20} weight="duotone" color="var(--primary)" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--maroon)' }}>{booking.eventName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {booking.user?.name} • {new Date(booking.eventDate).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                    <div style={{
                      padding: '4px 12px', borderRadius: 99,
                      background: st.bg, color: st.text,
                      fontSize: 11, fontWeight: 700,
                    }}>
                      {st.label}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export { AdminSidebar }
export default AdminDashboard
