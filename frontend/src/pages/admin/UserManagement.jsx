import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AdminSidebar } from './AdminDashboard'
import { adminAPI } from '../../utils/api'

function UserManagement() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await adminAPI.getAllUsers()
      setUsers(res.data || [])
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleToggle = async (userId) => {
    try {
      setTogglingId(userId)
      await adminAPI.toggleUserStatus(userId)
      await fetchUsers()
    } catch (err) {
      alert(err.message || 'Failed to toggle user status')
    } finally {
      setTogglingId(null)
    }
  }

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search)
  )

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--background)' }}><AdminSidebar />
      <div style={{ flex: 1, padding: '40px 36px', height: '100vh', overflowY: 'auto'  }}>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--maroon)', marginBottom: 6 }}>User Management</h1>
          <p style={{ fontSize: 14, color: '#9ca3af' }}>View and manage all registered users</p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ marginBottom: 24 }}>
          <input
            type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Search by name, email or phone..."
            style={{
              width: '100%', maxWidth: 480,
              padding: '13px 18px', borderRadius: 14,
              border: '2px solid #ede8e0', outline: 'none',
              fontSize: 14, color: 'var(--text)',
              background: 'rgba(255,255,255,0.92)',
              boxSizing: 'border-box',
            }}
          />
        </motion.div>

        {loading ? (
          <div style={{ borderRadius: 24, padding: '80px 32px', background: 'rgba(255,255,255,0.92)', border: '1.5px solid rgba(255,107,53,0.08)', textAlign: 'center' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid rgba(255,107,53,0.2)', borderTop: '4px solid #FF6B35', margin: '0 auto 20px' }} />
            <p style={{ fontSize: 15, color: '#9ca3af' }}>Loading users...</p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              borderRadius: 24, padding: '80px 32px',
              background: 'rgba(255,255,255,0.92)',
              border: '1.5px solid rgba(255,107,53,0.08)',
              boxShadow: '0 4px 20px rgba(139,26,26,0.06)',
              textAlign: 'center',
            }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>👥</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--maroon)', marginBottom: 8 }}>
              {search ? 'No users found' : 'No users registered yet'}
            </h3>
            <p style={{ fontSize: 14, color: '#9ca3af' }}>
              {search ? 'Try a different search term' : 'Users will appear here once they register'}
            </p>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((user, i) => (
              <motion.div key={user._id || i}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -3, boxShadow: '0 16px 40px rgba(139,26,26,0.1)' }}
                style={{
                  borderRadius: 18, padding: '20px 24px',
                  background: 'rgba(255,255,255,0.92)',
                  border: '1.5px solid rgba(255,107,53,0.08)',
                  boxShadow: '0 4px 20px rgba(139,26,26,0.06)',
                  display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                  transition: 'box-shadow 0.3s ease',
                }}>
                <div style={{
                  width: 46, height: 46, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FF6B35, #8B1A1A)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 800, color: 'white', flexShrink: 0,
                }}>
                  {user.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--maroon)', marginBottom: 3 }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: 13, color: '#9ca3af' }}>{user.email}</div>
                </div>
                <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{user.phone}</div>
                <div style={{
                  padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                  background: user.role === 'admin' ? 'rgba(139,26,26,0.1)' : 'rgba(22,163,74,0.1)',
                  color: user.role === 'admin' ? '#8B1A1A' : '#16a34a',
                }}>
                  {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                </div>
                <div style={{
                  padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                  background: user.isActive ? 'rgba(22,163,74,0.08)' : 'rgba(239,68,68,0.08)',
                  color: user.isActive ? '#16a34a' : '#ef4444',
                }}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                  onClick={() => handleToggle(user._id)}
                  disabled={togglingId === user._id || user.role === 'admin'}
                  style={{
                    padding: '7px 16px', borderRadius: 10, border: 'none',
                    cursor: user.role === 'admin' ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700,
                    color: user.isActive ? '#ef4444' : '#16a34a',
                    background: user.isActive ? 'rgba(239,68,68,0.08)' : 'rgba(22,163,74,0.08)',
                    opacity: user.role === 'admin' ? 0.4 : 1,
                  }}>
                  {togglingId === user._id ? '...' : user.isActive ? 'Deactivate' : 'Activate'}
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default UserManagement
