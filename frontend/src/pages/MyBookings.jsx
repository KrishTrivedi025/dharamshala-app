import { useState, useEffect, useRef } from 'react'
import { useIsMobile } from './admin/AdminDashboard'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import html2canvas from 'html2canvas'
import {
  Hourglass, CheckCircle, XCircle, ProhibitInset, SealCheck,
  Diamond, Confetti, Gift, Briefcase, Users, Sparkle, Building,
  CreditCard, DownloadSimple, WarningCircle, CircleNotch,
  ArrowRight, Tag, BookOpen, Phone, Envelope, CalendarBlank,
  ClipboardText,
} from '@phosphor-icons/react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { ReceiptHeader } from '../components/ReceiptHeader'
import { bookingAPI } from '../utils/api'
import { useLanguage } from '../context/LanguageContext'

const STATUS_CONFIG = {
  pending:   { color: 'var(--warning)',  bg: 'var(--warning-subtle)',  label: 'Pending Review', icon: <Hourglass size={13} weight="duotone" />,     step: 2 },
  approved:  { color: 'var(--success)',  bg: 'var(--success-subtle)',  label: 'Approved',        icon: <CheckCircle size={13} weight="fill" />,         step: 3 },
  rejected:  { color: 'var(--error)',    bg: 'var(--error-subtle)',    label: 'Rejected',        icon: <XCircle size={13} weight="fill" />,             step: -1 },
  cancelled: { color: 'var(--neutral-500)', bg: 'var(--neutral-100)', label: 'Cancelled',       icon: <ProhibitInset size={13} weight="fill" />,       step: -1 },
  completed: { color: 'var(--maroon)',   bg: 'var(--maroon-subtle)',   label: 'Completed',       icon: <SealCheck size={13} weight="fill" />,           step: 5 },
}

const EVENT_ICONS = {
  wedding: <Diamond size={24} weight="duotone" />,
  reception: <Confetti size={24} weight="duotone" />,
  birthday: <Gift size={24} weight="duotone" />,
  religious: <span style={{ fontSize: 22, lineHeight: 1 }}>🙏</span>,
  conference: <Briefcase size={24} weight="duotone" />,
  meeting: <Users size={24} weight="duotone" />,
  other: <Sparkle size={24} weight="duotone" />,
}

const FILTERS = ['All', 'Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed']

const _to12h = (t) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
}

function MyBookings() {
  const isMobile = useIsMobile()
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
    setTimeout(async () => {
      if (receiptRef.current) {
        const canvas = await html2canvas(receiptRef.current, { useCORS: true, scale: 2, backgroundColor: '#ffffff' })
        const link = document.createElement('a')
        link.href = canvas.toDataURL('image/png')
        link.download = `Receipt_${booking.eventName.replace(/\s+/g, '_')}_${new Date(booking.eventDate).toLocaleDateString('en-IN')}.png`
        link.click(); setDownloadingReceipt(null)
      }
    }, 100)
  }

  const fetchBookings = async () => {
    try {
      setLoading(true); setError(null)
      const res = await bookingAPI.getMyBookings(); setBookings(res.data || [])
    } catch (err) { setError(err.message || 'Failed to load bookings') } finally { setLoading(false) }
  }
  useEffect(() => { fetchBookings() }, [])

  const handleCancel = async (bookingId) => {
    try {
      setCancellingId(bookingId)
      await bookingAPI.cancel(bookingId, cancelReason || 'Cancelled by user')
      setShowCancelModal(null); setCancelReason(''); await fetchBookings()
    } catch (err) { alert(err.message || 'Failed to cancel booking') } finally { setCancellingId(null) }
  }

  const handlePayment = async (booking) => {
    try {
      setPayingId(booking._id)
      const orderRes = await bookingAPI.createPaymentOrder(booking._id)
      const { orderId, amount, currency, keyId } = orderRes.data
      const options = {
        key: keyId, amount, currency, name: 'Dharamshala Hall Booking',
        description: `Payment for ${booking.eventName}`, order_id: orderId,
        handler: async (response) => {
          try {
            await bookingAPI.verifyPayment(booking._id, { razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature })
            await fetchBookings(); alert('Payment successful!')
          } catch (err) { alert('Payment verification failed: ' + (err.message || 'Unknown error')) }
        },
        prefill: { name: booking.contactName, email: booking.contactEmail, contact: booking.contactPhone },
        theme: { color: '#FF6B35', backdrop_color: 'rgba(0,0,0,0.6)' },
        modal: { ondismiss: () => setPayingId(null) },
      }
      const rzp = new window.Razorpay(options); rzp.open()
    } catch (err) { alert('Failed to initiate payment: ' + (err.message || 'Unknown error')) } finally { setPayingId(null) }
  }

  const filtered = activeFilter === 'All' ? bookings : bookings.filter(b => b.status?.toLowerCase() === activeFilter.toLowerCase())
  const counts = bookings.reduce((acc, b) => { acc[b.status] = (acc[b.status] || 0) + 1; return acc }, {})
  const itemsPerPage = 5
  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const currentBookings = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />

      {/* Header */}
      <div style={{ background: 'linear-gradient(160deg, #1a0000 0%, #4a0c0c 40%, #c94a1a 100%)', padding: '52px 32px 44px', position: 'relative', overflow: 'hidden' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', top: -80, right: -80, width: 260, height: 260, borderRadius: '50%', background: 'rgba(247,201,72,0.04)' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 5 }}>
              <ClipboardText size={40} weight="duotone" style={{ color: 'white' }} />
              <div>
                <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 900, color: 'white', marginBottom: 3 }}>{t.myBookings.title}</h1>
                <p style={{ fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.48)' }}>
                  {bookings.length} total booking{bookings.length !== 1 ? 's' : ''} · Track and manage your hall reservations
                </p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            {[{ label: t.myBookings.submitted, count: counts.pending || 0, color: 'var(--secondary)' }, { label: t.dashboard.approved, count: counts.approved || 0, color: '#22c55e' }, { label: t.booking.status_confirmed, count: counts.completed || 0, color: '#a78bfa' }].map(s => (
              <div key={s.label} style={{ padding: '9px 16px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.color }} />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'rgba(255,255,255,0.65)' }}>{s.label}</span>
                <span style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'white' }}>{s.count}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '20px 14px 48px' : '28px 28px 60px' }}>

        {/* Filter tabs */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24, padding: '5px', borderRadius: 'var(--radius-lg)', background: 'var(--surface-solid)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          {FILTERS.map((filter) => {
            const count = filter === 'All' ? bookings.length : (counts[filter.toLowerCase()] || 0)
            return (
              <motion.button key={filter} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => { setActiveFilter(filter); setCurrentPage(1) }}
                style={{ padding: '9px 18px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s', background: activeFilter === filter ? 'linear-gradient(135deg, var(--primary), var(--maroon))' : 'transparent', color: activeFilter === filter ? 'white' : 'var(--text-secondary)', boxShadow: activeFilter === filter ? '0 4px 12px var(--primary-border)' : 'none', fontFamily: 'inherit' }}>
                {filter}
                {count > 0 && <span style={{ padding: '1px 7px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 800, background: activeFilter === filter ? 'rgba(255,255,255,0.25)' : 'var(--neutral-200)', color: activeFilter === filter ? 'white' : 'var(--text-muted)' }}>{count}</span>}
              </motion.button>
            )
          })}
        </motion.div>

        {loading && (
          <div style={{ borderRadius: 'var(--radius-xl)', padding: '72px 32px', background: 'var(--surface-solid)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', textAlign: 'center' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
              style={{ display: 'inline-block', color: 'var(--primary)', marginBottom: 16 }}>
              <CircleNotch size={44} weight="bold" />
            </motion.div>
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-muted)', fontWeight: 600 }}>Loading your bookings…</p>
          </div>
        )}

        {!loading && error && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{ borderRadius: 'var(--radius-xl)', padding: '44px 32px', background: 'var(--error-subtle)', border: '1px solid var(--error)', textAlign: 'center' }}>
            <WarningCircle size={44} weight="duotone" style={{ color: 'var(--error)', marginBottom: 14 }} />
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--error-text)', marginBottom: 6 }}>Oops!</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--error-text)', maxWidth: 280, margin: '0 auto 20px' }}>{error}</p>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={fetchBookings}
              style={{ padding: '11px 22px', borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'white', background: 'linear-gradient(135deg, var(--primary), var(--maroon))', fontFamily: 'inherit' }}>
              Try Again
            </motion.button>
          </motion.div>
        )}

        {!loading && !error && (
          <AnimatePresence mode="wait">
            {filtered.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ borderRadius: 'var(--radius-xl)', padding: '72px 32px', background: 'var(--surface-solid)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', textAlign: 'center' }}>
                <Building size={64} weight="duotone" style={{ color: 'var(--neutral-300)', marginBottom: 18 }} />
                <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 900, color: 'var(--maroon)', marginBottom: 8 }}>{t.myBookings.no_bookings}</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 24, maxWidth: 320, margin: '0 auto 24px' }}>
                  {activeFilter === 'All' ? t.myBookings.no_bookings_sub : `No ${activeFilter.toLowerCase()} bookings found.`}
                </p>
                <Link to="/booking" style={{ textDecoration: 'none' }}>
                  <motion.button whileHover={{ scale: 1.04, boxShadow: '0 10px 26px var(--primary-border)' }} whileTap={{ scale: 0.97 }}
                    style={{ padding: '13px 28px', borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer', fontSize: 'var(--text-base)', fontWeight: 800, color: 'white', background: 'linear-gradient(135deg, var(--primary), var(--maroon))', display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}>
                    {t.myBookings.book_now} <ArrowRight size={14} weight="bold" />
                  </motion.button>
                </Link>
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {currentBookings.map((booking, i) => {
                  const sc = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending
                  const canCancel = ['pending', 'approved'].includes(booking.status)
                  const needsPayment = booking.status === 'approved' && booking.paymentStatus !== 'paid' && booking.totalAmount > 0
                  const isPaid = booking.paymentStatus === 'paid'
                  const isExpanded = expandedId === booking._id
                  const eventIcon = EVENT_ICONS[booking.eventType] || <Building size={24} weight="duotone" />

                  return (
                    <motion.div key={booking._id || i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} layout
                      style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', background: 'var(--surface-solid)', border: `1px solid ${needsPayment ? 'var(--primary-border)' : 'var(--border)'}`, boxShadow: needsPayment ? 'var(--shadow-md)' : 'var(--shadow-sm)', transition: 'all 0.25s' }}>

                      {/* Status bar */}
                      <div style={{ height: 4, background: `linear-gradient(90deg, ${sc.color}, ${sc.color}70)` }} />

                      <div style={{ padding: '20px 24px' }}>
                        {/* Main row */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                          <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-md)', flexShrink: 0, background: `${sc.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: sc.color, border: `1px solid ${sc.color}20` }}>
                            {eventIcon}
                          </div>
                          <div style={{ flex: 1, minWidth: 190 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 5, flexWrap: 'wrap' }}>
                              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: 'var(--maroon)', margin: 0 }}>{booking.eventName}</h3>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 'var(--radius-full)', background: sc.bg, color: sc.color, fontSize: 'var(--text-xs)', fontWeight: 700 }}>
                                {sc.icon} {sc.label}
                              </span>
                              {isPaid && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 'var(--radius-full)', background: 'var(--success-subtle)', color: 'var(--success)', fontSize: 'var(--text-xs)', fontWeight: 700 }}><CreditCard size={11} weight="bold" /> Paid</span>}
                            </div>
                            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CalendarBlank size={12} weight="fill" />{[new Date(booking.eventDate), ...(booking.additionalDates || []).map(d => new Date(d))].map(d => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })).join(', ')} {new Date(booking.eventDate).getFullYear()}</span>
                              {booking.expectedGuests > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={12} weight="fill" />{booking.expectedGuests} guests</span>}
                            </div>
                            {booking.rejectionReason && (
                              <div style={{ marginTop: 7, display: 'flex', alignItems: 'flex-start', gap: 6, padding: '7px 11px', borderRadius: 'var(--radius-sm)', background: 'var(--error-subtle)', border: '1px solid var(--error)', fontSize: 'var(--text-xs)', color: 'var(--error-text)', fontWeight: 600 }}>
                                <XCircle size={12} weight="fill" style={{ flexShrink: 0, marginTop: 1 }} /> Reason: {booking.rejectionReason}
                              </div>
                            )}
                          </div>

                          {/* Right — price + actions */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7, minWidth: 130 }}>
                            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 900, color: booking.totalAmount ? 'var(--maroon)' : 'var(--text-muted)' }}>
                              {booking.totalAmount ? `₹${booking.totalAmount.toLocaleString()}` : t.myBookings.price_tbd}
                            </div>
                            {needsPayment && (
                              <motion.button whileHover={{ scale: 1.04, boxShadow: '0 6px 18px rgba(22,163,74,0.32)' }} whileTap={{ scale: 0.95 }}
                                onClick={() => handlePayment(booking)} disabled={payingId === booking._id}
                                style={{ padding: '9px 20px', borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 800, color: 'white', background: payingId === booking._id ? 'var(--neutral-400)' : 'linear-gradient(135deg, var(--success), #166534)', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
                                {payingId === booking._id ? (<><motion.span animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}><CircleNotch size={14} weight="bold" /></motion.span> Processing…</>) : (<><CreditCard size={13} weight="bold" /> Pay ₹{booking.totalAmount?.toLocaleString()}</>)}
                              </motion.button>
                            )}
                            {isPaid && (
                              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                                onClick={() => handleDownloadReceipt(booking)} disabled={downloadingReceipt?._id === booking._id}
                                style={{ padding: '9px 18px', borderRadius: 'var(--radius-full)', border: '1px solid var(--success)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--success)', background: 'var(--success-subtle)', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
                                {downloadingReceipt?._id === booking._id ? (<><motion.span animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}><CircleNotch size={13} weight="bold" /></motion.span> Preparing…</>) : (<><DownloadSimple size={13} weight="bold" /> Receipt</>)}
                              </motion.button>
                            )}
                            <div style={{ display: 'flex', gap: 7 }}>
                              <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                                onClick={() => setExpandedId(isExpanded ? null : booking._id)}
                                style={{ padding: '6px 13px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--surface-solid)', fontFamily: 'inherit' }}>
                                {isExpanded ? '▲ Less' : '▼ More'}
                              </motion.button>
                              {canCancel && (
                                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => setShowCancelModal(booking)}
                                  style={{ padding: '6px 13px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--error-text)', background: 'var(--error-subtle)', fontFamily: 'inherit' }}>
                                  Cancel
                                </motion.button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expanded details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28 }} style={{ overflow: 'hidden' }}>
                              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                                {sc.step > 0 && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 18 }}>
                                    {[t.myBookings.submitted, t.myBookings.under_review, t.myBookings.approved, t.myBookings.payment, t.myBookings.complete].map((label, idx) => {
                                      const active = idx < sc.step || (idx === 3 && isPaid)
                                      const current = (isPaid && sc.step < 5) ? idx === 4 : idx === sc.step - 1
                                      return (
                                        <div key={label} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                                          <div style={{ textAlign: 'center', flex: 1 }}>
                                            <div style={{ width: 26, height: 26, borderRadius: '50%', margin: '0 auto 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', fontWeight: 800, background: active ? 'var(--success)' : current ? 'var(--primary)' : 'var(--neutral-200)', color: active || current ? 'white' : 'var(--text-muted)', boxShadow: current ? '0 0 0 4px var(--primary-subtle)' : 'none' }}>
                                              {active ? <CheckCircle size={14} weight="fill" /> : idx + 1}
                                            </div>
                                            <div style={{ fontSize: 9, color: active ? 'var(--success)' : current ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
                                          </div>
                                          {idx < 4 && <div style={{ height: 2, flex: 0.5, minWidth: 8, background: active ? 'var(--success)' : 'var(--border)' }} />}
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
                                  {[
                                    { label: 'Booking ID', value: booking._id?.slice(-8).toUpperCase(), icon: <Tag size={12} weight="bold" /> },
                                    { label: 'Event Type', value: booking.eventType ? booking.eventType.charAt(0).toUpperCase() + booking.eventType.slice(1) : 'Not specified', icon: <BookOpen size={12} weight="bold" /> },
                                    { label: 'Contact', value: booking.contactName, icon: <Users size={12} weight="bold" /> },
                                    { label: 'Phone', value: booking.contactPhone, icon: <Phone size={12} weight="bold" /> },
                                    { label: 'Email', value: booking.contactEmail, icon: <Envelope size={12} weight="bold" /> },
                                    { label: 'Booked on', value: new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), icon: <CalendarBlank size={12} weight="bold" /> },
                                    ...(booking.specialRequests ? [{ label: 'Special Requests', value: booking.specialRequests, icon: <ClipboardText size={12} weight="bold" /> }] : []),
                                    ...(booking.paymentId ? [{ label: 'Payment ID', value: booking.paymentId, icon: <CreditCard size={12} weight="bold" /> }] : []),
                                  ].map((item, idx) => (
                                    <div key={idx} style={{ padding: '9px 12px', borderRadius: 'var(--radius-md)', background: 'var(--neutral-50)', border: '1px solid var(--border)' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 3 }}>
                                        <span style={{ color: 'var(--primary)' }}>{item.icon}</span> {item.label}
                                      </div>
                                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text)', fontWeight: 600, wordBreak: 'break-all' }}>{item.value}</div>
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 32, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
                    <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                      style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--surface-solid)', color: currentPage === 1 ? 'var(--neutral-300)' : 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: 16 }}>
                      ‹
                    </motion.button>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[...Array(totalPages)].map((_, idx) => {
                        const pg = idx + 1; const active = pg === currentPage
                        return (
                          <motion.button key={pg} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }} onClick={() => setCurrentPage(pg)}
                            style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', border: active ? 'none' : '1px solid var(--border)', background: active ? 'linear-gradient(135deg, var(--primary), var(--maroon))' : 'var(--surface-solid)', color: active ? 'white' : 'var(--text)', fontWeight: active ? 700 : 500, fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: active ? '0 4px 10px var(--primary-border)' : 'none' }}>
                            {pg}
                          </motion.button>
                        )
                      })}
                    </div>
                    <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                      style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--surface-solid)', color: currentPage === totalPages ? 'var(--neutral-300)' : 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: 16 }}>
                      ›
                    </motion.button>
                  </div>
                )}
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    Showing {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} bookings
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Cancel modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-modal)', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={() => setShowCancelModal(null)}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ borderRadius: 'var(--radius-xl)', padding: '32px', background: 'var(--surface-solid)', maxWidth: 440, width: '100%', boxShadow: '0 40px 100px rgba(0,0,0,0.28)' }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <WarningCircle size={44} weight="duotone" style={{ color: 'var(--error)' }} />
              </div>
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--maroon)', marginBottom: 7, textAlign: 'center' }}>Cancel Booking?</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 18, textAlign: 'center' }}>
                Are you sure you want to cancel <strong style={{ color: 'var(--maroon)' }}>{showCancelModal.eventName}</strong>?
              </p>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reason (optional)</label>
                <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Why are you cancelling?" rows={3}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border)', outline: 'none', fontSize: 'var(--text-sm)', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: 'var(--text)' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setShowCancelModal(null)}
                  style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-full)', border: '1.5px solid var(--border)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-secondary)', background: 'var(--surface-solid)', fontFamily: 'inherit' }}>
                  {t.myBookings.keep_booking}
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => handleCancel(showCancelModal._id)} disabled={cancellingId === showCancelModal._id}
                  style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'white', background: cancellingId === showCancelModal._id ? 'var(--neutral-400)' : 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: 'inherit' }}>
                  {cancellingId === showCancelModal._id ? 'Cancelling…' : <><XCircle size={14} weight="bold" /> {t.myBookings.cancel_booking}</>}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden receipt for html2canvas */}
      {downloadingReceipt && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div ref={receiptRef} style={{ width: '500px', borderRadius: 24, overflow: 'hidden', background: 'white', border: '1.5px solid #ede8e0', textAlign: 'left', fontFamily: 'sans-serif' }}>
            <ReceiptHeader badge="HALL BOOKING RECEIPT" />
            <div style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottom: '1px dashed #f5ede0' }}>
                <div>
                  <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Receipt No.</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#8B1A1A', fontFamily: 'monospace' }}>{downloadingReceipt.receiptNumber || 'DH-PENDING'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Date</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
              </div>
              {[
                { label: 'Name', value: downloadingReceipt.contactName },
                { label: 'Phone', value: downloadingReceipt.contactPhone },
                { label: 'Event', value: downloadingReceipt.eventName },
                { label: 'Payment ID', value: downloadingReceipt.paymentId || '-' },
                { label: 'Dates', value: [new Date(downloadingReceipt.eventDate), ...(downloadingReceipt.additionalDates || []).map(d => new Date(d))].map(d => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })).join(', ') + ' ' + new Date(downloadingReceipt.eventDate).getFullYear() },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f9fafb' }}>
                  <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', maxWidth: '65%', textAlign: 'right' }}>{row.value}</span>
                </div>
              ))}
              <div style={{ marginTop: 22, padding: '18px 22px', borderRadius: 14, background: 'rgba(22,163,74,0.06)', border: '1.5px solid rgba(22,163,74,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#16a34a' }}>Total Amount Paid</span>
                <span style={{ fontSize: 24, fontWeight: 900, color: '#16a34a' }}>₹{downloadingReceipt.totalAmount?.toLocaleString()}</span>
              </div>
              <div style={{ textAlign: 'center', marginTop: 28 }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>🙏</div>
                <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>Thank you for choosing <strong>Shri Dharamshala Trust</strong>.</p>
                <div style={{ marginTop: 20, fontSize: 10, color: '#d1d5db', fontStyle: 'italic' }}>This is a digital receipt and does not require a physical signature.</div>
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
