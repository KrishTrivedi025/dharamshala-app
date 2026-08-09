import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { AdminLayout } from './AdminDashboard'
import { adminAPI } from '../../utils/api'
import { LockSimple } from '@phosphor-icons/react'
import { cardStyleSolid, STATUS_COLORS } from '../../styles/theme'

const to12h = (t) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hr = h % 12 || 12
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function CalendarView() {
  const today = new Date()
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [selectedDay, setSelectedDay] = useState(null)
  const [bookings, setBookings] = useState([])
  const [lockedDates, setLockedDates] = useState([])
  const [loading, setLoading] = useState(true)

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const firstDay = new Date(calYear, calMonth, 1).getDay()

  const fetchCalendarData = useCallback(async () => {
    try {
      setLoading(true)
      const startDate = new Date(calYear, calMonth, 1).toISOString().split('T')[0]
      const endDate = new Date(calYear, calMonth + 1, 0).toISOString().split('T')[0]
      const res = await adminAPI.getCalendarBookings(startDate, endDate)
      setBookings(res.data?.bookings || [])
      setLockedDates(res.data?.lockedDates || [])
    } catch (err) {
      console.error('Calendar fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [calMonth, calYear])

  useEffect(() => { fetchCalendarData() }, [fetchCalendarData])

  const getBookingsForDay = (day) => bookings.filter(b => {
    const d = new Date(b.eventDate)
    return d.getDate() === day && d.getMonth() === calMonth && d.getFullYear() === calYear
  })

  const isLocked = (day) => lockedDates.some(l => {
    const start = new Date(l.startDate)
    const end = new Date(l.endDate)
    const check = new Date(calYear, calMonth, day)
    return check >= start && check <= end
  })

  const isToday = (day) =>
    day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear()

  const selectedDayBookings = selectedDay ? getBookingsForDay(selectedDay) : []

  const prevMonth = () => {
    setSelectedDay(null)
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1) }
    else setCalMonth(calMonth - 1)
  }
  const nextMonth = () => {
    setSelectedDay(null)
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1) }
    else setCalMonth(calMonth + 1)
  }

  return (
    <AdminLayout>
      
      <div style={{ padding: '40px 36px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--maroon)', marginBottom: 6 }}>Calendar View</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>View all bookings and locked dates at a glance</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={cardStyleSolid}>
          {/* Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={prevMonth}
              aria-label="Previous month"
              style={{ width: 40, height: 40, borderRadius: 12, border: '1.5px solid var(--border)', background: 'white', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ‹
            </motion.button>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--maroon)' }}>{MONTH_NAMES[calMonth]} {calYear}</h2>
              {loading && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Loading...</div>}
            </div>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={nextMonth}
              aria-label="Next month"
              style={{ width: 40, height: 40, borderRadius: 12, border: '1.5px solid var(--border)', background: 'white', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ›
            </motion.button>
          </div>

          {/* Day Headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 8, gap: 4 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', padding: '8px 0' }}>{d}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {[...Array(firstDay)].map((_, i) => <div key={`e-${i}`} />)}
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1
              const dayBookings = getBookingsForDay(day)
              const locked = isLocked(day)
              const todayDay = isToday(day)
              const selected = selectedDay === day
              const isPast = new Date(calYear, calMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate())
              let bg = 'transparent', border = '1.5px solid var(--border)', color = isPast ? 'var(--neutral-300)' : 'var(--text)'
              if (todayDay)          { bg = 'linear-gradient(135deg, var(--primary), var(--maroon))'; color = 'white'; border = 'none' }
              else if (selected)     { border = '2px solid var(--primary)'; bg = 'var(--primary-subtle)' }
              else if (locked)       { bg = 'var(--warning-subtle)'; border = '1.5px solid rgba(217,119,6,0.3)'; color = 'var(--warning-text)' }
              else if (dayBookings.length > 0) { bg = 'var(--success-subtle)'; border = '1.5px solid rgba(5,150,105,0.2)'; color = 'var(--success-text)' }
              return (
                <motion.div key={day} whileHover={{ scale: 1.06 }}
                  onClick={() => setSelectedDay(selected ? null : day)}
                  style={{ minHeight: 68, borderRadius: 12, padding: '8px', background: bg, border, color, cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: todayDay ? 'var(--shadow-lg)' : 'none' }}>
                  <div style={{ fontSize: 13, fontWeight: todayDay ? 900 : 600, marginBottom: 4 }}>{day}</div>
                  {locked && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: 'var(--warning-text)' }}>
                      <LockSimple size={10} weight="fill" /> Locked
                    </div>
                  )}
                  {dayBookings.length > 0 && (
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--success-text)' }}>
                      {dayBookings.length} booking{dayBookings.length > 1 ? 's' : ''}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 20, marginTop: 24, flexWrap: 'wrap' }}>
            {[
              { bg: 'linear-gradient(135deg, var(--primary), var(--maroon))', label: 'Today' },
              { bg: 'var(--success-subtle)', border: '1.5px solid rgba(5,150,105,0.2)', label: 'Has Bookings' },
              { bg: 'var(--warning-subtle)', border: '1.5px solid rgba(217,119,6,0.3)', label: 'Locked' },
              { bg: 'transparent', border: '1.5px solid var(--border)', label: 'Available' },
            ].map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, background: l.bg, border: l.border || 'none' }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{l.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Selected Day Details */}
        {selectedDay && selectedDayBookings.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: 24, ...cardStyleSolid }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--maroon)', marginBottom: 16 }}>
              Bookings on {MONTH_NAMES[calMonth]} {selectedDay}, {calYear}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selectedDayBookings.map((booking, i) => {
                const st = STATUS_COLORS[booking.status] || STATUS_COLORS.pending
                return (
                  <div key={booking._id || i} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 16px', borderRadius: 12,
                    background: 'var(--primary-subtle)', border: '1px solid var(--border)',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--maroon)' }}>{booking.eventName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {booking.user?.name} • {to12h(booking.startTime)} – {to12h(booking.endTime)} • {booking.expectedGuests} guests
                      </div>
                    </div>
                    <div style={{ padding: '4px 12px', borderRadius: 99, background: st.bg, color: st.text, fontSize: 11, fontWeight: 700 }}>
                      {st.label}
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </div>
  </AdminLayout>
  )
}

export default CalendarView
