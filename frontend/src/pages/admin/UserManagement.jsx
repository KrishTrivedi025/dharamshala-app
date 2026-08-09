import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AdminLayout, useIsMobile } from './AdminDashboard'
import { adminAPI } from '../../utils/api'
import { MagnifyingGlass, Users, Crown, User } from '@phosphor-icons/react'
import { cardStyleSolid } from '../../styles/theme'
import { ButtonSpinner } from '../../components/ButtonSpinner'

const PAGE_SIZE_UM = 10

function UserManagement() {
  const isMobile = useIsMobile()
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState(null)
  const [focused, setFocused] = useState(false)
  const [page, setPage] = useState(1)

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
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE_UM))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE_UM, page * PAGE_SIZE_UM)
  useEffect(() => { setPage(1) }, [search])

  return (
    <AdminLayout>
      
      <div style={{ padding: isMobile ? '20px 14px' : '40px 36px' }}>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: isMobile ? 16 : 32 }}>
          <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, color: 'var(--maroon)', marginBottom: 4 }}>User Management</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>View and manage all registered users</p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ marginBottom: 24 }}>
          <div style={{
            position: 'relative', maxWidth: isMobile ? '100%' : 480,
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {paginated.map((user, i) => (
              <motion.div key={user._id || i}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ boxShadow: 'var(--shadow-md)' }}
                style={{
                  borderRadius: 12, padding: isMobile ? '10px 12px' : '12px 16px',
                  background: 'var(--surface-solid)', border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'box-shadow 0.2s ease',
                }}>
                {/* Avatar */}
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--primary), var(--maroon))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800, color: 'white',
                }}>
                  {user.name?.charAt(0).toUpperCase() || '?'}
                </div>
                {/* Name + email */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--maroon)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                </div>
                {/* Role badge */}
                <div style={{
                  padding: '3px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, flexShrink: 0,
                  background: user.role === 'admin' ? 'var(--maroon-subtle)' : 'var(--success-subtle)',
                  color: user.role === 'admin' ? 'var(--maroon)' : 'var(--success-text)',
                  display: 'flex', alignItems: 'center', gap: 3,
                }}>
                  {user.role === 'admin' ? <><Crown size={9} weight="fill" /> Admin</> : <><User size={9} weight="fill" /> User</>}
                </div>
                {/* Status badge */}
                <div style={{
                  padding: '3px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, flexShrink: 0,
                  background: user.isActive ? 'var(--success-subtle)' : 'var(--error-subtle)',
                  color: user.isActive ? 'var(--success-text)' : 'var(--error-text)',
                }}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </div>
                {/* Toggle button */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleToggle(user._id)}
                  disabled={togglingId === user._id || user.role === 'admin'}
                  style={{
                    padding: '4px 10px', borderRadius: 8, border: 'none', flexShrink: 0,
                    cursor: user.role === 'admin' ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 700,
                    color: user.isActive ? 'var(--error-text)' : 'var(--success-text)',
                    background: user.isActive ? 'var(--error-subtle)' : 'var(--success-subtle)',
                    opacity: user.role === 'admin' ? 0.4 : 1,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                  {togglingId === user._id
                    ? <><ButtonSpinner light={false} size={11} /> <span>Saving…</span></>
                    : user.isActive ? 'Deactivate' : 'Activate'}
                </motion.button>
              </motion.div>
            ))}
            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '10px 0' }}>
                <motion.button whileTap={{ scale: 0.93 }} disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  style={{ padding: '7px 18px', borderRadius: 99, border: '1.5px solid var(--border)', background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, color: page === 1 ? 'var(--text-muted)' : 'var(--maroon)', opacity: page === 1 ? 0.4 : 1 }}>
                  ← Prev
                </motion.button>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>{page} / {totalPages}</span>
                <motion.button whileTap={{ scale: 0.93 }} disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  style={{ padding: '7px 18px', borderRadius: 99, border: '1.5px solid var(--border)', background: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, color: page === totalPages ? 'var(--text-muted)' : 'var(--maroon)', opacity: page === totalPages ? 0.4 : 1 }}>
                  Next →
                </motion.button>
              </div>
            )}
          </div>
        )}
      </div>
  </AdminLayout>
  )
}

export default UserManagement
