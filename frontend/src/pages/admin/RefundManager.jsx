import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AdminLayout } from './AdminDashboard'
import { adminAPI } from '../../utils/api'
import { CurrencyCircleDollar, Tray } from '@phosphor-icons/react'
import { cardStyleSolid, adminCardStyle } from '../../styles/theme'
const REFUND_FILTERS = ['All', 'Pending', 'Processed', 'Failed']

const REFUND_STATUS = {
  pending:   { text: 'var(--warning-text)', bg: 'var(--warning-subtle)', label: 'Pending' },
  processed: { text: 'var(--success-text)', bg: 'var(--success-subtle)', label: 'Processed' },
  failed:    { text: 'var(--error-text)',   bg: 'var(--error-subtle)',   label: 'Failed' },
}

function RefundManager() {
  const [refunds, setRefunds] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [processingId, setProcessingId] = useState(null)

  const fetchRefunds = async () => {
    try {
      setLoading(true)
      const res = await adminAPI.getRefunds()
      setRefunds(res.data || [])
    } catch (err) {
      console.error('Failed to fetch refunds:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRefunds() }, [])

  const handleProcessRefund = async (id) => {
    try {
      setProcessingId(id)
      await adminAPI.processRefund(id)
      await fetchRefunds()
    } catch (err) {
      alert(err.message || 'Failed to process refund')
    } finally {
      setProcessingId(null)
    }
  }

  const filtered = filter === 'All'
    ? refunds
    : refunds.filter(r => (r.refundStatus || 'pending').toLowerCase() === filter.toLowerCase())

  return (
    <AdminLayout>
      
      <div style={{ padding: '40px 36px' }}>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--maroon)', marginBottom: 6 }}>Refund Manager</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Process and track all cancellation refunds</p>
        </motion.div>

        {/* Filters — horizontally scrollable pill tabs */}
        <div style={{ marginBottom: 28, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div style={{ display: 'flex', gap: 8, paddingBottom: 4, width: 'max-content' }}>
            {REFUND_FILTERS.map((f) => {
              const active = filter === f
              return (
                <motion.button key={f}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setFilter(f)}
                  style={{
                    flexShrink: 0, padding: '7px 18px', borderRadius: 99,
                    border: active ? 'none' : '1.5px solid var(--border)',
                    cursor: 'pointer', fontSize: 13, fontWeight: 700,
                    background: active ? 'linear-gradient(135deg, var(--primary), var(--maroon))' : 'white',
                    color: active ? 'white' : 'var(--text-secondary)',
                    boxShadow: active ? '0 2px 10px rgba(255,107,53,0.35)' : 'none',
                    transition: 'all 0.2s ease',
                  }}>
                  {f}
                </motion.button>
              )
            })}
          </div>
        </div>

        {loading ? (
          <div style={{ ...cardStyleSolid, padding: '80px 32px', textAlign: 'center' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid var(--primary-subtle)', borderTop: '4px solid var(--primary)', margin: '0 auto 20px' }} />
            <p style={{ fontSize: 15, color: 'var(--text-muted)' }}>Loading refunds...</p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ ...cardStyleSolid, padding: '80px 32px', textAlign: 'center' }}>
            <Tray size={56} weight="duotone" color="var(--text-muted)" style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--maroon)', marginBottom: 8 }}>No refunds found</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              {filter === 'All' ? 'Refund requests will appear here when users cancel paid bookings' : `No ${filter.toLowerCase()} refunds`}
            </p>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map((refund, i) => {
              const statusStyle = REFUND_STATUS[refund.refundStatus] || REFUND_STATUS.pending
              return (
                <motion.div key={refund._id || i}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  whileHover={{ y: -3, boxShadow: 'var(--shadow-xl)' }}
                  style={{
                    ...adminCardStyle,
                    display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap',
                    transition: 'box-shadow 0.3s ease',
                  }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: 14,
                    background: 'var(--primary-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1.5px solid var(--primary-border)', flexShrink: 0,
                  }}>
                    <CurrencyCircleDollar size={22} weight="duotone" color="var(--primary)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--maroon)', marginBottom: 3 }}>
                      {refund.user?.name} — {refund.eventName}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      Cancelled: {new Date(refund.cancelledAt).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--maroon)' }}>
                    ₹{refund.refundAmount?.toLocaleString()}
                  </div>
                  <div style={{
                    padding: '5px 14px', borderRadius: 99,
                    background: statusStyle.bg, color: statusStyle.text,
                    fontSize: 12, fontWeight: 700,
                  }}>
                    {statusStyle.label}
                  </div>
                  {(refund.refundStatus || 'pending') === 'pending' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                      onClick={() => handleProcessRefund(refund._id)}
                      disabled={processingId === refund._id}
                      style={{
                        padding: '8px 18px', borderRadius: 10, border: 'none',
                        cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'white',
                        background: processingId === refund._id ? 'var(--neutral-300)' : 'linear-gradient(135deg, var(--success), #166534)',
                      }}>
                      {processingId === refund._id ? 'Processing...' : 'Process Refund'}
                    </motion.button>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
  </AdminLayout>
  )
}

export default RefundManager
