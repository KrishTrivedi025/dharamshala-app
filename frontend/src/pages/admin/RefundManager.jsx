import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AdminSidebar } from './AdminDashboard'
import { adminAPI } from '../../utils/api'

const REFUND_STATUS = {
  pending: { color: '#d97706', bg: 'rgba(247,201,72,0.12)', label: 'Pending' },
  processed: { color: '#16a34a', bg: 'rgba(22,163,74,0.1)', label: 'Processed' },
  failed: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Failed' },
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
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--background)' }}><AdminSidebar />
      <div style={{ flex: 1, padding: '40px 36px', height: '100vh', overflowY: 'auto'  }}>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--maroon)', marginBottom: 6 }}>Refund Manager</h1>
          <p style={{ fontSize: 14, color: '#9ca3af' }}>Process and track all cancellation refunds</p>
        </motion.div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
          {['All', 'Pending', 'Processed', 'Failed'].map((f) => (
            <motion.button key={f} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={() => setFilter(f)}
              style={{
                padding: '9px 20px', borderRadius: 99, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700, transition: 'all 0.25s ease',
                background: filter === f ? 'linear-gradient(135deg, #FF6B35, #8B1A1A)' : 'rgba(255,255,255,0.9)',
                color: filter === f ? 'white' : '#6b7280',
                boxShadow: filter === f ? '0 4px 14px rgba(255,107,53,0.35)' : '0 2px 8px rgba(0,0,0,0.06)',
              }}>
              {f}
            </motion.button>
          ))}
        </div>

        {loading ? (
          <div style={{ borderRadius: 24, padding: '80px 32px', background: 'rgba(255,255,255,0.92)', border: '1.5px solid rgba(255,107,53,0.08)', textAlign: 'center' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid rgba(255,107,53,0.2)', borderTop: '4px solid #FF6B35', margin: '0 auto 20px' }} />
            <p style={{ fontSize: 15, color: '#9ca3af' }}>Loading refunds...</p>
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
            <div style={{ fontSize: 56, marginBottom: 16 }}>💰</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--maroon)', marginBottom: 8 }}>No refunds found</h3>
            <p style={{ fontSize: 14, color: '#9ca3af' }}>
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
                  whileHover={{ y: -3, boxShadow: '0 16px 40px rgba(139,26,26,0.1)' }}
                  style={{
                    borderRadius: 20, padding: '22px 26px',
                    background: 'rgba(255,255,255,0.92)',
                    border: '1.5px solid rgba(255,107,53,0.08)',
                    boxShadow: '0 4px 20px rgba(139,26,26,0.06)',
                    display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap',
                    transition: 'box-shadow 0.3s ease',
                  }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: 14,
                    background: 'rgba(255,107,53,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, border: '1.5px solid rgba(255,107,53,0.15)', flexShrink: 0,
                  }}>
                    💰
                  </div>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--maroon)', marginBottom: 3 }}>
                      {refund.user?.name} — {refund.eventName}
                    </div>
                    <div style={{ fontSize: 13, color: '#9ca3af' }}>
                      Cancelled: {new Date(refund.cancelledAt).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--maroon)' }}>
                    ₹{refund.refundAmount?.toLocaleString()}
                  </div>
                  <div style={{
                    padding: '5px 14px', borderRadius: 99,
                    background: statusStyle.bg, color: statusStyle.color,
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
                        background: processingId === refund._id ? '#ccc' : 'linear-gradient(135deg, #16a34a, #166534)',
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
    </div>
  )
}

export default RefundManager
