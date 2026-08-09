import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CheckCircle, Hourglass, XCircle,
  Eye, Tag, CreditCard, SealCheck, Bell, ArrowRight,
} from '@phosphor-icons/react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const statusConfig = {
  pending: {
    icon: <Hourglass size={38} weight="duotone" />,
    title: 'Booking Request Submitted!',
    subtitle: 'Your request is under review by the admin',
    color: 'var(--warning)',
    bg: 'var(--warning-subtle)',
    steps: [
      { label: 'Request Submitted', done: true, icon: <CheckCircle size={18} weight="fill" /> },
      { label: 'Admin Review', done: false, active: true, icon: <Eye size={18} weight="duotone" /> },
      { label: 'Price Set', done: false, icon: <Tag size={18} weight="duotone" /> },
      { label: 'Payment', done: false, icon: <CreditCard size={18} weight="duotone" /> },
      { label: 'Confirmed', done: false, icon: <SealCheck size={18} weight="duotone" /> },
    ],
  },
  approved: {
    icon: <CheckCircle size={38} weight="fill" />,
    title: 'Booking Approved!',
    subtitle: 'Your booking has been approved. Please proceed with payment.',
    color: 'var(--success)',
    bg: 'var(--success-subtle)',
    steps: [
      { label: 'Request Submitted', done: true, icon: <CheckCircle size={18} weight="fill" /> },
      { label: 'Admin Review', done: true, icon: <CheckCircle size={18} weight="fill" /> },
      { label: 'Price Set', done: true, icon: <CheckCircle size={18} weight="fill" /> },
      { label: 'Payment', done: false, active: true, icon: <CreditCard size={18} weight="duotone" /> },
      { label: 'Confirmed', done: false, icon: <SealCheck size={18} weight="duotone" /> },
    ],
  },
  rejected: {
    icon: <XCircle size={38} weight="fill" />,
    title: 'Booking Rejected',
    subtitle: 'Unfortunately your booking request was not approved.',
    color: 'var(--error)',
    bg: 'var(--error-subtle)',
    steps: [
      { label: 'Request Submitted', done: true, icon: <CheckCircle size={18} weight="fill" /> },
      { label: 'Admin Review', done: true, icon: <CheckCircle size={18} weight="fill" /> },
      { label: 'Rejected', done: true, rejected: true, icon: <XCircle size={18} weight="fill" /> },
    ],
  },
}

function BookingStatus() {
  const status = 'pending'
  const config = statusConfig[status] || statusConfig.pending

  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '56px 24px' }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>

          {/* Status card */}
          <div style={{
            borderRadius: 'var(--radius-xl)', padding: '44px 36px',
            background: 'var(--surface-solid)', border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-xl)', textAlign: 'center', marginBottom: 20,
          }}>
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 84, height: 84, borderRadius: '50%',
                background: config.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 22px', color: config.color,
                border: `2px solid ${config.color}`,
              }}>
              {config.icon}
            </motion.div>

            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, color: 'var(--maroon)', marginBottom: 8 }}>
              {config.title}
            </h1>
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', marginBottom: 30, maxWidth: 400, margin: '0 auto 30px' }}>
              {config.subtitle}
            </p>

            {/* Progress steps */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, flexWrap: 'wrap' }}>
              {config.steps.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: s.done
                        ? (s.rejected ? 'var(--error-subtle)' : 'var(--success-subtle)')
                        : s.active ? 'var(--warning-subtle)' : 'var(--neutral-100)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 6px',
                      border: s.active ? '2px solid var(--warning)' : '1px solid var(--border)',
                      color: s.done ? (s.rejected ? 'var(--error)' : 'var(--success)') : s.active ? 'var(--warning)' : 'var(--text-muted)',
                    }}>
                      {s.icon}
                    </div>
                    <div style={{
                      fontSize: 'var(--text-xs)', fontWeight: 700,
                      color: s.done ? 'var(--success)' : s.active ? 'var(--warning)' : 'var(--text-muted)',
                      maxWidth: 60, lineHeight: 1.3,
                    }}>
                      {s.label}
                    </div>
                  </div>
                  {i < config.steps.length - 1 && (
                    <div style={{ width: 28, height: 2, margin: '0 4px 20px', background: s.done ? 'var(--success)' : 'var(--border)' }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Info note */}
          <div style={{
            borderRadius: 'var(--radius-lg)', padding: '16px 20px',
            background: 'var(--primary-subtle)', border: '1px solid var(--primary-border)', marginBottom: 20,
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <Bell size={16} weight="fill" style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--primary)', fontWeight: 600, lineHeight: 1.6, margin: 0 }}>
              You will receive an in-app notification once the admin reviews your request and sets the pricing.
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/my-bookings" style={{ textDecoration: 'none', flex: 1 }}>
              <motion.button whileHover={{ scale: 1.02, boxShadow: '0 8px 22px var(--primary-border)' }} whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%', padding: '13px', borderRadius: 'var(--radius-full)', border: 'none',
                  cursor: 'pointer', fontSize: 'var(--text-base)', fontWeight: 700, color: 'white',
                  background: 'linear-gradient(135deg, var(--primary), var(--maroon))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: 'inherit',
                }}>
                View My Bookings <ArrowRight size={14} weight="bold" />
              </motion.button>
            </Link>
            <Link to="/" style={{ textDecoration: 'none', flex: 1 }}>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%', padding: '13px', borderRadius: 'var(--radius-full)',
                  border: '1.5px solid var(--border)', cursor: 'pointer',
                  fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-secondary)',
                  background: 'var(--surface-solid)', fontFamily: 'inherit',
                }}>
                Back to Home
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
