import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AdminLayout, useIsMobile } from './AdminDashboard'
import { cashbookAPI, settingsAPI, memberAPI, adminAPI } from '../../utils/api'
import { MagnifyingGlass, CheckCircle, WarningCircle, UsersThree } from '@phosphor-icons/react'
import { cardStyleSolid, inputStyle as themeInput } from '../../styles/theme'
import { ButtonSpinner } from '../../components/ButtonSpinner'

const YEARS = [2023, 2024, 2025, 2026]
const CATEGORY = 'Annual Ritual Payment (Pooja Shulk)'

const emptyYearData = (defaultAmount) => Object.fromEntries(
  YEARS.map(y => [y, { include: true, status: 'completed', receiptNumber: '', amount: defaultAmount }])
)

function BulkRitualEntry() {
  const isMobile = useIsMobile()
  const [pickerList, setPickerList] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [annualFee, setAnnualFee] = useState(1200)
  const [yearData, setYearData] = useState(emptyYearData(1200))
  const [saving, setSaving] = useState(false)
  const [rowErrors, setRowErrors] = useState({})
  const [doneNames, setDoneNames] = useState([])

  useEffect(() => {
    Promise.all([
      memberAPI.getAll(),
      adminAPI.getAllUsers(),
      settingsAPI.getRitualFee(),
    ]).then(([membersRes, usersRes, feeRes]) => {
      const users = (usersRes.data || []).map(u => ({ _id: u._id, name: u.name, phone: u.phone, userId: u._id, isRegistered: true }))
      const usedNames = new Set(users.map(u => u.name.trim().toLowerCase()))
      const plainMembers = (membersRes.data || [])
        .filter(m => !usedNames.has(m.name.trim().toLowerCase()))
        .map(m => ({ _id: m._id, name: m.name, phone: m.phone, userId: null, isRegistered: false }))
      setPickerList([...users, ...plainMembers])
      const fee = feeRes.data?.annualRitualFee || 1200
      setAnnualFee(fee)
      setYearData(emptyYearData(fee))
    }).catch(() => {})
  }, [])

  const filtered = pickerList
    .filter(p => p.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => (a.isRegistered === b.isRegistered) ? a.name.localeCompare(b.name) : (a.isRegistered ? -1 : 1))

  const selectPerson = (person) => {
    setSelected(person)
    setSearch('')
    setYearData(emptyYearData(annualFee))
    setRowErrors({})
  }

  const updateYear = (year, field, value) => {
    setYearData(prev => ({
      ...prev,
      [year]: {
        ...prev[year],
        [field]: value,
        ...(field === 'status' && value === 'pending' ? { receiptNumber: '' } : {})
      }
    }))
  }

  const handleSaveAll = async () => {
    if (!selected) return
    const yearsToSave = YEARS.filter(y => yearData[y].include)
    if (yearsToSave.length === 0) { return }

    setSaving(true)
    const errors = {}

    for (const year of yearsToSave) {
      const yd = yearData[year]
      try {
        await cashbookAPI.createEntry({
          entryDate: `${year}-01-01`,
          paymentDate: '',
          name: selected.name,
          phone: selected.phone || '',
          userId: selected.userId || null,
          category: CATEGORY,
          receiptNumber: yd.status === 'completed' ? yd.receiptNumber.trim() : '',
          paymentMode: 'cash',
          type: 'credit',
          amount: parseFloat(yd.amount) || annualFee,
          status: yd.status,
          description: '',
          source: 'annual_ritual',
        })
      } catch (err) {
        errors[year] = err.message
      }
    }

    setRowErrors(errors)
    setSaving(false)

    if (Object.keys(errors).length === 0) {
      setDoneNames(prev => [selected.name, ...prev])
      setSelected(null)
      setYearData(emptyYearData(annualFee))
    }
  }

  return (
    <AdminLayout>
      <div style={{ padding: isMobile ? '20px 14px' : '40px 36px', maxWidth: 720 }}>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 900, color: 'var(--maroon)', marginBottom: 4 }}>
            Bulk Annual Ritual Entry
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Temporary tool — pick a person, fill in 2023–2026, save. {doneNames.length > 0 && <strong style={{ color: 'var(--success-text)' }}>{doneNames.length} done this session.</strong>}
          </p>
        </motion.div>

        {!selected ? (
          <div style={{ ...cardStyleSolid, padding: 20 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <MagnifyingGlass size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, pointerEvents: 'none' }} />
              <input autoFocus type="text" placeholder="Search person name..."
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ ...themeInput(), paddingLeft: 34 }} />
            </div>
            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
              {filtered.map(p => (
                <div key={p._id} onClick={() => selectPerson(p)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px', borderRadius: 10, cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-subtle)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, var(--primary), var(--maroon))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'white' }}>
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--maroon)', flex: 1 }}>{p.name}</div>
                  {p.isRegistered && (
                    <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', padding: '2px 6px', borderRadius: 99, background: 'var(--success-subtle)', color: 'var(--success-text)' }}>
                      Registered
                    </span>
                  )}
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: 13 }}>No matching person.</div>
              )}
            </div>
            {doneNames.length > 0 && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Done this session</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {doneNames.map((n, i) => (
                    <span key={i} style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: 'var(--success-subtle)', color: 'var(--success-text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle size={11} weight="fill" /> {n}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ ...cardStyleSolid, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--maroon))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'white' }}>
                  {selected.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--maroon)' }}>{selected.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{CATEGORY}{selected.isRegistered ? ' · Registered account' : ''}</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} disabled={saving}
                style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Change person
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {YEARS.map(year => {
                const yd = yearData[year]
                return (
                  <div key={year} style={{
                    display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'auto 1fr 1fr 1fr', gap: 10, alignItems: 'center',
                    padding: '12px', borderRadius: 12, background: yd.include ? 'var(--primary-subtle)' : 'var(--neutral-100)',
                    border: rowErrors[year] ? '1.5px solid var(--error)' : '1px solid var(--border)',
                    opacity: yd.include ? 1 : 0.55,
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 800, color: 'var(--maroon)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={yd.include} onChange={e => updateYear(year, 'include', e.target.checked)} style={{ width: 16, height: 16 }} />
                      {year}
                    </label>
                    <select disabled={!yd.include} value={yd.status} onChange={e => updateYear(year, 'status', e.target.value)} style={themeInput()}>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                    </select>
                    <input disabled={!yd.include || yd.status === 'pending'} placeholder={yd.status === 'pending' ? 'No receipt (pending)' : 'Receipt No.'}
                      value={yd.receiptNumber} onChange={e => updateYear(year, 'receiptNumber', e.target.value)}
                      style={themeInput()} />
                    <input disabled={!yd.include} type="number" placeholder="Amount"
                      value={yd.amount} onChange={e => updateYear(year, 'amount', e.target.value)}
                      style={themeInput()} />
                    {rowErrors[year] && (
                      <div style={{ gridColumn: '1 / -1', fontSize: 11, color: 'var(--error-text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <WarningCircle size={12} weight="fill" /> {rowErrors[year]}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <motion.button whileTap={{ scale: 0.98 }} disabled={saving}
              onClick={handleSaveAll}
              style={{
                width: '100%', marginTop: 18, padding: 14, borderRadius: 12, border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 800, color: 'white',
                background: saving ? 'var(--neutral-300)' : 'linear-gradient(135deg, var(--primary), var(--maroon))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
              {saving ? <><ButtonSpinner /> Saving...</> : `Save ${YEARS.filter(y => yearData[y].include).length} year(s) for ${selected.name}`}
            </motion.button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default BulkRitualEntry
