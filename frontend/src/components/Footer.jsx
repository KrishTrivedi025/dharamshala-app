import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useIsMobile } from '../pages/admin/AdminDashboard'
import {
  MapPin, Phone, Envelope, Globe, FacebookLogo, InstagramLogo,
  ArrowRight,
} from '@phosphor-icons/react'

function Footer() {
  const currentYear = new Date().getFullYear()
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const quickLinks = [
    { path: '/', label: 'Home' },
    { path: '/booking', label: 'Book Hall' },
    { path: '/my-bookings', label: 'My Bookings' },
    { path: '/notifications', label: 'Notifications' },
    { path: '/profile', label: 'Profile' },
  ]

  const contactInfo = [
    { icon: <MapPin size={16} weight="fill" />, text: '123 Samaj Nagar, Rajasthan, India' },
    { icon: <Phone size={16} weight="fill" />, text: '+91 98765 43210' },
    { icon: <Envelope size={16} weight="fill" />, text: 'info@dharamshala.com' },
  ]

  const socialIcons = [
    { icon: <Globe size={16} weight="bold" />, label: 'Website' },
    { icon: <FacebookLogo size={16} weight="bold" />, label: 'Facebook' },
    { icon: <InstagramLogo size={16} weight="bold" />, label: 'Instagram' },
  ]

  const handleCTA = () => {
    if (isLoggedIn) {
      navigate('/booking')
    } else {
      navigate('/signup')
    }
  }

  return (
    <footer style={{
      background: 'linear-gradient(160deg, #1a0000 0%, #5a0e0e 50%, var(--maroon) 100%)',
      color: 'white', paddingTop: isMobile ? 36 : 64,
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: isMobile ? 28 : 48, paddingBottom: isMobile ? 28 : 48,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 36 }}>🛕</span>
              <div>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'white', lineHeight: 1.2 }}>Dharamshala</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--primary)', fontWeight: 600, letterSpacing: '1px' }}>BOOKING</div>
              </div>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, maxWidth: 260 }}>
              Your trusted community hall booking platform. Book for weddings, celebrations, meetings and more.
            </p>
            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
              {socialIcons.map(({ icon, label }, i) => (
                <motion.button
                  key={i}
                  aria-label={label}
                  whileHover={{ scale: 1.15, backgroundColor: 'rgba(255,107,53,0.3)' }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    width: 38, height: 38, borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  {icon}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{
              fontSize: 'var(--text-xs)', fontWeight: 700, color: 'rgba(255,255,255,0.9)',
              marginBottom: 20, letterSpacing: '1px', textTransform: 'uppercase',
            }}>
              Quick Links
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {quickLinks.map((link) => (
                <Link key={link.path} to={link.path} style={{ textDecoration: 'none' }}>
                  <motion.div
                    whileHover={{ x: 6, color: 'var(--primary)' }}
                    style={{
                      fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.55)',
                      display: 'flex', alignItems: 'center', gap: 8,
                      transition: 'color 0.2s ease', cursor: 'pointer',
                    }}
                  >
                    <ArrowRight size={10} weight="bold" style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    {link.label}
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{
              fontSize: 'var(--text-xs)', fontWeight: 700, color: 'rgba(255,255,255,0.9)',
              marginBottom: 20, letterSpacing: '1px', textTransform: 'uppercase',
            }}>
              Contact Us
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {contactInfo.map(({ icon, text }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 3 }}>{icon}</span>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div>
            <h4 style={{
              fontSize: 'var(--text-xs)', fontWeight: 700, color: 'rgba(255,255,255,0.9)',
              marginBottom: 20, letterSpacing: '1px', textTransform: 'uppercase',
            }}>
              Book Now
            </h4>
            <p style={{ fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 20 }}>
              {isLoggedIn
                ? 'Book your dates and host your perfect event with us.'
                : 'Create an account and book your dates today.'}
            </p>
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 10px 30px rgba(255,107,53,0.5)' }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCTA}
              style={{
                padding: '12px 24px', borderRadius: 'var(--radius-md)', border: 'none',
                cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'white',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--maroon) 100%)',
                boxShadow: '0 6px 20px rgba(255,107,53,0.35)', width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: 'inherit',
              }}
            >
              {isLoggedIn ? 'Book Hall' : 'Create Account'}
              <ArrowRight size={15} weight="bold" />
            </motion.button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          padding: '20px 0', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.35)' }}>
            © {currentYear} Dharamshala Booking. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacy Policy', 'Terms of Service'].map((item, i) => (
              <motion.span
                key={i}
                whileHover={{ color: 'var(--primary)' }}
                style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', transition: 'color 0.2s ease' }}
              >
                {item}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
