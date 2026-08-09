import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useLanguage } from '../context/LanguageContext'

function BookingStatus() {
  const { t } = useLanguage()
  const status = 'pending'

  const statusConfig = {
    pending: {
      icon: '⏳',
      title: t.bookingStatus.pending_title,
      subtitle: t.bookingStatus.pending_sub,
      color: '#d97706',
      bg: 'rgba(247,201,72,0.1)',
      steps: [
        { label: 'Request Submitted', done: true, icon: '✅' },
        { label: 'Admin Review', done: false, active: true, icon: '👀' },
        { label: 'Price Set', done: false, icon: '💰' },
        { label: 'Payment', done: false, icon: '💳' },
        { label: 'Confirmed', done: false, icon: '🎉' },
      ],
    },
    approved: {
      icon: '✅',
      title: t.bookingStatus.approved_title,
      subtitle: t.bookingStatus.approved_sub,
      color: '#16a34a',
      bg: 'rgba(22,163,74,0.1)',
      steps: [
        { label: 'Request Submitted', done: true, icon: '✅' },
        { label: 'Admin Review', done: true, icon: '✅' },
        { label: 'Price Set', done: true, icon: '✅' },
        { label: 'Payment', done: false, active: true, icon: '💳' },
        { label: 'Confirmed', done: false, icon: '🎉' },
      ],
    },
    rejected: {
      icon: '❌',
      title: t.bookingStatus.rejected_title,
      subtitle: t.bookingStatus.rejected_sub,
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.1)',
      steps: [
        { label: 'Request Submitted', done: true, icon: '✅' },
        { label: 'Admin Review', done: true, icon: '✅' },
        { label: 'Rejected', done: true, rejected: true, icon: '❌' },
      ],
    },
  }

  const config = statusConfig[status] || statusConfig.pending

  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '60px 32px' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}>

          {/* Status Card */}
          <div style={{
            borderRadius: 28, padding: '48px 40px',
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(20px)',
            border: '1.5px solid rgba(255,107,53,0.08)',
            boxShadow: '0 8px 40px rgba(139,26,26,0.08)',
            textAlign: 'center',
            marginBottom: 24,
          }}>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 90, height: 90, borderRadius: '50%',
                background: config.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 40, margin: '0 auto 24px',
                border: `2px solid ${config.color}30`,
              }}>
              {config.icon}
            </motion.div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--maroon)', marginBottom: 10 }}>
              {config.title}
            </h1>
            <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
              {config.subtitle}
            </p>

            {/* Progress Steps */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, flexWrap: 'wrap' }}>
              {config.steps.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: s.done
                        ? (s.rejected ? 'rgba(239,68,68,0.1)' : 'rgba(22,163,74,0.1)')
                        : s.active ? 'rgba(247,201,72,0.15)' : '#f5f5f5',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, margin: '0 auto 6px',
                      border: s.active ? '2px solid #d97706' : 'none',
                    }}>
                      {s.icon}
                    </div>
                    <div style={{
                      fontSize: 10, fontWeight: 700,
                      color: s.done ? '#16a34a' : s.active ? '#d97706' : '#9ca3af',
                      maxWidth: 60, lineHeight: 1.3,
                    }}>
                      {s.label}
                    </div>
                  </div>
                  {i < config.steps.length - 1 && (
                    <div style={{
                      width: 32, height: 2, margin: '0 4px 20px',
                      background: s.done ? '#16a34a' : '#ede8e0',
                    }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Info Note */}
          <div style={{
            borderRadius: 20, padding: '20px 24px',
            background: 'rgba(255,107,53,0.05)',
            border: '1.5px solid rgba(255,107,53,0.12)',
            marginBottom: 24,
          }}>
            <p style={{ fontSize: 14, color: 'var(--primary)', fontWeight: 600, lineHeight: 1.6 }}>
              🔔 You will receive an in-app notification once the admin reviews your request and sets the pricing.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Link to="/my-bookings" style={{ textDecoration: 'none', flex: 1 }}>
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: '0 8px 24px rgba(255,107,53,0.4)' }}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%', padding: '14px', borderRadius: 13, border: 'none',
                  cursor: 'pointer', fontSize: 15, fontWeight: 700, color: 'white',
                  background: 'linear-gradient(135deg, #FF6B35, #8B1A1A)',
                  boxShadow: '0 4px 14px rgba(255,107,53,0.3)',
                }}>
                {t.bookingStatus.view_bookings}
              </motion.button>
            </Link>
            <Link to="/" style={{ textDecoration: 'none', flex: 1 }}>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%', padding: '14px', borderRadius: 13,
                  border: '2px solid #ede8e0', cursor: 'pointer',
                  fontSize: 15, fontWeight: 700, color: 'var(--text)',
                  background: 'white',
                }}>
                {t.nav.home}
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  )
}

export default BookingStatus