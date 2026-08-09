import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AdminLayout, useIsMobile } from './AdminDashboard'
import { adminAPI } from '../../utils/api'
import { CurrencyCircleDollar, Tray, User, CalendarBlank, CheckCircle, WarningCircle, XCircle } from '@phosphor-icons/react'
import { cardStyleSolid } from '../../styles/theme'
const REFUND_FILTERS = ['All', 'Pending', 'Processed', 'Failed']

const REFUND_STATUS = {
  pending:   { text: 'var(--warning-text)', bg: 'var(--warning-subtle)', label: 'Pending' },
  processed: { text: 'var(--success-text)', bg: 'var(--success-subtle)', label: 'Processed' },
  failed:    { text: 'var(--error-text)',   bg: 'var(--error-subtle)',   label: 'Failed' },
}

function RefundManager() {
  const isMobile = useIsMobile()
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
      
      <div style={{ padding: isMobile ? '20px 14px' : '40px 36px' }}>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: isMobile ? 16 : 32 }}>
          <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, color: 'var(--maroon)', marginBottom: 4 }}>Refund Manager</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Process and track all cancellation refunds</p>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((refund, i) => {
              const statusStyle = REFUND_STATUS[refund.refundStatus] || REFUND_STATUS.pending
              const isPending = (refund.refundStatus || 'pending') === 'pending'
              const StatusIcon = isPending ? WarningCircle : refund.refundStatus === 'processed' ? CheckCircle : XCircle
              return (
                <motion.div key={refund._id || i}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  style={{ background: 'white', borderRadius: 18, overflow: 'hidden',
                    border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
                    transition: 'box-shadow 0.2s ease' }}>

                  {/* ── ZONE 1: Who — user name + event name + status ── */}
                  <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--maroon)', lineHeight: 1.3, marginBottom: 2 }}>
                          {refund.eventName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-secondary)' }}>
                          <User size={11} weight="duotone" color="var(--primary)" />
                          <span style={{ fontWeight: 600 }}>{refund.user?.name}</span>
                        </div>
                      </div>
                      <span style={{ padding: '4px 11px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
                        background: statusStyle.bg, color: statusStyle.text }}>
                        <StatusIcon size={10} weight="fill" />
                        {statusStyle.label}
                      </span>
                    </div>
                  </div>

                  {/* ── ZONE 2: When — cancellation date ── */}
                  <div style={{ padding: '9px 16px', borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: 5 }}>
                    <CalendarBlank size={12} weight="duotone" color="var(--text-muted)" />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      Cancelled on
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                      {new Date(refund.cancelledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {/* ── ZONE 3: Footer — amount + action ── */}
                  <div style={{ padding: '11px 16px 13px', background: 'var(--neutral-50)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--maroon)', lineHeight: 1 }}>
                        ₹{refund.refundAmount?.toLocaleString() || '0'}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>Refund amount</div>
                    </div>
                    {isPending && (
                      <motion.button
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                        onClick={() => handleProcessRefund(refund._id)}
                        disabled={processingId === refund._id}
                        style={{ flexShrink: 0, padding: '9px 18px', borderRadius: 10, border: 'none',
                          cursor: processingId === refund._id ? 'not-allowed' : 'pointer',
                          fontSize: 13, fontWeight: 700, color: 'white', fontFamily: 'inherit',
                          background: processingId === refund._id
                            ? 'var(--neutral-300)'
                            : 'linear-gradient(135deg, var(--success), #166534)',
                          display: 'flex', alignItems: 'center', gap: 6,
                          boxShadow: processingId === refund._id ? 'none' : '0 2px 10px rgba(5,150,105,0.28)' }}>
                        <CurrencyCircleDollar size={14} />
                        {processingId === refund._id ? 'Processing…' : 'Process Refund'}
                      </motion.button>
                    )}
                  </div>
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
