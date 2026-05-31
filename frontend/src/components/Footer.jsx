import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

function Footer() {
  const currentYear = new Date().getFullYear()
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()

  const quickLinks = [
    { path: '/', label: 'Home' },
    { path: '/booking', label: 'Book Hall' },
    { path: '/my-bookings', label: 'My Bookings' },
    { path: '/notifications', label: 'Notifications' },
    { path: '/profile', label: 'Profile' },
  ]

  const contactInfo = [
    { icon: '📍', text: '123 Samaj Nagar, Rajasthan, India' },
    { icon: '📞', text: '+91 98765 43210' },
    { icon: '📧', text: 'info@dharamshala.com' },
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
      background: 'linear-gradient(160deg, #1a0000 0%, #5a0e0e 50%, #8B1A1A 100%)',
      color: 'white', paddingTop: 64,
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 48, paddingBottom: 48,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 36 }}>🛕</span>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'white', lineHeight: 1.2 }}>Dharamshala</div>
                <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, letterSpacing: '1px' }}>BOOKING</div>
              </div>
            </div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, maxWidth: 260 }}>
              Your trusted community hall booking platform. Book for weddings, celebrations, meetings and more.
            </p>
            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
              {['🌐', '📘', '📸'].map((icon, i) => (
                <motion.div key={i}
                  whileHover={{ scale: 1.15, backgroundColor: 'rgba(255,107,53,0.3)' }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, cursor: 'pointer', transition: 'all 0.2s ease',
                  }}>
                  {icon}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 20, letterSpacing: '1px', textTransform: 'uppercase' }}>
              Quick Links
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {quickLinks.map((link) => (
                <Link key={link.path} to={link.path} style={{ textDecoration: 'none' }}>
                  <motion.div whileHover={{ x: 6, color: 'var(--primary)' }}
                    style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', gap: 8, transition: 'color 0.2s ease', cursor: 'pointer' }}>
                    <span style={{ fontSize: 10, color: 'var(--primary)' }}>›</span>
                    {link.label}
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 20, letterSpacing: '1px', textTransform: 'uppercase' }}>
              Contact Us
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {contactInfo.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ fontSize: 16, flexShrink: 0, marginTop: 2 }}>{item.icon}</span>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA — auth-aware */}
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 20, letterSpacing: '1px', textTransform: 'uppercase' }}>
              Book Now
            </h4>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 20 }}>
              {isLoggedIn
                ? 'Book your dates and host your perfect event with us.'
                : 'Create an account and book your dates today.'}
            </p>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(255,107,53,0.5)' }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCTA}
              style={{
                padding: '12px 24px', borderRadius: 12, border: 'none',
                cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'white',
                background: 'linear-gradient(135deg, #FF6B35 0%, #8B1A1A 100%)',
                boxShadow: '0 6px 20px rgba(255,107,53,0.35)', width: '100%',
              }}>
              {isLoggedIn ? 'Book Hall →' : 'Create Account →'}
            </motion.button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          padding: '20px 0', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
            © {currentYear} Dharamshala Booking. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacy Policy', 'Terms of Service'].map((item, i) => (
              <motion.span key={i} whileHover={{ color: 'var(--primary)' }}
                style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', cursor: 'pointer', transition: 'color 0.2s ease' }}>
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
