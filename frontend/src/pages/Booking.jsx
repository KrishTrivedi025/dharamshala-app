import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { bookingAPI } from '../utils/api'

const EVENT_TYPES = [
  { value: 'wedding', label: 'Wedding', icon: '💍' },
  { value: 'reception', label: 'Reception', icon: '🎊' },
  { value: 'birthday', label: 'Birthday', icon: '🎂' },
  { value: 'religious', label: 'Religious', icon: '🙏' },
  { value: 'conference', label: 'Conference', icon: '💼' },
  { value: 'meeting', label: 'Meeting', icon: '📋' },
  { value: 'other', label: 'Other', icon: '✨' },
]

const TIME_OPTIONS = [
  { value: '06:00', label: '6:00 AM' },
  { value: '07:00', label: '7:00 AM' },
  { value: '08:00', label: '8:00 AM' },
  { value: '09:00', label: '9:00 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '13:00', label: '1:00 PM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '16:00', label: '4:00 PM' },
  { value: '17:00', label: '5:00 PM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '19:00', label: '7:00 PM' },
  { value: '20:00', label: '8:00 PM' },
  { value: '21:00', label: '9:00 PM' },
  { value: '22:00', label: '10:00 PM' },
  { value: '23:00', label: '11:00 PM' },
]


const STEPS = ['Event Details', 'Date & Time', 'Contact Info', 'Review & Submit']

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function Booking() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Calendar state
  const today = new Date()
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [availability, setAvailability] = useState({})

  useEffect(() => {
    const fetchAvailability = async () => {
      const start = new Date(calYear, calMonth, 1).toLocaleDateString('en-CA')
      const end = new Date(calYear, calMonth + 1, 0).toLocaleDateString('en-CA')
      try {
        const res = await bookingAPI.getAvailableDates(start, end)
        if (res.data) {
          const m = {}
          res.data.forEach(d => { m[d.date] = d.status })
          setAvailability(m)
        }
      } catch (err) { console.error('Failed to fetch calendar:', err) }
    }
    fetchAvailability()
  }, [calYear, calMonth])

  const [form, setForm] = useState({
    eventName: '',
    eventType: '',
    description: '',
    expectedGuests: '',
    specialRequests: '',
    selectedDates: [],
    startTime: '',
    endTime: '',
    contactName: user?.name || '',
    contactPhone: user?.phone || '',
    contactEmail: user?.email || '',
  })

  const [errors, setErrors] = useState({})

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
    setError('')
  }

  // Calendar generation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay()
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
    const days = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(d)
    return days
  }, [calMonth, calYear])

  const isDatePast = (day) => {
    if (!day) return true
    const d = new Date(calYear, calMonth, day)
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return d < todayStart
  }

  const isDateSelected = (day) => {
    if (!day) return false
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return form.selectedDates.includes(dateStr)
  }

  const toggleDate = (day) => {
    if (!day || isDatePast(day)) return
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const current = [...form.selectedDates]
    const idx = current.indexOf(dateStr)
    if (idx > -1) current.splice(idx, 1)
    else current.push(dateStr)
    current.sort()
    set('selectedDates', current)
  }

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
  }

  const canGoPrev = calYear > today.getFullYear() || (calYear === today.getFullYear() && calMonth > today.getMonth())

  const validateStep = (s) => {
    const e = {}
    if (s === 0) {
      if (!form.eventName.trim()) e.eventName = 'Event name is required'
    }
    if (s === 1) {
      if (form.selectedDates.length === 0) e.selectedDates = 'Please select at least one date'
    }
    if (s === 2) {
      if (!form.contactName.trim()) e.contactName = 'Contact name is required'
      if (!form.contactPhone || !/^[0-9]{10}$/.test(form.contactPhone)) e.contactPhone = 'Valid 10-digit phone required'
      if (!form.contactEmail || !/\S+@\S+\.\S+/.test(form.contactEmail)) e.contactEmail = 'Valid email required'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) setStep(prev => prev + 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const primaryDate = form.selectedDates[0]
      const extraDates = form.selectedDates.slice(1)
      await bookingAPI.create({
        eventName: form.eventName,
        eventType: form.eventType || 'other',
        description: form.description,
        eventDate: primaryDate,
        additionalDates: extraDates,
        startTime: '00:00',
        endTime: '23:59',
        expectedGuests: Number(form.expectedGuests) || 0,
        contactName: form.contactName,
        contactPhone: form.contactPhone,
        contactEmail: form.contactEmail,
        specialRequests: form.specialRequests || '',
        baseAmount: 0,
        totalAmount: 0,
      })
      navigate('/my-bookings', { state: { success: true } })
    } catch (err) {
      setError(err.message || 'Failed to submit booking. Please try again.')
      setStep(0)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (field) => ({
    width: '100%', padding: '14px 18px', borderRadius: 14, boxSizing: 'border-box',
    border: `2px solid ${errors[field] ? '#ef4444' : '#ede8e0'}`,
    backgroundColor: '#fafafa', outline: 'none',
    fontSize: 14, color: 'var(--text)', transition: 'all 0.25s ease',
    fontFamily: 'inherit',
  })

  const handleInputFocus = (e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 4px rgba(255,107,53,0.1)' }
  const handleInputBlur = (e) => { e.target.style.borderColor = errors[e.target.name] ? '#ef4444' : '#ede8e0'; e.target.style.boxShadow = 'none' }



  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />

      {/* Header */}
      <div style={{
        background: 'linear-gradient(160deg, #1a0000 0%, #5a0e0e 45%, #d45a20 100%)',
        padding: '60px 24px 48px',
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity }}
            style={{ fontSize: 52, marginBottom: 16 }}>🏛️</motion.div>
          <h1 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 900, color: 'white', marginBottom: 10 }}>
            Book the Hall
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)' }}>
            Fill in the details below and the admin will review your request
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #f0e8e0', padding: '0 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', overflowX: 'auto' }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ flex: 1, minWidth: 120, display: 'flex', alignItems: 'center' }}>
              <div style={{
                padding: '18px 0', display: 'flex', alignItems: 'center', gap: 10,
                borderBottom: `3px solid ${i === step ? 'var(--primary)' : i < step ? '#22c55e' : 'transparent'}`,
                width: '100%',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800,
                  background: i < step ? '#22c55e' : i === step ? 'var(--primary)' : '#e5e7eb',
                  color: i <= step ? 'white' : '#9ca3af',
                }}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span style={{
                  fontSize: 13, fontWeight: i === step ? 700 : 500,
                  color: i === step ? 'var(--primary)' : i < step ? '#22c55e' : '#9ca3af',
                  whiteSpace: 'nowrap',
                }}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && <div style={{ width: 20, height: 1, backgroundColor: '#e5e7eb', flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 80px' }}>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '14px 18px', borderRadius: 12, marginBottom: 24,
              background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.25)',
              fontSize: 14, color: '#ef4444', fontWeight: 600,
            }}>
            ⚠ {error}
          </motion.div>
        )}

        <div style={{
          borderRadius: 24, padding: 'clamp(24px, 4vw, 40px)',
          background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)',
          border: '1.5px solid rgba(255,107,53,0.1)',
          boxShadow: '0 8px 40px rgba(139,26,26,0.08)',
        }}>
          <AnimatePresence mode="wait">

            {/* STEP 0 — Event Details */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--maroon)', marginBottom: 28 }}>📝 Event Details</h2>

                <div style={{ marginBottom: 22 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Event Name *</label>
                  <input name="eventName" value={form.eventName} onChange={e => set('eventName', e.target.value)}
                    onFocus={handleInputFocus} onBlur={handleInputBlur}
                    placeholder="e.g. Sharma Family Wedding" style={inputStyle('eventName')} />
                  {errors.eventName && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 5 }}>⚠ {errors.eventName}</p>}
                </div>

                <div style={{ marginBottom: 22 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
                    Event Type <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                    {EVENT_TYPES.map(et => (
                      <motion.div key={et.value}
                        whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
                        onClick={() => set('eventType', form.eventType === et.value ? '' : et.value)}
                        style={{
                          padding: '14px 12px', borderRadius: 14, cursor: 'pointer',
                          border: `2px solid ${form.eventType === et.value ? 'var(--primary)' : '#ede8e0'}`,
                          background: form.eventType === et.value
                            ? 'linear-gradient(135deg, rgba(255,107,53,0.08), rgba(139,26,26,0.05))'
                            : '#fafafa',
                          fontWeight: form.eventType === et.value ? 700 : 500,
                          color: form.eventType === et.value ? 'var(--primary)' : 'var(--text)',
                          transition: 'all 0.25s ease', textAlign: 'center',
                          boxShadow: form.eventType === et.value ? '0 4px 12px rgba(255,107,53,0.15)' : 'none',
                        }}>
                        <div style={{ fontSize: 24, marginBottom: 4 }}>{et.icon}</div>
                        <div style={{ fontSize: 12 }}>{et.label}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
                      Expected Guests <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span>
                    </label>
                    <input type="number" name="expectedGuests" value={form.expectedGuests}
                      onChange={e => set('expectedGuests', e.target.value)}
                      onFocus={handleInputFocus} onBlur={handleInputBlur}
                      placeholder="e.g. 200" min="0" max="1000" style={inputStyle('expectedGuests')} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
                      Description <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span>
                    </label>
                    <input name="description" value={form.description} onChange={e => set('description', e.target.value)}
                      onFocus={handleInputFocus} onBlur={handleInputBlur}
                      placeholder="Brief description..." style={inputStyle('description')} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 1 — Date & Time with Calendar */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--maroon)', marginBottom: 28 }}>📅 Select Dates & Time</h2>

                {/* Calendar */}
                <div style={{
                  borderRadius: 20, overflow: 'hidden', marginBottom: 28,
                  border: '1.5px solid rgba(255,107,53,0.12)',
                  boxShadow: '0 4px 20px rgba(139,26,26,0.06)',
                }}>
                  {/* Calendar Header */}
                  <div style={{
                    background: 'linear-gradient(135deg, #1a0000 0%, #5a0e0e 60%, #c94a1a 100%)',
                    padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <motion.button
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={prevMonth} disabled={!canGoPrev}
                      style={{
                        width: 36, height: 36, borderRadius: '50%', border: 'none',
                        background: canGoPrev ? 'rgba(255,255,255,0.15)' : 'transparent',
                        color: canGoPrev ? 'white' : 'rgba(255,255,255,0.2)',
                        cursor: canGoPrev ? 'pointer' : 'not-allowed', fontSize: 16, fontWeight: 700,
                      }}>
                      ‹
                    </motion.button>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>
                        {MONTHS[calMonth]} {calYear}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                        Click dates to select • multiple dates allowed
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={nextMonth}
                      style={{
                        width: 36, height: 36, borderRadius: '50%', border: 'none',
                        background: 'rgba(255,255,255,0.15)', color: 'white',
                        cursor: 'pointer', fontSize: 16, fontWeight: 700,
                      }}>
                      ›
                    </motion.button>
                  </div>

                  {/* Weekday headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'rgb(250, 248, 245)' }}>
                    {WEEKDAYS.map(d => (
                      <div key={d} style={{
                        textAlign: 'center', padding: '10px 0', fontSize: 11,
                        fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1,
                      }}>{d}</div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'white',
                    padding: '8px', gap: 4,
                  }}>
                    {calendarDays.map((day, idx) => {
                      const past = isDatePast(day)
                      const isToday = day && calYear === today.getFullYear() && calMonth === today.getMonth() && day === today.getDate()
                      
                      let dayStatus = 'available'
                      let dateStr = ''
                      if (day) {
                        dateStr = new Date(calYear, calMonth, day).toLocaleDateString('en-CA')
                        dayStatus = availability[dateStr] || 'available'
                      }

                      const selected = isDateSelected(day)
                      const unclickable = !day || past || dayStatus === 'locked' || dayStatus === 'booked'

                      let bg = 'transparent'
                      let col = 'var(--text)'
                      let shadow = 'none'

                      if (selected) {
                        bg = 'linear-gradient(135deg, #FF6B35, #c94a1a)'
                        col = 'white'
                        shadow = '0 4px 12px rgba(255,107,53,0.3)'
                      } else if (dayStatus === 'locked') {
                        bg = 'rgba(146,64,14,0.1)' 
                        col = '#92400e'
                      } else if (dayStatus === 'booked') {
                        bg = 'rgba(239,68,68,0.1)'
                        col = '#ef4444'
                      } else if (isToday) {
                        bg = 'linear-gradient(135deg, #FF6B35, #f59e0b)'
                        col = 'white'
                      } else if (day && !past && (!unclickable || dayStatus === 'available' || dayStatus === 'partial')) {
                        bg = 'rgba(34,197,94,0.08)' // Green for available
                        col = '#16a34a'
                      }

                      if (past && !selected && !isToday && day) {
                        bg = 'transparent'
                        col = '#d1d5db'
                      }

                      return (
                        <motion.div
                          key={idx}
                          title={dayStatus === 'locked' ? 'Locked by admin' : dayStatus === 'booked' ? 'Fully Booked' : ''}
                          whileHover={!unclickable ? { scale: 1.15, zIndex: 10 } : {}}
                          whileTap={!unclickable ? { scale: 0.9 } : {}}
                          onClick={() => { if (!unclickable) toggleDate(day) }}
                          style={{
                            aspectRatio: '1', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', borderRadius: 12,
                            cursor: (!unclickable) ? 'pointer' : 'default',
                            fontSize: 14, fontWeight: selected ? 800 : isToday ? 700 : 600,
                            background: bg,
                            color: col,
                            border: isToday && !selected ? '2px solid rgba(255,107,53,0.3)' : '2px solid transparent',
                            transition: 'all 0.2s ease',
                            boxShadow: shadow,
                            opacity: (past && !isToday) ? 0.6 : 1
                          }}>
                          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {day || ''}
                            
                            {/* Status Indicator Dots */}
                            {(dayStatus === 'booked' || dayStatus === 'locked') && (
                              <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                  position: 'absolute',
                                  bottom: 4,
                                  fontSize: 8,
                                  fontWeight: 800,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.4px',
                                  color: dayStatus === 'booked' ? '#ef4444' : '#16a34a', // Red for booked, Green for locked
                                }}
                              >
                                {dayStatus === 'booked' ? 'Booked' : 'Locked'}
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>

                {/* Selected Dates Preview */}
                {form.selectedDates.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: '14px 18px', borderRadius: 14, marginBottom: 24,
                      background: 'rgba(34,197,94,0.06)', border: '1.5px solid rgba(34,197,94,0.15)',
                      display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
                    }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>📅 Selected:</span>
                    {form.selectedDates.map(d => (
                      <span key={d} style={{
                        padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                        background: 'rgba(34,197,94,0.1)', color: '#16a34a',
                      }}>
                        {new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    ))}
                  </motion.div>
                )}
                {errors.selectedDates && <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 16 }}>⚠ {errors.selectedDates}</p>}



                <div style={{
                  padding: '16px 20px', borderRadius: 14,
                  background: 'rgba(247,201,72,0.06)', border: '1.5px solid rgba(247,201,72,0.2)',
                }}>
                  <p style={{ fontSize: 13, color: '#92400e', fontWeight: 600, margin: 0 }}>
                    ℹ️ Admin will confirm availability and set the pricing after reviewing your request.
                  </p>
                </div>
              </motion.div>
            )}

            {/* STEP 2 — Contact Info */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--maroon)', marginBottom: 28 }}>📞 Contact Information</h2>

                <div style={{ marginBottom: 22 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Contact Name *</label>
                  <input name="contactName" value={form.contactName} onChange={e => set('contactName', e.target.value)}
                    onFocus={handleInputFocus} onBlur={handleInputBlur}
                    placeholder="Full name of the contact person" style={inputStyle('contactName')} />
                  {errors.contactName && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 5 }}>⚠ {errors.contactName}</p>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Phone Number *</label>
                    <input type="tel" name="contactPhone" value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)}
                      onFocus={handleInputFocus} onBlur={handleInputBlur}
                      placeholder="10-digit mobile number" maxLength={10} style={inputStyle('contactPhone')} />
                    {errors.contactPhone && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 5 }}>⚠ {errors.contactPhone}</p>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Email Address *</label>
                    <input type="email" name="contactEmail" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)}
                      onFocus={handleInputFocus} onBlur={handleInputBlur}
                      placeholder="your@email.com" style={inputStyle('contactEmail')} />
                    {errors.contactEmail && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 5 }}>⚠ {errors.contactEmail}</p>}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
                    Special Requests <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span>
                  </label>
                  <textarea name="specialRequests" value={form.specialRequests} onChange={e => set('specialRequests', e.target.value)}
                    onFocus={handleInputFocus} onBlur={handleInputBlur}
                    placeholder="Any special requirements or notes for the admin..." rows={3}
                    style={{ ...inputStyle('specialRequests'), resize: 'none', lineHeight: 1.6 }} />
                </div>
              </motion.div>
            )}

            {/* STEP 3 — Review */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--maroon)', marginBottom: 28 }}>✅ Review & Submit</h2>

                {[
                  { title: '📝 Event Details', rows: [
                    { label: 'Event Name', value: form.eventName },
                    ...(form.eventType ? [{ label: 'Event Type', value: EVENT_TYPES.find(e => e.value === form.eventType)?.icon + ' ' + EVENT_TYPES.find(e => e.value === form.eventType)?.label }] : []),
                    ...(form.expectedGuests ? [{ label: 'Expected Guests', value: `${form.expectedGuests} guests` }] : []),
                    ...(form.description ? [{ label: 'Description', value: form.description }] : []),
                  ]},
                  { title: '📅 Date & Time', rows: [
                    { label: 'Date(s)', value: form.selectedDates.map(d => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })).join(', ') },
                    { label: 'Time', value: `Full Day` },
                  ]},
                  { title: '📞 Contact', rows: [
                    { label: 'Name', value: form.contactName },
                    { label: 'Phone', value: form.contactPhone },
                    { label: 'Email', value: form.contactEmail },
                  ]},
                ].map((section, si) => (
                  <div key={si} style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--maroon)', marginBottom: 12 }}>{section.title}</div>
                    <div style={{
                      borderRadius: 16, overflow: 'hidden',
                      border: '1.5px solid rgba(255,107,53,0.1)',
                    }}>
                      {section.rows.map((row, ri) => (
                        <div key={ri} style={{
                          display: 'flex', padding: '13px 20px',
                          backgroundColor: ri % 2 === 0 ? '#fafafa' : 'white',
                          borderBottom: ri < section.rows.length - 1 ? '1px solid #f3ede5' : 'none',
                        }}>
                          <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600, width: 130, flexShrink: 0 }}>{row.label}</span>
                          <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{row.value || '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div style={{
                  padding: '16px 20px', borderRadius: 14,
                  background: 'rgba(255,107,53,0.05)', border: '1.5px solid rgba(255,107,53,0.15)',
                  marginBottom: 8,
                }}>
                  <p style={{ fontSize: 14, color: 'var(--maroon)', fontWeight: 600, margin: 0 }}>
                    🙏 By submitting, you agree that the admin will review your request and contact you with pricing details.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', gap: 12, marginTop: 32, justifyContent: 'space-between' }}>
            {step > 0 ? (
              <motion.button type="button" onClick={() => setStep(s => s - 1)}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{
                  padding: '14px 28px', borderRadius: 14,
                  border: '2px solid #ede8e0', background: 'white',
                  cursor: 'pointer', fontSize: 15, fontWeight: 700, color: 'var(--text)',
                }}>
                ← Back
              </motion.button>
            ) : <div />}

            {step < 3 ? (
              <motion.button type="button" onClick={handleNext}
                whileHover={{ scale: 1.02, boxShadow: '0 12px 30px rgba(255,107,53,0.4)' }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: '14px 36px', borderRadius: 14, border: 'none',
                  cursor: 'pointer', fontSize: 15, fontWeight: 800, color: 'white',
                  background: 'linear-gradient(135deg, #FF6B35 0%, #c94a1a 50%, #8B1A1A 100%)',
                  boxShadow: '0 6px 20px rgba(255,107,53,0.35)',
                }}>
                Continue →
              </motion.button>
            ) : (
              <motion.button type="button" onClick={handleSubmit} disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02, boxShadow: loading ? 'none' : '0 12px 30px rgba(255,107,53,0.4)' }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                style={{
                  padding: '14px 36px', borderRadius: 14, border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: 15, fontWeight: 800, color: 'white',
                  background: loading ? '#9ca3af' : 'linear-gradient(135deg, #FF6B35 0%, #c94a1a 50%, #8B1A1A 100%)',
                  boxShadow: loading ? 'none' : '0 6px 20px rgba(255,107,53,0.35)',
                }}>
                {loading ? '⏳ Submitting...' : '🙏 Submit Booking Request'}
              </motion.button>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Booking
