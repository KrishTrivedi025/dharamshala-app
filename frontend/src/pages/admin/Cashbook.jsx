import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AdminLayout, useIsMobile } from './AdminDashboard'
import { CustomSelect } from '../../components/AdminSelect'
import {
  BookOpen, ChartBar, CurrencyCircleDollar, ArrowUp, Wallet,
  Plus, DownloadSimple, Printer, PencilSimple, Trash,
  MagnifyingGlass, Receipt, WarningCircle, CheckCircle, X,
} from '@phosphor-icons/react'
import { cashbookAPI, settingsAPI } from '../../utils/api'
import { cardStyleSolid, modalOverlay, modalContent, inputStyle as themeInput } from '../../styles/theme'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import autoTable from 'jspdf-autotable'
import { saveAs } from 'file-saver'


const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR - 2020 + 1 }, (_, i) => 2020 + i)
const MONTHS = ['All Months','January','February','March','April','May','June','July','August','September','October','November','December']
const TYPES = ['All','credit','debit']
const SOURCES = ['All','booking','daan_peti','annual_ritual','manual']
const SOURCE_LABELS = { booking:'Hall Booking', daan_peti:'Daan Peti', annual_ritual:'Annual Ritual', manual:'Manual' }
const yearRange = (dateStr) => {
  const yr = new Date(dateStr).getFullYear()
  return `${yr}-${yr + 1}`
}

const LEDGER_FILTERS_KEY = 'cashbookLedgerFilters'
const loadSavedLedgerFilters = () => {
  try { return JSON.parse(localStorage.getItem(LEDGER_FILTERS_KEY) || '{}') } catch { return {} }
}

// Compact admin button style (not pill — data-dense context)
const adminBtn = (bg = 'linear-gradient(135deg, var(--primary), var(--maroon))') => ({
  padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
  fontSize: 13, fontWeight: 700, color: 'white', background: bg,
  display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', whiteSpace: 'nowrap',
})

function Cashbook() {
  const isMobile = useIsMobile()
  const savedFilters = loadSavedLedgerFilters()
  const [entries, setEntries] = useState([])
  const [summary, setSummary] = useState({ totalIncome:0, totalExpense:0, balance:0 })
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(savedFilters.year ?? CURRENT_YEAR)
  const [month, setMonth] = useState(savedFilters.month ?? 0)
  const [typeFilter, setTypeFilter] = useState(savedFilters.typeFilter ?? 'All')
  const [sourceFilter, setSourceFilter] = useState(savedFilters.sourceFilter ?? 'All')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editEntry, setEditEntry] = useState(null)
  const [formData, setFormData] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('ledger')
  const [ritualData, setRitualData] = useState(null)
  const [ritualYear, setRitualYear] = useState(CURRENT_YEAR)
  const [ritualModal, setRitualModal] = useState(null)
  const [ritualForm, setRitualForm] = useState({})
  const [ritualSaving, setRitualSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const tableRef = useRef(null)
  const [annualFee, setAnnualFee] = useState(1200)
  const [showFeeModal, setShowFeeModal] = useState(false)
  const [newFee, setNewFee] = useState(1200)
  const [feeSaving, setFeeSaving] = useState(false)
  const [downloadingReceipt, setDownloadingReceipt] = useState(null)
  const ritualReceiptRef = useRef(null)
  const [exportModal, setExportModal] = useState(null)
  const [exportTarget, setExportTarget] = useState(null)
  const [exportRange, setExportRange] = useState({ from: '', to: '' })
  const [exporting, setExporting] = useState(false)
  const [ritualSearch, setRitualSearch] = useState('')
  const [nextReceiptNo, setNextReceiptNo] = useState('')
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [newReceiptNo, setNewReceiptNo] = useState('')
  const [receiptNoSaving, setReceiptNoSaving] = useState(false)

  const fetchNextReceipt = async () => {
    try {
      const res = await cashbookAPI.getNextReceipt(year > 0 ? year : CURRENT_YEAR)
      setNextReceiptNo(res.data?.receiptNumber || '')
    } catch { /* non-critical */ }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = { sort: 'entryDate' }
      if (year > 0) params.year = year
      if (month > 0) params.month = month
      if (typeFilter !== 'All') params.type = typeFilter
      if (sourceFilter !== 'All') params.source = sourceFilter
      if (search.trim()) params.search = search.trim()
      params.limit = 500
      const [entriesRes, summaryRes] = await Promise.all([
        cashbookAPI.getEntries(params),
        cashbookAPI.getSummary({ ...(year > 0 ? { year } : {}), ...(month > 0 ? { month } : {}) })
      ])
      setEntries(entriesRes.data || [])
      setSummary(summaryRes.data || { totalIncome:0, totalExpense:0, balance:0 })
    } catch (err) {
      console.error('Cashbook fetch error:', err)
      setError(err.message)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [year, month, typeFilter, sourceFilter])
  useEffect(() => { fetchNextReceipt() }, [year])
  useEffect(() => {
    localStorage.setItem(LEDGER_FILTERS_KEY, JSON.stringify({ year, month, typeFilter, sourceFilter }))
  }, [year, month, typeFilter, sourceFilter])

  const handleSearch = (e) => { if (e.key === 'Enter') fetchData() }

  const openReceiptModal = () => { setNewReceiptNo(nextReceiptNo); setShowReceiptModal(true) }

  const handleReceiptNoUpdate = async () => {
    if (!newReceiptNo.trim()) { setError('Please enter a valid receipt number'); return }
    try {
      setReceiptNoSaving(true); setError(null)
      const receiptYear = year > 0 ? year : CURRENT_YEAR
      await settingsAPI.update(`nextReceiptNumber_${receiptYear}`, newReceiptNo.trim(), `Manual override for next cashbook receipt number (${receiptYear})`)
      setShowReceiptModal(false); await fetchNextReceipt()
    } catch (err) { setError(err.message) }
    finally { setReceiptNoSaving(false) }
  }

  const openAdd = async () => {
    setEditEntry(null)
    let nextReceipt = ''
    try {
      const res = await cashbookAPI.getNextReceipt(CURRENT_YEAR)
      nextReceipt = res.data?.receiptNumber || ''
    } catch { /* leave blank */ }
    setFormData({
      entryDate: String(CURRENT_YEAR), paymentDate: '',
      name:'', phone:'', category:'', paymentMode:'cash',
      type:'credit', amount:'', status:'completed', description:'',
      receiptNumber: nextReceipt
    })
    setShowModal(true)
  }

  const openEdit = (entry) => {
    setEditEntry(entry)
    setFormData({
      entryDate: entry.entryDate ? String(new Date(entry.entryDate).getFullYear()) : String(CURRENT_YEAR),
      paymentDate: entry.paymentDate ? new Date(entry.paymentDate).toISOString().split('T')[0] : '',
      name: entry.name, phone: entry.phone || '', category: entry.category,
      paymentMode: entry.paymentMode, type: entry.type,
      amount: entry.amount, status: entry.status, description: entry.description || '',
      receiptNumber: entry.receiptNumber || ''
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.category || !formData.amount) {
      setError('Name, category, and amount are required'); return
    }
    try {
      setSaving(true); setError(null)
      const source = /annual\s*ritual/i.test(formData.category || '')
        ? 'annual_ritual' : (editEntry ? editEntry.source : 'manual')
      const payload = { ...formData, entryDate: formData.entryDate ? `${formData.entryDate}-01-01` : '', source }
      if (editEntry) await cashbookAPI.updateEntry(editEntry._id, payload)
      else await cashbookAPI.createEntry(payload)
      setShowModal(false); await fetchData(); await fetchNextReceipt()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try {
      await cashbookAPI.deleteEntry(id)
      setDeleteConfirm(null); await fetchData()
    } catch (err) { setError(err.message) }
  }

  const fetchRituals = async () => {
    try {
      setLoading(true)
      const res = await cashbookAPI.getAnnualRituals(ritualYear)
      setRitualData(res.data)
      if (res.data.annualFee) setAnnualFee(res.data.annualFee)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (tab === 'annual') fetchRituals() }, [tab, ritualYear])

  const openRitualModal = (member) => {
    setRitualModal(member)
    setRitualForm({
      name: member.name, phone: member.phone || '',
      userId: member.userId || '', year: ritualYear,
      amount: member.amount || annualFee, paymentMode: member.paymentMode || 'cash',
      status: member.status === 'not_paid' ? 'completed' : member.status,
      paymentDate: new Date().toISOString().split('T')[0]
    })
  }

  const handleRitualSave = async () => {
    if (!ritualForm.amount) { setError('Amount is required'); return }
    try {
      setRitualSaving(true); setError(null)
      if (ritualModal.entryId) await cashbookAPI.updateRitualPayment(ritualModal.entryId, ritualForm)
      else await cashbookAPI.recordRitualPayment(ritualForm)
      setRitualModal(null); await fetchRituals()
    } catch (err) { setError(err.message) }
    finally { setRitualSaving(false) }
  }

  const handleFeeUpdate = async () => {
    if (!newFee || newFee < 0) { setError('Please enter a valid amount'); return }
    try {
      setFeeSaving(true); setError(null)
      await settingsAPI.update('annualRitualFee', parseFloat(newFee), 'Annual Ritual Payment Fee (Pooja Shulk)')
      setAnnualFee(parseFloat(newFee)); setShowFeeModal(false); await fetchRituals()
    } catch (err) { setError(err.message) }
    finally { setFeeSaving(false) }
  }

  const downloadRitualReceipt = (m) => {
    setDownloadingReceipt(m)
    setTimeout(async () => {
      try {
        if (!ritualReceiptRef.current) return
        const canvas = await html2canvas(ritualReceiptRef.current, { scale: 2, backgroundColor: '#fff', logging: false })
        const link = document.createElement('a')
        link.download = `Annual_Ritual_Receipt_${ritualYear}_${m.receiptNumber}.png`
        link.href = canvas.toDataURL('image/png'); link.click()
      } catch (err) { console.error('Download error:', err) }
      finally { setDownloadingReceipt(null) }
    }, 100)
  }

  const entriesWithBalance = (() => {
    let bal = 0
    return entries.map(e => {
      if (e.status === 'completed') bal += e.type === 'credit' ? e.amount : -e.amount
      return { ...e, runningBalance: bal }
    })
  })()

  const openExportModal = (type, target) => { setExportModal(type); setExportTarget(target); setExportRange({ from: '', to: '' }) }

  const handleExport = async () => {
    try {
      setExporting(true)
      let dataToExport = [], titleSuffix = ''
      if (exportTarget === 'ledger') {
        if (exportRange.from || exportRange.to) {
          const res = await cashbookAPI.getEntries({ fromDate: exportRange.from, toDate: exportRange.to, limit: 10000 })
          let bal = 0
          dataToExport = (res.data || []).map(e => {
            if (e.status === 'completed') bal += e.type === 'credit' ? e.amount : -e.amount
            return { ...e, runningBalance: bal }
          })
          titleSuffix = `${exportRange.from || '...'} to ${exportRange.to || '...'}`
        } else {
          dataToExport = entriesWithBalance
          titleSuffix = `${MONTHS[month] || 'All Months'} ${year}`
        }
      } else {
        const filteredMembers = ritualData ? ritualData.members.filter(m =>
          !ritualSearch || (m.name && m.name.toLowerCase().includes(ritualSearch.toLowerCase())) ||
          (m.receiptNumber && m.receiptNumber.toLowerCase().includes(ritualSearch.toLowerCase()))
        ) : []
        dataToExport = filteredMembers; titleSuffix = `Annual Rituals ${ritualYear}`
      }

      if (exportModal === 'pdf') {
        const doc = new jsPDF('l', 'mm', 'a4')
        doc.setFontSize(18); doc.text('Shri Dharamshala Trust', 14, 18)
        doc.setFontSize(11); doc.text(exportTarget === 'ledger' ? `Cashbook - ${titleSuffix}` : `Annual Rituals - ${titleSuffix}`, 14, 26)
        let rows = [], head = []
        if (exportTarget === 'ledger') {
          head = [['Date','Name','Category','Payment Date','Receipt No.','Mode','Type','Amount','Status','Balance']]
          rows = dataToExport.map(e => [yearRange(e.entryDate), e.name, e.category, e.paymentDate ? new Date(e.paymentDate).toLocaleDateString('en-IN') : '-', e.receiptNumber, e.paymentMode, e.type === 'credit' ? 'Credit' : 'Debit', `Rs.${e.amount.toLocaleString()}`, e.status, `Rs.${e.runningBalance.toLocaleString()}`])
        } else {
          head = [['Name','Phone','Amount','Status','Payment Date','Mode','Receipt No.']]
          rows = dataToExport.map(m => [m.name, m.phone || '-', `Rs.${(m.amount||annualFee).toLocaleString()}`, m.status, m.paymentDate ? new Date(m.paymentDate).toLocaleDateString('en-IN') : '-', m.paymentMode || '-', m.receiptNumber || '-'])
        }
        autoTable(doc, { startY: 36, head, body: rows, styles: { fontSize: 8 }, headStyles: { fillColor: [139, 26, 26] } })
        doc.save(`${exportTarget}_${Date.now()}.pdf`)
      } else if (exportModal === 'doc') {
        let html = `<html><head><meta charset="utf-8"><style>table{border-collapse:collapse;width:100%}th,td{border:1px solid #999;padding:4px 6px;font-size:11px}th{background:#8B1A1A;color:white}</style></head><body>`
        html += `<h2>Shri Dharamshala Trust</h2><p>${exportTarget === 'ledger' ? 'Cashbook' : 'Annual Rituals'} - ${titleSuffix}</p>`
        if (exportTarget === 'ledger') {
          html += `<table><tr><th>Date</th><th>Name</th><th>Category</th><th>Payment Date</th><th>Receipt No.</th><th>Mode</th><th>Type</th><th>Amount</th><th>Status</th><th>Balance</th></tr>`
          dataToExport.forEach(e => { html += `<tr><td>${yearRange(e.entryDate)}</td><td>${e.name}</td><td>${e.category}</td><td>${e.paymentDate ? new Date(e.paymentDate).toLocaleDateString('en-IN') : '-'}</td><td>${e.receiptNumber}</td><td>${e.paymentMode}</td><td>${e.type}</td><td>Rs.${e.amount.toLocaleString()}</td><td>${e.status}</td><td>Rs.${e.runningBalance.toLocaleString()}</td></tr>` })
        } else {
          html += `<table><tr><th>Name</th><th>Phone</th><th>Amount</th><th>Status</th><th>Payment Date</th><th>Mode</th><th>Receipt No.</th></tr>`
          dataToExport.forEach(m => { html += `<tr><td>${m.name}</td><td>${m.phone||'-'}</td><td>Rs.${(m.amount||annualFee).toLocaleString()}</td><td>${m.status}</td><td>${m.paymentDate ? new Date(m.paymentDate).toLocaleDateString('en-IN') : '-'}</td><td>${m.paymentMode||'-'}</td><td>${m.receiptNumber||'-'}</td></tr>` })
        }
        html += `</table></body></html>`
        saveAs(new Blob([html], { type: 'application/msword' }), `${exportTarget}_${Date.now()}.doc`)
      } else if (exportModal === 'print') {
        const win = window.open('', '_blank')
        let contentHtml = ''
        if (exportTarget === 'ledger') {
          let rowsHtml = dataToExport.map(e => `<tr><td>${yearRange(e.entryDate)}</td><td>${e.name}</td><td>${e.category}</td><td>${e.paymentDate ? new Date(e.paymentDate).toLocaleDateString('en-IN') : '-'}</td><td>${e.receiptNumber}</td><td>${e.paymentMode}</td><td>${e.type}</td><td>Rs.${e.amount.toLocaleString()}</td><td>${e.status}</td><td>Rs.${e.runningBalance.toLocaleString()}</td></tr>`).join('')
          contentHtml = `<table><tr><th>Date</th><th>Name</th><th>Category</th><th>Payment Date</th><th>Receipt No.</th><th>Mode</th><th>Type</th><th>Amount</th><th>Status</th><th>Balance</th></tr>${rowsHtml}</table>`
        } else {
          let rowsHtml = dataToExport.map(m => `<tr><td>${m.name}</td><td>${m.phone||'-'}</td><td>Rs.${(m.amount||annualFee).toLocaleString()}</td><td>${m.status}</td><td>${m.paymentDate ? new Date(m.paymentDate).toLocaleDateString('en-IN') : '-'}</td><td>${m.paymentMode||'-'}</td><td>${m.receiptNumber||'-'}</td></tr>`).join('')
          contentHtml = `<table><tr><th>Name</th><th>Phone</th><th>Amount</th><th>Status</th><th>Payment Date</th><th>Mode</th><th>Receipt No.</th></tr>${rowsHtml}</table>`
        }
        win.document.write(`<html><head><title>${exportTarget.toUpperCase()}</title><style>body{font-family:Arial,sans-serif;padding:20px}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}th{background:#8B1A1A;color:white}h2{color:#8B1A1A}.summary{margin-bottom:10px;font-size:13px}</style></head><body><h2>Shri Dharamshala Trust — ${exportTarget === 'ledger' ? 'Cashbook' : 'Annual Rituals'}</h2><div class="summary">${titleSuffix}</div>${contentHtml}</body></html>`)
        win.document.close(); win.print()
      }
      setExportModal(null)
    } catch (err) { setError(err.message) }
    finally { setExporting(false) }
  }

  return (
    <AdminLayout>
      
      <div style={{ padding: '40px 36px' }}>

        {/* Header */}
        <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} style={{ marginBottom:24 }}>
          <h1 style={{ fontSize:28, fontWeight:900, color:'var(--maroon)', marginBottom:6, display:'flex', alignItems:'center', gap:10 }}>
            <BookOpen size={28} weight="duotone" color="var(--maroon)" /> Cashbook / Bank Ledger
          </h1>
          <p style={{ fontSize:14, color:'var(--text-muted)' }}>Complete financial record of all transactions</p>
        </motion.div>

        {/* Tab Switcher */}
        <div style={{ display:'flex', gap:8, marginBottom:24 }}>
          {[{k:'ledger',Icon:ChartBar,l:'Ledger'},{k:'annual',emoji:'🪔',l:'Annual Ritual Payments'}].map(t=>(
            <motion.button key={t.k} whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
              onClick={()=>setTab(t.k)}
              style={{
                ...adminBtn(tab===t.k ? 'linear-gradient(135deg,var(--primary),var(--maroon))' : 'var(--surface-solid)'),
                color: tab===t.k ? 'white' : 'var(--text-secondary)',
                boxShadow: tab===t.k ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                border: tab===t.k ? 'none' : '1px solid var(--border)',
                padding: '10px 24px',
              }}>
              {t.Icon ? <t.Icon size={16} weight={tab===t.k ? 'fill':'regular'} /> : <span>{t.emoji}</span>}
              {t.l}
            </motion.button>
          ))}
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              style={{ padding:'12px 16px', borderRadius:12, background:'var(--error-subtle)',
                border:'1px solid rgba(220,38,38,0.2)', color:'var(--error-text)', fontSize:13,
                fontWeight:600, marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ display:'flex', alignItems:'center', gap:8 }}><WarningCircle size={16} /> {error}</span>
              <button onClick={()=>setError(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--error-text)', display:'flex', alignItems:'center' }}>
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {tab === 'ledger' ? (
          <>
            {/* Summary Cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:24 }}>
              {[
                { label:'Total Income',  value:`₹${summary.totalIncome?.toLocaleString()}`,  color:'var(--success-text)', bg:'var(--success-subtle)', Icon: CurrencyCircleDollar },
                { label:'Total Expense', value:`₹${summary.totalExpense?.toLocaleString()}`, color:'var(--error-text)',   bg:'var(--error-subtle)',   Icon: ArrowUp },
                { label:'Balance',       value:`₹${summary.balance?.toLocaleString()}`,      color:'var(--info-text)',    bg:'var(--info-subtle)',    Icon: Wallet },
              ].map((c,i)=>(
                <motion.div key={i} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.1}}
                  style={{ ...cardStyleSolid, padding:'20px 24px', display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:50, height:50, borderRadius:14, background:c.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <c.Icon size={24} weight="duotone" color={c.color} />
                  </div>
                  <div>
                    <div style={{ fontSize:24, fontWeight:900, color:c.color }}>{loading ? '—' : c.value}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)', fontWeight:500 }}>{c.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Filters & Actions */}
            <div style={{ ...cardStyleSolid, marginBottom:24, padding:'16px 20px' }}>
              {isMobile ? (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {/* Row 1: Year + Month */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <CustomSelect value={year} onChange={v => setYear(+v)} options={[{ value: 0, label: 'All Years' }, ...YEARS.map(y => ({ value: y, label: String(y) }))]} minWidth={0} />
                    <CustomSelect value={month} onChange={v => setMonth(+v)} options={MONTHS.map((m, i) => ({ value: i, label: m }))} minWidth={0} />
                  </div>
                  {/* Row 2: Type + Source */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <CustomSelect value={typeFilter} onChange={v => setTypeFilter(v)} options={TYPES.map(t => ({ value: t, label: t === 'All' ? 'All Types' : t === 'credit' ? 'Credit ↑' : 'Debit ↓' }))} minWidth={0} />
                    <CustomSelect value={sourceFilter} onChange={v => setSourceFilter(v)} options={SOURCES.map(s => ({ value: s, label: s === 'All' ? 'All Sources' : SOURCE_LABELS[s] || s }))} minWidth={0} />
                  </div>
                  {/* Row 3: Search */}
                  <div style={{ display:'flex', gap:8 }}>
                    <div style={{ position:'relative', flex:1 }}>
                      <MagnifyingGlass size={14} color="var(--text-muted)" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                      <input placeholder="Search name, receipt..." value={search}
                        onChange={e=>setSearch(e.target.value)} onKeyDown={handleSearch}
                        style={{ ...themeInput(), width:'100%', paddingLeft:30 }} />
                    </div>
                    <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                      onClick={fetchData} style={adminBtn()}>
                      <MagnifyingGlass size={14} />
                    </motion.button>
                  </div>
                  {/* Row 4: Next Receipt No */}
                  <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 14px', borderRadius:10, background:'var(--maroon-subtle)', border:'1px solid rgba(139,26,26,0.15)' }}>
                    <span style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)', whiteSpace:'nowrap' }}>Next Receipt No:</span>
                    <span style={{ fontSize:13, fontWeight:800, color:'var(--maroon)', fontFamily:'monospace', flex:1 }}>{nextReceiptNo || '—'}</span>
                    <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                      onClick={openReceiptModal}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:8, border:'1.5px solid rgba(139,26,26,0.2)',
                        fontSize:11, fontWeight:700, color:'var(--maroon)', background:'white', cursor:'pointer', flexShrink:0 }}>
                      <PencilSimple size={11} weight="fill" /> Edit
                    </motion.button>
                  </div>
                  {/* Row 5: Action buttons 2×2 grid */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                      onClick={openAdd} style={{ ...adminBtn(), justifyContent:'center' }}>
                      <Plus size={14} weight="bold" /> Add Entry
                    </motion.button>
                    <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                      onClick={() => openExportModal('pdf', 'ledger')} style={{ ...adminBtn('var(--success)'), justifyContent:'center' }}>
                      <DownloadSimple size={14} /> PDF
                    </motion.button>
                    <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                      onClick={() => openExportModal('doc', 'ledger')} style={{ ...adminBtn('var(--info)'), justifyContent:'center' }}>
                      <DownloadSimple size={14} /> DOC
                    </motion.button>
                    <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                      onClick={() => openExportModal('print', 'ledger')} style={{ ...adminBtn('#7c3aed'), justifyContent:'center' }}>
                      <Printer size={14} /> Print
                    </motion.button>
                  </div>
                </div>
              ) : (
                <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
                  <CustomSelect value={year} onChange={v => setYear(+v)} options={[{ value: 0, label: 'All Years' }, ...YEARS.map(y => ({ value: y, label: String(y) }))]} minWidth={120} />
                  <CustomSelect value={month} onChange={v => setMonth(+v)} options={MONTHS.map((m, i) => ({ value: i, label: m }))} minWidth={140} />
                  <CustomSelect value={typeFilter} onChange={v => setTypeFilter(v)} options={TYPES.map(t => ({ value: t, label: t === 'All' ? 'All Types' : t === 'credit' ? 'Credit ↑' : 'Debit ↓' }))} minWidth={120} />
                  <CustomSelect value={sourceFilter} onChange={v => setSourceFilter(v)} options={SOURCES.map(s => ({ value: s, label: s === 'All' ? 'All Sources' : SOURCE_LABELS[s] || s }))} minWidth={140} />
                  <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
                    <MagnifyingGlass size={14} color="var(--text-muted)" style={{ position:'absolute', left:10, pointerEvents:'none' }} />
                    <input placeholder="Search name, receipt..." value={search}
                      onChange={e=>setSearch(e.target.value)} onKeyDown={handleSearch}
                      style={{ ...themeInput(), width:'auto', minWidth:180, paddingLeft:30 }} />
                  </div>
                  <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                    onClick={fetchData} style={adminBtn()}>
                    <MagnifyingGlass size={14} />
                  </motion.button>
                  <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 14px', borderRadius:10, background:'var(--maroon-subtle)', border:'1px solid rgba(139,26,26,0.15)' }}>
                    <span style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)', whiteSpace:'nowrap' }}>Next Receipt No:</span>
                    <span style={{ fontSize:14, fontWeight:800, color:'var(--maroon)', fontFamily:'monospace', whiteSpace:'nowrap' }}>{nextReceiptNo || '—'}</span>
                    <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                      onClick={openReceiptModal}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:8, border:'1.5px solid rgba(139,26,26,0.2)',
                        fontSize:11, fontWeight:700, color:'var(--maroon)', background:'white', cursor:'pointer' }}>
                      <PencilSimple size={11} weight="fill" /> Edit
                    </motion.button>
                  </div>
                  <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
                    <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                      onClick={openAdd} style={adminBtn()}>
                      <Plus size={14} weight="bold" /> Add Entry
                    </motion.button>
                    <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                      onClick={() => openExportModal('pdf', 'ledger')} style={adminBtn('var(--success)')}>
                      <DownloadSimple size={14} /> PDF
                    </motion.button>
                    <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                      onClick={() => openExportModal('doc', 'ledger')} style={adminBtn('var(--info)')}>
                      <DownloadSimple size={14} /> DOC
                    </motion.button>
                    <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                      onClick={() => openExportModal('print', 'ledger')} style={adminBtn('#7c3aed')}>
                      <Printer size={14} /> Print
                    </motion.button>
                  </div>
                </div>
              )}
            </div>

            {/* Data Table */}
            {loading ? (
              <div style={{ ...cardStyleSolid, textAlign:'center', padding:'60px' }}>
                <motion.div animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:'linear' }}
                  style={{ width:48, height:48, borderRadius:'50%', border:'4px solid var(--primary-subtle)', borderTop:'4px solid var(--primary)', margin:'0 auto 16px' }} />
                <p style={{ color:'var(--text-muted)' }}>Loading cashbook...</p>
              </div>
            ) : entriesWithBalance.length === 0 ? (
              <div style={{ ...cardStyleSolid, textAlign:'center', padding:'60px' }}>
                <BookOpen size={56} weight="duotone" color="var(--text-muted)" style={{ marginBottom:16 }} />
                <h3 style={{ fontSize:18, fontWeight:800, color:'var(--maroon)', marginBottom:8 }}>No entries found</h3>
                <p style={{ fontSize:14, color:'var(--text-muted)' }}>Add your first cashbook entry to get started</p>
              </div>
            ) : isMobile ? (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {entriesWithBalance.map((e,i)=>(
                  <div key={e._id} style={{ ...cardStyleSolid, padding:'14px 16px' }}>
                    {/* Top: type+status badges + amount */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        <span style={{ padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700,
                          background: e.type==='credit' ? 'var(--success-subtle)' : 'var(--error-subtle)',
                          color: e.type==='credit' ? 'var(--success-text)' : 'var(--error-text)' }}>
                          {e.type==='credit'?'↑ Credit':'↓ Debit'}
                        </span>
                        <span style={{ padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700,
                          background: e.status==='completed' ? 'var(--success-subtle)' : 'var(--warning-subtle)',
                          color: e.status==='completed' ? 'var(--success-text)' : 'var(--warning-text)' }}>
                          {e.status==='completed'?'Done':'Pending'}
                        </span>
                      </div>
                      <span style={{ fontSize:18, fontWeight:900, color: e.type==='credit' ? 'var(--success-text)' : 'var(--error-text)' }}>
                        ₹{e.amount.toLocaleString()}
                      </span>
                    </div>
                    {/* Name + category */}
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--maroon)', marginBottom:2 }}>{e.name}</div>
                    <div style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:8 }}>{e.category}</div>
                    {/* Meta row */}
                    <div style={{ fontSize:11, color:'var(--text-muted)', display:'flex', flexWrap:'wrap', gap:4, alignItems:'center', marginBottom:8 }}>
                      <span>{yearRange(e.entryDate)}</span>
                      {e.paymentDate && <><span>•</span><span>{new Date(e.paymentDate).toLocaleDateString('en-IN')}</span></>}
                      {e.receiptNumber && <><span>•</span><span style={{ fontFamily:'monospace' }}>{e.receiptNumber}</span></>}
                      <span>•</span>
                      <span style={{ padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:700,
                        background: e.paymentMode==='online' ? 'var(--info-subtle)' : 'var(--neutral-100)',
                        color: e.paymentMode==='online' ? 'var(--info-text)' : 'var(--text-secondary)' }}>
                        {e.paymentMode==='online'?'Online':'Cash'}
                      </span>
                    </div>
                    {/* Balance + actions */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span style={{ fontSize:12, fontWeight:700, color: e.runningBalance>=0 ? 'var(--success-text)' : 'var(--error-text)' }}>
                        Balance: ₹{e.runningBalance.toLocaleString()}
                      </span>
                      <div style={{ display:'flex', gap:10 }}>
                        <button onClick={()=>openEdit(e)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--primary)' }} title="Edit">
                          <PencilSimple size={18} weight="duotone" />
                        </button>
                        <button onClick={()=>setDeleteConfirm(e._id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--error)' }} title="Delete">
                          <Trash size={18} weight="duotone" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ ...cardStyleSolid, padding:0, overflow:'hidden' }}>
                <div style={{ overflowX:'auto' }}>
                  <table ref={tableRef} style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                    <thead>
                      <tr style={{ background:'linear-gradient(135deg,#1a0000,#5a0e0e)', color:'white' }}>
                        {['Date','Name','Category','Payment Date','Receipt No.','Mode','Type','Amount','Status','Balance','Actions'].map(h=>(
                          <th key={h} style={{ padding:'12px 10px', textAlign:'left', fontWeight:700, fontSize:12, whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {entriesWithBalance.map((e,i)=>(
                        <tr key={e._id} style={{ borderBottom:'1px solid var(--border)', background: i%2===0 ? 'white' : 'var(--neutral-50)' }}>
                          <td style={{ padding:'10px', whiteSpace:'nowrap' }}>{yearRange(e.entryDate)}</td>
                          <td style={{ padding:'10px', fontWeight:600, color:'var(--maroon)' }}>{e.name}</td>
                          <td style={{ padding:'10px', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis' }}>{e.category}</td>
                          <td style={{ padding:'10px', whiteSpace:'nowrap' }}>{e.paymentDate ? new Date(e.paymentDate).toLocaleDateString('en-IN') : '—'}</td>
                          <td style={{ padding:'10px', fontFamily:'monospace', fontSize:12, color:'var(--text-secondary)' }}>{e.receiptNumber}</td>
                          <td style={{ padding:'10px' }}>
                            <span style={{ padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700,
                              background: e.paymentMode==='online' ? 'var(--info-subtle)' : 'var(--neutral-100)',
                              color: e.paymentMode==='online' ? 'var(--info-text)' : 'var(--text-secondary)' }}>
                              {e.paymentMode==='online'?'Online':'Cash'}
                            </span>
                          </td>
                          <td style={{ padding:'10px' }}>
                            <span style={{ padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700,
                              background: e.type==='credit' ? 'var(--success-subtle)' : 'var(--error-subtle)',
                              color: e.type==='credit' ? 'var(--success-text)' : 'var(--error-text)' }}>
                              {e.type==='credit'?'↑ Credit':'↓ Debit'}
                            </span>
                          </td>
                          <td style={{ padding:'10px', fontWeight:800, color: e.type==='credit' ? 'var(--success-text)' : 'var(--error-text)' }}>
                            ₹{e.amount.toLocaleString()}
                          </td>
                          <td style={{ padding:'10px' }}>
                            <span style={{ padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700,
                              background: e.status==='completed' ? 'var(--success-subtle)' : 'var(--warning-subtle)',
                              color: e.status==='completed' ? 'var(--success-text)' : 'var(--warning-text)' }}>
                              {e.status==='completed'?'Done':'Pending'}
                            </span>
                          </td>
                          <td style={{ padding:'10px', fontWeight:700, color: e.runningBalance>=0 ? 'var(--success-text)' : 'var(--error-text)' }}>
                            ₹{e.runningBalance.toLocaleString()}
                          </td>
                          <td style={{ padding:'10px', whiteSpace:'nowrap' }}>
                            <button onClick={()=>openEdit(e)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--primary)', marginRight:8 }} title="Edit">
                              <PencilSimple size={16} weight="duotone" />
                            </button>
                            <button onClick={()=>setDeleteConfirm(e._id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--error)' }} title="Delete">
                              <Trash size={16} weight="duotone" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Annual Ritual Payments Tab */
          <>
            <div style={{ ...cardStyleSolid, marginBottom:24, padding:'16px 20px' }}>
              {isMobile ? (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {/* Row 1: Year + Annual Fee */}
                  <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontWeight:700, color:'var(--maroon)', fontSize:13 }}>Year:</span>
                      <CustomSelect value={ritualYear} onChange={v => setRitualYear(+v)} options={YEARS.map(y => ({ value: y, label: String(y) }))} minWidth={90} />
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)' }}>Fee:</span>
                      <span style={{ fontSize:15, fontWeight:900, color:'var(--maroon)' }}>₹{annualFee.toLocaleString()}</span>
                      <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                        onClick={() => { setNewFee(annualFee); setShowFeeModal(true) }}
                        style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:8, border:'1.5px solid rgba(139,26,26,0.2)',
                          fontSize:11, fontWeight:700, color:'var(--maroon)', background:'var(--maroon-subtle)', cursor:'pointer' }}>
                        <PencilSimple size={11} weight="fill" /> Edit Fee
                      </motion.button>
                    </div>
                  </div>
                  {/* Row 2: Stats 2×2 grid */}
                  {ritualData && (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                      <div style={{ padding:'10px 12px', borderRadius:10, background:'var(--success-subtle)', textAlign:'center' }}>
                        <div style={{ fontSize:20, fontWeight:900, color:'var(--success-text)' }}>{ritualData.paid}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600 }}>Paid</div>
                      </div>
                      <div style={{ padding:'10px 12px', borderRadius:10, background:'var(--warning-subtle)', textAlign:'center' }}>
                        <div style={{ fontSize:20, fontWeight:900, color:'var(--warning-text)' }}>{ritualData.pending}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600 }}>Pending</div>
                      </div>
                      <div style={{ padding:'10px 12px', borderRadius:10, background:'var(--error-subtle)', textAlign:'center' }}>
                        <div style={{ fontSize:20, fontWeight:900, color:'var(--error-text)' }}>{ritualData.notPaid}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600 }}>Not Paid</div>
                      </div>
                      <div style={{ padding:'10px 12px', borderRadius:10, background:'var(--maroon-subtle)', textAlign:'center' }}>
                        <div style={{ fontSize:20, fontWeight:900, color:'var(--maroon)' }}>{ritualData.totalMembers}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600 }}>Total</div>
                      </div>
                    </div>
                  )}
                  {/* Row 3: Search */}
                  <div style={{ position:'relative' }}>
                    <MagnifyingGlass size={14} color="var(--text-muted)" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                    <input placeholder="Search name or receipt..." value={ritualSearch}
                      onChange={e=>setRitualSearch(e.target.value)}
                      style={{ ...themeInput(), width:'100%', paddingLeft:30 }} />
                  </div>
                  {/* Row 4: Export buttons 3-column */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                    <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                      onClick={() => openExportModal('pdf', 'annual')} style={{ ...adminBtn('var(--success)'), justifyContent:'center' }}>
                      <DownloadSimple size={14} /> PDF
                    </motion.button>
                    <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                      onClick={() => openExportModal('doc', 'annual')} style={{ ...adminBtn('var(--info)'), justifyContent:'center' }}>
                      <DownloadSimple size={14} /> DOC
                    </motion.button>
                    <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                      onClick={() => openExportModal('print', 'annual')} style={{ ...adminBtn('#7c3aed'), justifyContent:'center' }}>
                      <Printer size={14} /> Print
                    </motion.button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                    <span style={{ fontWeight:700, color:'var(--maroon)' }}>Year:</span>
                    <CustomSelect value={ritualYear} onChange={v => setRitualYear(+v)} options={YEARS.map(y => ({ value: y, label: String(y) }))} minWidth={100} />
                    <div style={{ marginLeft:8, display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:13, fontWeight:600, color:'var(--text-secondary)' }}>Annual Fee:</span>
                      <span style={{ fontSize:16, fontWeight:900, color:'var(--maroon)' }}>₹{annualFee.toLocaleString()}</span>
                      <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                        onClick={() => { setNewFee(annualFee); setShowFeeModal(true) }}
                        style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 12px', borderRadius:8, border:'1.5px solid rgba(139,26,26,0.2)',
                          fontSize:12, fontWeight:700, color:'var(--maroon)', background:'var(--maroon-subtle)', cursor:'pointer' }}>
                        <PencilSimple size={12} weight="fill" /> Edit Fee
                      </motion.button>
                    </div>
                    {ritualData && (
                      <div style={{ marginLeft:'auto', display:'flex', gap:16, fontSize:13, fontWeight:600 }}>
                        <span style={{ color:'var(--success-text)' }}>Paid: {ritualData.paid}</span>
                        <span style={{ color:'var(--warning-text)' }}>Pending: {ritualData.pending}</span>
                        <span style={{ color:'var(--error-text)' }}>Not Paid: {ritualData.notPaid}</span>
                        <span style={{ color:'var(--maroon)' }}>Total: {ritualData.totalMembers}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ display:'flex', gap:10, marginTop:16, alignItems:'center', flexWrap:'wrap' }}>
                    <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
                      <MagnifyingGlass size={14} color="var(--text-muted)" style={{ position:'absolute', left:10, pointerEvents:'none' }} />
                      <input placeholder="Search name or receipt..." value={ritualSearch}
                        onChange={e=>setRitualSearch(e.target.value)}
                        style={{ ...themeInput(), width:'auto', minWidth:250, paddingLeft:30 }} />
                    </div>
                    <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
                      <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                        onClick={() => openExportModal('pdf', 'annual')} style={adminBtn('var(--success)')}>
                        <DownloadSimple size={14} /> PDF
                      </motion.button>
                      <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                        onClick={() => openExportModal('doc', 'annual')} style={adminBtn('var(--info)')}>
                        <DownloadSimple size={14} /> DOC
                      </motion.button>
                      <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                        onClick={() => openExportModal('print', 'annual')} style={adminBtn('#7c3aed')}>
                        <Printer size={14} /> Print
                      </motion.button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {loading ? (
              <div style={{ ...cardStyleSolid, textAlign:'center', padding:'60px' }}>
                <motion.div animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:'linear' }}
                  style={{ width:48, height:48, borderRadius:'50%', border:'4px solid var(--primary-subtle)', borderTop:'4px solid var(--primary)', margin:'0 auto 16px' }} />
              </div>
            ) : ritualData && (() => {
              const filteredMembers = ritualData.members.filter(m =>
                !ritualSearch || (m.name && m.name.toLowerCase().includes(ritualSearch.toLowerCase())) ||
                (m.receiptNumber && m.receiptNumber.toLowerCase().includes(ritualSearch.toLowerCase()))
              )
              return isMobile ? (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {filteredMembers.map((m,i)=>(
                    <div key={m.userId||i} style={{ ...cardStyleSolid, padding:'14px 16px' }}>
                      {/* Top: name + status */}
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                        <span style={{ fontSize:14, fontWeight:700, color:'var(--maroon)', flex:1, marginRight:8 }}>{m.name}</span>
                        <span style={{ padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700, flexShrink:0,
                          background: m.status==='completed' ? 'var(--success-subtle)' : m.status==='pending' ? 'var(--warning-subtle)' : 'var(--error-subtle)',
                          color: m.status==='completed' ? 'var(--success-text)' : m.status==='pending' ? 'var(--warning-text)' : 'var(--error-text)' }}>
                          {m.status==='completed'?'Paid':m.status==='pending'?'Pending':'Not Paid'}
                        </span>
                      </div>
                      {/* Phone */}
                      {m.phone && <div style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:6 }}>{m.phone}</div>}
                      {/* Amount + date + mode */}
                      <div style={{ fontSize:12, display:'flex', flexWrap:'wrap', gap:4, alignItems:'center', marginBottom:6 }}>
                        <span style={{ fontWeight:800, color:'var(--maroon)', fontSize:15 }}>₹{(m.amount||annualFee).toLocaleString()}</span>
                        {m.paymentDate && <><span style={{ color:'var(--text-muted)' }}>•</span><span style={{ color:'var(--text-secondary)' }}>{new Date(m.paymentDate).toLocaleDateString('en-IN')}</span></>}
                        {m.paymentMode && <><span style={{ color:'var(--text-muted)' }}>•</span><span style={{ color:'var(--text-secondary)' }}>{m.paymentMode}</span></>}
                      </div>
                      {/* Receipt number */}
                      {m.receiptNumber && (
                        <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'monospace', marginBottom:10 }}>{m.receiptNumber}</div>
                      )}
                      {/* Actions */}
                      <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                        <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                          onClick={()=>openRitualModal(m)}
                          style={{ ...adminBtn(m.status==='not_paid' ? 'linear-gradient(135deg,var(--success),#166534)' : 'linear-gradient(135deg,var(--primary),var(--maroon))'), padding:'7px 14px', fontSize:12 }}>
                          {m.status==='not_paid' ? <><CurrencyCircleDollar size={13} /> Record</> : <><PencilSimple size={13} /> Edit</>}
                        </motion.button>
                        {m.receiptReady && (
                          <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                            onClick={()=>downloadRitualReceipt(m)}
                            style={{ ...adminBtn('linear-gradient(135deg,var(--info),#1e40af)'), padding:'7px 14px', fontSize:12 }}>
                            <DownloadSimple size={13} /> Receipt
                          </motion.button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ ...cardStyleSolid, padding:0, overflow:'hidden' }}>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                      <thead>
                        <tr style={{ background:'linear-gradient(135deg,#1a0000,#5a0e0e)', color:'white' }}>
                          {['#','Name','Phone','Amount','Status','Payment Date','Mode','Receipt No.','Actions'].map(h=>(
                            <th key={h} style={{ padding:'12px 10px', textAlign:'left', fontWeight:700, fontSize:12 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMembers.map((m,i)=>(
                          <tr key={m.userId||i} style={{ borderBottom:'1px solid var(--border)', background: i%2===0 ? 'white' : 'var(--neutral-50)' }}>
                            <td style={{ padding:'10px', color:'var(--text-muted)' }}>{i+1}</td>
                            <td style={{ padding:'10px', fontWeight:600, color:'var(--maroon)' }}>{m.name}</td>
                            <td style={{ padding:'10px' }}>{m.phone || '—'}</td>
                            <td style={{ padding:'10px', fontWeight:700 }}>₹{(m.amount||annualFee).toLocaleString()}</td>
                            <td style={{ padding:'10px' }}>
                              <span style={{ padding:'4px 12px', borderRadius:99, fontSize:11, fontWeight:700,
                                background: m.status==='completed' ? 'var(--success-subtle)' : m.status==='pending' ? 'var(--warning-subtle)' : 'var(--error-subtle)',
                                color: m.status==='completed' ? 'var(--success-text)' : m.status==='pending' ? 'var(--warning-text)' : 'var(--error-text)' }}>
                                {m.status==='completed'?'Paid':m.status==='pending'?'Pending':'Not Paid'}
                              </span>
                            </td>
                            <td style={{ padding:'10px' }}>{m.paymentDate ? new Date(m.paymentDate).toLocaleDateString('en-IN') : '—'}</td>
                            <td style={{ padding:'10px' }}>{m.paymentMode || '—'}</td>
                            <td style={{ padding:'10px', fontFamily:'monospace', fontSize:12 }}>{m.receiptNumber || '—'}</td>
                            <td style={{ padding:'10px', whiteSpace:'nowrap', display:'flex', gap:6 }}>
                              <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                                onClick={()=>openRitualModal(m)}
                                style={{ ...adminBtn(m.status==='not_paid' ? 'linear-gradient(135deg,var(--success),#166534)' : 'linear-gradient(135deg,var(--primary),var(--maroon))'), padding:'6px 12px', fontSize:11 }}>
                                {m.status==='not_paid' ? <><CurrencyCircleDollar size={12} /> Record</> : <><PencilSimple size={12} /> Edit</>}
                              </motion.button>
                              {m.receiptReady && (
                                <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                                  onClick={()=>downloadRitualReceipt(m)}
                                  style={{ ...adminBtn('linear-gradient(135deg,var(--info),#1e40af)'), padding:'6px 12px', fontSize:11 }}>
                                  <DownloadSimple size={12} /> Receipt
                                </motion.button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })()}
          </>
        )}

        {/* Export Modal */}
        <AnimatePresence>
          {exportModal && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              style={modalOverlay} onClick={()=>!exporting&&setExportModal(null)}>
              <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}}
                onClick={e=>e.stopPropagation()}
                style={{ ...modalContent, maxWidth:420 }}>
                <h3 style={{ fontSize:20, fontWeight:800, color:'var(--maroon)', marginBottom:20 }}>
                  Export {exportModal.toUpperCase()} — {exportTarget === 'ledger' ? 'Cashbook' : 'Annual Rituals'}
                </h3>
                {exportTarget === 'ledger' && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>Select a date range. Leave empty to export the currently loaded data.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text-muted)', marginBottom:4, textTransform:'uppercase' }}>From Date</label>
                        <input type="date" value={exportRange.from} onChange={e=>setExportRange({...exportRange, from: e.target.value})} style={themeInput()} />
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text-muted)', marginBottom:4, textTransform:'uppercase' }}>To Date</label>
                        <input type="date" value={exportRange.to} onChange={e=>setExportRange({...exportRange, to: e.target.value})} style={themeInput()} />
                      </div>
                    </div>
                  </div>
                )}
                {exportTarget === 'annual' && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>This will export the list of annual rituals for {ritualYear}. Any current search filters will be applied.</p>
                  </div>
                )}
                <div style={{ display:'flex', gap:12 }}>
                  <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}} disabled={exporting}
                    onClick={()=>setExportModal(null)}
                    style={{ flex:1, padding:13, borderRadius:12, border:'2px solid var(--border)', cursor:'pointer', fontSize:14, fontWeight:700, color:'var(--text-secondary)', background:'white' }}>
                    Cancel
                  </motion.button>
                  <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}} disabled={exporting}
                    onClick={handleExport}
                    style={{ flex:1, padding:13, borderRadius:12, border:'none', cursor:'pointer', fontSize:14, fontWeight:700, color:'white', background: exporting?'var(--neutral-300)':'linear-gradient(135deg,var(--primary),var(--maroon))' }}>
                    {exporting ? 'Generating...' : 'Generate'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              style={modalOverlay} onClick={()=>!saving&&setShowModal(false)}>
              <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}}
                onClick={e=>e.stopPropagation()}
                style={{ ...modalContent, maxWidth:560, maxHeight:'90vh', overflowY:'auto' }}>
                <h3 style={{ fontSize:20, fontWeight:800, color:'var(--maroon)', marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
                  {editEntry ? <><PencilSimple size={20} weight="duotone" /> Edit Entry</> : <><Plus size={20} weight="bold" /> New Cashbook Entry</>}
                </h3>
                <datalist id="cashbookCategoryOptions">
                  <option value="Annual Ritual Payment (Pooja Shulk)" />
                  <option value="Hall Booking" />
                  <option value="Daan Peti Donation" />
                  <option value="Maintenance" />
                  <option value="Donation" />
                </datalist>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {[
                    { label:'Name *', key:'name', type:'text', full:false },
                    { label:'Phone', key:'phone', type:'text', full:false },
                    { label:'Category *', key:'category', type:'text', full:true, list:'cashbookCategoryOptions' },
                    { label:'Receipt No.', key:'receiptNumber', type:'text', full:false },
                    { label:'Entry Date (Year)', key:'entryDate', type:'year', full:false },
                    { label:'Payment Date', key:'paymentDate', type:'date', full:false },
                    { label:'Amount (₹) *', key:'amount', type:'number', full:false },
                  ].map(f=>(
                    <div key={f.key} style={{ gridColumn: f.full ? '1/-1' : 'auto' }}>
                      <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text-muted)', marginBottom:4, textTransform:'uppercase' }}>{f.label}</label>
                      {f.type === 'year' ? (
                        <select value={formData[f.key]||''} onChange={e=>setFormData({...formData,[f.key]:e.target.value})} style={themeInput()}>
                          {YEARS.map(y => <option key={y} value={y}>{y}-{y+1}</option>)}
                        </select>
                      ) : (
                        <input type={f.type} list={f.list} value={formData[f.key]||''} onChange={e=>setFormData({...formData,[f.key]:e.target.value})} style={themeInput()} />
                      )}
                    </div>
                  ))}
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text-muted)', marginBottom:4, textTransform:'uppercase' }}>Type *</label>
                    <select value={formData.type} onChange={e=>setFormData({...formData,type:e.target.value})} style={themeInput()}>
                      <option value="credit">Credit (Income)</option>
                      <option value="debit">Debit (Expense)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text-muted)', marginBottom:4, textTransform:'uppercase' }}>Payment Mode *</label>
                    <select value={formData.paymentMode} onChange={e=>setFormData({...formData,paymentMode:e.target.value})} style={themeInput()}>
                      <option value="cash">Cash</option>
                      <option value="online">Online</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text-muted)', marginBottom:4, textTransform:'uppercase' }}>Status</label>
                    <select value={formData.status} onChange={e=>setFormData({...formData,status:e.target.value})} style={themeInput()}>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  <div style={{ gridColumn:'1/-1' }}>
                    <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text-muted)', marginBottom:4, textTransform:'uppercase' }}>Description</label>
                    <textarea value={formData.description||''} onChange={e=>setFormData({...formData,description:e.target.value})}
                      rows={2} style={{ ...themeInput(), resize:'none' }} />
                  </div>
                </div>
                <div style={{ display:'flex', gap:12, marginTop:20 }}>
                  <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}} disabled={saving}
                    onClick={()=>setShowModal(false)}
                    style={{ flex:1, padding:13, borderRadius:12, border:'2px solid var(--border)', cursor:'pointer', fontSize:14, fontWeight:700, color:'var(--text-secondary)', background:'white' }}>
                    Cancel
                  </motion.button>
                  <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}} disabled={saving}
                    onClick={handleSave}
                    style={{ flex:1, padding:13, borderRadius:12, border:'none', cursor:'pointer', fontSize:14, fontWeight:700, color:'white', background: saving?'var(--neutral-300)':'linear-gradient(135deg,var(--primary),var(--maroon))' }}>
                    {saving ? 'Saving...' : editEntry ? 'Update' : 'Create'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fee Edit Modal */}
        <AnimatePresence>
          {showFeeModal && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              style={modalOverlay} onClick={()=>!feeSaving&&setShowFeeModal(false)}>
              <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}}
                onClick={e=>e.stopPropagation()}
                style={{ ...modalContent, maxWidth:420 }}>
                <div style={{ textAlign:'center', marginBottom:24 }}>
                  <CurrencyCircleDollar size={48} weight="duotone" color="var(--maroon)" style={{ marginBottom:8 }} />
                  <h3 style={{ fontSize:20, fontWeight:800, color:'var(--maroon)', marginBottom:4 }}>Update Annual Ritual Fee</h3>
                  <p style={{ fontSize:13, color:'var(--text-muted)' }}>This new fee will apply to all unpaid members going forward.</p>
                </div>
                <div style={{ marginBottom:20 }}>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text-muted)', marginBottom:6, textTransform:'uppercase' }}>New Fee Amount (₹)</label>
                  <input type="number" value={newFee} onChange={e=>setNewFee(e.target.value)}
                    style={{ ...themeInput(), fontSize:20, fontWeight:800, textAlign:'center', color:'var(--maroon)' }}
                    placeholder="e.g. 1500" />
                </div>
                <div style={{ display:'flex', gap:12 }}>
                  <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}} disabled={feeSaving}
                    onClick={()=>setShowFeeModal(false)}
                    style={{ flex:1, padding:13, borderRadius:12, border:'2px solid var(--border)', cursor:'pointer', fontSize:14, fontWeight:700, color:'var(--text-secondary)', background:'white' }}>
                    Cancel
                  </motion.button>
                  <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}} disabled={feeSaving}
                    onClick={handleFeeUpdate}
                    style={{ flex:1, padding:13, borderRadius:12, border:'none', cursor:'pointer', fontSize:14, fontWeight:700, color:'white', display:'flex', alignItems:'center', justifyContent:'center', gap:8, background: feeSaving?'var(--neutral-300)':'linear-gradient(135deg,var(--primary),var(--maroon))' }}>
                    <CheckCircle size={16} /> {feeSaving ? 'Saving...' : 'Update Fee'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Receipt Number Edit Modal */}
        <AnimatePresence>
          {showReceiptModal && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              style={modalOverlay} onClick={()=>!receiptNoSaving&&setShowReceiptModal(false)}>
              <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}}
                onClick={e=>e.stopPropagation()}
                style={{ ...modalContent, maxWidth:420 }}>
                <div style={{ textAlign:'center', marginBottom:24 }}>
                  <Receipt size={48} weight="duotone" color="var(--maroon)" style={{ marginBottom:8 }} />
                  <h3 style={{ fontSize:20, fontWeight:800, color:'var(--maroon)', marginBottom:4 }}>Update Next Receipt No.</h3>
                  <p style={{ fontSize:13, color:'var(--text-muted)' }}>This will apply to the next entry created for {year > 0 ? year : CURRENT_YEAR}; numbering continues automatically after that.</p>
                </div>
                <div style={{ marginBottom:20 }}>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text-muted)', marginBottom:6, textTransform:'uppercase' }}>Next Receipt Number</label>
                  <input type="text" value={newReceiptNo} onChange={e=>setNewReceiptNo(e.target.value)}
                    style={{ ...themeInput(), fontSize:18, fontWeight:800, textAlign:'center', color:'var(--maroon)', fontFamily:'monospace' }}
                    placeholder="e.g. DH-2026-0050" />
                </div>
                <div style={{ display:'flex', gap:12 }}>
                  <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}} disabled={receiptNoSaving}
                    onClick={()=>setShowReceiptModal(false)}
                    style={{ flex:1, padding:13, borderRadius:12, border:'2px solid var(--border)', cursor:'pointer', fontSize:14, fontWeight:700, color:'var(--text-secondary)', background:'white' }}>
                    Cancel
                  </motion.button>
                  <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}} disabled={receiptNoSaving}
                    onClick={handleReceiptNoUpdate}
                    style={{ flex:1, padding:13, borderRadius:12, border:'none', cursor:'pointer', fontSize:14, fontWeight:700, color:'white', display:'flex', alignItems:'center', justifyContent:'center', gap:8, background: receiptNoSaving?'var(--neutral-300)':'linear-gradient(135deg,var(--primary),var(--maroon))' }}>
                    <CheckCircle size={16} /> {receiptNoSaving ? 'Saving...' : 'Update'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ritual Payment Modal */}
        <AnimatePresence>
          {ritualModal && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              style={modalOverlay} onClick={()=>!ritualSaving&&setRitualModal(null)}>
              <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}}
                onClick={e=>e.stopPropagation()}
                style={{ ...modalContent, maxWidth:460 }}>
                <h3 style={{ fontSize:18, fontWeight:800, color:'var(--maroon)', marginBottom:20 }}>
                  🪔 {ritualModal.entryId ? 'Edit' : 'Record'} Annual Ritual Payment
                </h3>
                <p style={{ fontSize:14, color:'var(--text-secondary)', marginBottom:16 }}>Member: <strong>{ritualModal.name}</strong></p>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text-muted)', marginBottom:4, textTransform:'uppercase' }}>Amount (₹) *</label>
                    <input type="number" value={ritualForm.amount||''} onChange={e=>setRitualForm({...ritualForm,amount:e.target.value})} style={themeInput()} />
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text-muted)', marginBottom:4, textTransform:'uppercase' }}>Payment Mode</label>
                    <select value={ritualForm.paymentMode} onChange={e=>setRitualForm({...ritualForm,paymentMode:e.target.value})} style={themeInput()}>
                      <option value="cash">Cash</option><option value="online">Online</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text-muted)', marginBottom:4, textTransform:'uppercase' }}>Status</label>
                    <select value={ritualForm.status} onChange={e=>setRitualForm({...ritualForm,status:e.target.value})} style={themeInput()}>
                      <option value="completed">Paid</option><option value="pending">Pending</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text-muted)', marginBottom:4, textTransform:'uppercase' }}>Payment Date</label>
                    <input type="date" value={ritualForm.paymentDate||''} onChange={e=>setRitualForm({...ritualForm,paymentDate:e.target.value})} style={themeInput()} />
                  </div>
                </div>
                <div style={{ display:'flex', gap:12, marginTop:20 }}>
                  <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}} disabled={ritualSaving}
                    onClick={()=>setRitualModal(null)}
                    style={{ flex:1, padding:13, borderRadius:12, border:'2px solid var(--border)', cursor:'pointer', fontSize:14, fontWeight:700, color:'var(--text-secondary)', background:'white' }}>
                    Cancel
                  </motion.button>
                  <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}} disabled={ritualSaving}
                    onClick={handleRitualSave}
                    style={{ flex:1, padding:13, borderRadius:12, border:'none', cursor:'pointer', fontSize:14, fontWeight:700, color:'white', display:'flex', alignItems:'center', justifyContent:'center', gap:8, background: ritualSaving?'var(--neutral-300)':'linear-gradient(135deg,var(--success),#166534)' }}>
                    <CurrencyCircleDollar size={16} /> {ritualSaving ? 'Saving...' : 'Save Payment'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirm */}
        <AnimatePresence>
          {deleteConfirm && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              style={modalOverlay} onClick={()=>setDeleteConfirm(null)}>
              <motion.div initial={{scale:0.9}} animate={{scale:1}} exit={{scale:0.9}}
                onClick={e=>e.stopPropagation()}
                style={{ ...modalContent, maxWidth:400, textAlign:'center' }}>
                <Trash size={48} weight="duotone" color="var(--error)" style={{ marginBottom:12 }} />
                <h3 style={{ fontSize:18, fontWeight:800, color:'var(--maroon)', marginBottom:8 }}>Delete Entry?</h3>
                <p style={{ fontSize:14, color:'var(--text-muted)', marginBottom:20 }}>This action cannot be undone.</p>
                <div style={{ display:'flex', gap:12 }}>
                  <button onClick={()=>setDeleteConfirm(null)}
                    style={{ flex:1, padding:12, borderRadius:12, border:'2px solid var(--border)', cursor:'pointer', fontSize:14, fontWeight:700, color:'var(--text-secondary)', background:'white' }}>Cancel</button>
                  <button onClick={()=>handleDelete(deleteConfirm)}
                    style={{ flex:1, padding:12, borderRadius:12, border:'none', cursor:'pointer', fontSize:14, fontWeight:700, color:'white', background:'var(--error)' }}>Delete</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden Html2Canvas Receipt for Rituals */}
        {downloadingReceipt && (
          <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
            <div ref={ritualReceiptRef} style={{
              width: '500px', borderRadius: 20, overflow: 'hidden', background: 'white',
              boxShadow: '0 20px 60px rgba(139,26,26,0.12)', border: '1.5px solid rgba(255,107,53,0.1)',
              textAlign: 'left', fontFamily: 'sans-serif'
            }}>
              <div style={{ background: 'linear-gradient(135deg, #1a0000 0%, #5a0e0e 60%, #8B1A1A 100%)', padding: '28px 28px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 6 }}>🛕</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#F7C948', letterSpacing: '0.5px' }}>Shri Dharamshala Trust</div>
                <div style={{ marginTop: 14, display: 'inline-block', padding: '6px 16px', borderRadius: 99, background: 'rgba(247,201,72,0.2)', border: '1px solid rgba(247,201,72,0.4)', fontSize: 14, fontWeight: 700, color: '#F7C948' }}>
                  ANNUAL RITUAL RECEIPT
                </div>
              </div>
              <div style={{ padding: '24px 28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: '1px dashed #f5ede0' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Receipt No.</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#8B1A1A', fontFamily: 'monospace' }}>{downloadingReceipt.receiptNumber}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>
                      {downloadingReceipt.paymentDate ? new Date(downloadingReceipt.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                {[
                  { label: 'Name', value: downloadingReceipt.name || '-' },
                  { label: 'Phone', value: downloadingReceipt.phone || '-' },
                  { label: 'Year', value: ritualYear },
                  { label: 'Payment Mode', value: downloadingReceipt.paymentMode === 'online' ? 'Online (Razorpay)' : 'Cash' },
                  { label: 'Category', value: 'Annual Ritual (Pooja Shulk)' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f5ede0' }}>
                    <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', maxWidth: '60%', textAlign: 'right' }}>{row.value}</span>
                  </div>
                ))}
                <div style={{ marginTop: 20, padding: '16px 20px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(22,163,74,0.08), rgba(22,163,74,0.04))', border: '1.5px solid rgba(22,163,74,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#16a34a' }}>Amount Paid</span>
                  <span style={{ fontSize: 24, fontWeight: 900, color: '#16a34a' }}>₹{(downloadingReceipt.amount||annualFee).toLocaleString()}</span>
                </div>
                <div style={{ textAlign: 'center', marginTop: 24, padding: '12px' }}>
                  <div style={{ fontSize: 20, marginBottom: 8 }}>🙏</div>
                  <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>Thank you for your annual contribution to <strong>Shri Dharamshala Trust</strong>.</p>
                  <div style={{ marginTop: 16, fontSize: 11, color: '#d1d5db', fontStyle: 'italic' }}>This is a computer-generated receipt and does not require a signature.</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  </AdminLayout>
  )
}

export default Cashbook
