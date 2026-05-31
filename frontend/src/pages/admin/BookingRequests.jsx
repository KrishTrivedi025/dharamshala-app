import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AdminSidebar } from './AdminDashboard'
import { adminAPI } from '../../utils/api'

const to12h = (t) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hr = h % 12 || 12
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`
}

const STATUS_COLORS = {
  pending: { color: '#d97706', bg: 'rgba(247,201,72,0.12)', label: 'Pending' },
  approved: { color: '#16a34a', bg: 'rgba(22,163,74,0.1)', label: 'Approved' },
  rejected: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Rejected' },
  cancelled: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', label: 'Cancelled' },
  completed: { color: '#8B1A1A', bg: 'rgba(139,26,26,0.08)', label: 'Completed' },
}

const FILTERS = ['All', 'Pending', 'Approved', 'Rejected', 'Cancelled']

function BookingRequests() {
  const [filter, setFilter] = useState('All')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [priceInput, setPriceInput] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [modalMode, setModalMode] = useState('review')

  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await adminAPI.getAllBookings()
      setBookings(res.data || [])
    } catch (err) {
      setError(err.message || 'Failed to load booking requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const filtered = filter === 'All'
    ? bookings
    : bookings.filter(b => b.status?.toLowerCase() === filter.toLowerCase())

  const handleApprove = async (booking) => {
    if (!priceInput || isNaN(priceInput) || parseFloat(priceInput) <= 0) {
      setActionError('Please enter a valid price amount before approving.')
      return
    }
    try {
      setActionLoading(true)
      setActionError(null)
      await adminAPI.approveBooking(booking._id, parseFloat(priceInput))
      setSelectedBooking(null)
      setPriceInput('')
      await fetchBookings()
    } catch (err) {
      setActionError(err.message || 'Failed to approve booking')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (booking) => {
    if (!rejectReason.trim()) {
      setActionError('Please provide a reason for rejection.')
      return
    }
    try {
      setActionLoading(true)
      setActionError(null)
      await adminAPI.rejectBooking(booking._id, rejectReason)
      setSelectedBooking(null)
      setRejectReason('')
      await fetchBookings()
    } catch (err) {
      setActionError(err.message || 'Failed to reject booking')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSetPrice = async (booking) => {
    if (!priceInput || isNaN(priceInput) || parseFloat(priceInput) <= 0) {
      setActionError('Please enter a valid price amount.')
      return
    }
    try {
      setActionLoading(true)
      setActionError(null)
      await adminAPI.setBookingPrice(booking._id, parseFloat(priceInput))
      setSelectedBooking(null)
      setPriceInput('')
      await fetchBookings()
    } catch (err) {
      setActionError(err.message || 'Failed to set price')
    } finally {
      setActionLoading(false)
    }
  }

  const openModal = (booking, mode = 'review') => {
    setSelectedBooking(booking)
    setModalMode(mode)
    setPriceInput('')
    setRejectReason('')
    setActionError(null)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--background)' }}><AdminSidebar />
      <div style={{ flex: 1, padding: '40px 36px', height: '100vh', overflowY: 'auto'  }}>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--maroon)', marginBottom: 6 }}>Booking Requests</h1>
          <p style={{ fontSize: 14, color: '#9ca3af' }}>Review and manage all booking requests</p>
        </motion.div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
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
              {f === 'Pending' && bookings.filter(b => b.status === 'pending').length > 0 && (
                <span style={{
                  marginLeft: 6, fontSize: 11,
                  background: filter === 'Pending' ? 'rgba(255,255,255,0.3)' : '#FF6B35',
                  color: 'white', padding: '1px 6px', borderRadius: 99,
                }}>
                  {bookings.filter(b => b.status === 'pending').length}
                </span>
              )}
            </motion.button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{
            borderRadius: 24, padding: '80px 32px',
            background: 'rgba(255,255,255,0.92)',
            border: '1.5px solid rgba(255,107,53,0.08)',
            textAlign: 'center',
          }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{
                width: 48, height: 48, borderRadius: '50%',
                border: '4px solid rgba(255,107,53,0.2)',
                borderTop: '4px solid #FF6B35',
                margin: '0 auto 20px',
              }}
            />
            <p style={{ fontSize: 15, color: '#9ca3af' }}>Loading booking requests...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{
            borderRadius: 24, padding: '48px 32px',
            background: 'rgba(239,68,68,0.05)',
            border: '1.5px solid rgba(239,68,68,0.2)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#ef4444', marginBottom: 8 }}>Failed to load</h3>
            <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 20 }}>{error}</p>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              onClick={fetchBookings}
              style={{
                padding: '12px 24px', borderRadius: 12, border: 'none',
                cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'white',
                background: 'linear-gradient(135deg, #FF6B35, #8B1A1A)',
              }}>
              Try Again
            </motion.button>
          </div>
        )}

        {/* Bookings List */}
        {!loading && !error && (
          filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{
                borderRadius: 24, padding: '80px 32px',
                background: 'rgba(255,255,255,0.92)',
                border: '1.5px solid rgba(255,107,53,0.08)',
                boxShadow: '0 4px 20px rgba(139,26,26,0.06)',
                textAlign: 'center',
              }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>📭</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--maroon)', marginBottom: 8 }}>No requests found</h3>
              <p style={{ fontSize: 14, color: '#9ca3af' }}>
                {filter === 'All' ? 'No booking requests yet' : `No ${filter.toLowerCase()} bookings`}
              </p>
            </motion.div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filtered.map((booking, i) => {
                const statusStyle = STATUS_COLORS[booking.status] || STATUS_COLORS.pending
                return (
                  <motion.div key={booking._id || i}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    whileHover={{ y: -3, boxShadow: '0 16px 40px rgba(139,26,26,0.1)' }}
                    style={{
                      borderRadius: 20, padding: '24px 28px',
                      background: 'rgba(255,255,255,0.92)',
                      border: '1.5px solid rgba(255,107,53,0.08)',
                      boxShadow: '0 4px 20px rgba(139,26,26,0.06)',
                      transition: 'box-shadow 0.3s ease',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--maroon)', marginBottom: 4 }}>
                          {booking.eventName}
                        </div>
                        <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 2 }}>
                          👤 {booking.user?.name} • 📞 {booking.contactPhone}
                        </div>
                        <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 2 }}>
                          📅 {new Date(booking.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {booking.additionalDates && booking.additionalDates.length > 0 && (
                            <span style={{ color: '#d97706', fontWeight: 600 }}>
                              {' '}+ {booking.additionalDates.length} more date{booking.additionalDates.length > 1 ? 's' : ''}
                            </span>
                          )}
                          {' '}• ⏰ {to12h(booking.startTime)} - {to12h(booking.endTime)}
                        </div>
                        {booking.additionalDates && booking.additionalDates.length > 0 && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                            {booking.additionalDates.map((d, i) => (
                              <span key={i} style={{
                                padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                                background: 'rgba(217,119,6,0.08)', color: '#d97706',
                              }}>
                                {new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                            ))}
                          </div>
                        )}
                        <div style={{ fontSize: 13, color: '#9ca3af' }}>
                          👥 {booking.expectedGuests} guests • 🎊 {booking.eventType}
                        </div>
                        {booking.totalAmount > 0 && (
                          <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 700, marginTop: 4 }}>
                            ₹{booking.totalAmount.toLocaleString()}
                          </div>
                        )}
                        {booking.rejectionReason && (
                          <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>
                            Rejection reason: {booking.rejectionReason}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <div style={{
                            padding: '5px 14px', borderRadius: 99,
                            background: statusStyle.bg, color: statusStyle.color,
                            fontSize: 12, fontWeight: 700,
                          }}>
                            {statusStyle.label}
                          </div>
                          {booking.status === 'approved' && (
                            <div style={{
                              padding: '5px 14px', borderRadius: 99,
                              background: booking.paymentStatus === 'paid' ? 'rgba(22,163,74,0.1)' : 'rgba(247,201,72,0.12)',
                              color: booking.paymentStatus === 'paid' ? '#16a34a' : '#d97706',
                              fontSize: 12, fontWeight: 700,
                            }}>
                              {booking.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending'}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>
                          {new Date(booking.createdAt).toLocaleDateString('en-IN')}
                        </div>
                        {booking.status === 'pending' && (
                          <motion.button
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                            onClick={() => openModal(booking)}
                            style={{
                              padding: '8px 18px', borderRadius: 10, border: 'none',
                              cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'white',
                              background: 'linear-gradient(135deg, #FF6B35, #8B1A1A)',
                            }}>
                            Review
                          </motion.button>
                        )}
                        {booking.status === 'approved' && (!booking.totalAmount || booking.totalAmount <= 0) && booking.paymentStatus !== 'paid' && (
                          <motion.button
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                            onClick={() => openModal(booking, 'setPrice')}
                            style={{
                              padding: '8px 18px', borderRadius: 10, border: 'none',
                              cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'white',
                              background: 'linear-gradient(135deg, #16a34a, #166534)',
                            }}>
                            💰 Set Price
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )
        )}

        {/* Review Modal */}
        <AnimatePresence>
          {selectedBooking && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 24,
              }}
              onClick={() => !actionLoading && setSelectedBooking(null)}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                style={{
                  borderRadius: 24, padding: '36px',
                  background: 'white', maxWidth: 520, width: '100%',
                  boxShadow: '0 40px 100px rgba(0,0,0,0.3)',
                }}>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--maroon)', marginBottom: 20 }}>
                  {modalMode === 'setPrice' ? 'Set Booking Price' : 'Review Booking Request'}
                </h3>
                <div style={{ marginBottom: 24 }}>
                  {[
                    { label: 'Event', value: selectedBooking.eventName },
                    { label: 'User', value: selectedBooking.user?.name },
                    { label: 'Phone', value: selectedBooking.contactPhone },
                    { label: 'Date', value: new Date(selectedBooking.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) + (selectedBooking.additionalDates && selectedBooking.additionalDates.length > 0 ? ` + ${selectedBooking.additionalDates.map(d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })).join(', ')}` : '') },
                    { label: 'Time', value: `${selectedBooking.startTime} – ${selectedBooking.endTime}` },
                    { label: 'Guests', value: selectedBooking.expectedGuests },
                    { label: 'Type', value: selectedBooking.eventType },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #f5ede0' }}>
                      <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 700, minWidth: 80 }}>{item.label}</span>
                      <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{item.value}</span>
                    </div>
                  ))}
                  {selectedBooking.specialRequests && (
                    <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,107,53,0.04)', border: '1px solid rgba(255,107,53,0.12)' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 4, textTransform: 'uppercase' }}>Special Requests</div>
                      <div style={{ fontSize: 13, color: '#6b7280' }}>{selectedBooking.specialRequests}</div>
                    </div>
                  )}
                </div>

                {actionError && (
                  <div style={{
                    marginBottom: 16, padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    fontSize: 13, color: '#ef4444', fontWeight: 600,
                  }}>
                    ⚠️ {actionError}
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {modalMode === 'setPrice' ? 'Set Total Price (₹) *' : 'Set Total Price (₹) *'}
                  </label>
                  <input
                    type="number" value={priceInput}
                    onChange={e => { setPriceInput(e.target.value); setActionError(null) }}
                    placeholder="Enter booking price (required to approve)"
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: 12,
                      border: '2px solid #ede8e0', outline: 'none', fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {modalMode === 'review' && (
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Rejection Reason (required to reject)
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={e => { setRejectReason(e.target.value); setActionError(null) }}
                      placeholder="Reason for rejection..."
                      rows={3}
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: 12,
                        border: '2px solid #ede8e0', outline: 'none', fontSize: 14,
                        resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                      }}
                    />
                  </div>
                )}

                {modalMode === 'setPrice' ? (
                  <div style={{ display: 'flex', gap: 12 }}>
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedBooking(null)}
                      disabled={actionLoading}
                      style={{
                        flex: 1, padding: '13px', borderRadius: 12,
                        border: '2px solid #ede8e0', cursor: 'pointer',
                        fontSize: 14, fontWeight: 700, color: '#6b7280', background: 'white',
                      }}>
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => handleSetPrice(selectedBooking)}
                      disabled={actionLoading}
                      style={{
                        flex: 1, padding: '13px', borderRadius: 12, border: 'none',
                        cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'white',
                        background: actionLoading ? '#ccc' : 'linear-gradient(135deg, #16a34a, #166534)',
                      }}>
                      {actionLoading ? '...' : '💰 Set Price'}
                    </motion.button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 12 }}>
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedBooking(null)}
                      disabled={actionLoading}
                      style={{
                        flex: 1, padding: '13px', borderRadius: 12,
                        border: '2px solid #ede8e0', cursor: 'pointer',
                        fontSize: 14, fontWeight: 700, color: '#6b7280', background: 'white',
                      }}>
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => handleReject(selectedBooking)}
                      disabled={actionLoading}
                      style={{
                        flex: 1, padding: '13px', borderRadius: 12, border: 'none',
                        cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'white',
                        background: actionLoading ? '#ccc' : '#ef4444',
                      }}>
                      {actionLoading ? '...' : '❌ Reject'}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => handleApprove(selectedBooking)}
                      disabled={actionLoading}
                      style={{
                        flex: 1, padding: '13px', borderRadius: 12, border: 'none',
                        cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'white',
                        background: actionLoading ? '#ccc' : 'linear-gradient(135deg, #16a34a, #166534)',
                      }}>
                      {actionLoading ? '...' : '✅ Approve'}
                    </motion.button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default BookingRequests
