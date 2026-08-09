import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import html2canvas from 'html2canvas'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { bookingAPI } from '../utils/api'
import { useLanguage } from '../context/LanguageContext'

const STATUS_CONFIG = {
  pending: { color: '#d97706', bg: 'rgba(247,201,72,0.10)', glow: 'rgba(247,201,72,0.3)', label: 'Pending Review', icon: '⏳', step: 2 },
  approved: { color: '#16a34a', bg: 'rgba(22,163,74,0.08)', glow: 'rgba(22,163,74,0.3)', label: 'Approved', icon: '✅', step: 3 },
  rejected: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', glow: 'rgba(239,68,68,0.3)', label: 'Rejected', icon: '❌', step: -1 },
  cancelled: { color: '#6b7280', bg: 'rgba(107,114,128,0.08)', glow: 'rgba(107,114,128,0.3)', label: 'Cancelled', icon: '🚫', step: -1 },
  completed: { color: '#7c3aed', bg: 'rgba(124,58,237,0.06)', glow: 'rgba(124,58,237,0.3)', label: 'Completed', icon: '🎉', step: 5 },
}

const EVENT_ICONS = {
  wedding: '💍', reception: '🎊', birthday: '🎂', religious: '🙏',
  conference: '💼', meeting: '📋', other: '✨',
}

const FILTERS = ['All', 'Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed']

const to12h = (t) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hr = h % 12 || 12
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`
}

function MyBookings() {
  const { t } = useLanguage()
  const [activeFilter, setActiveFilter] = useState('All')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [payingId, setPayingId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [downloadingReceipt, setDownloadingReceipt] = useState(null)
  const receiptRef = useRef(null)

  const handleDownloadReceipt = async (booking) => {
    setDownloadingReceipt(booking)
    // Wait for the hidden component to render
    setTimeout(async () => {
      if (receiptRef.current) {
        const canvas = await html2canvas(receiptRef.current, {
          useCORS: true,
          scale: 2,
          backgroundColor: '#ffffff'
        })
        const image = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.href = image
        link.download = `Receipt_${booking.eventName.replace(/\s+/g, '_')}_${new Date(booking.eventDate).toLocaleDateString('en-IN')}.png`
        link.click()
        setDownloadingReceipt(null)
      }
    }, 100)
  }

  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await bookingAPI.getMyBookings()
      setBookings(res.data || [])
    } catch (err) {
      setError(err.message || 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBookings() }, [])

  const handleCancel = async (bookingId) => {
    try {
      setCancellingId(bookingId)
      await bookingAPI.cancel(bookingId, cancelReason || 'Cancelled by user')
      setShowCancelModal(null)
      setCancelReason('')
      await fetchBookings()
    } catch (err) {
      alert(err.message || 'Failed to cancel booking')
    } finally {
      setCancellingId(null)
    }
  }

  const handlePayment = async (booking) => {
    try {
      setPayingId(booking._id)
      const orderRes = await bookingAPI.createPaymentOrder(booking._id)
      const { orderId, amount, currency, keyId } = orderRes.data

      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'Dharamshala Hall Booking',
        description: `Payment for ${booking.eventName}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            await bookingAPI.verifyPayment(booking._id, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            await fetchBookings()
            alert('✅ Payment successful!')
          } catch (err) {
            alert('Payment verification failed: ' + (err.message || 'Unknown error'))
          }
        },
        prefill: {
          name: booking.contactName,
          email: booking.contactEmail,
          contact: booking.contactPhone,
        },
        theme: {
          color: '#FF6B35',
          backdrop_color: 'rgba(0,0,0,0.6)',
        },
        modal: {
          ondismiss: () => setPayingId(null),
        }
      }

      const razorpayInstance = new window.Razorpay(options)
      razorpayInstance.open()
    } catch (err) {
      alert('Failed to initiate payment: ' + (err.message || 'Unknown error'))
    } finally {
      setPayingId(null)
    }
  }

  const filtered = activeFilter === 'All'
    ? bookings
    : bookings.filter(b => b.status?.toLowerCase() === activeFilter.toLowerCase())

  const counts = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1
    return acc
  }, {})

  const itemsPerPage = 5
  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const currentBookings = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh', overflow: 'hidden' }}>
      <Navbar />

      {/* Only this middle area scrolls */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(160deg, #1a0000 0%, #4a0c0c 40%, #c94a1a 100%)',
        padding: '56px 32px 48px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative elements */}
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', top: -80, right: -80, width: 260, height: 260, borderRadius: '50%', background: 'rgba(247,201,72,0.04)' }} />
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', bottom: -40, left: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,107,53,0.06)' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 6 }}>
              <motion.span animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}
                style={{ fontSize: 42 }}>📋</motion.span>
              <div>
                <h1 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 900, color: 'white', marginBottom: 4 }}>
                  {t.myBookings.title}
                </h1>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
                  {bookings.length} total booking{bookings.length !== 1 ? 's' : ''} • Track and manage your hall reservations
                </p>
              </div>
            </div>
          </motion.div>

          {/* Stats Row */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
            {[
              { label: t.booking.status_pending,  count: counts.pending || 0,   color: '#F7C948' },
              { label: t.booking.status_approved, count: counts.approved || 0,  color: '#22c55e' },
              { label: t.booking.status_confirmed,count: counts.completed || 0, color: '#a78bfa' },
            ].map(s => (
              <div key={s.label} style={{
                padding: '10px 18px', borderRadius: 14,
                background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{s.label}</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: 'white' }}>{s.count}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px 64px' }}>

        {/* Filter Tabs */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{
            display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28,
            padding: '6px', borderRadius: 16, background: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(255,107,53,0.08)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          }}>
          {FILTERS.map((filter) => {
            const count = filter === 'All' ? bookings.length : (counts[filter.toLowerCase()] || 0)
            return (
              <motion.button
                key={filter}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setActiveFilter(filter); setCurrentPage(1); }}
                style={{
                  padding: '10px 22px', borderRadius: 12, border: 'none',
                  cursor: 'pointer', fontSize: 13, fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'all 0.3s ease',
                  background: activeFilter === filter
                    ? 'linear-gradient(135deg, #FF6B35, #8B1A1A)' : 'transparent',
                  color: activeFilter === filter ? 'white' : '#6b7280',
                  boxShadow: activeFilter === filter ? '0 4px 14px rgba(255,107,53,0.3)' : 'none',
                }}>
                {filter}
                {count > 0 && (
                  <span style={{
                    padding: '1px 7px', borderRadius: 99, fontSize: 11, fontWeight: 800,
                    background: activeFilter === filter ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                    color: activeFilter === filter ? 'white' : '#9ca3af',
                  }}>{count}</span>
                )}
              </motion.button>
            )
          })}
        </motion.div>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              borderRadius: 24, padding: '80px 32px',
              background: 'rgba(255,255,255,0.95)', border: '1.5px solid rgba(255,107,53,0.08)',
              boxShadow: '0 4px 20px rgba(139,26,26,0.06)', textAlign: 'center',
            }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ width: 52, height: 52, borderRadius: '50%', border: '4px solid rgba(255,107,53,0.15)', borderTop: '4px solid #FF6B35', margin: '0 auto 20px' }} />
            <p style={{ fontSize: 15, color: '#9ca3af', fontWeight: 600 }}>Loading your bookings...</p>
          </motion.div>
        )}

        {!loading && error && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{
              borderRadius: 24, padding: '48px 32px',
              background: 'rgba(239,68,68,0.04)', border: '1.5px solid rgba(239,68,68,0.15)',
              textAlign: 'center',
            }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#ef4444', marginBottom: 8 }}>Oops!</h3>
            <p style={{ fontSize: 14, color: '#991b1b', maxWidth: 300, margin: '0 auto 24px' }}>{error}</p>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              onClick={fetchBookings}
              style={{ padding: '12px 24px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'white', background: 'linear-gradient(135deg, #FF6B35, #8B1A1A)' }}>
              Try Again
            </motion.button>
          </motion.div>
        )}

        {/* Bookings */}
        {!loading && !error && (
          <AnimatePresence mode="wait">
            {filtered.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{
                  borderRadius: 28, padding: '80px 32px',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,248,243,0.95))',
                  border: '1.5px solid rgba(255,107,53,0.08)',
                  boxShadow: '0 4px 30px rgba(139,26,26,0.06)', textAlign: 'center',
                }}>
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}
                  style={{ fontSize: 72, marginBottom: 20 }}>📭</motion.div>
                <h3 style={{ fontSize: 22, fontWeight: 900, color: 'var(--maroon)', marginBottom: 10 }}>
                  {t.myBookings.no_bookings}
                </h3>
                <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 28, maxWidth: 340, margin: '0 auto 28px' }}>
                  {activeFilter === 'All'
                    ? t.myBookings.no_bookings_sub
                    : `No ${activeFilter.toLowerCase()} bookings found.`}
                </p>
                <Link to="/booking" style={{ textDecoration: 'none' }}>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 12px 30px rgba(255,107,53,0.4)' }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      padding: '15px 32px', borderRadius: 14, border: 'none',
                      cursor: 'pointer', fontSize: 15, fontWeight: 800, color: 'white',
                      background: 'linear-gradient(135deg, #FF6B35 0%, #c94a1a 50%, #8B1A1A 100%)',
                      boxShadow: '0 6px 20px rgba(255,107,53,0.35)',
                    }}>
                    🏛️ {t.myBookings.book_now}
                  </motion.button>
                </Link>
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {currentBookings.map((booking, i) => {
                  const sc = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending
                  const canCancel = ['pending', 'approved'].includes(booking.status)
                  const needsPayment = booking.status === 'approved' && booking.paymentStatus !== 'paid' && booking.totalAmount > 0
                  const isPaid = booking.paymentStatus === 'paid'
                  const isExpanded = expandedId === booking._id
                  const eventIcon = EVENT_ICONS[booking.eventType] || '🏛️'

                  return (
                    <motion.div key={booking._id || i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      layout
                      style={{
                        borderRadius: 22, overflow: 'hidden',
                        background: 'rgba(255,255,255,0.97)',
                        border: `1.5px solid ${needsPayment ? 'rgba(255,107,53,0.2)' : 'rgba(255,107,53,0.06)'}`,
                        boxShadow: needsPayment
                          ? '0 4px 20px rgba(255,107,53,0.12)'
                          : '0 2px 16px rgba(139,26,26,0.04)',
                        transition: 'all 0.3s ease',
                      }}>

                      {/* Status indicator bar */}
                      <div style={{ height: 4, background: `linear-gradient(90deg, ${sc.color}, ${sc.color}80)` }} />

                      <div style={{ padding: '22px 26px' }}>
                        {/* Main Row */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' }}>
                          {/* Event Icon */}
                          <motion.div
                            whileHover={{ rotate: [0, -10, 10, 0] }}
                            transition={{ duration: 0.4 }}
                            style={{
                              width: 56, height: 56, borderRadius: 16, flexShrink: 0,
                              background: `linear-gradient(135deg, ${sc.bg}, rgba(255,107,53,0.04))`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 28, border: `1.5px solid ${sc.color}15`,
                            }}>
                            {eventIcon}
                          </motion.div>

                          {/* Details */}
                          <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                              <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--maroon)', margin: 0 }}>
                                {booking.eventName}
                              </h3>
                              <div style={{
                                padding: '4px 12px', borderRadius: 99,
                                background: sc.bg, color: sc.color,
                                fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4,
                              }}>
                                {sc.icon} {sc.label}
                              </div>
                              {isPaid && (
                                <div style={{
                                  padding: '4px 10px', borderRadius: 99,
                                  background: 'rgba(22,163,74,0.08)', color: '#16a34a',
                                  fontSize: 11, fontWeight: 700,
                                }}>
                                  💳 Paid
                                </div>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#6b7280' }}>
                              <span>📅 {[new Date(booking.eventDate), ...(booking.additionalDates || []).map(d => new Date(d))].map(d => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })).join(', ')} {new Date(booking.eventDate).getFullYear()}</span>
                              <span>🕐 {to12h(booking.startTime)} – {to12h(booking.endTime)}</span>
                              {booking.expectedGuests > 0 && <span>👥 {booking.expectedGuests} guests</span>}
                            </div>

                            {booking.rejectionReason && (
                              <div style={{
                                marginTop: 8, padding: '8px 12px', borderRadius: 10,
                                background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)',
                                fontSize: 12, color: '#ef4444', fontWeight: 600,
                              }}>
                                ❌ Reason: {booking.rejectionReason}
                              </div>
                            )}
                          </div>

                          {/* Right side — Price & Actions */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, minWidth: 140 }}>
                            <div style={{
                              fontSize: 22, fontWeight: 900,
                              color: booking.totalAmount ? 'var(--maroon)' : '#9ca3af',
                              fontFamily: 'inherit',
                            }}>
                              {booking.totalAmount ? `₹${booking.totalAmount.toLocaleString()}` : t.myBookings.price_tbd}
                            </div>

                            {/* Pay Now Button */}
                            {needsPayment && (
                              <motion.button
                                whileHover={{ scale: 1.05, boxShadow: '0 8px 24px rgba(22,163,74,0.35)' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handlePayment(booking)}
                                disabled={payingId === booking._id}
                                style={{
                                  padding: '10px 24px', borderRadius: 12, border: 'none',
                                  cursor: 'pointer', fontSize: 14, fontWeight: 800, color: 'white',
                                  background: payingId === booking._id ? '#9ca3af' : 'linear-gradient(135deg, #16a34a, #166534)',
                                  boxShadow: '0 4px 14px rgba(22,163,74,0.25)',
                                  display: 'flex', alignItems: 'center', gap: 6,
                                }}>
                                {payingId === booking._id ? (
                                  <>⏳ Processing...</>
                                ) : (
                                  <>💳 Pay ₹{booking.totalAmount?.toLocaleString()}</>
                                )}
                              </motion.button>
                            )}

                            {/* Download Receipt Button */}
                            {isPaid && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDownloadReceipt(booking)}
                                disabled={downloadingReceipt?._id === booking._id}
                                style={{
                                  padding: '10px 24px', borderRadius: 12, border: 'none',
                                  cursor: 'pointer', fontSize: 13, fontWeight: 800, color: '#16a34a',
                                  background: 'rgba(22,163,74,0.1)',
                                  display: 'flex', alignItems: 'center', gap: 6,
                                }}>
                                {downloadingReceipt?._id === booking._id ? (
                                  <>⏳ Preparing...</>
                                ) : (
                                  <>📥 {t.myBookings.receipt_download}</>
                                )}
                              </motion.button>
                            )}

                            <div style={{ display: 'flex', gap: 8 }}>
                              {/* Expand */}
                              <motion.button
                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={() => setExpandedId(isExpanded ? null : booking._id)}
                                style={{
                                  padding: '7px 14px', borderRadius: 10, border: '1.5px solid #ede8e0',
                                  cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#6b7280',
                                  background: 'white',
                                }}>
                                {isExpanded ? '▲ Less' : '▼ More'}
                              </motion.button>

                              {canCancel && (
                                <motion.button
                                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                                  onClick={() => setShowCancelModal(booking)}
                                  style={{
                                    padding: '7px 14px', borderRadius: 10, border: 'none',
                                    cursor: 'pointer', fontSize: 12, fontWeight: 700,
                                    color: '#ef4444', background: 'rgba(239,68,68,0.06)',
                                  }}>
                                  Cancel
                                </motion.button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              style={{ overflow: 'hidden' }}>
                              <div style={{
                                marginTop: 18, paddingTop: 18,
                                borderTop: '1.5px solid rgba(255,107,53,0.08)',
                              }}>
                                {/* Progress Timeline */}
                                {sc.step > 0 && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 20 }}>
                                    {[t.myBookings.submitted, t.myBookings.under_review, t.myBookings.approved, t.myBookings.payment, t.myBookings.complete].map((label, idx) => {
                                      const active = idx < sc.step || (idx === 3 && isPaid)
                                      const current = (isPaid && sc.step < 5) ? idx === 4 : idx === sc.step - 1
                                      return (
                                        <div key={label} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                                          <div style={{ textAlign: 'center', flex: 1 }}>
                                            <div style={{
                                              width: 28, height: 28, borderRadius: '50%', margin: '0 auto 4px',
                                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                                              fontSize: 12, fontWeight: 800,
                                              background: active ? '#22c55e' : current ? 'var(--primary)' : '#e5e7eb',
                                              color: active || current ? 'white' : '#9ca3af',
                                              boxShadow: current ? '0 0 0 4px rgba(255,107,53,0.15)' : 'none',
                                            }}>
                                              {active ? '✓' : idx + 1}
                                            </div>
                                            <div style={{ fontSize: 10, color: active ? '#22c55e' : current ? 'var(--primary)' : '#9ca3af', fontWeight: 600 }}>
                                              {label}
                                            </div>
                                          </div>
                                          {idx < 4 && (
                                            <div style={{
                                              height: 2, flex: 0.5, minWidth: 10,
                                              background: active ? '#22c55e' : '#e5e7eb',
                                            }} />
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                                  {[
                                    { label: 'Booking ID', value: booking._id?.slice(-8).toUpperCase(), icon: '🔖' },
                                    { label: 'Event Type', value: booking.eventType ? booking.eventType.charAt(0).toUpperCase() + booking.eventType.slice(1) : 'Not specified', icon: eventIcon },
                                    { label: 'Contact', value: booking.contactName, icon: '👤' },
                                    { label: 'Phone', value: booking.contactPhone, icon: '📱' },
                                    { label: 'Email', value: booking.contactEmail, icon: '📧' },
                                    { label: 'Booked on', value: new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), icon: '📆' },
                                    ...(booking.specialRequests ? [{ label: 'Special Requests', value: booking.specialRequests, icon: '📝' }] : []),
                                    ...(booking.paymentId ? [{ label: 'Payment ID', value: booking.paymentId, icon: '💳' }] : []),
                                  ].map((item, idx) => (
                                    <div key={idx} style={{
                                      padding: '10px 14px', borderRadius: 12,
                                      background: '#fafafa', border: '1px solid #f3ede5',
                                    }}>
                                      <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, marginBottom: 3 }}>
                                        {item.icon} {item.label}
                                      </div>
                                      <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600, wordBreak: 'break-all' }}>
                                        {item.value}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )
                })}

                {/* Pagination UI */}
                {totalPages > 1 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 12, marginTop: 40, padding: '20px 0',
                    borderTop: '1px solid #f3f4f6'
                  }}>
                    <motion.button
                      whileHover={{ scale: 1.1, backgroundColor: '#f9fafb' }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      style={{
                        width: 40, height: 40, borderRadius: 12, border: '1px solid #e5e7eb',
                        background: 'white', color: currentPage === 1 ? '#d1d5db' : '#374151',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: 18,
                        transition: 'all 0.2s ease',
                      }}>
                      ‹
                    </motion.button>
                    
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[...Array(totalPages)].map((_, idx) => {
                        const pg = idx + 1
                        const active = pg === currentPage
                        return (
                          <motion.button
                            key={pg}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setCurrentPage(pg)}
                            style={{
                              width: 40, height: 40, borderRadius: 12,
                              border: active ? 'none' : '1px solid #e5e7eb',
                              background: active ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'white',
                              color: active ? 'white' : '#374151',
                              fontWeight: active ? 700 : 500,
                              fontSize: 14,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer',
                              boxShadow: active ? '0 4px 12px rgba(22,163,74,0.3)' : 'none',
                              transition: 'all 0.2s ease',
                            }}>
                            {pg}
                          </motion.button>
                        )
                      })}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.1, backgroundColor: '#f9fafb' }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      style={{
                        width: 40, height: 40, borderRadius: 12, border: '1px solid #e5e7eb',
                        background: 'white', color: currentPage === totalPages ? '#d1d5db' : '#374151',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: 18,
                        transition: 'all 0.2s ease',
                      }}>
                      ›
                    </motion.button>
                  </div>
                )}
                
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                  <p style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>
                    Showing {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} bookings
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Cancel Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
            }}
            onClick={() => setShowCancelModal(null)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                borderRadius: 24, padding: '36px',
                background: 'white', maxWidth: 460, width: '100%',
                boxShadow: '0 40px 100px rgba(0,0,0,0.3)',
              }}>
              <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>⚠️</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--maroon)', marginBottom: 8, textAlign: 'center' }}>
                {t.myBookings.cancel_booking}?
              </h3>
              <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 20, textAlign: 'center' }}>
                Are you sure you want to cancel <strong style={{ color: 'var(--maroon)' }}>{showCancelModal.eventName}</strong>?
              </p>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Reason (optional)
                </label>
                <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                  placeholder="Why are you cancelling?" rows={3}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: 12,
                    border: '2px solid #ede8e0', outline: 'none', fontSize: 14,
                    resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                  }} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setShowCancelModal(null)}
                  style={{
                    flex: 1, padding: '13px', borderRadius: 12,
                    border: '2px solid #ede8e0', cursor: 'pointer',
                    fontSize: 14, fontWeight: 700, color: '#6b7280', background: 'white',
                  }}>
                  {t.myBookings.keep_booking}
                </motion.button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => handleCancel(showCancelModal._id)}
                  disabled={cancellingId === showCancelModal._id}
                  style={{
                    flex: 1, padding: '13px', borderRadius: 12, border: 'none',
                    cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'white',
                    background: cancellingId === showCancelModal._id ? '#ccc' : '#ef4444',
                  }}>
                  {cancellingId === showCancelModal._id ? `${t.common.loading}` : `❌ ${t.myBookings.cancel_booking}`}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      </div>{/* end scrollable area */}

      {/* Hidden Html2Canvas Receipt for Hall Bookings */}
      {downloadingReceipt && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div ref={receiptRef} style={{
            width: '500px', borderRadius: 24, overflow: 'hidden', background: 'white',
            boxShadow: '0 20px 60px rgba(139,26,26,0.12)', border: '1.5px solid rgba(255,107,53,0.1)',
            textAlign: 'left', fontFamily: 'var(--font-primary), sans-serif'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1a0000 0%, #5a0e0e 60%, #8B1A1A 100%)',
              padding: '32px 32px 24px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 44, marginBottom: 8 }}>🏛️</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#F7C948', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Shri Dharamshala Trust</div>
              <div style={{
                marginTop: 16, display: 'inline-block', padding: '6px 20px', borderRadius: 99,
                background: 'rgba(247,201,72,0.15)', border: '1px solid rgba(247,201,72,0.3)',
                fontSize: 13, fontWeight: 800, color: '#F7C948',
              }}>HALL BOOKING RECEIPT</div>
            </div>

            <div style={{ padding: '28px 32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 18, borderBottom: '1px dashed #f5ede0' }}>
                <div>
                  <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Receipt No.</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#8B1A1A', fontFamily: 'monospace' }}>{downloadingReceipt.receiptNumber || 'DH-PENDING'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Date</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>
                    {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {[
                { label: 'Name', value: downloadingReceipt.contactName },
                { label: 'Phone', value: downloadingReceipt.contactPhone },
                { label: 'Event name', value: downloadingReceipt.eventName },
                { label: 'Payment ID', value: downloadingReceipt.paymentId || '-' },
                { label: 'Booked dates', value: [new Date(downloadingReceipt.eventDate), ...(downloadingReceipt.additionalDates || []).map(d => new Date(d))].map(d => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })).join(', ') + ' ' + new Date(downloadingReceipt.eventDate).getFullYear() },
                { label: 'Payment mode', value: '-' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f9fafb' }}>
                  <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', maxWidth: '65%', textAlign: 'right' }}>{row.value}</span>
                </div>
              ))}

              <div style={{
                marginTop: 24, padding: '20px 24px', borderRadius: 16,
                background: 'linear-gradient(135deg, rgba(22,163,74,0.08), rgba(22,163,74,0.04))',
                border: '1.5px solid rgba(22,163,74,0.2)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 17, fontWeight: 800, color: '#16a34a' }}>Total Amount Paid</span>
                <span style={{ fontSize: 26, fontWeight: 900, color: '#16a34a' }}>₹{downloadingReceipt.totalAmount?.toLocaleString()}</span>
              </div>

              <div style={{ textAlign: 'center', marginTop: 32, padding: '12px' }}>
                <div style={{ fontSize: 24, marginBottom: 10 }}>🙏</div>
                <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>Thank you for choosing <strong>Shri Dharamshala Trust</strong>.</p>
                <div style={{ marginTop: 24, fontSize: 10, color: '#d1d5db', fontStyle: 'italic', letterSpacing: '0.3px' }}>This is a digital receipt and does not require a physical signature.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default MyBookings