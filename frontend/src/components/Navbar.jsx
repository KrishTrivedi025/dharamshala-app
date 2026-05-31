import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../utils/api'

function Navbar() {
  const { t, language, changeLanguage } = useLanguage()
  const { user, isLoggedIn, isAdmin, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const langRef = useRef(null)
  const userRef = useRef(null)

  const isActive = (path) => location.pathname === path

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false)
      if (userRef.current && !userRef.current.contains(e.target)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const navLinks = [
    { path: '/', label: t.nav.home },
    { path: '/booking', label: t.nav.bookHall },
    { path: '/daan-peti', label: 'Daan Peti' },
    { path: '/my-bookings', label: t.nav.myBookings },
    { path: '/notifications', label: t.nav.notifications },
  ]

  const languages = [
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'hi', label: 'हिंदी', short: 'HI' },
    { code: 'mr', label: 'मारवाड़ी', short: 'MR' },
  ]

  const userMenuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    )},
    { label: 'My Bookings', path: '/my-bookings', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    )},
    { label: 'Profile', path: '/profile', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    )},
    ...(isAdmin ? [{ label: 'Admin Panel', path: '/admin', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
      </svg>
    ), admin: true }] : []),
  ]

  const handleLogout = async () => {
    try { await authAPI.logout() } catch (_) {}
    logout()
    navigate('/')
    setUserMenuOpen(false)
    setMenuOpen(false)
  }

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
          background: 'rgba(253,248,240,0.97)',
          backdropFilter: 'blur(24px)',
          borderBottom: scrolled ? '1px solid rgba(139,26,26,0.12)' : '1px solid rgba(139,26,26,0.07)',
          boxShadow: scrolled ? '0 2px 20px rgba(139,26,26,0.08)' : 'none',
          transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
        }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 28px',
          height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>

          {/* ── Logo (text only, no emoji) ── */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span style={{
                fontSize: 19, fontWeight: 900, color: 'var(--maroon)',
                letterSpacing: '-0.5px',
              }}>
                Dharamshala
              </span>
              <span style={{
                fontSize: 9.5, fontWeight: 700, color: 'var(--primary)',
                letterSpacing: '2.5px', textTransform: 'uppercase', marginTop: 2,
              }}>
                Booking
              </span>
            </div>
          </Link>

          {/* ── Desktop Nav Links ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {navLinks.map((link) => {
              const active = isActive(link.path)
              return (
                <Link key={link.path} to={link.path} style={{ textDecoration: 'none' }}>
                  <div style={{ position: 'relative', padding: '8px 15px', cursor: 'pointer' }}
                    className="nav-link-item">
                    <span style={{
                      fontSize: 13.5, fontWeight: active ? 700 : 500,
                      color: active ? 'var(--primary)' : '#4a4a4a',
                      letterSpacing: active ? '0' : '0.1px',
                      transition: 'color 0.2s ease',
                    }}>
                      {link.label}
                    </span>
                    {active && (
                      <motion.div
                        layoutId="navUnderline"
                        style={{
                          position: 'absolute', bottom: 0, left: 15, right: 15,
                          height: 2, borderRadius: 99,
                          background: 'linear-gradient(90deg, #FF6B35, #8B1A1A)',
                        }}
                      />
                    )}
                  </div>
                </Link>
              )
            })}

            {isAdmin && (
              <Link to="/admin" style={{ textDecoration: 'none' }}>
                <div style={{ position: 'relative', padding: '8px 15px', cursor: 'pointer' }}>
                  <span style={{
                    fontSize: 13.5,
                    fontWeight: location.pathname.startsWith('/admin') ? 700 : 500,
                    color: location.pathname.startsWith('/admin') ? 'var(--maroon)' : '#4a4a4a',
                    transition: 'color 0.2s ease',
                  }}>
                    Admin Panel
                  </span>
                  {location.pathname.startsWith('/admin') && (
                    <motion.div
                      layoutId="navUnderline"
                      style={{
                        position: 'absolute', bottom: 0, left: 15, right: 15,
                        height: 2, borderRadius: 99,
                        background: 'linear-gradient(90deg, #8B1A1A, #c94a1a)',
                      }}
                    />
                  )}
                </div>
              </Link>
            )}
          </div>

          {/* ── Right Controls ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

            {/* Language Switcher */}
            <div ref={langRef} style={{ position: 'relative' }}>
              <button
                onClick={() => { setLangOpen(v => !v); setUserMenuOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px', borderRadius: 8,
                  border: '1px solid rgba(139,26,26,0.14)',
                  background: langOpen ? 'rgba(139,26,26,0.05)' : 'transparent',
                  cursor: 'pointer', transition: 'all 0.18s ease',
                }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--maroon)', letterSpacing: '0.5px' }}>
                  {languages.find(l => l.code === language)?.short}
                </span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                  style={{ transform: langOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', opacity: 0.4 }}>
                  <path d="M2 3.5L5 6.5L8 3.5" stroke="#2D2D2D" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>

              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    style={{
                      position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                      background: 'white', borderRadius: 14, padding: '6px',
                      minWidth: 158,
                      boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.10)',
                      border: '1px solid rgba(0,0,0,0.07)', zIndex: 200,
                    }}>
                    {/* Dropdown arrow tip */}
                    <div style={{
                      position: 'absolute', top: -5, right: 16,
                      width: 10, height: 10, background: 'white',
                      border: '1px solid rgba(0,0,0,0.07)',
                      borderBottom: 'none', borderRight: 'none',
                      transform: 'rotate(45deg)',
                    }} />
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', letterSpacing: '1px', padding: '6px 12px 4px', textTransform: 'uppercase' }}>
                      Language
                    </div>
                    {languages.map((lang) => {
                      const active = language === lang.code
                      return (
                        <button key={lang.code}
                          onClick={() => { changeLanguage(lang.code); setLangOpen(false) }}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '9px 12px', borderRadius: 9, border: 'none',
                            background: active ? 'rgba(255,107,53,0.07)' : 'transparent',
                            cursor: 'pointer', transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f7f3ef' }}
                          onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: 13.5, fontWeight: active ? 700 : 500, color: active ? 'var(--primary)' : '#2d2d2d' }}>
                              {lang.label}
                            </span>
                          </div>
                          {active && (
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M2.5 7L5.5 10L11.5 4" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Auth */}
            {isLoggedIn ? (
              <div ref={userRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => { setUserMenuOpen(v => !v); setLangOpen(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '5px 12px 5px 5px', borderRadius: 99,
                    border: `1.5px solid ${userMenuOpen ? 'rgba(255,107,53,0.4)' : 'rgba(139,26,26,0.15)'}`,
                    background: userMenuOpen ? 'rgba(255,107,53,0.04)' : 'white',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                  }}>
                  {/* Avatar */}
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FF6B35 0%, #8B1A1A 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, color: 'white', flexShrink: 0,
                    letterSpacing: '-0.3px',
                  }}>
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span style={{
                    fontSize: 13.5, fontWeight: 600, color: '#2d2d2d',
                    maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {user?.name?.split(' ')[0] || 'User'}
                  </span>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                    style={{ transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', opacity: 0.35, flexShrink: 0 }}>
                    <path d="M2 3.5L5 6.5L8 3.5" stroke="#2D2D2D" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      style={{
                        position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                        background: 'white', borderRadius: 16, padding: '6px',
                        minWidth: 220,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 16px 48px rgba(0,0,0,0.12)',
                        border: '1px solid rgba(0,0,0,0.07)', zIndex: 200,
                      }}>
                      {/* Arrow tip */}
                      <div style={{
                        position: 'absolute', top: -5, right: 20,
                        width: 10, height: 10, background: 'white',
                        border: '1px solid rgba(0,0,0,0.07)',
                        borderBottom: 'none', borderRight: 'none',
                        transform: 'rotate(45deg)',
                      }} />

                      {/* User info header */}
                      <div style={{
                        padding: '10px 14px 12px', marginBottom: 4,
                        borderBottom: '1px solid #f0ebe3',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #FF6B35, #8B1A1A)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 15, fontWeight: 800, color: 'white', flexShrink: 0,
                          }}>
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {user?.name}
                            </div>
                            <div style={{ fontSize: 11.5, color: '#999', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {user?.email}
                            </div>
                          </div>
                        </div>
                        {isAdmin && (
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            marginTop: 8, padding: '3px 10px', borderRadius: 6,
                            background: 'rgba(139,26,26,0.07)',
                            border: '1px solid rgba(139,26,26,0.12)',
                          }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8B1A1A" strokeWidth="2.5">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                            <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--maroon)', letterSpacing: '0.3px' }}>Administrator</span>
                          </div>
                        )}
                      </div>

                      {/* Menu items */}
                      <div style={{ padding: '2px 0' }}>
                        {userMenuItems.map((item) => (
                          <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}
                            onClick={() => setUserMenuOpen(false)}>
                            <div
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
                                color: item.admin ? 'var(--maroon)' : '#2d2d2d',
                                transition: 'background 0.15s ease',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = item.admin ? 'rgba(139,26,26,0.05)' : '#f7f3ef'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <span style={{ color: item.admin ? 'var(--maroon)' : '#888', flexShrink: 0 }}>
                                {item.icon}
                              </span>
                              <span style={{ fontSize: 13.5, fontWeight: 500 }}>{item.label}</span>
                              {item.admin && (
                                <span style={{
                                  marginLeft: 'auto', fontSize: 9.5, fontWeight: 700,
                                  padding: '2px 7px', borderRadius: 5,
                                  background: 'rgba(139,26,26,0.08)', color: 'var(--maroon)',
                                }}>
                                  ADMIN
                                </span>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>

                      {/* Logout */}
                      <div style={{ padding: '4px 0 2px', borderTop: '1px solid #f0ebe3', marginTop: 4 }}>
                        <div
                          onClick={handleLogout}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.05)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                            <polyline points="16 17 21 12 16 7"/>
                            <line x1="21" y1="12" x2="9" y2="12"/>
                          </svg>
                          <span style={{ fontSize: 13.5, fontWeight: 500, color: '#DC2626' }}>
                            {t.nav.logout}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <button
                    style={{
                      padding: '8px 18px', borderRadius: 9,
                      border: '1.5px solid rgba(255,107,53,0.35)',
                      background: 'transparent', cursor: 'pointer',
                      fontSize: 13.5, fontWeight: 600, color: 'var(--primary)',
                      transition: 'all 0.18s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,53,0.05)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    {t.nav.login}
                  </button>
                </Link>
                <Link to="/signup" style={{ textDecoration: 'none' }}>
                  <button
                    style={{
                      padding: '8px 18px', borderRadius: 9, border: 'none',
                      background: 'linear-gradient(135deg, #FF6B35 0%, #8B1A1A 100%)',
                      cursor: 'pointer', fontSize: 13.5, fontWeight: 700, color: 'white',
                      boxShadow: '0 2px 8px rgba(255,107,53,0.3)',
                      transition: 'all 0.18s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,107,53,0.45)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(255,107,53,0.3)'; e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    {t.nav.signup}
                  </button>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => { setMenuOpen(v => !v); setLangOpen(false); setUserMenuOpen(false) }}
              className="lg:hidden"
              style={{
                width: 38, height: 38, borderRadius: 9,
                border: '1px solid rgba(139,26,26,0.15)',
                background: menuOpen ? 'rgba(139,26,26,0.06)' : 'transparent',
                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 5,
                transition: 'background 0.2s ease',
              }}>
              {[0, 1, 2].map((i) => (
                <motion.div key={i}
                  animate={{
                    rotate: menuOpen && i === 0 ? 45 : menuOpen && i === 2 ? -45 : 0,
                    y: menuOpen && i === 0 ? 7 : menuOpen && i === 2 ? -7 : 0,
                    opacity: menuOpen && i === 1 ? 0 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                  style={{ width: 18, height: 1.5, backgroundColor: 'var(--maroon)', borderRadius: 99 }}
                />
              ))}
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              style={{
                overflow: 'hidden',
                borderTop: '1px solid rgba(139,26,26,0.08)',
                background: '#fff',
              }}>
              <div style={{ padding: '12px 20px 20px' }}>

                {/* Nav links */}
                <div style={{ marginBottom: 12 }}>
                  {navLinks.map((link, i) => {
                    const active = isActive(link.path)
                    return (
                      <motion.div key={link.path}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}>
                        <Link to={link.path} onClick={() => setMenuOpen(false)}
                          style={{ textDecoration: 'none' }}>
                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '11px 14px', borderRadius: 10, marginBottom: 2,
                            background: active ? 'rgba(255,107,53,0.07)' : 'transparent',
                            transition: 'background 0.15s ease',
                          }}>
                            <span style={{
                              fontSize: 14.5, fontWeight: active ? 700 : 500,
                              color: active ? 'var(--primary)' : '#2d2d2d',
                            }}>
                              {link.label}
                            </span>
                            {active && (
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }} />
                            )}
                          </div>
                        </Link>
                      </motion.div>
                    )
                  })}

                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '11px 14px', borderRadius: 10, marginBottom: 2,
                        background: location.pathname.startsWith('/admin') ? 'rgba(139,26,26,0.06)' : 'transparent',
                      }}>
                        <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--maroon)' }}>
                          Admin Panel
                        </span>
                        <span style={{
                          fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                          background: 'rgba(139,26,26,0.08)', color: 'var(--maroon)',
                        }}>
                          ADMIN
                        </span>
                      </div>
                    </Link>
                  )}
                </div>

                <div style={{ height: 1, background: '#f0ebe3', marginBottom: 14 }} />

                {isLoggedIn ? (
                  <div>
                    {/* User info */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', borderRadius: 12,
                      background: '#faf7f3',
                      border: '1px solid rgba(139,26,26,0.08)',
                      marginBottom: 10,
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #FF6B35, #8B1A1A)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 800, color: 'white', flexShrink: 0,
                      }}>
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{user?.name}</div>
                        <div style={{ fontSize: 11.5, color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
                      </div>
                    </div>

                    <button onClick={handleLogout}
                      style={{
                        width: '100%', padding: '11px 14px', borderRadius: 10,
                        border: '1px solid rgba(220,38,38,0.2)',
                        background: 'rgba(220,38,38,0.04)',
                        cursor: 'pointer', fontSize: 14, fontWeight: 600,
                        color: '#DC2626', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      {t.nav.logout}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Link to="/login" style={{ flex: 1, textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>
                      <button style={{
                        width: '100%', padding: '11px', borderRadius: 10,
                        border: '1.5px solid rgba(255,107,53,0.3)', background: 'transparent',
                        cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--primary)',
                      }}>
                        {t.nav.login}
                      </button>
                    </Link>
                    <Link to="/signup" style={{ flex: 1, textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>
                      <button style={{
                        width: '100%', padding: '11px', borderRadius: 10,
                        border: 'none', background: 'linear-gradient(135deg, #FF6B35, #8B1A1A)',
                        cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'white',
                      }}>
                        {t.nav.signup}
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Spacer */}
      <div style={{ height: 66 }} />

      {/* Hover styles injected globally */}
      <style>{`
        .nav-link-item:hover span { color: var(--primary) !important; }
      `}</style>
    </>
  )
}

export default Navbar
