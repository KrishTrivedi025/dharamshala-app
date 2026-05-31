import sys
import re

with open('frontend/src/pages/admin/Cashbook.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the PDF, DOC, PRINT functions logic
export_logic = '''  const openExportModal = (type, target) => {
    setExportModal(type)
    setExportTarget(target)
    setExportRange({ from: '', to: '' })
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      
      let dataToExport = []
      let exportSummary = { ...summary }
      let titleSuffix = ''

      if (exportTarget === 'ledger') {
        if (exportRange.from || exportRange.to) {
          const res = await cashbookAPI.getEntries({ fromDate: exportRange.from, toDate: exportRange.to, limit: 10000 })
          let bal = 0
          dataToExport = (res.data || []).map(e => {
            if (e.status === 'completed') bal += e.type === 'credit' ? e.amount : -e.amount
            return { ...e, runningBalance: bal }
          })
          titleSuffix = ${exportRange.from} to 
        } else {
          dataToExport = entriesWithBalance
          titleSuffix = ${MONTHS[month] || 'All Months'} 
        }
      } else {
        // Annual Rituals export
        const filteredMembers = ritualData ? ritualData.members.filter(m => 
          !ritualSearch || (m.name && m.name.toLowerCase().includes(ritualSearch.toLowerCase())) || 
          (m.receiptNumber && m.receiptNumber.toLowerCase().includes(ritualSearch.toLowerCase()))
        ) : []
        dataToExport = filteredMembers
        titleSuffix = Annual Rituals 
      }

      if (exportType === 'pdf') {
        const doc = new jsPDF('l', 'mm', 'a4')
        doc.setFontSize(18)
        doc.text('Shri Dharamshala Trust', 14, 18)
        doc.setFontSize(11)
        doc.text(exportTarget === 'ledger' ? Cashbook -  : Annual Rituals - , 14, 26)
        
        let rows = []
        let head = []
        
        if (exportTarget === 'ledger') {
          head = [['Date','Name','Category','Payment Date','Receipt No.','Mode','Type','Amount','Status','Balance']]
          rows = dataToExport.map(e => [
            new Date(e.entryDate).toLocaleDateString('en-IN'),
            e.name,
            e.category,
            e.paymentDate ? new Date(e.paymentDate).toLocaleDateString('en-IN') : '-',
            e.receiptNumber,
            e.paymentMode,
            e.type === 'credit' ? 'Credit' : 'Debit',
            Rs.,
            e.status,
            Rs.
          ])
        } else {
          head = [['Name','Phone','Amount','Status','Payment Date','Mode','Receipt No.']]
          rows = dataToExport.map(m => [
            m.name,
            m.phone || '-',
            Rs.,
            m.status,
            m.paymentDate ? new Date(m.paymentDate).toLocaleDateString('en-IN') : '-',
            m.paymentMode || '-',
            m.receiptNumber || '-'
          ])
        }

        autoTable(doc, {
          startY: 36, head, body: rows,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [139, 26, 26] },
        })
        doc.save(${exportTarget}_.pdf)

      } else if (exportType === 'doc') {
        let html = <html><head><meta charset="utf-8"><style>table{border-collapse:collapse;width:100%}th,td{border:1px solid #999;padding:4px 6px;font-size:11px}th{background:#8B1A1A;color:white}</style></head><body>
        html += <h2>Shri Dharamshala Trust</h2><p> - </p>
        
        if (exportTarget === 'ledger') {
          html += <table><tr><th>Date</th><th>Name</th><th>Category</th><th>Payment Date</th><th>Receipt No.</th><th>Mode</th><th>Type</th><th>Amount</th><th>Status</th><th>Balance</th></tr>
          dataToExport.forEach(e => {
            html += <tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td>Rs.</td><td></td><td>Rs.</td></tr>
          })
        } else {
          html += <table><tr><th>Name</th><th>Phone</th><th>Amount</th><th>Status</th><th>Payment Date</th><th>Mode</th><th>Receipt No.</th></tr>
          dataToExport.forEach(m => {
             html += <tr><td></td><td></td><td>Rs.</td><td></td><td></td><td></td><td></td></tr>
          })
        }
        
        html += </table></body></html>
        const blob = new Blob([html], { type: 'application/msword' })
        saveAs(blob, ${exportTarget}_.doc)

      } else if (exportType === 'print') {
        const win = window.open('', '_blank')
        let contentHtml = ''
        
        if (exportTarget === 'ledger') {
          let rowsHtml = dataToExport.map(e => <tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td>Rs.</td><td></td><td>Rs.</td></tr>).join('')
          contentHtml = <table><tr><th>Date</th><th>Name</th><th>Category</th><th>Payment Date</th><th>Receipt No.</th><th>Mode</th><th>Type</th><th>Amount</th><th>Status</th><th>Balance</th></tr></table>
        } else {
          let rowsHtml = dataToExport.map(m => <tr><td></td><td></td><td>Rs.</td><td></td><td></td><td></td><td></td></tr>).join('')
           contentHtml = <table><tr><th>Name</th><th>Phone</th><th>Amount</th><th>Status</th><th>Payment Date</th><th>Mode</th><th>Receipt No.</th></tr></table>
        }

        win.document.write(<html><head><title></title><style>
          body{font-family:Arial,sans-serif;padding:20px}
          table{width:100%;border-collapse:collapse;font-size:11px}
          th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}
          th{background:#8B1A1A;color:white}
          h2{color:#8B1A1A} .summary{margin-bottom:10px;font-size:13px}
        </style></head><body>
          <h2>Shri Dharamshala Trust — </h2>
          <div class="summary"></div>
          
        </body></html>)
        win.document.close()
        win.print()
      }

      setExportModal(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setExporting(false)
    }
  }'''

# Replace from // PDF Download up to // DOC Download and the closing brace of downloadDOC
pattern = r'// PDF Download.*?const downloadDOC = \(\) => \{.*?saveAs.*?\}'
text = re.sub(pattern, export_logic, text, flags=re.DOTALL)

with open('frontend/src/pages/admin/Cashbook.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("Finished Step 2")
