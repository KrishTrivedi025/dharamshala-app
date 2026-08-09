import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  PencilLine, SealCheck, CreditCard,
  MapPin, Phone, Envelope,
  CaretDown, ArrowRight,
  Sparkle, Heart, Briefcase,
} from '@phosphor-icons/react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import RitualFloatingIcon from '../components/RitualFloatingIcon'
import RitualPaymentModal from '../components/RitualPaymentModal'
import { ritualAPI } from '../utils/api'

const steps = [
  {
    icon: <PencilLine size={28} weight="duotone" />,
    title: 'Submit Request',
    desc: 'Fill in your event details and preferred dates and send your booking request to the admin',
    color: 'var(--primary)',
    colorRaw: '#FF6B35',
  },
  {
    icon: <SealCheck size={28} weight="duotone" />,
    title: 'Admin Approval',
    desc: 'Our admin reviews your request personally and sets the pricing for your event',
    color: 'var(--secondary)',
    colorRaw: '#F7C948',
  },
  {
    icon: <CreditCard size={28} weight="duotone" />,
    title: 'Pay & Confirm',
    desc: 'Pay securely online or lock your dates and pay before your event begins',
    color: 'var(--maroon)',
    colorRaw: '#8B1A1A',
  },
]

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

const getCalendarData = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const bookedDates = [3, 4, 5, 12, 18, 19, 25]
  const lockedDates = [8, 9, 22, 23]
  return { daysInMonth, firstDay, bookedDates, lockedDates, month, year }
}

const heroFeatures = [
  { icon: <Sparkle size={20} weight="duotone" />, text: 'Weddings & Celebrations' },
  { icon: <span style={{ fontSize: 18, lineHeight: 1 }}>🙏</span>, text: 'Religious Functions' },
  { icon: <Heart size={20} weight="duotone" />, text: 'Birthday Parties' },
  { icon: <Briefcase size={20} weight="duotone" />, text: 'Meetings & Conferences' },
]

const contactItems = [
  { icon: <MapPin size={28} weight="duotone" />, label: 'Address', value: '123 Samaj Nagar, Rajasthan, India', color: 'var(--primary)' },
  { icon: <Phone size={28} weight="duotone" />, label: 'Phone', value: '+91 98765 43210', color: 'var(--maroon)' },
  { icon: <Envelope size={28} weight="duotone" />, label: 'Email', value: 'info@dharamshala.com', color: 'var(--secondary)' },
]

function Home() {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [calendarData] = useState(getCalendarData)
  const today = new Date().getDate()
  const [ritualStatus, setRitualStatus] = useState(null)
  const [showRitualModal, setShowRitualModal] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) return
    const fetchRitual = async () => {
      try {
        const res = await ritualAPI.getMyStatus()
        setRitualStatus(res.data)
        const now = new Date()
        const isJan1 = now.getMonth() === 0 && now.getDate() === 1
        if (isJan1 && !res.data.hasPaid) setShowRitualModal(true)
      } catch { /* ignore */ }
    }
    fetchRitual()
  }, [isLoggedIn])

  const handleBookNow = () => navigate(isLoggedIn ? '/booking' : '/login')
  const handleCreateAccount = () => navigate(isLoggedIn ? '/booking' : '/signup')
  const handleLoginOrDashboard = () => navigate(isLoggedIn ? '/dashboard' : '/login')

  const getDateStatus = (day) => {
    if (calendarData.bookedDates.includes(day)) return 'booked'
    if (calendarData.lockedDates.includes(day)) return 'locked'
    if (day < today) return 'past'
    return 'available'
  }

  const getDateStyle = (status, day) => {
    const base = {
      width: 36, height: 36, borderRadius: 'var(--radius-sm)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 'var(--text-sm)', fontWeight: 600,
      cursor: status === 'available' ? 'pointer' : 'default',
      transition: 'all 0.15s ease', margin: '2px auto',
    }
    if (day === today) return { ...base, background: 'linear-gradient(135deg, var(--primary), var(--maroon))', color: 'white', fontWeight: 800, boxShadow: '0 4px 12px var(--primary-border)' }
    if (status === 'booked') return { ...base, background: 'var(--error-subtle)', color: 'var(--error)', textDecoration: 'line-through' }
    if (status === 'locked') return { ...base, background: 'var(--warning-subtle)', color: 'var(--warning)' }
    if (status === 'past') return { ...base, color: 'var(--neutral-300)' }
    return { ...base, background: 'var(--success-subtle)', color: 'var(--success)' }
  }

  const scrollToHow = () => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />

      {/* ── HERO ── */}
      <div style={{
        background: 'linear-gradient(160deg, #1a0000 0%, #5a0e0e 40%, #c94a1a 80%, var(--primary) 100%)',
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background orbs */}
        {[...Array(3)].map((_, i) => (
          <motion.div key={i} style={{
            position: 'absolute', borderRadius: '50%',
            background: `rgba(247,201,72,${0.04 + i * 0.02})`,
            width: 300 + i * 180, height: 300 + i * 180,
            top: `${-15 + i * 28}%`, left: `${-8 + i * 22}%`,
          }}
            animate={{ rotate: 360 }}
            transition={{ duration: 22 + i * 6, repeat: Infinity, ease: 'linear' }}
          />
        ))}
        <motion.div style={{
          position: 'absolute', top: '18%', right: '4%',
          width: 260, height: 260, borderRadius: '50%',
          background: 'rgba(255,107,53,0.06)',
        }}
          animate={{ y: [-18, 18, -18], scale: [1, 1.04, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Hero grid — Tailwind responsive, no more @media hack */}
        <div
          className="grid grid-cols-1 lg:grid-cols-2 items-center"
          style={{
            maxWidth: 1200, margin: '0 auto',
            padding: '100px 32px 80px',
            width: '100%', position: 'relative', zIndex: 10,
            gap: 'clamp(0px, 5vw, 60px)',
          }}
        >
          {/* Left — copy + CTAs */}
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: 76, marginBottom: 18, display: 'block', lineHeight: 1 }}
            >🛕</motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 16px', borderRadius: 'var(--radius-full)',
                background: 'rgba(247,201,72,0.12)', border: '1px solid rgba(247,201,72,0.28)',
                color: 'var(--secondary)', fontSize: 'var(--text-sm)',
                fontWeight: 600, marginBottom: 20, letterSpacing: '0.3px',
              }}
            >
              <Sparkle size={13} weight="fill" />
              Community Hall Booking Platform
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{
                fontSize: 'clamp(30px, 4vw, 52px)', fontWeight: 900, color: 'white',
                lineHeight: 1.12, marginBottom: 18, letterSpacing: '-1px',
              }}
            >
              Welcome to Our<br />
              <span style={{ color: 'var(--secondary)' }}>Dharamshala</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              style={{ fontSize: 'var(--text-md)', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 34, maxWidth: 460 }}
            >
              Book our beautiful community hall for your most special occasions — weddings, celebrations, meetings and more.
            </motion.p>

            {/* CTAs — Tailwind responsive */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row flex-wrap"
              style={{ gap: 12 }}
            >
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 18px 44px rgba(255,107,53,0.55)' }}
                whileTap={{ scale: 0.97 }}
                onClick={handleBookNow}
                className="w-full sm:w-auto"
                style={{
                  padding: '15px 34px', borderRadius: 'var(--radius-full)', border: 'none',
                  cursor: 'pointer', fontSize: 'var(--text-md)', fontWeight: 800, color: 'white',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--maroon) 100%)',
                  boxShadow: '0 8px 28px var(--primary-border)',
                  display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'inherit',
                }}
              >
                Book Now <ArrowRight size={16} weight="bold" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04, backgroundColor: 'rgba(255,255,255,0.14)' }}
                whileTap={{ scale: 0.97 }}
                onClick={scrollToHow}
                className="w-full sm:w-auto"
                style={{
                  padding: '15px 34px', borderRadius: 'var(--radius-full)',
                  border: '1.5px solid rgba(255,255,255,0.28)',
                  cursor: 'pointer', fontSize: 'var(--text-md)', fontWeight: 700, color: 'white',
                  background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(10px)',
                  display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'inherit',
                }}
              >
                Learn More <CaretDown size={14} weight="bold" />
              </motion.button>
            </motion.div>

            {/* Stats — Tailwind responsive gap */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
              className="flex flex-wrap"
              style={{ gap: 'clamp(20px, 3vw, 36px)', marginTop: 44 }}
            >
              {[{ n: '500+', l: 'Members' }, { n: '200+', l: 'Events Hosted' }, { n: '10+', l: 'Years Service' }, { n: '5★', l: 'Rating' }].map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, color: 'var(--secondary)' }}>{s.n}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.48)', marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — venue card — hidden on mobile */}
          <motion.div
            className="hidden lg:flex justify-center"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <div style={{
              borderRadius: 'var(--radius-xl)', padding: 28, width: '100%', maxWidth: 380,
              background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 30px 80px rgba(0,0,0,0.28)',
            }}>
              <div style={{ textAlign: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.09)' }}>
                <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'white', marginBottom: 3 }}>Main Hall</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.45)' }}>Capacity: 500+ Guests</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {heroFeatures.map((f, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 + i * 0.1, ease: [0.4, 0, 0.2, 1] }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '11px 14px', borderRadius: 'var(--radius-md)',
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.55)',
                    }}
                  >
                    <span style={{ color: 'var(--primary)', flexShrink: 0 }}>{f.icon}</span>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{f.text}</span>
                  </motion.div>
                ))}
              </div>
              <div style={{
                marginTop: 16, padding: '12px 14px', borderRadius: 'var(--radius-md)',
                background: 'var(--primary-subtle)',
                border: '1px solid var(--primary-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.55)' }}>Next Available</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--secondary)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
                  Tomorrow onwards
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.button
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          onClick={scrollToHow}
          style={{
            position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.35)', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', fontFamily: 'inherit',
          }}
        >
          Scroll to explore
          <CaretDown size={16} weight="bold" />
        </motion.button>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div id="how-it-works" style={{ padding: '96px 24px', backgroundColor: 'var(--background)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: 60 }}
          >
            <div style={{
              display: 'inline-block', padding: '5px 16px', borderRadius: 'var(--radius-full)',
              background: 'var(--primary-subtle)', color: 'var(--primary)',
              fontSize: 'var(--text-xs)', fontWeight: 700, marginBottom: 14, letterSpacing: '0.8px', textTransform: 'uppercase',
            }}>
              Simple Process
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 900, color: 'var(--maroon)', marginBottom: 12, letterSpacing: '-0.5px' }}>
              How It Works
            </h2>
            <p style={{ fontSize: 'var(--text-md)', color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto' }}>
              Book your hall in just 3 simple steps — fast, easy and transparent
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {steps.map((step, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.55, delay: i * 0.15 }}
                whileHover={{ y: -6, boxShadow: 'var(--shadow-xl)' }}
                style={{
                  borderRadius: 'var(--radius-xl)', padding: '32px 28px',
                  background: 'var(--surface-solid)', border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-md)', position: 'relative', overflow: 'hidden',
                  transition: 'box-shadow 0.25s ease, transform 0.25s ease',
                }}
              >
                {/* Number watermark */}
                <div style={{
                  position: 'absolute', top: 16, right: 22,
                  fontSize: 56, fontWeight: 900, color: `${step.colorRaw}10`, lineHeight: 1,
                  userSelect: 'none',
                }}>{i + 1}</div>

                {/* Icon */}
                <div style={{
                  width: 52, height: 52, borderRadius: 'var(--radius-lg)',
                  background: `${step.colorRaw}12`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20, border: `1.5px solid ${step.colorRaw}22`,
                  color: step.color,
                }}>
                  {step.icon}
                </div>

                <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--maroon)', marginBottom: 10 }}>{step.title}</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CALENDAR ── */}
      <div style={{ padding: '80px 24px', background: 'linear-gradient(135deg, #1a0000 0%, #5a0e0e 60%, var(--maroon) 100%)' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: 44 }}
          >
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 900, color: 'white', marginBottom: 10 }}>Check Availability</h2>
            <p style={{ fontSize: 'var(--text-base)', color: 'rgba(255,255,255,0.5)' }}>See which dates are open for booking this month</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 }}
            style={{
              borderRadius: 'var(--radius-xl)', padding: '32px',
              background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 30px 80px rgba(0,0,0,0.28)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'white' }}>
                {MONTH_NAMES[calendarData.month]} {calendarData.year}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'rgba(255,255,255,0.3)', padding: '4px 0' }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {[...Array(calendarData.firstDay)].map((_, i) => <div key={`e-${i}`} />)}
              {[...Array(calendarData.daysInMonth)].map((_, i) => {
                const day = i + 1
                const status = getDateStatus(day)
                return (
                  <motion.div key={day} whileHover={status === 'available' && day >= today ? { scale: 1.15 } : {}} style={getDateStyle(status, day)}>
                    {day}
                  </motion.div>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
              {[
                { color: 'var(--success)', bg: 'var(--success-subtle)', label: 'Available' },
                { color: 'var(--error)', bg: 'var(--error-subtle)', label: 'Booked' },
                { color: 'var(--warning)', bg: 'var(--warning-subtle)', label: 'Locked' },
                { color: 'white', bg: 'linear-gradient(135deg, var(--primary), var(--maroon))', label: 'Today' },
              ].map((l, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 'var(--radius-sm)', background: l.bg }} />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{l.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── CONTACT ── */}
      <div style={{ padding: '80px 24px', backgroundColor: 'var(--background)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: 52 }}
          >
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 900, color: 'var(--maroon)', marginBottom: 10 }}>Get In Touch</h2>
            <p style={{ fontSize: 'var(--text-md)', color: 'var(--text-muted)' }}>We are here to help you plan your perfect event</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
            {contactItems.map((c, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.12 }}
                whileHover={{ y: -5, boxShadow: 'var(--shadow-xl)' }}
                style={{
                  borderRadius: 'var(--radius-xl)', padding: '28px 24px',
                  background: 'var(--surface-solid)', border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-md)', textAlign: 'center',
                  transition: 'box-shadow 0.25s ease, transform 0.25s ease',
                }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: 'var(--radius-lg)',
                  background: 'var(--primary-subtle)', border: '1px solid var(--primary-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 14px', color: c.color,
                }}>
                  {c.icon}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1.2px', marginBottom: 6, textTransform: 'uppercase' }}>
                  {c.label}
                </div>
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text)', lineHeight: 1.5 }}>{c.value}</div>
              </motion.div>
            ))}
          </div>

          {/* CTA Banner */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.25 }}
            style={{
              marginTop: 44, borderRadius: 'var(--radius-xl)', padding: '52px 32px',
              background: 'linear-gradient(135deg, #1a0000 0%, #5a0e0e 50%, #c94a1a 100%)',
              textAlign: 'center', position: 'relative', overflow: 'hidden',
            }}
          >
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
              style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(247,201,72,0.05)' }} />
            <motion.div animate={{ rotate: -360 }} transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
              style={{ position: 'absolute', bottom: -40, left: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,107,53,0.06)' }} />

            <div style={{ position: 'relative', zIndex: 2 }}>
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: 46, marginBottom: 16 }}>🛕</motion.div>
              <h3 style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 900, color: 'white', marginBottom: 10 }}>
                {isLoggedIn ? 'Ready to Book Your Hall?' : 'Ready to Book Your Event?'}
              </h3>
              <p style={{ fontSize: 'var(--text-base)', color: 'rgba(255,255,255,0.58)', marginBottom: 28, maxWidth: 400, margin: '0 auto 28px' }}>
                {isLoggedIn
                  ? 'Book the hall for your most special moments'
                  : 'Join our Samaj community and book the hall for your most special moments'}
              </p>
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: '0 14px 36px rgba(255,107,53,0.55)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCreateAccount}
                  style={{
                    padding: '13px 30px', borderRadius: 'var(--radius-full)', border: 'none',
                    cursor: 'pointer', fontSize: 'var(--text-base)', fontWeight: 800, color: 'white',
                    background: 'linear-gradient(135deg, var(--primary), var(--maroon))',
                    boxShadow: '0 8px 24px var(--primary-border)',
                    display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'inherit',
                  }}
                >
                  {isLoggedIn ? 'Book Now' : 'Create Account'}
                  <ArrowRight size={15} weight="bold" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04, backgroundColor: 'rgba(255,255,255,0.14)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleLoginOrDashboard}
                  style={{
                    padding: '13px 30px', borderRadius: 'var(--radius-full)',
                    border: '1.5px solid rgba(255,255,255,0.26)',
                    cursor: 'pointer', fontSize: 'var(--text-base)', fontWeight: 700, color: 'white',
                    background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(10px)',
                    fontFamily: 'inherit',
                  }}
                >
                  {isLoggedIn ? 'Dashboard' : 'Login'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />

      {isLoggedIn && (
        <>
          {!showRitualModal && <RitualFloatingIcon ritualStatus={ritualStatus} onClick={() => setShowRitualModal(true)} />}
          <RitualPaymentModal
            isOpen={showRitualModal}
            onClose={() => setShowRitualModal(false)}
            ritualStatus={ritualStatus}
            onPaymentSuccess={async () => {
              try {
                const res = await ritualAPI.getMyStatus()
                setRitualStatus(res.data)
              } catch { /* ignore */ }
            }}
          />
        </>
      )}
    </div>
  )
}

export default Home
