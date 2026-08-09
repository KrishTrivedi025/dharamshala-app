import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AdminLayout, useIsMobile } from './AdminDashboard'
import { adminAPI } from '../../utils/api'
import {
  User, Phone, CalendarBlank, Clock, Users, Confetti,
  CurrencyCircleDollar, CheckCircle, X, WarningCircle, Tray,
} from '@phosphor-icons/react'
import { cardStyleSolid, STATUS_COLORS, modalOverlay, modalContent, inputStyle as themeInput } from '../../styles/theme'

const to12h = (t) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hr = h % 12 || 12
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`
}

const FILTERS = ['All', 'Pending', 'Approved', 'Rejected', 'Cancelled']

const PAGE_SIZE_BR = 8

function BookingRequests() {
  const isMobile = useIsMobile()
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
  const [page, setPage] = useState(1)

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

  useEffect(() => { fetchBookings() }, [])
  useEffect(() => { setPage(1) }, [filter])

  const filtered = filter === 'All'
    ? bookings
    : bookings.filter(b => b.status?.toLowerCase() === filter.toLowerCase())
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE_BR))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE_BR, page * PAGE_SIZE_BR)

  const handleApprove = async (booking) => {
    if (!priceInput || isNaN(priceInput) || parseFloat(priceInput) <= 0) {
      setActionError('Please enter a valid price amount before approving.')
      return
    }
    try {
      setActionLoading(true); setActionError(null)
      await adminAPI.approveBooking(booking._id, parseFloat(priceInput))
      setSelectedBooking(null); setPriceInput('')
      await fetchBookings()
    } catch (err) {
      setActionError(err.message || 'Failed to approve booking')
    } finally { setActionLoading(false) }
  }

  const handleReject = async (booking) => {
    if (!rejectReason.trim()) {
      setActionError('Please provide a reason for rejection.')
      return
    }
    try {
      setActionLoading(true); setActionError(null)
      await adminAPI.rejectBooking(booking._id, rejectReason)
      setSelectedBooking(null); setRejectReason('')
      await fetchBookings()
    } catch (err) {
      setActionError(err.message || 'Failed to reject booking')
    } finally { setActionLoading(false) }
  }

  const handleSetPrice = async (booking) => {
    if (!priceInput || isNaN(priceInput) || parseFloat(priceInput) <= 0) {
      setActionError('Please enter a valid price amount.')
      return
    }
    try {
      setActionLoading(true); setActionError(null)
      await adminAPI.setBookingPrice(booking._id, parseFloat(priceInput))
      setSelectedBooking(null); setPriceInput('')
      await fetchBookings()
    } catch (err) {
      setActionError(err.message || 'Failed to set price')
    } finally { setActionLoading(false) }
  }

  const openModal = (booking, mode = 'review') => {
    setSelectedBooking(booking); setModalMode(mode)
    setPriceInput(''); setRejectReason(''); setActionError(null)
  }

  return (
    <AdminLayout>
      
      <div style={{ padding: isMobile ? '20px 14px' : '40px 36px' }}>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: isMobile ? 16 : 32 }}>
          <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, color: 'var(--maroon)', marginBottom: 4 }}>Booking Requests</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Review and manage all booking requests</p>
        </motion.div>

        {/* Filters — horizontally scrollable pill tabs */}
        <div style={{ marginBottom: 28, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div style={{ display: 'flex', gap: 8, paddingBottom: 4, width: 'max-content' }}>
            {FILTERS.map((f) => {
              const pendingCount = bookings.filter(b => b.status === 'pending').length
              const active = filter === f
              const label = f === 'Pending' && pendingCount > 0 ? `Pending (${pendingCount})` : f
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
                  {label}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ ...cardStyleSolid, padding: '80px 32px', textAlign: 'center' }}>
            <motion.div
              animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{
                width: 48, height: 48, borderRadius: '50%',
                border: '4px solid var(--primary-subtle)',
                borderTop: '4px solid var(--primary)',
                margin: '0 auto 20px',
              }}
            />
            <p style={{ fontSize: 15, color: 'var(--text-muted)' }}>Loading booking requests...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{
            ...cardStyleSolid, padding: '48px 32px', textAlign: 'center',
            background: 'var(--error-subtle)', border: '1.5px solid rgba(220,38,38,0.2)',
          }}>
            <WarningCircle size={48} weight="duotone" color="var(--error)" style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--error)', marginBottom: 8 }}>Failed to load</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>{error}</p>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              onClick={fetchBookings}
              style={{
                padding: '12px 24px', borderRadius: 12, border: 'none',
                cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'white',
                background: 'linear-gradient(135deg, var(--primary), var(--maroon))',
              }}>
              Try Again
            </motion.button>
          </div>
        )}

        {/* Bookings List */}
        {!loading && !error && (
          filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ ...cardStyleSolid, padding: '80px 32px', textAlign: 'center' }}>
              <Tray size={56} weight="duotone" color="var(--text-muted)" style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--maroon)', marginBottom: 8 }}>No requests found</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                {filter === 'All' ? 'No booking requests yet' : `No ${filter.toLowerCase()} bookings`}
              </p>
            </motion.div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {paginated.map((booking, i) => {
                const statusStyle = STATUS_COLORS[booking.status] || STATUS_COLORS.pending
                return (
                  <motion.div key={booking._id || i}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    whileHover={{ y: -3, boxShadow: 'var(--shadow-xl)' }}
                    style={{ ...cardStyleSolid, padding: '24px 28px', transition: 'box-shadow 0.3s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--maroon)', marginBottom: 4 }}>
                          {booking.eventName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>
                          <User size={13} /> {booking.user?.name}
                          <span style={{ marginLeft: 4 }}>•</span>
                          <Phone size={13} /> {booking.contactPhone}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>
                          <CalendarBlank size={13} />
                          {new Date(booking.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {booking.additionalDates?.length > 0 && (
                            <span style={{ color: 'var(--warning-text)', fontWeight: 600 }}>
                              {' '}+ {booking.additionalDates.length} more date{booking.additionalDates.length > 1 ? 's' : ''}
                            </span>
                          )}
                          <span style={{ marginLeft: 4 }}>•</span>
                          <Clock size={13} /> {to12h(booking.startTime)} - {to12h(booking.endTime)}
                        </div>
                        {booking.additionalDates?.length > 0 && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                            {booking.additionalDates.map((d, idx) => (
                              <span key={idx} style={{
                                padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                                background: 'var(--warning-subtle)', color: 'var(--warning-text)',
                              }}>
                                {new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                            ))}
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                          <Users size={13} /> {booking.expectedGuests} guests
                          <span style={{ marginLeft: 4 }}>•</span>
                          <Confetti size={13} /> {booking.eventType}
                        </div>
                        {booking.totalAmount > 0 && (
                          <div style={{ fontSize: 13, color: 'var(--success-text)', fontWeight: 700, marginTop: 4 }}>
                            ₹{booking.totalAmount.toLocaleString()}
                          </div>
                        )}
                        {booking.rejectionReason && (
                          <div style={{ fontSize: 12, color: 'var(--error-text)', marginTop: 4 }}>
                            Rejection reason: {booking.rejectionReason}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <div style={{
                            padding: '5px 14px', borderRadius: 99,
                            background: statusStyle.bg, color: statusStyle.text,
                            fontSize: 12, fontWeight: 700,
                          }}>
                            {statusStyle.label}
                          </div>
                          {booking.status === 'approved' && (
                            <div style={{
                              padding: '5px 14px', borderRadius: 99,
                              background: booking.paymentStatus === 'paid' ? 'var(--success-subtle)' : 'var(--warning-subtle)',
                              color: booking.paymentStatus === 'paid' ? 'var(--success-text)' : 'var(--warning-text)',
                              fontSize: 12, fontWeight: 700,
                            }}>
                              {booking.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending'}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {new Date(booking.createdAt).toLocaleDateString('en-IN')}
                        </div>
                        {booking.status === 'pending' && (
                          <motion.button
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                            onClick={() => openModal(booking)}
                            style={{
                              padding: '8px 18px', borderRadius: 10, border: 'none',
                              cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'white',
                              background: 'linear-gradient(135deg, var(--primary), var(--maroon))',
                            }}>
                            Review
                          </motion.button>
                        )}
                        {booking.status === 'approved' && (!booking.totalAmount || booking.totalAmount <= 0) && booking.paymentStatus !== 'paid' && (
                          <motion.button
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                            onClick={() => openModal(booking, 'setPrice')}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              padding: '8px 18px', borderRadius: 10, border: 'none',
                              cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'white',
                              background: 'linear-gradient(135deg, var(--success), #166534)',
                            }}>
                            <CurrencyCircleDollar size={14} /> Set Price
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '8px 0' }}>
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
          )
        )}

        {/* Review Modal */}
        <AnimatePresence>
          {selectedBooking && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={modalOverlay}
              onClick={() => !actionLoading && setSelectedBooking(null)}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                style={modalContent}>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--maroon)', marginBottom: 20 }}>
                  {modalMode === 'setPrice' ? 'Set Booking Price' : 'Review Booking Request'}
                </h3>
                <div style={{ marginBottom: 24 }}>
                  {[
                    { label: 'Event',  value: selectedBooking.eventName },
                    { label: 'User',   value: selectedBooking.user?.name },
                    { label: 'Phone',  value: selectedBooking.contactPhone },
                    { label: 'Date',   value: new Date(selectedBooking.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) + (selectedBooking.additionalDates?.length > 0 ? ` + ${selectedBooking.additionalDates.map(d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })).join(', ')}` : '') },
                    { label: 'Time',   value: `${selectedBooking.startTime} – ${selectedBooking.endTime}` },
                    { label: 'Guests', value: selectedBooking.expectedGuests },
                    { label: 'Type',   value: selectedBooking.eventType },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 700, minWidth: 80 }}>{item.label}</span>
                      <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{item.value}</span>
                    </div>
                  ))}
                  {selectedBooking.specialRequests && (
                    <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'var(--primary-subtle)', border: '1px solid var(--primary-border)' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Special Requests</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{selectedBooking.specialRequests}</div>
                    </div>
                  )}
                </div>

                {actionError && (
                  <div style={{
                    marginBottom: 16, padding: '10px 14px', borderRadius: 10,
                    background: 'var(--error-subtle)', border: '1px solid rgba(220,38,38,0.2)',
                    fontSize: 13, color: 'var(--error-text)', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <WarningCircle size={16} /> {actionError}
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Set Total Price (₹) *
                  </label>
                  <input
                    type="number" value={priceInput}
                    onChange={e => { setPriceInput(e.target.value); setActionError(null) }}
                    placeholder="Enter booking price (required to approve)"
                    style={themeInput()}
                  />
                </div>

                {modalMode === 'review' && (
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Rejection Reason (required to reject)
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={e => { setRejectReason(e.target.value); setActionError(null) }}
                      placeholder="Reason for rejection..."
                      rows={3}
                      style={{ ...themeInput(), resize: 'none' }}
                    />
                  </div>
                )}

                {modalMode === 'setPrice' ? (
                  <div style={{ display: 'flex', gap: 12 }}>
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedBooking(null)} disabled={actionLoading}
                      style={{ flex: 1, padding: '13px', borderRadius: 12, border: '2px solid var(--border)', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', background: 'white' }}>
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => handleSetPrice(selectedBooking)} disabled={actionLoading}
                      style={{
                        flex: 1, padding: '13px', borderRadius: 12, border: 'none',
                        cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        background: actionLoading ? 'var(--neutral-300)' : 'linear-gradient(135deg, var(--success), #166534)',
                      }}>
                      <CurrencyCircleDollar size={16} /> {actionLoading ? 'Saving...' : 'Set Price'}
                    </motion.button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 12 }}>
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedBooking(null)} disabled={actionLoading}
                      style={{ flex: 1, padding: '13px', borderRadius: 12, border: '2px solid var(--border)', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', background: 'white' }}>
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => handleReject(selectedBooking)} disabled={actionLoading}
                      style={{
                        flex: 1, padding: '13px', borderRadius: 12, border: 'none',
                        cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        background: actionLoading ? 'var(--neutral-300)' : 'var(--error)',
                      }}>
                      <X size={16} /> {actionLoading ? '...' : 'Reject'}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => handleApprove(selectedBooking)} disabled={actionLoading}
                      style={{
                        flex: 1, padding: '13px', borderRadius: 12, border: 'none',
                        cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        background: actionLoading ? 'var(--neutral-300)' : 'linear-gradient(135deg, var(--success), #166534)',
                      }}>
                      <CheckCircle size={16} /> {actionLoading ? '...' : 'Approve'}
                    </motion.button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  </AdminLayout>
  )
}

export default BookingRequests
