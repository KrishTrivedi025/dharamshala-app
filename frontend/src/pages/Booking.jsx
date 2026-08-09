import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PencilLine, CalendarBlank, Phone, CheckCircle,
  ArrowLeft, ArrowRight, WarningCircle, CircleNotch, Info,
  Diamond, Confetti, Gift, Briefcase, Users, Sparkle,
} from '@phosphor-icons/react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { bookingAPI } from '../utils/api'

const EVENT_TYPES = [
  { value: 'wedding', label: 'Wedding', icon: <Diamond size={22} weight="duotone" /> },
  { value: 'reception', label: 'Reception', icon: <Confetti size={22} weight="duotone" /> },
  { value: 'birthday', label: 'Birthday', icon: <Gift size={22} weight="duotone" /> },
  { value: 'religious', label: 'Religious', icon: <span style={{ fontSize: 20, lineHeight: 1 }}>🙏</span> },
  { value: 'conference', label: 'Conference', icon: <Briefcase size={22} weight="duotone" /> },
  { value: 'meeting', label: 'Meeting', icon: <Users size={22} weight="duotone" /> },
  { value: 'other', label: 'Other', icon: <Sparkle size={22} weight="duotone" /> },
]

const STEPS = ['Event Details', 'Date & Time', 'Contact Info', 'Review & Submit']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const inputBase = {
  width: '100%', padding: '13px 16px', borderRadius: 'var(--radius-md)', boxSizing: 'border-box',
  border: '1.5px solid var(--border)', background: 'var(--surface-solid)',
  outline: 'none', fontSize: 'var(--text-base)', color: 'var(--text)',
  transition: 'border-color 0.18s, box-shadow 0.18s', fontFamily: 'inherit',
}

const inputError = { borderColor: 'var(--error)', boxShadow: '0 0 0 3px var(--error-subtle)' }

const STEP_ICONS = [
  <PencilLine size={18} weight="duotone" />,
  <CalendarBlank size={18} weight="duotone" />,
  <Phone size={18} weight="duotone" />,
  <CheckCircle size={18} weight="duotone" />,
]

function Booking() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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
        if (res.data) { const m = {}; res.data.forEach(d => { m[d.date] = d.status }); setAvailability(m) }
      } catch (err) { console.error('Failed to fetch calendar:', err) }
    }
    fetchAvailability()
  }, [calYear, calMonth])

  const [form, setForm] = useState({
    eventName: '', eventType: '', description: '', expectedGuests: '', specialRequests: '',
    selectedDates: [], startTime: '', endTime: '',
    contactName: user?.name || '', contactPhone: user?.phone || '', contactEmail: user?.email || '',
  })
  const [errors, setErrors] = useState({})

  const set = (field, value) => { setForm(prev => ({ ...prev, [field]: value })); setErrors(prev => ({ ...prev, [field]: '' })); setError('') }

  const calendarDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay()
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
    const days = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(d)
    return days
  }, [calMonth, calYear])

  const isDatePast = (day) => { if (!day) return true; const d = new Date(calYear, calMonth, day); return d < new Date(today.getFullYear(), today.getMonth(), today.getDate()) }
  const isDateSelected = (day) => { if (!day) return false; return form.selectedDates.includes(`${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`) }
  const toggleDate = (day) => {
    if (!day || isDatePast(day)) return
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    const current = [...form.selectedDates]; const idx = current.indexOf(dateStr)
    if (idx > -1) current.splice(idx, 1); else current.push(dateStr)
    current.sort(); set('selectedDates', current)
  }
  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1) } else setCalMonth(m => m-1) }
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1) } else setCalMonth(m => m+1) }
  const canGoPrev = calYear > today.getFullYear() || (calYear === today.getFullYear() && calMonth > today.getMonth())

  const validateStep = (s) => {
    const e = {}
    if (s === 0 && !form.eventName.trim()) e.eventName = 'Event name is required'
    if (s === 1 && form.selectedDates.length === 0) e.selectedDates = 'Please select at least one date'
    if (s === 2) {
      if (!form.contactName.trim()) e.contactName = 'Contact name is required'
      if (!form.contactPhone || !/^[0-9]{10}$/.test(form.contactPhone)) e.contactPhone = 'Valid 10-digit phone required'
      if (!form.contactEmail || !/\S+@\S+\.\S+/.test(form.contactEmail)) e.contactEmail = 'Valid email required'
    }
    setErrors(e); return Object.keys(e).length === 0
  }
  const handleNext = () => { if (validateStep(step)) setStep(prev => prev + 1) }

  const handleSubmit = async () => {
    setLoading(true); setError('')
    try {
      const primaryDate = form.selectedDates[0]; const extraDates = form.selectedDates.slice(1)
      await bookingAPI.create({
        eventName: form.eventName, eventType: form.eventType || 'other', description: form.description,
        eventDate: primaryDate, additionalDates: extraDates, startTime: '00:00', endTime: '23:59',
        expectedGuests: Number(form.expectedGuests) || 0, contactName: form.contactName,
        contactPhone: form.contactPhone, contactEmail: form.contactEmail,
        specialRequests: form.specialRequests || '', baseAmount: 0, totalAmount: 0,
      })
      navigate('/my-bookings', { state: { success: true } })
    } catch (err) {
      setError(err.message || 'Failed to submit booking. Please try again.'); setStep(0)
    } finally { setLoading(false) }
  }

  const errStyle = (field) => errors[field] ? inputError : {}
  const fieldStyle = (field) => ({ ...inputBase, ...errStyle(field) })

  const handleFocus = (e) => { Object.assign(e.target.style, { borderColor: 'var(--primary)', boxShadow: '0 0 0 3px var(--primary-subtle)' }) }
  const handleBlur = (e, field) => { Object.assign(e.target.style, errors[field] ? { borderColor: 'var(--error)', boxShadow: '0 0 0 3px var(--error-subtle)' } : { borderColor: 'var(--border)', boxShadow: 'none' }) }

  const ErrMsg = ({ field }) => errors[field] ? (
    <p style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-xs)', color: 'var(--error-text)', marginTop: 5 }}>
      <WarningCircle size={12} weight="fill" /> {errors[field]}
    </p>
  ) : null

  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />

      {/* Header */}
      <div style={{ background: 'linear-gradient(160deg, #1a0000 0%, #5a0e0e 45%, #d45a20 100%)', padding: '52px 24px 40px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity }}
            style={{ fontSize: 50, marginBottom: 14 }}>🛕</motion.div>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 900, color: 'white', marginBottom: 8 }}>Book the Hall</h1>
          <p style={{ fontSize: 'var(--text-base)', color: 'rgba(255,255,255,0.58)' }}>Fill in the details below and the admin will review your request</p>
        </div>
      </div>

      {/* Progress steps */}
      <div style={{ backgroundColor: 'var(--surface-solid)', borderBottom: '1px solid var(--border)', padding: '0 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', overflowX: 'auto' }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ flex: 1, minWidth: 110, display: 'flex', alignItems: 'center' }}>
              <div style={{
                padding: '16px 0', display: 'flex', alignItems: 'center', gap: 8,
                borderBottom: `3px solid ${i === step ? 'var(--primary)' : i < step ? 'var(--success)' : 'transparent'}`,
                width: '100%',
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i < step ? 'var(--success)' : i === step ? 'var(--primary)' : 'var(--neutral-200)',
                  color: i <= step ? 'white' : 'var(--text-muted)',
                }}>
                  {i < step ? <CheckCircle size={14} weight="fill" /> : STEP_ICONS[i]}
                </div>
                <span style={{
                  fontSize: 'var(--text-xs)', fontWeight: i === step ? 700 : 500,
                  color: i === step ? 'var(--primary)' : i < step ? 'var(--success)' : 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div style={{ width: 16, height: 1, background: 'var(--border)', flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Form body */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '36px 24px 72px' }}>
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 22,
              background: 'var(--error-subtle)', border: '1px solid var(--error)',
              fontSize: 'var(--text-sm)', color: 'var(--error-text)', fontWeight: 500,
            }}>
            <WarningCircle size={16} weight="fill" style={{ flexShrink: 0, marginTop: 1 }} /> {error}
          </motion.div>
        )}

        <div style={{ borderRadius: 'var(--radius-xl)', padding: 'clamp(22px,4vw,38px)', background: 'var(--surface-solid)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
          <AnimatePresence mode="wait">

            {/* STEP 0 — Event Details */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--maroon)', marginBottom: 26, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PencilLine size={20} weight="duotone" /> Event Details
                </h2>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)', marginBottom: 7 }}>Event Name *</label>
                  <input name="eventName" value={form.eventName} onChange={e => set('eventName', e.target.value)}
                    onFocus={handleFocus} onBlur={e => handleBlur(e, 'eventName')}
                    placeholder="e.g. Sharma Family Wedding" style={fieldStyle('eventName')} />
                  <ErrMsg field="eventName" />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)', marginBottom: 7 }}>
                    Event Type <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))', gap: 9 }}>
                    {EVENT_TYPES.map(et => (
                      <motion.div key={et.value} whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
                        onClick={() => set('eventType', form.eventType === et.value ? '' : et.value)}
                        style={{
                          padding: '13px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'center',
                          border: `1.5px solid ${form.eventType === et.value ? 'var(--primary)' : 'var(--border)'}`,
                          background: form.eventType === et.value ? 'var(--primary-subtle)' : 'var(--neutral-50)',
                          color: form.eventType === et.value ? 'var(--primary)' : 'var(--text)',
                          fontWeight: form.eventType === et.value ? 700 : 500,
                          transition: 'all 0.18s',
                          boxShadow: form.eventType === et.value ? '0 4px 12px var(--primary-border)' : 'none',
                        }}>
                        <div style={{ marginBottom: 5, display: 'flex', justifyContent: 'center' }}>{et.icon}</div>
                        <div style={{ fontSize: 'var(--text-xs)' }}>{et.label}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)', marginBottom: 7 }}>
                      Expected Guests <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span>
                    </label>
                    <input type="number" name="expectedGuests" value={form.expectedGuests} onChange={e => set('expectedGuests', e.target.value)}
                      onFocus={handleFocus} onBlur={e => handleBlur(e, 'expectedGuests')}
                      placeholder="e.g. 200" min="0" style={fieldStyle('expectedGuests')} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)', marginBottom: 7 }}>
                      Description <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span>
                    </label>
                    <input name="description" value={form.description} onChange={e => set('description', e.target.value)}
                      onFocus={handleFocus} onBlur={e => handleBlur(e, 'description')}
                      placeholder="Brief description..." style={fieldStyle('description')} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 1 — Date & Time */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--maroon)', marginBottom: 26, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CalendarBlank size={20} weight="duotone" /> Select Dates
                </h2>
                <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                  {/* Calendar header */}
                  <div style={{ background: 'linear-gradient(135deg, #1a0000 0%, #5a0e0e 60%, #c94a1a 100%)', padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <motion.button whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }} onClick={prevMonth} disabled={!canGoPrev}
                      style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: canGoPrev ? 'rgba(255,255,255,0.15)' : 'transparent', color: canGoPrev ? 'white' : 'rgba(255,255,255,0.2)', cursor: canGoPrev ? 'pointer' : 'not-allowed', fontSize: 18, fontWeight: 700 }}>
                      ‹
                    </motion.button>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'white' }}>{MONTHS[calMonth]} {calYear}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Click dates to select · multiple dates allowed</div>
                    </div>
                    <motion.button whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }} onClick={nextMonth}
                      style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer', fontSize: 18, fontWeight: 700 }}>
                      ›
                    </motion.button>
                  </div>
                  {/* Weekday headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--neutral-50)' }}>
                    {WEEKDAYS.map(d => <div key={d} style={{ textAlign: 'center', padding: '9px 0', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{d}</div>)}
                  </div>
                  {/* Calendar grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--surface-solid)', padding: '6px', gap: 3 }}>
                    {calendarDays.map((day, idx) => {
                      const past = isDatePast(day)
                      const isToday = day && calYear === today.getFullYear() && calMonth === today.getMonth() && day === today.getDate()
                      let dayStatus = 'available', dateStr = ''
                      if (day) { dateStr = new Date(calYear, calMonth, day).toLocaleDateString('en-CA'); dayStatus = availability[dateStr] || 'available' }
                      const selected = isDateSelected(day)
                      const unclickable = !day || past || dayStatus === 'locked' || dayStatus === 'booked'
                      let bg = 'transparent', col = 'var(--text)'
                      if (selected) { bg = 'linear-gradient(135deg, var(--primary), #c94a1a)'; col = 'white' }
                      else if (dayStatus === 'locked') { bg = 'var(--warning-subtle)'; col = 'var(--warning)' }
                      else if (dayStatus === 'booked') { bg = 'var(--error-subtle)'; col = 'var(--error)' }
                      else if (isToday) { bg = 'linear-gradient(135deg, var(--primary), #f59e0b)'; col = 'white' }
                      else if (day && !past) { bg = 'var(--success-subtle)'; col = 'var(--success)' }
                      if (past && !selected && !isToday && day) { bg = 'transparent'; col = 'var(--neutral-300)' }
                      return (
                        <motion.div key={idx}
                          title={dayStatus === 'locked' ? 'Locked by admin' : dayStatus === 'booked' ? 'Fully Booked' : ''}
                          whileHover={!unclickable ? { scale: 1.14, zIndex: 10 } : {}}
                          whileTap={!unclickable ? { scale: 0.92 } : {}}
                          onClick={() => { if (!unclickable) toggleDate(day) }}
                          style={{
                            aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: 'var(--radius-sm)', cursor: !unclickable ? 'pointer' : 'default',
                            fontSize: 'var(--text-sm)', fontWeight: selected ? 800 : isToday ? 700 : 600,
                            background: bg, color: col,
                            border: isToday && !selected ? '2px solid var(--primary-border)' : '2px solid transparent',
                            transition: 'all 0.15s', opacity: (past && !isToday) ? 0.55 : 1,
                          }}>
                          {day || ''}
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
                {form.selectedDates.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 20, background: 'var(--success-subtle)', border: '1px solid var(--success)', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <CalendarBlank size={14} weight="fill" style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--success)' }}>Selected:</span>
                    {form.selectedDates.map(d => (
                      <span key={d} style={{ padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 600, background: 'rgba(5,150,105,0.1)', color: 'var(--success)' }}>
                        {new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    ))}
                  </motion.div>
                )}
                <ErrMsg field="selectedDates" />
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '12px 15px', borderRadius: 'var(--radius-md)', background: 'var(--warning-subtle)', border: '1px solid rgba(217,119,6,0.25)' }}>
                  <Info size={15} weight="fill" style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--warning-text)', fontWeight: 600, margin: 0 }}>
                    Admin will confirm availability and set the pricing after reviewing your request.
                  </p>
                </div>
              </motion.div>
            )}

            {/* STEP 2 — Contact Info */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--maroon)', marginBottom: 26, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Phone size={20} weight="duotone" /> Contact Information
                </h2>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)', marginBottom: 7 }}>Contact Name *</label>
                  <input name="contactName" value={form.contactName} onChange={e => set('contactName', e.target.value)}
                    onFocus={handleFocus} onBlur={e => handleBlur(e, 'contactName')}
                    placeholder="Full name of the contact person" style={fieldStyle('contactName')} />
                  <ErrMsg field="contactName" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)', marginBottom: 7 }}>Phone Number *</label>
                    <input type="tel" name="contactPhone" value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)}
                      onFocus={handleFocus} onBlur={e => handleBlur(e, 'contactPhone')}
                      placeholder="10-digit mobile number" maxLength={10} style={fieldStyle('contactPhone')} />
                    <ErrMsg field="contactPhone" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)', marginBottom: 7 }}>Email Address *</label>
                    <input type="email" name="contactEmail" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)}
                      onFocus={handleFocus} onBlur={e => handleBlur(e, 'contactEmail')}
                      placeholder="your@email.com" style={fieldStyle('contactEmail')} />
                    <ErrMsg field="contactEmail" />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)', marginBottom: 7 }}>
                    Special Requests <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span>
                  </label>
                  <textarea name="specialRequests" value={form.specialRequests} onChange={e => set('specialRequests', e.target.value)}
                    onFocus={handleFocus} onBlur={e => handleBlur(e, 'specialRequests')}
                    placeholder="Any special requirements or notes for the admin..." rows={3}
                    style={{ ...fieldStyle('specialRequests'), resize: 'none', lineHeight: 1.6 }} />
                </div>
              </motion.div>
            )}

            {/* STEP 3 — Review */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--maroon)', marginBottom: 26, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={20} weight="duotone" /> Review & Submit
                </h2>
                {[
                  { title: 'Event Details', icon: <PencilLine size={15} weight="duotone" />, rows: [
                    { label: 'Event Name', value: form.eventName },
                    ...(form.eventType ? [{ label: 'Event Type', value: EVENT_TYPES.find(e => e.value === form.eventType)?.label }] : []),
                    ...(form.expectedGuests ? [{ label: 'Expected Guests', value: `${form.expectedGuests} guests` }] : []),
                    ...(form.description ? [{ label: 'Description', value: form.description }] : []),
                  ]},
                  { title: 'Date & Time', icon: <CalendarBlank size={15} weight="duotone" />, rows: [
                    { label: 'Date(s)', value: form.selectedDates.map(d => new Date(d+'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })).join(', ') },
                    { label: 'Time', value: 'Full Day' },
                  ]},
                  { title: 'Contact', icon: <Phone size={15} weight="duotone" />, rows: [
                    { label: 'Name', value: form.contactName },
                    { label: 'Phone', value: form.contactPhone },
                    { label: 'Email', value: form.contactEmail },
                  ]},
                ].map((section, si) => (
                  <div key={si} style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--maroon)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {section.icon} {section.title}
                    </div>
                    <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                      {section.rows.map((row, ri) => (
                        <div key={ri} style={{ display: 'flex', padding: '11px 18px', backgroundColor: ri % 2 === 0 ? 'var(--neutral-50)' : 'var(--surface-solid)', borderBottom: ri < section.rows.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontWeight: 600, width: 120, flexShrink: 0 }}>{row.label}</span>
                          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text)', fontWeight: 600 }}>{row.value || '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div style={{ padding: '13px 16px', borderRadius: 'var(--radius-md)', background: 'var(--primary-subtle)', border: '1px solid var(--primary-border)' }}>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--maroon)', fontWeight: 600, margin: 0 }}>
                    🙏 By submitting, you agree that the admin will review your request and contact you with pricing details.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nav buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 28, justifyContent: 'space-between' }}>
            {step > 0 ? (
              <motion.button type="button" onClick={() => setStep(s => s - 1)}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{ padding: '13px 26px', borderRadius: 'var(--radius-full)', border: '1.5px solid var(--border)', background: 'var(--surface-solid)', cursor: 'pointer', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'inherit' }}>
                <ArrowLeft size={14} weight="bold" /> Back
              </motion.button>
            ) : <div />}
            {step < 3 ? (
              <motion.button type="button" onClick={handleNext}
                whileHover={{ scale: 1.02, boxShadow: '0 10px 26px var(--primary-border)' }} whileTap={{ scale: 0.98 }}
                style={{ padding: '13px 32px', borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer', fontSize: 'var(--text-base)', fontWeight: 800, color: 'white', background: 'linear-gradient(135deg, var(--primary) 0%, var(--maroon) 100%)', boxShadow: '0 6px 18px var(--primary-border)', display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'inherit' }}>
                Continue <ArrowRight size={14} weight="bold" />
              </motion.button>
            ) : (
              <motion.button type="button" onClick={handleSubmit} disabled={loading}
                whileHover={loading ? {} : { scale: 1.02, boxShadow: '0 10px 26px var(--primary-border)' }}
                whileTap={loading ? {} : { scale: 0.98 }}
                style={{ padding: '13px 32px', borderRadius: 'var(--radius-full)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 'var(--text-base)', fontWeight: 800, color: 'white', background: loading ? 'var(--neutral-400)' : 'linear-gradient(135deg, var(--primary) 0%, var(--maroon) 100%)', boxShadow: loading ? 'none' : '0 6px 18px var(--primary-border)', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}>
                {loading ? (<><motion.span animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}><CircleNotch size={16} weight="bold" /></motion.span> Submitting…</>) : (<>🙏 Submit Booking Request</>)}
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
