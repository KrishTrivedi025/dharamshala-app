import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import RitualFloatingIcon from '../components/RitualFloatingIcon'
import RitualPaymentModal from '../components/RitualPaymentModal'
import { ritualAPI } from '../utils/api'

const steps = [
  { icon: '📝', title: 'Submit Request', desc: 'Fill in your event details and preferred dates and send your booking request to the admin', color: '#FF6B35' },
  { icon: '✅', title: 'Admin Approval', desc: 'Our admin reviews your request personally and sets the pricing for your event', color: '#F7C948' },
  { icon: '💳', title: 'Pay & Confirm', desc: 'Pay securely online or lock your dates and pay before your event begins', color: '#8B1A1A' },
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
        // Show modal automatically on Jan 1 if not paid
        const now = new Date()
        const isJan1 = now.getMonth() === 0 && now.getDate() === 1
        if (isJan1 && !res.data.hasPaid) {
          setShowRitualModal(true)
        }
      } catch (e) { /* ignore */ }
    }
    fetchRitual()
  }, [isLoggedIn])

  const handleBookNow = () => {
    if (isLoggedIn) {
      navigate('/booking')
    } else {
      navigate('/login')
    }
  }

  const handleCreateAccount = () => {
    if (isLoggedIn) {
      navigate('/booking')
    } else {
      navigate('/signup')
    }
  }

  const handleLoginOrDashboard = () => {
    if (isLoggedIn) {
      navigate('/dashboard')
    } else {
      navigate('/login')
    }
  }

  const getDateStatus = (day) => {
    if (calendarData.bookedDates.includes(day)) return 'booked'
    if (calendarData.lockedDates.includes(day)) return 'locked'
    if (day < today) return 'past'
    return 'available'
  }

  const getDateStyle = (status, day) => {
    const base = {
      width: 38, height: 38, borderRadius: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 600,
      cursor: status === 'available' ? 'pointer' : 'default',
      transition: 'all 0.2s ease', margin: '2px auto',
    }
    if (day === today) return { ...base, background: 'linear-gradient(135deg, #FF6B35, #8B1A1A)', color: 'white', fontWeight: 800, boxShadow: '0 4px 12px rgba(255,107,53,0.5)' }
    if (status === 'booked') return { ...base, backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444', textDecoration: 'line-through' }
    if (status === 'locked') return { ...base, backgroundColor: 'rgba(247,201,72,0.2)', color: '#d97706' }
    if (status === 'past') return { ...base, color: '#d1d5db' }
    return { ...base, backgroundColor: 'rgba(34,197,94,0.1)', color: '#16a34a' }
  }

  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />

      {/* HERO SECTION */}
      <div style={{
        background: 'linear-gradient(160deg, #1a0000 0%, #5a0e0e 40%, #c94a1a 80%, #FF6B35 100%)',
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {[...Array(4)].map((_, i) => (
          <motion.div key={i} style={{
            position: 'absolute', borderRadius: '50%',
            background: `rgba(247,201,72,${0.04 + i * 0.02})`,
            width: 300 + i * 150, height: 300 + i * 150,
            top: `${-20 + i * 25}%`, left: `${-10 + i * 20}%`,
          }}
            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
            transition={{ duration: 20 + i * 5, repeat: Infinity, ease: 'linear' }}
          />
        ))}
        <motion.div style={{
          position: 'absolute', top: '15%', right: '5%',
          width: 280, height: 280, borderRadius: '50%',
          background: 'rgba(255,107,53,0.07)',
        }}
          animate={{ y: [-20, 20, -20], scale: [1, 1.05, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '100px 32px 80px',
          width: '100%', position: 'relative', zIndex: 10,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center',
        }}>
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9 }}>
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: 80, marginBottom: 20, display: 'block', lineHeight: 1 }}>🛕</motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{
                display: 'inline-block', padding: '6px 18px', borderRadius: 99,
                background: 'rgba(247,201,72,0.12)', border: '1px solid rgba(247,201,72,0.3)',
                color: '#F7C948', fontSize: 13, fontWeight: 600, marginBottom: 20, letterSpacing: '0.5px',
              }}>
              ✨ Community Hall Booking Platform
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ fontSize: 'clamp(32px, 4vw, 54px)', fontWeight: 900, color: 'white', lineHeight: 1.15, marginBottom: 20, letterSpacing: '-1px' }}>
              Welcome to Our<br />
              <span style={{ color: '#F7C948' }}>Dharamshala</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              style={{ fontSize: 17, color: 'rgba(255,255,255,0.72)', lineHeight: 1.7, marginBottom: 36, maxWidth: 460 }}>
              Book our beautiful community hall for your most special occasions — weddings, celebrations, meetings and more.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 20px 50px rgba(255,107,53,0.6)' }}
                whileTap={{ scale: 0.97 }}
                onClick={handleBookNow}
                style={{
                  padding: '16px 36px', borderRadius: 14, border: 'none', cursor: 'pointer',
                  fontSize: 16, fontWeight: 800, color: 'white',
                  background: 'linear-gradient(135deg, #FF6B35 0%, #c94a1a 50%, #8B1A1A 100%)',
                  boxShadow: '0 8px 30px rgba(255,107,53,0.45)', letterSpacing: '0.3px',
                }}>
                🏛️ Book Now
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.15)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
                style={{
                  padding: '16px 36px', borderRadius: 14,
                  border: '1.5px solid rgba(255,255,255,0.3)',
                  cursor: 'pointer', fontSize: 16, fontWeight: 700, color: 'white',
                  background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)',
                }}>
                Learn More ↓
              </motion.button>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
              style={{ display: 'flex', gap: 36, marginTop: 48, flexWrap: 'wrap' }}>
              {[{ n: '500+', l: 'Members' }, { n: '200+', l: 'Events Hosted' }, { n: '10+', l: 'Years Service' }, { n: '5★', l: 'Rating' }].map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#F7C948' }}>{s.n}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              borderRadius: 28, padding: 32, width: '100%', maxWidth: 400,
              background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.14)', boxShadow: '0 30px 80px rgba(0,0,0,0.3)',
            }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 4 }}>🏛️ Main Hall</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Capacity: 500+ Guests</div>
              </div>
              {[
                { icon: '🎊', text: 'Weddings & Celebrations' },
                { icon: '🙏', text: 'Religious Functions' },
                { icon: '🎂', text: 'Birthday Parties' },
                { icon: '💼', text: 'Meetings & Conferences' },
              ].map((f, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', borderRadius: 12, marginBottom: 10,
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)',
                  }}>
                  <span style={{ fontSize: 22 }}>{f.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.82)' }}>{f.text}</span>
                </motion.div>
              ))}
              <motion.div whileHover={{ scale: 1.02 }}
                style={{
                  marginTop: 20, padding: '14px', borderRadius: 14, textAlign: 'center',
                  background: 'rgba(255,107,53,0.15)', border: '1px solid rgba(255,107,53,0.3)',
                }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Next Available Date</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#F7C948' }}>Tomorrow onwards 🟢</div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}
          onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
          style={{
            position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', cursor: 'pointer',
          }}>
          ↓ Scroll to explore
        </motion.div>
      </div>

      {/* HOW IT WORKS */}
      <div id="how-it-works" style={{ padding: '100px 24px', backgroundColor: 'var(--background)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
            style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{
              display: 'inline-block', padding: '6px 18px', borderRadius: 99,
              background: 'rgba(255,107,53,0.1)', color: 'var(--primary)',
              fontSize: 13, fontWeight: 700, marginBottom: 16, letterSpacing: '0.5px',
            }}>
              SIMPLE PROCESS
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 900, color: 'var(--maroon)', marginBottom: 12, letterSpacing: '-0.5px' }}>
              How It Works
            </h2>
            <p style={{ fontSize: 16, color: '#9ca3af', maxWidth: 480, margin: '0 auto' }}>
              Book your hall in just 3 simple steps — fast, easy and transparent
            </p>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 28 }}>
            {steps.map((step, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.2 }}
                whileHover={{ y: -8, boxShadow: '0 24px 60px rgba(139,26,26,0.12)' }}
                style={{
                  borderRadius: 24, padding: '36px 32px',
                  background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)',
                  border: '1.5px solid rgba(255,107,53,0.08)',
                  boxShadow: '0 8px 32px rgba(139,26,26,0.07)',
                  position: 'relative', overflow: 'hidden',
                  transition: 'box-shadow 0.3s ease',
                }}>
                <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: `${step.color}10` }} />
                <div style={{ width: 56, height: 56, borderRadius: 16, background: `${step.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 20, border: `1.5px solid ${step.color}25` }}>
                  {step.icon}
                </div>
                <div style={{ position: 'absolute', top: 24, right: 28, fontSize: 52, fontWeight: 900, color: `${step.color}12`, lineHeight: 1 }}>{i + 1}</div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--maroon)', marginBottom: 10 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7 }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CALENDAR SECTION */}
      <div style={{ padding: '80px 24px', background: 'linear-gradient(135deg, #1a0000 0%, #5a0e0e 60%, #8B1A1A 100%)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
            style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 900, color: 'white', marginBottom: 10 }}>Check Availability</h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)' }}>See which dates are available for booking this month</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }}
            style={{
              borderRadius: 28, padding: '36px',
              background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.11)', boxShadow: '0 30px 80px rgba(0,0,0,0.3)',
            }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>
                {MONTH_NAMES[calendarData.month]} {calendarData.year}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 8 }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', padding: '4px 0' }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {[...Array(calendarData.firstDay)].map((_, i) => <div key={`e-${i}`} />)}
              {[...Array(calendarData.daysInMonth)].map((_, i) => {
                const day = i + 1
                const status = getDateStatus(day)
                return (
                  <motion.div key={day} whileHover={status === 'available' && day >= today ? { scale: 1.18 } : {}} style={getDateStyle(status, day)}>
                    {day}
                  </motion.div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
              {[
                { color: '#16a34a', bg: 'rgba(34,197,94,0.1)', label: 'Available' },
                { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', label: 'Booked' },
                { color: '#d97706', bg: 'rgba(247,201,72,0.2)', label: 'Locked' },
                { color: 'white', bg: 'linear-gradient(135deg, #FF6B35, #8B1A1A)', label: 'Today' },
              ].map((l, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 4, background: l.bg, border: `1.5px solid ${l.color}50` }} />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{l.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* CONTACT SECTION */}
      <div style={{ padding: '80px 24px', backgroundColor: 'var(--background)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
            style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 900, color: 'var(--maroon)', marginBottom: 12 }}>Get In Touch</h2>
            <p style={{ fontSize: 16, color: '#9ca3af' }}>We are here to help you plan your perfect event</p>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {[
              { icon: '📍', label: 'Address', value: '123 Samaj Nagar, Rajasthan, India', color: '#FF6B35' },
              { icon: '📞', label: 'Phone', value: '+91 98765 43210', color: '#8B1A1A' },
              { icon: '📧', label: 'Email', value: 'info@dharamshala.com', color: '#F7C948' },
            ].map((c, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.15 }}
                whileHover={{ y: -6, boxShadow: '0 20px 50px rgba(139,26,26,0.1)' }}
                style={{
                  borderRadius: 20, padding: '32px 28px',
                  background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)',
                  border: '1.5px solid rgba(255,107,53,0.08)',
                  boxShadow: '0 8px 32px rgba(139,26,26,0.06)',
                  textAlign: 'center', transition: 'box-shadow 0.3s ease',
                }}>
                <div style={{ width: 60, height: 60, borderRadius: 18, background: `${c.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px', border: `1.5px solid ${c.color}25` }}>
                  {c.icon}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '1.5px', marginBottom: 8 }}>{c.label.toUpperCase()}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', lineHeight: 1.5 }}>{c.value}</div>
              </motion.div>
            ))}
          </div>

          {/* CTA Banner — smart routing */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.3 }}
            style={{
              marginTop: 48, borderRadius: 24, padding: '56px 32px',
              background: 'linear-gradient(135deg, #1a0000 0%, #5a0e0e 50%, #c94a1a 100%)',
              textAlign: 'center', position: 'relative', overflow: 'hidden',
            }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(247,201,72,0.06)' }} />
            <motion.div animate={{ rotate: -360 }} transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              style={{ position: 'absolute', bottom: -40, left: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,107,53,0.07)' }} />
            <div style={{ position: 'relative', zIndex: 2 }}>
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: 48, marginBottom: 16 }}>🛕</motion.div>
              <h3 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 900, color: 'white', marginBottom: 12 }}>
                {isLoggedIn ? 'Ready to Book Your Hall?' : 'Ready to Book Your Event?'}
              </h3>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.62)', marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
                {isLoggedIn
                  ? 'Book the hall for your most special moments'
                  : 'Join our Samaj community and book the hall for your most special moments'}
              </p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 16px 40px rgba(255,107,53,0.6)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCreateAccount}
                  style={{
                    padding: '14px 32px', borderRadius: 14, border: 'none',
                    cursor: 'pointer', fontSize: 15, fontWeight: 800, color: 'white',
                    background: 'linear-gradient(135deg, #FF6B35, #8B1A1A)',
                    boxShadow: '0 8px 24px rgba(255,107,53,0.4)',
                  }}>
                  {isLoggedIn ? 'Book Now →' : 'Create Account →'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.15)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleLoginOrDashboard}
                  style={{
                    padding: '14px 32px', borderRadius: 14,
                    border: '1.5px solid rgba(255,255,255,0.3)',
                    cursor: 'pointer', fontSize: 15, fontWeight: 700, color: 'white',
                    background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)',
                  }}>
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
          <RitualFloatingIcon
            ritualStatus={ritualStatus}
            onClick={() => setShowRitualModal(true)}
          />
          <RitualPaymentModal
            isOpen={showRitualModal}
            onClose={() => setShowRitualModal(false)}
            ritualStatus={ritualStatus}
            onPaymentSuccess={async () => {
              try {
                const res = await ritualAPI.getMyStatus()
                setRitualStatus(res.data)
              } catch (e) {}
            }}
          />
        </>
      )}
    </div>
  )
}

export default Home
