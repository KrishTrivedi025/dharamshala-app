import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AdminLayout, useIsMobile } from './AdminDashboard'
import { memberAPI } from '../../utils/api'
import { MagnifyingGlass, UsersThree, Plus, UploadSimple, PencilSimple, Trash } from '@phosphor-icons/react'
import { cardStyleSolid, btnPrimary, btnSecondary, modalOverlay, modalContent, inputStyle } from '../../styles/theme'
import { ButtonSpinner } from '../../components/ButtonSpinner'

const PAGE_SIZE = 12
const emptyForm = { name: '', phone: '', email: '', address: '', notes: '' }

function Members() {
  const isMobile = useIsMobile()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [focused, setFocused] = useState(false)
  const [page, setPage] = useState(1)
  const [error, setError] = useState(null)

  const [showModal, setShowModal] = useState(false)
  const [editMember, setEditMember] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkSaving, setBulkSaving] = useState(false)

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const res = await memberAPI.getAll()
      setMembers(res.data || [])
    } catch (err) {
      console.error('Failed to fetch members:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMembers() }, [])

  const filtered = members.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.phone?.includes(search) ||
    m.email?.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  useEffect(() => { setPage(1) }, [search])

  const openAdd = () => {
    setEditMember(null)
    setFormData(emptyForm)
    setShowModal(true)
  }

  const openEdit = (member) => {
    setEditMember(member)
    setFormData({
      name: member.name || '', phone: member.phone || '',
      email: member.email || '', address: member.address || '',
      notes: member.notes || ''
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) { setError('Name is required'); return }
    try {
      setSaving(true); setError(null)
      if (editMember) {
        await memberAPI.update(editMember._id, formData)
      } else {
        await memberAPI.create(formData)
      }
      setShowModal(false); await fetchMembers()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try {
      setDeleting(true)
      await memberAPI.delete(id)
      setDeleteConfirm(null); await fetchMembers()
    } catch (err) { setError(err.message) }
    finally { setDeleting(false) }
  }

  // Parses pasted lines like "Name, Phone, Email" or just "Name" (one per line)
  const parseBulkText = (text) => text.split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split(',').map(p => p.trim())
      return { name: parts[0] || '', phone: parts[1] || '', email: parts[2] || '' }
    })
    .filter(m => m.name)

  const bulkPreview = parseBulkText(bulkText)

  const handleBulkImport = async () => {
    if (bulkPreview.length === 0) { setError('Paste at least one member name'); return }
    try {
      setBulkSaving(true); setError(null)
      const res = await memberAPI.bulkCreate(bulkPreview)
      setShowBulkModal(false); setBulkText('')
      await fetchMembers()
      setError(null)
      alert(`${res.count} member(s) imported successfully`)
    } catch (err) { setError(err.message) }
    finally { setBulkSaving(false) }
  }

  return (
    <AdminLayout>
      <div style={{ padding: isMobile ? '20px 14px' : '40px 36px' }}>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: isMobile ? 16 : 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, color: 'var(--maroon)', marginBottom: 4 }}>Members</h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Samaj member directory — {members.length} member{members.length === 1 ? '' : 's'}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowBulkModal(true)}
              style={{ ...btnSecondary, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '9px 16px' }}>
              <UploadSimple size={15} weight="bold" /> Bulk Import
            </motion.button>
            <motion.button whileTap={{ scale: 0.96 }} onClick={openAdd}
              style={{ ...btnPrimary, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '9px 18px' }}>
              <Plus size={15} weight="bold" /> Add Member
            </motion.button>
          </div>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'var(--error-subtle)',
                border: '1px solid rgba(220,38,38,0.2)', color: 'var(--error-text)', fontSize: 13,
                fontWeight: 600, marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
              <span>⚠️ {error}</span>
              <span onClick={() => setError(null)} style={{ cursor: 'pointer' }}>✕</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginBottom: 24 }}>
          <div style={{ position: 'relative', maxWidth: isMobile ? '100%' : 480, display: 'flex', alignItems: 'center' }}>
            <MagnifyingGlass size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, pointerEvents: 'none' }} />
            <input
              type="text" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, phone or email..."
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
            <p style={{ fontSize: 15, color: 'var(--text-muted)' }}>Loading members...</p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ ...cardStyleSolid, padding: '80px 32px', textAlign: 'center' }}>
            <UsersThree size={56} weight="duotone" color="var(--text-muted)" style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--maroon)', marginBottom: 8 }}>
              {search ? 'No members found' : 'No members yet'}
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              {search ? 'Try a different search term' : 'Add members one at a time, or use Bulk Import to paste your full list'}
            </p>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {paginated.map((m, i) => (
              <motion.div key={m._id || i}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                whileHover={{ boxShadow: 'var(--shadow-md)' }}
                style={{
                  borderRadius: 12, padding: isMobile ? '10px 12px' : '12px 16px',
                  background: 'var(--surface-solid)', border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'box-shadow 0.2s ease',
                }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--primary), var(--maroon))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800, color: 'white',
                }}>
                  {m.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--maroon)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {[m.phone, m.email].filter(Boolean).join(' • ') || '—'}
                  </div>
                </div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => openEdit(m)}
                  style={{ background: 'var(--primary-subtle)', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <PencilSimple size={14} color="var(--primary)" />
                </motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setDeleteConfirm(m)}
                  style={{ background: 'var(--error-subtle)', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Trash size={14} color="var(--error-text)" />
                </motion.button>
              </motion.div>
            ))}
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

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={modalOverlay} onClick={() => !saving && setShowModal(false)}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()} style={{ ...modalContent, maxWidth: 480 }}>
                <h3 style={{ fontSize: 19, fontWeight: 800, color: 'var(--maroon)', marginBottom: 20 }}>
                  {editMember ? 'Edit Member' : 'Add Member'}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Name *</label>
                    <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle()} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Phone</label>
                    <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={inputStyle()} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Email</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={inputStyle()} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Address</label>
                    <input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} style={inputStyle()} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Notes</label>
                    <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} style={{ ...inputStyle(), resize: 'none' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                  <motion.button whileTap={{ scale: 0.97 }} disabled={saving} onClick={() => setShowModal(false)}
                    style={{ flex: 1, padding: 13, borderRadius: 12, border: '2px solid var(--border)', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', background: 'white' }}>
                    Cancel
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} disabled={saving} onClick={handleSave}
                    style={{ ...btnPrimary, flex: 1, padding: 13, opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {saving ? <><ButtonSpinner size={13} /> Saving...</> : editMember ? 'Update' : 'Add Member'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bulk Import Modal */}
        <AnimatePresence>
          {showBulkModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={modalOverlay} onClick={() => !bulkSaving && setShowBulkModal(false)}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()} style={{ ...modalContent, maxWidth: 560 }}>
                <h3 style={{ fontSize: 19, fontWeight: 800, color: 'var(--maroon)', marginBottom: 6 }}>Bulk Import Members</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                  Paste one member per line. Format: <code>Name, Phone, Email</code> — phone and email are optional.
                </p>
                <textarea
                  value={bulkText} onChange={e => setBulkText(e.target.value)}
                  placeholder={'Ramesh Trivedi, 9876543210, ramesh@example.com\nSuresh Shah, 9876543211\nMahesh Patel'}
                  rows={10}
                  style={{ ...inputStyle(), resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
                />
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                  {bulkPreview.length} member{bulkPreview.length === 1 ? '' : 's'} detected
                </p>
                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                  <motion.button whileTap={{ scale: 0.97 }} disabled={bulkSaving} onClick={() => setShowBulkModal(false)}
                    style={{ flex: 1, padding: 13, borderRadius: 12, border: '2px solid var(--border)', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', background: 'white' }}>
                    Cancel
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} disabled={bulkSaving || bulkPreview.length === 0} onClick={handleBulkImport}
                    style={{ ...btnPrimary, flex: 1, padding: 13, opacity: (bulkSaving || bulkPreview.length === 0) ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {bulkSaving ? <><ButtonSpinner size={13} /> Importing...</> : `Import ${bulkPreview.length || ''}`}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirm */}
        <AnimatePresence>
          {deleteConfirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={modalOverlay} onClick={() => !deleting && setDeleteConfirm(null)}>
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                onClick={e => e.stopPropagation()} style={{ ...modalContent, maxWidth: 400, textAlign: 'center' }}>
                <Trash size={44} weight="duotone" color="var(--error-text)" style={{ marginBottom: 12 }} />
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--maroon)', marginBottom: 8 }}>Remove {deleteConfirm.name}?</h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>This action cannot be undone.</p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => setDeleteConfirm(null)} disabled={deleting}
                    style={{ flex: 1, padding: 12, borderRadius: 12, border: '2px solid var(--border)', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', background: 'white' }}>Cancel</button>
                  <button onClick={() => handleDelete(deleteConfirm._id)} disabled={deleting}
                    style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'white', background: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {deleting ? <><ButtonSpinner size={13} /> Deleting...</> : 'Delete'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  )
}

export default Members
