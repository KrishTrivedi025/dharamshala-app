import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AdminLayout, useIsMobile } from './AdminDashboard'
import { CustomSelect } from '../../components/AdminSelect'
import { ButtonSpinner } from '../../components/ButtonSpinner'
import {
  BookOpen, ChartBar, CurrencyCircleDollar, ArrowUp, Wallet,
  Plus, DownloadSimple, Printer, PencilSimple, Trash,
  MagnifyingGlass, Receipt, WarningCircle, CheckCircle, X,
} from '@phosphor-icons/react'
import { cashbookAPI, settingsAPI, memberAPI, adminAPI } from '../../utils/api'
import { cardStyleSolid, modalOverlay, modalContent, inputStyle as themeInput } from '../../styles/theme'
import { ReceiptHeader, SANSTHAN_NAME } from '../../components/ReceiptHeader'
import { getReceiptHeaderDataUrl, RECEIPT_HEADER_RATIO } from '../../utils/receiptAssets'
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
const yearRange = (dateStr) => String(new Date(dateStr).getFullYear())

// Status badge colors: completed = green, pending = dark yellow, not_paid = red.
// Labels stay as-is in markup — textTransform:'uppercase' below renders them ALL CAPS.
const STATUS_STYLES = {
  completed: { bg: 'rgba(5,150,105,0.12)',  color: '#059669', border: 'rgba(5,150,105,0.3)' },
  pending:   { bg: 'rgba(161,98,7,0.12)',   color: '#a16207', border: 'rgba(161,98,7,0.35)' },
  not_paid:  { bg: 'rgba(220,38,38,0.12)',  color: '#dc2626', border: 'rgba(220,38,38,0.3)' },
}
const statusStyle = (displayStatus) => STATUS_STYLES[displayStatus] || STATUS_STYLES.pending

// Same three-color scheme, in jsPDF's [r,g,b] / RGB-array form, for the PDF export table.
const PDF_STATUS_COLORS = {
  completed: { text: [5, 150, 105], fill: [209, 250, 229] },
  pending:   { text: [161, 98, 7],  fill: [254, 243, 199] },
  not_paid:  { text: [220, 38, 38], fill: [254, 226, 226] },
}
const pdfStatusColor = (displayStatus) => PDF_STATUS_COLORS[displayStatus] || PDF_STATUS_COLORS.pending
const STATUS_LABEL_LEDGER = { completed: 'DONE', pending: 'PENDING', not_paid: 'NOT PAID' }
const STATUS_LABEL_RITUAL = { completed: 'PAID', pending: 'PENDING', not_paid: 'NOT PAID' }
// Same badge, rendered as inline-styled HTML, for the DOC/Print exports.
const statusBadgeHtml = (raw, labelMap) => {
  const s = statusStyle(raw)
  return `<span style="display:inline-block;padding:4px 14px;border-radius:12px;font-weight:700;font-size:20px;text-transform:uppercase;letter-spacing:0.3px;background:${s.bg};color:${s.color}">${labelMap[raw] || String(raw).toUpperCase()}</span>`
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
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editEntry, setEditEntry] = useState(null)
  const [formData, setFormData] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('ledger')
  const [ritualData, setRitualData] = useState(null)
  const [ritualYear, setRitualYear] = useState(CURRENT_YEAR)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
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
  const [showRitualSearchSuggestions, setShowRitualSearchSuggestions] = useState(false)
  const [ritualStatusFilter, setRitualStatusFilter] = useState('all')
  const [nextReceiptNo, setNextReceiptNo] = useState('')
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [newReceiptNo, setNewReceiptNo] = useState('')
  const [receiptNoSaving, setReceiptNoSaving] = useState(false)
  const [members, setMembers] = useState([])
  const [registeredUsers, setRegisteredUsers] = useState([])
  const [showMemberPicker, setShowMemberPicker] = useState(false)
  const [memberPickerSearch, setMemberPickerSearch] = useState('')

  useEffect(() => {
    memberAPI.getAll().then(res => setMembers(res.data || [])).catch(() => {})
    adminAPI.getAllUsers().then(res => setRegisteredUsers((res.data || []).filter(u => u.role === 'user'))).catch(() => {})
    settingsAPI.getRitualFee().then(res => {
      if (res.data?.annualRitualFee) setAnnualFee(res.data.annualRitualFee)
    }).catch(() => {})
  }, [])

  // Picker list: registered website accounts first (so admin prefers linking
  // to the real account when one exists — this is what prevents the Annual
  // Ritual tab from also showing a separate "not paid" placeholder for them),
  // then the plain Members directory, skipping any member whose name exactly
  // matches a registered account already listed.
  const pickerList = (() => {
    const users = registeredUsers.map(u => ({ _id: u._id, name: u.name, phone: u.phone, userId: u._id, isRegistered: true }))
    const usedNames = new Set(users.map(u => u.name.trim().toLowerCase()))
    const plainMembers = members
      .filter(m => !usedNames.has(m.name.trim().toLowerCase()))
      .map(m => ({ _id: m._id, name: m.name, phone: m.phone, userId: null, isRegistered: false }))
    return [...users, ...plainMembers]
  })()

  const fetchNextReceipt = async () => {
    try {
      const res = await cashbookAPI.getNextReceipt(year > 0 ? year : CURRENT_YEAR)
      setNextReceiptNo(res.data?.receiptNumber || '')
    } catch { /* non-critical */ }
  }

  const fetchData = async (searchOverride) => {
    try {
      setLoading(true)
      const params = { sort: 'entryDate' }
      if (year > 0) params.year = year
      if (month > 0) params.month = month
      if (typeFilter !== 'All') params.type = typeFilter
      if (sourceFilter !== 'All') params.source = sourceFilter
      const searchTerm = searchOverride !== undefined ? searchOverride : search
      if (searchTerm.trim()) params.search = searchTerm.trim()
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

  const handleSearch = (e) => { if (e.key === 'Enter') { setShowSearchSuggestions(false); fetchData() } }

  // Prefix match against the Members directory (e.g. "SH" -> "Shyam Sharma"),
  // so admins can jump straight to one member's entries without typing the full name.
  const searchSuggestions = search.trim()
    ? members.filter(m => m.name?.toLowerCase().startsWith(search.trim().toLowerCase())).slice(0, 8)
    : []

  const selectSearchSuggestion = (name) => {
    setSearch(name)
    setShowSearchSuggestions(false)
    fetchData(name)
  }

  const ritualSearchSuggestions = ritualSearch.trim()
    ? members.filter(m => m.name?.toLowerCase().startsWith(ritualSearch.trim().toLowerCase())).slice(0, 8)
    : []

  const selectRitualSearchSuggestion = (name) => {
    setRitualSearch(name)
    setShowRitualSearchSuggestions(false)
  }

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

  const isPending = formData.status === 'pending'

  const handleStatusChange = (newStatus) => {
    setFormData(prev => {
      const next = { ...prev, status: newStatus }
      if (newStatus === 'pending') {
        next.receiptNumber = ''
        next.paymentDate = ''
        next.paymentMode = 'cash'
      } else if (prev.status === 'pending' && !next.receiptNumber) {
        next.receiptNumber = editEntry ? '' : (nextReceiptNo || '')
      }
      return next
    })
  }

  const openAdd = (member = null) => {
    setEditEntry(null)
    setFormData({
      entryDate: String(CURRENT_YEAR), paymentDate: '',
      name: member?.name || '', phone: member?.phone || '', userId: member?.userId || null,
      category:'', paymentMode:'cash',
      type:'credit', amount:'', status:'completed', description:'',
      receiptNumber: nextReceiptNo || ''
    })
    setShowModal(true)
  }

  const openMemberPicker = () => { setMemberPickerSearch(''); setShowMemberPicker(true) }
  const selectMemberForEntry = (member) => { setShowMemberPicker(false); openAdd(member) }
  const skipMemberPicker = () => { setShowMemberPicker(false); openAdd(null) }

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
      if (!payload.receiptNumber) delete payload.receiptNumber
      if (editEntry) await cashbookAPI.updateEntry(editEntry._id, payload)
      else await cashbookAPI.createEntry(payload)
      setShowModal(false)
      await Promise.all([fetchData(), fetchNextReceipt(), ...(source === 'annual_ritual' ? [fetchRituals()] : [])])
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try {
      setDeletingId(id)
      await cashbookAPI.deleteEntry(id)
      setDeleteConfirm(null)
      await Promise.all([fetchData(), ...(tab === 'annual' ? [fetchRituals()] : [])])
    } catch (err) { setError(err.message) }
    finally { setDeletingId(null) }
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

  // Record/Edit for annual ritual rows (whether a Ledger entry or an Annual Ritual
  // tab member) reuses the same general Add/Edit Entry modal as every other
  // cashbook entry — Ledger rows key off `_id`/`isVirtual`, Annual Ritual member
  // rows key off `entryId`, so normalize both shapes into one entry point.
  const openRitualEntryModal = (row) => {
    const realId = row.entryId !== undefined ? row.entryId : (row.isVirtual ? null : row._id)
    const yearVal = row.year || (row.entryDate ? new Date(row.entryDate).getFullYear() : CURRENT_YEAR)
    setEditEntry(realId ? { _id: realId } : null)
    setFormData({
      entryDate: String(yearVal),
      paymentDate: row.paymentDate ? new Date(row.paymentDate).toISOString().split('T')[0] : '',
      name: row.name, phone: row.phone || '',
      category: row.category || 'Annual Ritual Payment (Pooja Shulk)',
      paymentMode: row.paymentMode || 'cash',
      type: row.type || 'credit',
      amount: row.amount || annualFee,
      status: realId ? row.status : 'completed',
      description: row.description || '',
      receiptNumber: row.receiptNumber || ''
    })
    setShowModal(true)
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
        await document.fonts.ready
        const canvas = await html2canvas(ritualReceiptRef.current, { scale: 2, backgroundColor: '#fff', logging: false })
        const link = document.createElement('a')
        link.download = `Annual_Ritual_Receipt_${m.year || ritualYear}_${m.receiptNumber}.png`
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
          (!ritualSearch || (m.name && m.name.toLowerCase().includes(ritualSearch.toLowerCase())) ||
          (m.receiptNumber && m.receiptNumber.toLowerCase().includes(ritualSearch.toLowerCase()))) &&
          (ritualStatusFilter === 'all' || (ritualStatusFilter === 'paid' ? m.status === 'completed' : m.status !== 'completed'))
        ) : []
        dataToExport = filteredMembers; titleSuffix = ritualYear === 'all' ? 'All Years' : `Annual Rituals ${ritualYear}`
      }

      if (exportModal === 'pdf') {
        const doc = new jsPDF('l', 'mm', 'a4')
        const pageWidth = 297, margin = 14
        let contentStartY = 36
        try {
          const headerImg = await getReceiptHeaderDataUrl()
          const imgW = pageWidth - margin * 2, imgH = imgW / RECEIPT_HEADER_RATIO, imgY = 12
          doc.addImage(headerImg, 'PNG', margin, imgY, imgW, imgH)
          const lineY = imgY + imgH + 8
          doc.setDrawColor(139, 26, 26); doc.setLineWidth(0.6); doc.line(margin, lineY, pageWidth - margin, lineY)
          contentStartY = lineY + 8
        } catch {
          doc.setFontSize(18); doc.text('Shri Dharamshala Trust', margin, 18)
          doc.setFontSize(11); doc.text(exportTarget === 'ledger' ? `Cashbook - ${titleSuffix}` : `Annual Rituals - ${titleSuffix}`, margin, 26)
        }
        let rows = [], head = [], statusColIndex = 0, statusRaw = []
        if (exportTarget === 'ledger') {
          head = [['Date','Name','Category','Payment Date','Receipt No.','Mode','Type','Amount','Status','Balance']]
          statusColIndex = 8
          statusRaw = dataToExport.map(e => e.displayStatus)
          rows = dataToExport.map(e => [yearRange(e.entryDate), e.name, e.category, e.paymentDate ? new Date(e.paymentDate).toLocaleDateString('en-IN') : '-', e.displayStatus==='completed' ? e.receiptNumber : 'N/A', e.displayStatus==='completed' ? e.paymentMode : '-', e.type === 'credit' ? 'Credit' : 'Debit', `Rs.${e.amount.toLocaleString()}`, STATUS_LABEL_LEDGER[e.displayStatus] || e.displayStatus.toUpperCase(), `Rs.${e.runningBalance.toLocaleString()}`])
        } else {
          head = ritualYear === 'all' ? [['Year','Name','Phone','Amount','Status','Payment Date','Mode','Receipt No.']] : [['Name','Phone','Amount','Status','Payment Date','Mode','Receipt No.']]
          statusColIndex = ritualYear === 'all' ? 4 : 3
          statusRaw = dataToExport.map(m => m.displayStatus)
          rows = dataToExport.map(m => {
            const row = [m.name, m.phone || '-', `Rs.${(m.amount||annualFee).toLocaleString()}`, STATUS_LABEL_RITUAL[m.displayStatus] || m.displayStatus.toUpperCase(), m.paymentDate ? new Date(m.paymentDate).toLocaleDateString('en-IN') : '-', m.displayStatus==='completed' ? (m.paymentMode || '-') : '-', m.displayStatus==='completed' ? (m.receiptNumber || '-') : 'N/A']
            return ritualYear === 'all' ? [m.year, ...row] : row
          })
        }
        autoTable(doc, {
          startY: contentStartY, head, body: rows,
          styles: { fontSize: 11, cellPadding: 3 },
          headStyles: { fillColor: [139, 26, 26], fontSize: 12, fontStyle: 'bold' },
          didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === statusColIndex) {
              const sc = pdfStatusColor(statusRaw[data.row.index])
              data.cell.styles.textColor = sc.text
              data.cell.styles.fillColor = sc.fill
              data.cell.styles.fontStyle = 'bold'
              data.cell.styles.fontSize = 13
              data.cell.styles.halign = 'center'
            }
          },
        })
        doc.save(`${exportTarget}_${Date.now()}.pdf`)
      } else if (exportModal === 'doc') {
        const headerImg = await getReceiptHeaderDataUrl().catch(() => null)
        let html = `<html><head><meta charset="utf-8"><style>table{border-collapse:collapse;width:100%}th,td{border:1px solid #999;padding:6px 8px;font-size:18px}th{background:#8B1A1A;color:white}</style></head><body>`
        if (headerImg) {
          html += `<div style="margin:0 0 18px"><img src="${headerImg}" style="width:100%;display:block" /></div><hr style="border:none;border-top:2px solid #8B1A1A;margin:0 0 18px" />`
        } else {
          html += `<h2 style="color:#8B1A1A">Shri Dharamshala Trust</h2><p>${exportTarget === 'ledger' ? 'Cashbook' : 'Annual Rituals'} - ${titleSuffix}</p>`
        }
        if (exportTarget === 'ledger') {
          html += `<table><tr><th>Date</th><th>Name</th><th>Category</th><th>Payment Date</th><th>Receipt No.</th><th>Mode</th><th>Type</th><th>Amount</th><th>Status</th><th>Balance</th></tr>`
          dataToExport.forEach(e => { html += `<tr><td>${yearRange(e.entryDate)}</td><td>${e.name}</td><td>${e.category}</td><td>${e.paymentDate ? new Date(e.paymentDate).toLocaleDateString('en-IN') : '-'}</td><td>${e.displayStatus==='completed' ? e.receiptNumber : 'N/A'}</td><td>${e.displayStatus==='completed' ? e.paymentMode : '-'}</td><td>${e.type}</td><td>Rs.${e.amount.toLocaleString()}</td><td>${statusBadgeHtml(e.displayStatus, STATUS_LABEL_LEDGER)}</td><td>Rs.${e.runningBalance.toLocaleString()}</td></tr>` })
        } else {
          html += `<table><tr>${ritualYear === 'all' ? '<th>Year</th>' : ''}<th>Name</th><th>Phone</th><th>Amount</th><th>Status</th><th>Payment Date</th><th>Mode</th><th>Receipt No.</th></tr>`
          dataToExport.forEach(m => { html += `<tr>${ritualYear === 'all' ? `<td>${m.year}</td>` : ''}<td>${m.name}</td><td>${m.phone||'-'}</td><td>Rs.${(m.amount||annualFee).toLocaleString()}</td><td>${statusBadgeHtml(m.displayStatus, STATUS_LABEL_RITUAL)}</td><td>${m.paymentDate ? new Date(m.paymentDate).toLocaleDateString('en-IN') : '-'}</td><td>${m.displayStatus==='completed' ? (m.paymentMode||'-') : '-'}</td><td>${m.displayStatus==='completed' ? (m.receiptNumber||'-') : 'N/A'}</td></tr>` })
        }
        html += `</table></body></html>`
        saveAs(new Blob([html], { type: 'application/msword' }), `${exportTarget}_${Date.now()}.doc`)
      } else if (exportModal === 'print') {
        const headerImg = await getReceiptHeaderDataUrl().catch(() => null)
        const win = window.open('', '_blank')
        let contentHtml = ''
        if (exportTarget === 'ledger') {
          let rowsHtml = dataToExport.map(e => `<tr><td>${yearRange(e.entryDate)}</td><td>${e.name}</td><td>${e.category}</td><td>${e.paymentDate ? new Date(e.paymentDate).toLocaleDateString('en-IN') : '-'}</td><td>${e.displayStatus==='completed' ? e.receiptNumber : 'N/A'}</td><td>${e.displayStatus==='completed' ? e.paymentMode : '-'}</td><td>${e.type}</td><td>Rs.${e.amount.toLocaleString()}</td><td>${statusBadgeHtml(e.displayStatus, STATUS_LABEL_LEDGER)}</td><td>Rs.${e.runningBalance.toLocaleString()}</td></tr>`).join('')
          contentHtml = `<table><tr><th>Date</th><th>Name</th><th>Category</th><th>Payment Date</th><th>Receipt No.</th><th>Mode</th><th>Type</th><th>Amount</th><th>Status</th><th>Balance</th></tr>${rowsHtml}</table>`
        } else {
          let rowsHtml = dataToExport.map(m => `<tr>${ritualYear === 'all' ? `<td>${m.year}</td>` : ''}<td>${m.name}</td><td>${m.phone||'-'}</td><td>Rs.${(m.amount||annualFee).toLocaleString()}</td><td>${statusBadgeHtml(m.displayStatus, STATUS_LABEL_RITUAL)}</td><td>${m.paymentDate ? new Date(m.paymentDate).toLocaleDateString('en-IN') : '-'}</td><td>${m.displayStatus==='completed' ? (m.paymentMode||'-') : '-'}</td><td>${m.displayStatus==='completed' ? (m.receiptNumber||'-') : 'N/A'}</td></tr>`).join('')
          contentHtml = `<table><tr>${ritualYear === 'all' ? '<th>Year</th>' : ''}<th>Name</th><th>Phone</th><th>Amount</th><th>Status</th><th>Payment Date</th><th>Mode</th><th>Receipt No.</th></tr>${rowsHtml}</table>`
        }
        const headerHtml = headerImg
          ? `<img src="${headerImg}" style="width:100%;display:block;margin-bottom:18px" /><hr style="border:none;border-top:2px solid #8B1A1A;margin:0 0 18px" />`
          : `<h2>Shri Dharamshala Trust — ${exportTarget === 'ledger' ? 'Cashbook' : 'Annual Rituals'}</h2><div class="summary">${titleSuffix}</div>`
        win.document.write(`<html><head><title>${exportTarget.toUpperCase()}</title><style>body{font-family:Arial,sans-serif;padding:20px}table{width:100%;border-collapse:collapse;font-size:18px}th,td{border:1px solid #ddd;padding:8px 10px;text-align:left}th{background:#8B1A1A;color:white}h2{color:#8B1A1A}.summary{margin-bottom:10px;font-size:13px}</style></head><body>${headerHtml}${contentHtml}</body></html>`)
        win.document.close(); win.print()
      }
      setExportModal(null)
    } catch (err) { setError(err.message) }
    finally { setExporting(false) }
  }

  return (
    <AdminLayout>
      
      <div style={{ padding: isMobile ? '20px 14px' : '40px 36px' }}>

        {/* Header */}
        <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} style={{ marginBottom: isMobile ? 18 : 24 }}>
          <h1 style={{ fontSize: isMobile ? 20 : 28, fontWeight:900, color:'var(--maroon)', marginBottom:4, display:'flex', alignItems:'center', gap:8 }}>
            <BookOpen size={isMobile ? 20 : 28} weight="duotone" color="var(--maroon)" /> Cashbook / Bank Ledger
          </h1>
          <p style={{ fontSize:13, color:'var(--text-muted)' }}>Complete financial record of all transactions</p>
        </motion.div>

        {/* Tab Switcher — segmented pill control */}
        <div style={{ display:'flex', background:'var(--neutral-100)', borderRadius:14, padding:4, marginBottom: isMobile ? 16 : 24, gap:2 }}>
          {[{k:'ledger',Icon:ChartBar,l:'Ledger'},{k:'annual',emoji:'🪔',l:'Annual Ritual Payments'}].map(t=>(
            <div key={t.k} style={{ flex:1, position:'relative' }}>
              {tab===t.k && (
                <motion.div layoutId="tab-pill"
                  style={{ position:'absolute', inset:0, background:'white', borderRadius:11, boxShadow:'0 2px 8px rgba(0,0,0,0.10)' }}
                  transition={{ type:'spring', stiffness:400, damping:32 }} />
              )}
              <button onClick={()=>setTab(t.k)}
                style={{ position:'relative', zIndex:1, width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                  padding: isMobile ? '9px 8px' : '10px 20px', borderRadius:11, border:'none', cursor:'pointer', background:'transparent',
                  fontSize: isMobile ? 12 : 13, fontWeight:700, fontFamily:'inherit', whiteSpace:'nowrap',
                  color: tab===t.k ? 'var(--maroon)' : 'var(--text-muted)',
                  transition:'color 0.2s ease',
                }}>
                {t.Icon ? <t.Icon size={14} weight={tab===t.k ? 'fill':'regular'} color={tab===t.k ? 'var(--primary)' : 'var(--text-muted)'} /> : <span style={{ fontSize:14 }}>{t.emoji}</span>}
                {t.l}
              </button>
            </div>
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
            {/* Summary Cards — always 3-col with left accent bar */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap: isMobile ? 8 : 16, marginBottom: isMobile ? 14 : 24 }}>
              {[
                { label:'Income',  value:`₹${summary.totalIncome?.toLocaleString()}`,  color:'var(--success-text)', accentColor:'#059669', bg:'var(--success-subtle)', Icon: CurrencyCircleDollar },
                { label:'Expense', value:`₹${summary.totalExpense?.toLocaleString()}`, color:'var(--error-text)',   accentColor:'#dc2626', bg:'var(--error-subtle)',   Icon: ArrowUp },
                { label:'Balance', value:`₹${summary.balance?.toLocaleString()}`,      color:'var(--info-text)',    accentColor:'#2563eb', bg:'var(--info-subtle)',    Icon: Wallet },
              ].map((c,i)=>(
                <motion.div key={i} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.08}}
                  style={{ background:'var(--surface-solid)', border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)',
                    borderRadius:14, overflow:'hidden', display:'flex', alignItems:'stretch', minHeight: isMobile ? 72 : 90 }}>
                  {/* Left accent bar */}
                  <div style={{ width:4, background:c.accentColor, flexShrink:0 }} />
                  <div style={{ padding: isMobile ? '10px 10px' : '16px 18px', display:'flex', flexDirection:'column', justifyContent:'center', flex:1 }}>
                    <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:4 }}>{c.label}</div>
                    <div style={{ fontSize: isMobile ? 16 : 22, fontWeight:900, color:c.color, lineHeight:1 }}>{loading ? '—' : c.value}</div>
                  </div>
                  {!isMobile && (
                    <div style={{ padding:'16px 14px', display:'flex', alignItems:'center' }}>
                      <div style={{ width:40, height:40, borderRadius:12, background:c.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <c.Icon size={20} weight="duotone" color={c.color} />
                      </div>
                    </div>
                  )}
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
                        onChange={e=>{ setSearch(e.target.value); setShowSearchSuggestions(true) }}
                        onFocus={()=>setShowSearchSuggestions(true)}
                        onBlur={()=>setTimeout(()=>setShowSearchSuggestions(false), 150)}
                        onKeyDown={handleSearch}
                        style={{ ...themeInput(), width:'100%', paddingLeft:30 }} />
                      {showSearchSuggestions && searchSuggestions.length > 0 && (
                        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'white', border:'1px solid var(--border)', borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,0.14)', zIndex:50, maxHeight:220, overflowY:'auto' }}>
                          {searchSuggestions.map(m => (
                            <div key={m._id} onMouseDown={e=>e.preventDefault()} onClick={()=>selectSearchSuggestion(m.name)}
                              style={{ padding:'9px 14px', fontSize:13, fontWeight:600, color:'var(--text-primary)', cursor:'pointer', borderBottom:'1px solid var(--neutral-100)', display:'flex', justifyContent:'space-between', gap:8 }}>
                              <span>{m.name}</span>
                              {m.phone && <span style={{ fontSize:11, fontWeight:500, color:'var(--text-muted)' }}>{m.phone}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                      onClick={()=>fetchData()} style={adminBtn()}>
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
                  {/* Row 5: Add Entry hero + 3-col export */}
                  <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}}
                    onClick={openMemberPicker}
                    style={{ width:'100%', padding:'13px', borderRadius:12, border:'none', cursor:'pointer',
                      fontSize:14, fontWeight:800, color:'white', fontFamily:'inherit',
                      background:'linear-gradient(135deg, var(--primary), var(--maroon))',
                      boxShadow:'0 4px 14px rgba(255,107,53,0.35)',
                      display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    <Plus size={16} weight="bold" /> Add New Entry
                  </motion.button>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                    <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                      onClick={() => openExportModal('pdf', 'ledger')} style={{ ...adminBtn('var(--success)'), justifyContent:'center' }}>
                      <DownloadSimple size={13} /> PDF
                    </motion.button>
                    <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                      onClick={() => openExportModal('doc', 'ledger')} style={{ ...adminBtn('var(--info)'), justifyContent:'center' }}>
                      <DownloadSimple size={13} /> DOC
                    </motion.button>
                    <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                      onClick={() => openExportModal('print', 'ledger')} style={{ ...adminBtn('#7c3aed'), justifyContent:'center' }}>
                      <Printer size={13} /> Print
                    </motion.button>
                  </div>
                </div>
              ) : (
                <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
                  <CustomSelect value={year} onChange={v => setYear(+v)} options={[{ value: 0, label: 'All Years' }, ...YEARS.map(y => ({ value: y, label: String(y) }))]} minWidth={120} />
                  <CustomSelect value={month} onChange={v => setMonth(+v)} options={MONTHS.map((m, i) => ({ value: i, label: m }))} minWidth={140} />
                  <CustomSelect value={typeFilter} onChange={v => setTypeFilter(v)} options={TYPES.map(t => ({ value: t, label: t === 'All' ? 'All Types' : t === 'credit' ? 'Credit ↑' : 'Debit ↓' }))} minWidth={120} />
                  <CustomSelect value={sourceFilter} onChange={v => setSourceFilter(v)} options={SOURCES.map(s => ({ value: s, label: s === 'All' ? 'All Sources' : SOURCE_LABELS[s] || s }))} minWidth={140} />
                  <div style={{ position:'relative', display:'flex', alignItems:'center', flex:'1 1 280px', maxWidth:420 }}>
                    <MagnifyingGlass size={14} color="var(--text-muted)" style={{ position:'absolute', left:10, pointerEvents:'none' }} />
                    <input placeholder="Search name, receipt..." value={search}
                      onChange={e=>{ setSearch(e.target.value); setShowSearchSuggestions(true) }}
                      onFocus={()=>setShowSearchSuggestions(true)}
                      onBlur={()=>setTimeout(()=>setShowSearchSuggestions(false), 150)}
                      onKeyDown={handleSearch}
                      style={{ ...themeInput(), width:'100%', paddingLeft:30 }} />
                    {showSearchSuggestions && searchSuggestions.length > 0 && (
                      <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'white', border:'1px solid var(--border)', borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,0.14)', zIndex:50, maxHeight:220, overflowY:'auto' }}>
                        {searchSuggestions.map(m => (
                          <div key={m._id} onMouseDown={e=>e.preventDefault()} onClick={()=>selectSearchSuggestion(m.name)}
                            style={{ padding:'9px 14px', fontSize:13, fontWeight:600, color:'var(--text-primary)', cursor:'pointer', borderBottom:'1px solid var(--neutral-100)', display:'flex', justifyContent:'space-between', gap:8, whiteSpace:'nowrap' }}>
                            <span>{m.name}</span>
                            {m.phone && <span style={{ fontSize:11, fontWeight:500, color:'var(--text-muted)' }}>{m.phone}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                    onClick={()=>fetchData()} style={adminBtn()}>
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
                      onClick={openMemberPicker} style={adminBtn()}>
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
                <h3 style={{ fontSize:18, fontWeight:800, color:'var(--maroon)', marginBottom:8 }}>
                  {search.trim() ? 'No matching entries' : 'No entries found'}
                </h3>
                <p style={{ fontSize:14, color:'var(--text-muted)' }}>
                  {search.trim() ? `No entries match "${search.trim()}" — try a different name or clear the search` : 'Add your first cashbook entry to get started'}
                </p>
              </div>
            ) : isMobile ? (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {entriesWithBalance.map((e,i)=>(
                  <motion.div key={e._id}
                    initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                    transition={{ delay:i*0.04 }}
                    style={{ background:'white', border:'1px solid var(--border)', borderRadius:14,
                      boxShadow:'var(--shadow-sm)', padding:'12px 14px' }}>
                    {/* Row 1: type badge + amount + edit/delete */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                      <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                        {/* Colored dot — green credit, red debit */}
                        <div style={{ width:7, height:7, borderRadius:'50%', flexShrink:0,
                          background: e.type==='credit' ? '#059669' : '#dc2626' }} />
                        <span style={{ padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:700,
                          background: e.type==='credit' ? 'var(--success-subtle)' : 'var(--error-subtle)',
                          color: e.type==='credit' ? 'var(--success-text)' : 'var(--error-text)' }}>
                          {e.type==='credit'?'Credit':'Debit'}
                        </span>
                        <span style={{ padding:'2px 8px', borderRadius:99, fontSize:20, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.3px',
                          background: statusStyle(e.displayStatus).bg, color: statusStyle(e.displayStatus).color }}>
                          {e.displayStatus==='completed'?'Done':e.displayStatus==='not_paid'?'Not Paid':'Pending'}
                        </span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <span style={{ fontSize:15, fontWeight:900, color: e.displayStatus!=='completed' ? 'var(--error-text)' : (e.type==='credit' ? 'var(--success-text)' : 'var(--error-text)') }}>
                          ₹{e.amount.toLocaleString()}
                        </span>
                        {e.source==='annual_ritual' && e.displayStatus!=='completed' ? (
                          <>
                            <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                              onClick={()=>openRitualEntryModal(e)}
                              style={{ ...adminBtn(e.displayStatus==='not_paid' ? 'linear-gradient(135deg,var(--success),#166534)' : 'linear-gradient(135deg,var(--primary),var(--maroon))'), padding:'4px 10px', fontSize:10 }}>
                              {e.displayStatus==='not_paid' ? <><CurrencyCircleDollar size={11} /> Record</> : <><PencilSimple size={11} /> Edit</>}
                            </motion.button>
                            {!e.isVirtual && (
                              <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                                onClick={()=>setDeleteConfirm(e._id)}
                                style={{ ...adminBtn('linear-gradient(135deg,var(--error),#991b1b)'), padding:'4px 8px', fontSize:10 }}>
                                <Trash size={11} weight="duotone" />
                              </motion.button>
                            )}
                          </>
                        ) : (
                          <>
                            <button onClick={()=>openEdit(e)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--primary)', padding:'2px 4px', display:'flex' }}>
                              <PencilSimple size={14} weight="duotone" />
                            </button>
                            <button onClick={()=>setDeleteConfirm(e._id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--error)', padding:'2px 4px', display:'flex' }}>
                              <Trash size={14} weight="duotone" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {/* Row 2: Name + category */}
                    <div style={{ fontSize:18, fontWeight:700, color:'var(--maroon)', marginBottom:1 }}>{e.name}</div>
                    <div style={{ fontSize:11, color:'var(--text-secondary)', marginBottom:6 }}>{e.category}</div>
                    {/* Row 3: meta */}
                    <div style={{ fontSize:10, color:'var(--text-muted)', display:'flex', flexWrap:'wrap', gap:4, alignItems:'center' }}>
                      <span>{yearRange(e.entryDate)}</span>
                      {e.paymentDate && <><span>·</span><span>{new Date(e.paymentDate).toLocaleDateString('en-IN')}</span></>}
                      {e.displayStatus==='completed' && e.receiptNumber && (
                        <><span>·</span>
                        <span style={{ display:'flex', alignItems:'center', gap:2, color:'var(--text-secondary)' }}>
                          <Receipt size={9} weight="duotone" />{e.receiptNumber}
                        </span></>
                      )}
                      <span>·</span>
                      <span style={{ padding:'1px 6px', borderRadius:99, fontSize:9, fontWeight:700,
                        background: e.displayStatus==='completed' && e.paymentMode==='online' ? 'var(--info-subtle)' : 'var(--neutral-100)',
                        color: e.displayStatus==='completed' && e.paymentMode==='online' ? 'var(--info-text)' : 'var(--text-secondary)' }}>
                        {e.displayStatus!=='completed' ? '—' : (e.paymentMode==='online'?'Online':e.paymentMode==='cash'?'Cash':'—')}
                      </span>
                      <span>·</span>
                      <span style={{ fontWeight:600, color: e.runningBalance>=0 ? 'var(--success-text)' : 'var(--error-text)' }}>
                        Bal ₹{e.runningBalance.toLocaleString()}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div style={{ ...cardStyleSolid, padding:0, overflow:'hidden' }}>
                <div style={{ overflowX:'auto' }}>
                  <table ref={tableRef} style={{ width:'100%', borderCollapse:'collapse', fontSize:18 }}>
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
                          <td style={{ padding:'10px', fontFamily:'monospace', fontSize:12, color:'var(--text-secondary)' }}>{e.displayStatus==='completed' ? e.receiptNumber : 'N/A'}</td>
                          <td style={{ padding:'10px' }}>
                            <span style={{ padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700,
                              background: e.displayStatus==='completed' && e.paymentMode==='online' ? 'var(--info-subtle)' : 'var(--neutral-100)',
                              color: e.displayStatus==='completed' && e.paymentMode==='online' ? 'var(--info-text)' : 'var(--text-secondary)' }}>
                              {e.displayStatus!=='completed' ? '—' : (e.paymentMode==='online'?'Online':e.paymentMode==='cash'?'Cash':'—')}
                            </span>
                          </td>
                          <td style={{ padding:'10px' }}>
                            <span style={{ padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700,
                              background: e.type==='credit' ? 'var(--success-subtle)' : 'var(--error-subtle)',
                              color: e.type==='credit' ? 'var(--success-text)' : 'var(--error-text)' }}>
                              {e.type==='credit'?'↑ Credit':'↓ Debit'}
                            </span>
                          </td>
                          <td style={{ padding:'10px', fontWeight:800, color: e.displayStatus!=='completed' ? 'var(--error-text)' : (e.type==='credit' ? 'var(--success-text)' : 'var(--error-text)') }}>
                            ₹{e.amount.toLocaleString()}
                          </td>
                          <td style={{ padding:'10px' }}>
                            <span style={{ padding:'3px 10px', borderRadius:99, fontSize:20, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.3px',
                              background: statusStyle(e.displayStatus).bg, color: statusStyle(e.displayStatus).color }}>
                              {e.displayStatus==='completed'?'Done':e.displayStatus==='not_paid'?'Not Paid':'Pending'}
                            </span>
                          </td>
                          <td style={{ padding:'10px', fontWeight:700, color: e.runningBalance>=0 ? 'var(--success-text)' : 'var(--error-text)' }}>
                            ₹{e.runningBalance.toLocaleString()}
                          </td>
                          <td style={{ padding:'10px', whiteSpace:'nowrap' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              {e.source==='annual_ritual' && e.displayStatus!=='completed' ? (
                                <>
                                  <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                                    onClick={()=>openRitualEntryModal(e)}
                                    style={{ ...adminBtn(e.displayStatus==='not_paid' ? 'linear-gradient(135deg,var(--success),#166534)' : 'linear-gradient(135deg,var(--primary),var(--maroon))'), padding:'6px 12px', fontSize:11 }}>
                                    {e.displayStatus==='not_paid' ? <><CurrencyCircleDollar size={12} /> Record</> : <><PencilSimple size={12} /> Edit</>}
                                  </motion.button>
                                  {!e.isVirtual && (
                                    <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                                      onClick={()=>setDeleteConfirm(e._id)} title="Delete"
                                      style={{ ...adminBtn('linear-gradient(135deg,var(--error),#991b1b)'), padding:'6px 10px', fontSize:11 }}>
                                      <Trash size={12} weight="duotone" />
                                    </motion.button>
                                  )}
                                </>
                              ) : (
                                <>
                                  <button onClick={()=>openEdit(e)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--primary)' }} title="Edit">
                                    <PencilSimple size={16} weight="duotone" />
                                  </button>
                                  <button onClick={()=>setDeleteConfirm(e._id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--error)' }} title="Delete">
                                    <Trash size={16} weight="duotone" />
                                  </button>
                                </>
                              )}
                            </div>
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
                      <CustomSelect value={ritualYear} onChange={v => setRitualYear(v === 'all' ? 'all' : +v)} options={[{ value:'all', label:'All Years' }, ...YEARS.map(y => ({ value: y, label: String(y) }))]} minWidth={90} />
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
                  {/* Row 2: Stats — single scrollable badge row */}
                  {ritualData && (
                    <div style={{ display:'flex', gap:8, overflowX:'auto', scrollbarWidth:'none' }}>
                      {[
                        { label:'Paid', value: ritualData.paid, color:'var(--success-text)', bg:'var(--success-subtle)' },
                        { label:'Pending', value: ritualData.pending, color:'var(--warning-text)', bg:'var(--warning-subtle)' },
                        { label:'Not Paid', value: ritualData.notPaid, color:'var(--error-text)', bg:'var(--error-subtle)' },
                        { label:'Total', value: ritualData.totalMembers, color:'var(--maroon)', bg:'var(--maroon-subtle)' },
                      ].map((s,i) => (
                        <div key={i} style={{ flexShrink:0, padding:'7px 14px', borderRadius:99, background:s.bg,
                          display:'flex', alignItems:'center', gap:6 }}>
                          <span style={{ fontSize:16, fontWeight:900, color:s.color }}>{s.value}</span>
                          <span style={{ fontSize:11, fontWeight:600, color:s.color, opacity:0.8 }}>{s.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Row 3: Search */}
                  <div style={{ position:'relative' }}>
                    <MagnifyingGlass size={14} color="var(--text-muted)" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                    <input placeholder="Search name or receipt..." value={ritualSearch}
                      onChange={e=>{ setRitualSearch(e.target.value); setShowRitualSearchSuggestions(true) }}
                      onFocus={()=>setShowRitualSearchSuggestions(true)}
                      onBlur={()=>setTimeout(()=>setShowRitualSearchSuggestions(false), 150)}
                      style={{ ...themeInput(), width:'100%', paddingLeft:30 }} />
                    {showRitualSearchSuggestions && ritualSearchSuggestions.length > 0 && (
                      <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'white', border:'1px solid var(--border)', borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,0.14)', zIndex:50, maxHeight:220, overflowY:'auto' }}>
                        {ritualSearchSuggestions.map(m => (
                          <div key={m._id} onMouseDown={e=>e.preventDefault()} onClick={()=>selectRitualSearchSuggestion(m.name)}
                            style={{ padding:'9px 14px', fontSize:13, fontWeight:600, color:'var(--text-primary)', cursor:'pointer', borderBottom:'1px solid var(--neutral-100)', display:'flex', justifyContent:'space-between', gap:8 }}>
                            <span>{m.name}</span>
                            {m.phone && <span style={{ fontSize:11, fontWeight:500, color:'var(--text-muted)' }}>{m.phone}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Row 3b: Status filter */}
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontWeight:700, color:'var(--maroon)', fontSize:13 }}>Status:</span>
                    <CustomSelect value={ritualStatusFilter} onChange={setRitualStatusFilter} options={[{ value:'all', label:'All' }, { value:'paid', label:'Paid' }, { value:'unpaid', label:'Unpaid' }]} minWidth={100} />
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
                    <CustomSelect value={ritualYear} onChange={v => setRitualYear(v === 'all' ? 'all' : +v)} options={[{ value:'all', label:'All Years' }, ...YEARS.map(y => ({ value: y, label: String(y) }))]} minWidth={100} />
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
                    <div style={{ position:'relative', display:'flex', alignItems:'center', flex:'1 1 280px', maxWidth:420 }}>
                      <MagnifyingGlass size={14} color="var(--text-muted)" style={{ position:'absolute', left:10, pointerEvents:'none' }} />
                      <input placeholder="Search name or receipt..." value={ritualSearch}
                        onChange={e=>{ setRitualSearch(e.target.value); setShowRitualSearchSuggestions(true) }}
                        onFocus={()=>setShowRitualSearchSuggestions(true)}
                        onBlur={()=>setTimeout(()=>setShowRitualSearchSuggestions(false), 150)}
                        style={{ ...themeInput(), width:'100%', paddingLeft:30 }} />
                      {showRitualSearchSuggestions && ritualSearchSuggestions.length > 0 && (
                        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'white', border:'1px solid var(--border)', borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,0.14)', zIndex:50, maxHeight:220, overflowY:'auto' }}>
                          {ritualSearchSuggestions.map(m => (
                            <div key={m._id} onMouseDown={e=>e.preventDefault()} onClick={()=>selectRitualSearchSuggestion(m.name)}
                              style={{ padding:'9px 14px', fontSize:13, fontWeight:600, color:'var(--text-primary)', cursor:'pointer', borderBottom:'1px solid var(--neutral-100)', display:'flex', justifyContent:'space-between', gap:8, whiteSpace:'nowrap' }}>
                              <span>{m.name}</span>
                              {m.phone && <span style={{ fontSize:11, fontWeight:500, color:'var(--text-muted)' }}>{m.phone}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontWeight:700, color:'var(--maroon)', fontSize:13 }}>Status:</span>
                      <CustomSelect value={ritualStatusFilter} onChange={setRitualStatusFilter} options={[{ value:'all', label:'All' }, { value:'paid', label:'Paid' }, { value:'unpaid', label:'Unpaid' }]} minWidth={110} />
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
                (!ritualSearch || (m.name && m.name.toLowerCase().includes(ritualSearch.toLowerCase())) ||
                (m.receiptNumber && m.receiptNumber.toLowerCase().includes(ritualSearch.toLowerCase()))) &&
                (ritualStatusFilter === 'all' || (ritualStatusFilter === 'paid' ? m.status === 'completed' : m.status !== 'completed'))
              )
              return isMobile ? (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {filteredMembers.map((m,i)=>(
                    <motion.div key={m.userId||i}
                      initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                      transition={{ delay:i*0.05 }}
                      style={{ background:'white', borderRadius:16, overflow:'hidden',
                        border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)' }}>

                      {/* Header row — name + status */}
                      <div style={{ padding:'12px 14px 10px', display:'flex', alignItems:'center', justifyContent:'space-between',
                        borderBottom:'1px solid var(--border)' }}>
                        <div>
                          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:1 }}>
                            <span style={{ fontSize:18, fontWeight:800, color:'var(--maroon)' }}>{m.name}</span>
                            {ritualYear === 'all' && <span style={{ fontSize:10, fontWeight:700, color:'var(--text-secondary)', background:'var(--neutral-100)', border:'1px solid var(--border)', borderRadius:6, padding:'1px 6px' }}>{m.year}</span>}
                          </div>
                          {m.phone && <div style={{ fontSize:11, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4 }}>
                            <span>📞</span>{m.phone}
                          </div>}
                        </div>
                        <span style={{
                          padding:'4px 12px', borderRadius:99, fontSize:20, fontWeight:800, flexShrink:0, textTransform:'uppercase', letterSpacing:'0.3px',
                          background: statusStyle(m.displayStatus).bg, color: statusStyle(m.displayStatus).color,
                          border: `1px solid ${statusStyle(m.displayStatus).border}`,
                        }}>
                          {m.displayStatus==='completed'?'Paid':m.displayStatus==='pending'?'Pending':'Not Paid'}
                        </span>
                      </div>

                      {/* Body — amount, date, mode, receipt */}
                      <div style={{ padding:'10px 14px 12px' }}>
                        {/* Amount row */}
                        <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:6 }}>
                          <span style={{ fontSize:20, fontWeight:900, color: m.displayStatus!=='completed' ? 'var(--error-text)' : 'var(--maroon)' }}>
                            ₹{(m.amount||annualFee).toLocaleString()}
                          </span>
                          {m.paymentDate && (
                            <span style={{ fontSize:12, color:'var(--text-secondary)', fontWeight:500 }}>
                              {new Date(m.paymentDate).toLocaleDateString('en-IN')}
                            </span>
                          )}
                          {m.paymentMode && (
                            <span style={{ padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:700,
                              background: m.paymentMode==='online' ? 'var(--info-subtle)' : 'var(--neutral-100)',
                              color: m.paymentMode==='online' ? 'var(--info-text)' : 'var(--text-secondary)' }}>
                              {m.paymentMode==='online' ? 'Online' : 'Cash'}
                            </span>
                          )}
                        </div>

                        {/* Receipt number — with icon label */}
                        {m.displayStatus==='completed' && m.receiptNumber ? (
                          <div style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:8,
                            background:'var(--neutral-100)', border:'1px solid var(--border)', marginBottom:12 }}>
                            <Receipt size={12} weight="duotone" color="var(--text-muted)" />
                            <span style={{ fontSize:11, fontWeight:600, color:'var(--text-secondary)' }}>
                              {m.receiptNumber}
                            </span>
                          </div>
                        ) : <div style={{ marginBottom:12 }} />}

                        {/* Actions */}
                        <div style={{ display:'flex', gap:8 }}>
                          <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.95}}
                            onClick={()=>openRitualEntryModal(m)}
                            style={{ flex:1, padding:'8px 12px', borderRadius:10, border:'none', cursor:'pointer',
                              fontSize:12, fontWeight:700, color:'white', fontFamily:'inherit',
                              background: m.displayStatus==='not_paid'
                                ? 'linear-gradient(135deg,var(--success),#166534)'
                                : 'linear-gradient(135deg,var(--primary),var(--maroon))',
                              display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                            {m.displayStatus==='not_paid'
                              ? <><CurrencyCircleDollar size={13} /> Record Payment</>
                              : <><PencilSimple size={13} /> Edit</>}
                          </motion.button>
                          {m.receiptReady && (
                            <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.95}}
                              onClick={()=>downloadRitualReceipt(m)}
                              style={{ padding:'8px 12px', borderRadius:10,
                                border:'1.5px solid var(--info)', cursor:'pointer', background:'var(--info-subtle)',
                                fontSize:12, fontWeight:700, color:'var(--info-text)', fontFamily:'inherit',
                                display:'flex', alignItems:'center', gap:5 }}>
                              <DownloadSimple size={13} /> Receipt
                            </motion.button>
                          )}
                          {m.entryId && (
                            <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.95}}
                              onClick={()=>setDeleteConfirm(m.entryId)}
                              style={{ ...adminBtn('linear-gradient(135deg,var(--error),#991b1b)'), padding:'8px 10px', fontSize:12 }}>
                              <Trash size={13} weight="duotone" />
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div style={{ ...cardStyleSolid, padding:0, overflow:'hidden' }}>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:18 }}>
                      <thead>
                        <tr style={{ background:'linear-gradient(135deg,#1a0000,#5a0e0e)', color:'white' }}>
                          {(ritualYear === 'all' ? ['#','Year','Name','Phone','Amount','Status','Payment Date','Mode','Receipt No.','Actions'] : ['#','Name','Phone','Amount','Status','Payment Date','Mode','Receipt No.','Actions']).map(h=>(
                            <th key={h} style={{ padding:'12px 10px', textAlign:'left', fontWeight:700, fontSize:12 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMembers.map((m,i)=>(
                          <tr key={m.userId||i} style={{ borderBottom:'1px solid var(--border)', background: i%2===0 ? 'white' : 'var(--neutral-50)' }}>
                            <td style={{ padding:'10px', color:'var(--text-muted)' }}>{i+1}</td>
                            {ritualYear === 'all' && <td style={{ padding:'10px', color:'var(--text-muted)' }}>{m.year}</td>}
                            <td style={{ padding:'10px', fontWeight:600, color:'var(--maroon)' }}>{m.name}</td>
                            <td style={{ padding:'10px' }}>{m.phone || '—'}</td>
                            <td style={{ padding:'10px', fontWeight:700, color: m.displayStatus!=='completed' ? 'var(--error-text)' : 'inherit' }}>₹{(m.amount||annualFee).toLocaleString()}</td>
                            <td style={{ padding:'10px' }}>
                              <span style={{ padding:'4px 12px', borderRadius:99, fontSize:20, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.3px',
                                background: statusStyle(m.displayStatus).bg, color: statusStyle(m.displayStatus).color }}>
                                {m.displayStatus==='completed'?'Paid':m.displayStatus==='pending'?'Pending':'Not Paid'}
                              </span>
                            </td>
                            <td style={{ padding:'10px' }}>{m.paymentDate ? new Date(m.paymentDate).toLocaleDateString('en-IN') : '—'}</td>
                            <td style={{ padding:'10px' }}>{m.paymentMode || '—'}</td>
                            <td style={{ padding:'10px', fontFamily:'monospace', fontSize:12 }}>{m.displayStatus==='completed' ? (m.receiptNumber || '—') : 'N/A'}</td>
                            <td style={{ padding:'10px', whiteSpace:'nowrap' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                                  onClick={()=>openRitualEntryModal(m)}
                                  style={{ ...adminBtn(m.displayStatus==='not_paid' ? 'linear-gradient(135deg,var(--success),#166534)' : 'linear-gradient(135deg,var(--primary),var(--maroon))'), padding:'6px 12px', fontSize:11 }}>
                                  {m.displayStatus==='not_paid' ? <><CurrencyCircleDollar size={12} /> Record</> : <><PencilSimple size={12} /> Edit</>}
                                </motion.button>
                                {m.receiptReady && (
                                  <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                                    onClick={()=>downloadRitualReceipt(m)}
                                    style={{ ...adminBtn('linear-gradient(135deg,var(--info),#1e40af)'), padding:'6px 12px', fontSize:11 }}>
                                    <DownloadSimple size={12} /> Receipt
                                  </motion.button>
                                )}
                                {m.entryId && (
                                  <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                                    onClick={()=>setDeleteConfirm(m.entryId)} title="Delete"
                                    style={{ ...adminBtn('linear-gradient(135deg,var(--error),#991b1b)'), padding:'6px 10px', fontSize:11 }}>
                                    <Trash size={12} weight="duotone" />
                                  </motion.button>
                                )}
                              </div>
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
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>This will export the list of annual rituals for {ritualYear === 'all' ? 'all years' : ritualYear}. Any current search/status filters will be applied.</p>
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
                    {exporting ? <><ButtonSpinner /> <span>Generating…</span></> : 'Generate'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Member Picker Modal */}
        <AnimatePresence>
          {showMemberPicker && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              style={modalOverlay} onClick={()=>setShowMemberPicker(false)}>
              <motion.div initial={{y:40,opacity:0}} animate={{y:0,opacity:1}} exit={{y:40,opacity:0}}
                transition={{ type:'spring', stiffness:340, damping:30 }}
                onClick={e=>e.stopPropagation()}
                style={{ ...modalContent, maxWidth:480, maxHeight:'80vh', display:'flex', flexDirection:'column', padding:0, overflow:'hidden' }}>
                <div style={{ padding:'20px 20px 12px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                    <h3 style={{ fontSize:18, fontWeight:800, color:'var(--maroon)' }}>Select Member</h3>
                    <motion.button whileTap={{scale:0.9}} onClick={()=>setShowMemberPicker(false)}
                      style={{ background:'var(--neutral-100)', border:'none', borderRadius:8, width:28, height:28, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <X size={14} />
                    </motion.button>
                  </div>
                  <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
                    <MagnifyingGlass size={15} color="var(--text-muted)" style={{ position:'absolute', left:12, pointerEvents:'none' }} />
                    <input autoFocus type="text" placeholder="Search member name..."
                      value={memberPickerSearch} onChange={e=>setMemberPickerSearch(e.target.value)}
                      style={{ ...themeInput(), paddingLeft:34 }} />
                  </div>
                </div>
                <div style={{ flex:1, overflowY:'auto', padding:'8px 10px' }}>
                  {pickerList
                    .filter(m => m.name?.toLowerCase().includes(memberPickerSearch.trim().toLowerCase()))
                    .sort((a,b) => (a.isRegistered === b.isRegistered) ? a.name.localeCompare(b.name) : (a.isRegistered ? -1 : 1))
                    .map(m => (
                      <motion.div key={m._id} whileHover={{ background:'var(--primary-subtle)' }} whileTap={{scale:0.98}}
                        onClick={()=>selectMemberForEntry(m)}
                        style={{ display:'flex', alignItems:'center', gap:10, padding:'10px', borderRadius:10, cursor:'pointer' }}>
                        <div style={{ width:32, height:32, borderRadius:'50%', flexShrink:0, background:'linear-gradient(135deg, var(--primary), var(--maroon))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'white' }}>
                          {m.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <div style={{ fontSize:13.5, fontWeight:700, color:'var(--maroon)' }}>{m.name}</div>
                            {m.isRegistered && (
                              <span style={{ fontSize:9, fontWeight:800, textTransform:'uppercase', letterSpacing:0.3, padding:'2px 6px', borderRadius:99, background:'var(--success-subtle)', color:'var(--success-text)' }}>
                                Registered
                              </span>
                            )}
                          </div>
                          {m.phone && <div style={{ fontSize:11, color:'var(--text-muted)' }}>{m.phone}</div>}
                        </div>
                      </motion.div>
                    ))}
                  {pickerList.filter(m => m.name?.toLowerCase().includes(memberPickerSearch.trim().toLowerCase())).length === 0 && (
                    <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--text-muted)', fontSize:13 }}>
                      {pickerList.length === 0 ? 'No members added yet.' : 'No matching members.'}
                    </div>
                  )}
                </div>
                <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
                  <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.97}} onClick={skipMemberPicker}
                    style={{ width:'100%', padding:'11px', borderRadius:10, border:'1.5px dashed var(--border)', background:'transparent', cursor:'pointer', fontSize:13, fontWeight:700, color:'var(--text-secondary)', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                    <Plus size={14} weight="bold" /> Enter manually (not a member)
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
                <datalist id="cashbookMemberOptions">
                  {pickerList.map(m => <option key={m._id} value={m.name} />)}
                </datalist>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {[
                    { label:'Name *', key:'name', type:'text', full:false, list:'cashbookMemberOptions' },
                    { label:'Phone', key:'phone', type:'text', full:false },
                    { label:'Category *', key:'category', type:'text', full:true, list:'cashbookCategoryOptions' },
                    { label:'Receipt No.', key:'receiptNumber', type:'text', full:false, lockWhenPending:true },
                    { label:'Entry Date (Year)', key:'entryDate', type:'year', full:false },
                    { label:'Payment Date', key:'paymentDate', type:'date', full:false, lockWhenPending:true },
                    { label:'Amount (₹) *', key:'amount', type:'number', full:false },
                  ].map(f=>{
                    const locked = f.lockWhenPending && isPending
                    return (
                    <div key={f.key} style={{ gridColumn: f.full ? '1/-1' : 'auto' }}>
                      <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text-muted)', marginBottom:4, textTransform:'uppercase' }}>{f.label}</label>
                      {f.type === 'year' ? (
                        <select value={formData[f.key]||''} onChange={e=>setFormData({...formData,[f.key]:e.target.value})} style={themeInput()}>
                          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      ) : (
                        <input type={f.type} list={f.list} value={locked ? '' : (formData[f.key]||'')}
                          placeholder={locked ? 'N/A' : undefined}
                          disabled={locked}
                          onChange={e=>{
                            const val = e.target.value
                            if (f.key === 'name') {
                              const match = pickerList.find(mm => mm.name === val)
                              setFormData(prev => ({ ...prev, name: val, phone: match?.phone ? match.phone : prev.phone, userId: match?.userId || null }))
                            } else if (f.key === 'category') {
                              setFormData(prev => ({
                                ...prev, category: val,
                                amount: (/annual\s*ritual/i.test(val) && !prev.amount) ? annualFee : prev.amount
                              }))
                            } else {
                              setFormData({...formData,[f.key]:val})
                            }
                          }}
                          style={{ ...themeInput(), ...(locked ? { background:'var(--neutral-100)', color:'var(--text-muted)', cursor:'not-allowed' } : {}) }} />
                      )}
                    </div>
                  )})}
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text-muted)', marginBottom:4, textTransform:'uppercase' }}>Type *</label>
                    <select value={formData.type} onChange={e=>setFormData({...formData,type:e.target.value})} style={themeInput()}>
                      <option value="credit">Credit (Income)</option>
                      <option value="debit">Debit (Expense)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text-muted)', marginBottom:4, textTransform:'uppercase' }}>Payment Mode *</label>
                    <select value={formData.paymentMode} disabled={isPending} onChange={e=>setFormData({...formData,paymentMode:e.target.value})}
                      style={{ ...themeInput(), ...(isPending ? { background:'var(--neutral-100)', color:'var(--text-muted)', cursor:'not-allowed' } : {}) }}>
                      <option value="cash">Cash</option>
                      <option value="online">Online</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text-muted)', marginBottom:4, textTransform:'uppercase' }}>Status</label>
                    <select value={formData.status} onChange={e=>handleStatusChange(e.target.value)} style={themeInput()}>
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
                    style={{ flex:1, padding:13, borderRadius:12, border:'none', cursor:'pointer', fontSize:14, fontWeight:700, color:'white', background: saving?'var(--neutral-300)':'linear-gradient(135deg,var(--primary),var(--maroon))', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    {saving ? <><ButtonSpinner /> <span>Saving…</span></> : editEntry ? 'Update' : 'Create'}
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
                    {feeSaving ? <><ButtonSpinner /> <span>Saving…</span></> : <><CheckCircle size={16} /> Update Fee</>}
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
                    {receiptNoSaving ? <><ButtonSpinner /> <span>Saving…</span></> : <><CheckCircle size={16} /> Update</>}
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
                  <button onClick={()=>!deletingId&&setDeleteConfirm(null)} disabled={!!deletingId}
                    style={{ flex:1, padding:12, borderRadius:12, border:'2px solid var(--border)', cursor: deletingId ? 'not-allowed' : 'pointer', fontSize:14, fontWeight:700, color:'var(--text-secondary)', background:'white', opacity: deletingId ? 0.5 : 1 }}>Cancel</button>
                  <button onClick={()=>handleDelete(deleteConfirm)} disabled={!!deletingId}
                    style={{ flex:1, padding:12, borderRadius:12, border:'none', cursor: deletingId ? 'not-allowed' : 'pointer', fontSize:14, fontWeight:700, color:'white', background: deletingId ? 'var(--neutral-300)' : 'var(--error)',
                      display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    {deletingId ? <><ButtonSpinner /> <span>Deleting…</span></> : 'Delete'}
                  </button>
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
              <ReceiptHeader />
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
                  { label: 'Year', value: downloadingReceipt.year || ritualYear },
                  { label: 'Payment Mode', value: downloadingReceipt.paymentMode === 'online' ? 'Online (Razorpay)' : 'Cash' },
                  { label: 'Category', value: 'Annual Ritual (Pooja Shulk)' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f5ede0' }}>
                    <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', maxWidth: '60%', textAlign: 'right' }}>{row.value}</span>
                  </div>
                ))}
                <div style={{ marginTop: 20, padding: '16px 20px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(22,163,74,0.08), rgba(22,163,74,0.04))', border: '1.5px solid rgba(22,163,74,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#16a34a', lineHeight: 1 }}>Amount Paid</span>
                  <span style={{ fontSize: 24, fontWeight: 900, color: '#16a34a', lineHeight: 1 }}>₹{(downloadingReceipt.amount||annualFee).toLocaleString()}</span>
                </div>
                <div style={{ textAlign: 'center', marginTop: 24, padding: '12px' }}>
                  <div style={{ fontSize: 20, marginBottom: 8 }}>🙏</div>
                  <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 4 }}>Thank you for your annual contribution to</p>
                  <p style={{ fontFamily: "'Cinzel', 'Segoe UI', serif", fontWeight: 700, fontSize: 15, color: '#8B1A1A', lineHeight: 1.4 }}>{SANSTHAN_NAME}</p>
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
