import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { adminAPI } from '../../utils/api'

const adminLinks = [
  { path: '/admin', label: 'Dashboard', icon: '📊' },
  { path: '/admin/requests', label: 'Booking Requests', icon: '📋' },
  { path: '/admin/calendar', label: 'Calendar View', icon: '📅' },
  { path: '/admin/locked-dates', label: 'Locked Dates', icon: '🔒' },
  { path: '/admin/users', label: 'User Management', icon: '👥' },
  { path: '/admin/refunds', label: 'Refund Manager', icon: '💰' },
  { path: '/admin/cashbook', label: 'Cashbook', icon: '📒' },
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
        {adminLinks.map((link) => {
          const active = location.pathname === link.path
          return (
            <Link key={link.path} to={link.path} style={{ textDecoration: 'none' }}>
              <motion.div
                whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.1)' }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 12,
                  background: active ? 'rgba(255,107,53,0.25)' : 'transparent',
                  border: active ? '1px solid rgba(255,107,53,0.3)' : '1px solid transparent',
                  transition: 'all 0.2s ease', cursor: 'pointer',
                }}>
                <span style={{ fontSize: 18 }}>{link.icon}</span>
                <span style={{
                  fontSize: 14, fontWeight: active ? 700 : 500,
                  color: active ? '#F7C948' : 'rgba(255,255,255,0.7)',
                }}>
                  {link.label}
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
          <span style={{ fontSize: 18 }}>🏠</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>Back to Site</span>
        </motion.div>
      </Link>
    </div>
  )
}

const STATUS_COLORS = {
  pending: { color: '#d97706', bg: 'rgba(247,201,72,0.12)', label: 'Pending' },
  approved: { color: '#16a34a', bg: 'rgba(22,163,74,0.1)', label: 'Approved' },
  rejected: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Rejected' },
  cancelled: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', label: 'Cancelled' },
  completed: { color: '#8B1A1A', bg: 'rgba(139,26,26,0.08)', label: 'Completed' },
}

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
        const getCount = (status) => {
          const found = byStatus.find(s => s._id === status)
          return found ? found.count : 0
        }

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

  const statCards = [
    { icon: '📋', label: 'Total Bookings', value: statsData.total, color: '#FF6B35', bg: 'rgba(255,107,53,0.08)' },
    { icon: '⏳', label: 'Pending Requests', value: statsData.pending, color: '#d97706', bg: 'rgba(247,201,72,0.08)' },
    { icon: '✅', label: 'Approved', value: statsData.approved, color: '#16a34a', bg: 'rgba(22,163,74,0.08)' },
    { icon: '👥', label: 'Total Users', value: statsData.totalUsers, color: '#8B1A1A', bg: 'rgba(139,26,26,0.08)' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--background)' }}><AdminSidebar />
      <div style={{ flex: 1, padding: '40px 36px', height: '100vh', overflowY: 'auto'  }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--maroon)', marginBottom: 6 }}>
            Admin Dashboard
          </h1>
          <p style={{ fontSize: 14, color: '#9ca3af' }}>
            Welcome back, <strong>{user?.name || 'Admin'}</strong> — here is your overview
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 20, marginBottom: 36,
        }}>
          {statCards.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(139,26,26,0.1)' }}
              style={{
                borderRadius: 20, padding: '24px',
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(20px)',
                border: '1.5px solid rgba(255,107,53,0.08)',
                boxShadow: '0 4px 20px rgba(139,26,26,0.06)',
                transition: 'box-shadow 0.3s ease',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 50, height: 50, borderRadius: 14,
                  background: s.bg, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, border: `1.5px solid ${s.color}20`,
                }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>
                    {loading ? '—' : s.value}
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>{s.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Monthly Revenue Banner */}
        {!loading && statsData.monthlyRevenue > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            style={{
              borderRadius: 20, padding: '20px 28px',
              background: 'linear-gradient(135deg, rgba(22,163,74,0.08), rgba(22,163,74,0.04))',
              border: '1.5px solid rgba(22,163,74,0.2)',
              marginBottom: 24,
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
            <span style={{ fontSize: 28 }}>💰</span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#16a34a' }}>
                ₹{statsData.monthlyRevenue.toLocaleString()}
              </div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Revenue this month</div>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            borderRadius: 24, padding: '28px',
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(20px)',
            border: '1.5px solid rgba(255,107,53,0.08)',
            boxShadow: '0 4px 20px rgba(139,26,26,0.06)',
            marginBottom: 24,
          }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--maroon)', marginBottom: 20 }}>
            Quick Actions
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
            {adminLinks.slice(1).map((link, i) => (
              <Link key={i} to={link.path} style={{ textDecoration: 'none' }}>
                <motion.div
                  whileHover={{ scale: 1.03, boxShadow: '0 8px 24px rgba(255,107,53,0.15)' }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: '18px 16px', borderRadius: 16,
                    background: 'rgba(255,107,53,0.04)',
                    border: '1.5px solid rgba(255,107,53,0.1)',
                    cursor: 'pointer', textAlign: 'center',
                    transition: 'box-shadow 0.2s ease',
                    position: 'relative',
                  }}>
                  {link.label === 'Booking Requests' && statsData.pending > 0 && (
                    <div style={{
                      position: 'absolute', top: 8, right: 8,
                      width: 20, height: 20, borderRadius: '50%',
                      background: '#FF6B35', color: 'white',
                      fontSize: 10, fontWeight: 900,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {statsData.pending}
                    </div>
                  )}
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{link.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--maroon)' }}>{link.label}</div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Recent Bookings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            borderRadius: 24, padding: '28px',
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(20px)',
            border: '1.5px solid rgba(255,107,53,0.08)',
            boxShadow: '0 4px 20px rgba(139,26,26,0.06)',
          }}>
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
                  border: '3px solid rgba(255,107,53,0.2)',
                  borderTop: '3px solid #FF6B35',
                  margin: '0 auto',
                }}
              />
            </div>
          ) : statsData.recentBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 14 }}>📭</div>
              <p style={{ fontSize: 14, color: '#9ca3af' }}>No booking requests yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {statsData.recentBookings.map((booking, i) => {
                const st = STATUS_COLORS[booking.status] || STATUS_COLORS.pending
                return (
                  <div key={booking._id || i} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', borderRadius: 14,
                    background: 'rgba(255,107,53,0.03)',
                    border: '1.5px solid rgba(255,107,53,0.06)',
                  }}>
                    <div style={{ fontSize: 20 }}>🏛️</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--maroon)' }}>{booking.eventName}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>
                        {booking.user?.name} • {new Date(booking.eventDate).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                    <div style={{
                      padding: '4px 12px', borderRadius: 99,
                      background: st.bg, color: st.color,
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
