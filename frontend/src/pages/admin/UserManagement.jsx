import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AdminSidebar } from './AdminDashboard'
import { adminAPI } from '../../utils/api'
import { MagnifyingGlass, Users, Crown, User } from '@phosphor-icons/react'
import { cardStyleSolid, adminCardStyle } from '../../styles/theme'

function UserManagement() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState(null)
  const [focused, setFocused] = useState(false)

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
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--background)' }}>
      <AdminSidebar />
      <div style={{ flex: 1, padding: '40px 36px', height: '100vh', overflowY: 'auto' }}>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--maroon)', marginBottom: 6 }}>User Management</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>View and manage all registered users</p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ marginBottom: 24 }}>
          <div style={{
            position: 'relative', maxWidth: 480,
            display: 'flex', alignItems: 'center',
          }}>
            <MagnifyingGlass
              size={16} color="var(--text-muted)"
              style={{ position: 'absolute', left: 14, pointerEvents: 'none' }}
            />
            <input
              type="text" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email or phone..."
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              style={{
                width: '100%', padding: '13px 18px 13px 38px',
                borderRadius: 14, outline: 'none', fontSize: 14, color: 'var(--text)',
                background: 'var(--surface-solid)',
                border: focused ? '2px solid var(--primary)' : '2px solid var(--border)',
                boxShadow: focused ? '0 0 0 3px var(--primary-subtle)' : 'none',
                boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
            />
          </div>
        </motion.div>

        {loading ? (
          <div style={{ ...cardStyleSolid, padding: '80px 32px', textAlign: 'center' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid var(--primary-subtle)', borderTop: '4px solid var(--primary)', margin: '0 auto 20px' }} />
            <p style={{ fontSize: 15, color: 'var(--text-muted)' }}>Loading users...</p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ ...cardStyleSolid, padding: '80px 32px', textAlign: 'center' }}>
            <Users size={56} weight="duotone" color="var(--text-muted)" style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--maroon)', marginBottom: 8 }}>
              {search ? 'No users found' : 'No users registered yet'}
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              {search ? 'Try a different search term' : 'Users will appear here once they register'}
            </p>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((user, i) => (
              <motion.div key={user._id || i}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -3, boxShadow: 'var(--shadow-xl)' }}
                style={{
                  ...adminCardStyle,
                  display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                  transition: 'box-shadow 0.3s ease',
                }}>
                <div style={{
                  width: 46, height: 46, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--maroon))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 800, color: 'white', flexShrink: 0,
                }}>
                  {user.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--maroon)', marginBottom: 3 }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user.email}</div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{user.phone}</div>
                <div style={{
                  padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                  background: user.role === 'admin' ? 'var(--maroon-subtle)' : 'var(--success-subtle)',
                  color: user.role === 'admin' ? 'var(--maroon)' : 'var(--success-text)',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  {user.role === 'admin'
                    ? <><Crown size={12} weight="fill" /> Admin</>
                    : <><User size={12} weight="fill" /> User</>
                  }
                </div>
                <div style={{
                  padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                  background: user.isActive ? 'var(--success-subtle)' : 'var(--error-subtle)',
                  color: user.isActive ? 'var(--success-text)' : 'var(--error-text)',
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
                    color: user.isActive ? 'var(--error-text)' : 'var(--success-text)',
                    background: user.isActive ? 'var(--error-subtle)' : 'var(--success-subtle)',
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
