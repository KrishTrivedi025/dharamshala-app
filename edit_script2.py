import sys
import re

with open('frontend/src/pages/admin/Cashbook.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace ledger download buttons
ledger_btns = '''                  <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                    onClick={() => openExportModal('pdf', 'ledger')} style={{ ...btnPrimary, background:'#16a34a' }}>📥 PDF</motion.button>
                  <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                    onClick={() => openExportModal('doc', 'ledger')} style={{ ...btnPrimary, background:'#2563eb' }}>📥 DOC</motion.button>
                  <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                    onClick={() => openExportModal('print', 'ledger')} style={{ ...btnPrimary, background:'#7c3aed' }}>🖨️ Print</motion.button>'''
text = re.sub(r'<motion\.button whileHover={{scale:1\.03}} whileTap={{scale:0\.97}}\s+onClick=\{downloadPDF\}.*?🖨️ Print</motion\.button>', ledger_btns, text, flags=re.DOTALL)

# Add search and buttons in Annual rituals tab
annual_header = '''                {ritualData && (
                  <div style={{ marginLeft:'auto', display:'flex', gap:16, fontSize:13, fontWeight:600 }}>
                    <span style={{ color:'#16a34a' }}>✅ Paid: {ritualData.paid}</span>
                    <span style={{ color:'#d97706' }}>⏳ Pending: {ritualData.pending}</span>
                    <span style={{ color:'#ef4444' }}>❌ Not Paid: {ritualData.notPaid}</span>
                    <span style={{ color:'var(--maroon)' }}>Total: {ritualData.totalMembers}</span>
                  </div>
                )}
                </div>
                
                <div style={{ display:'flex', gap:10, marginTop:16, alignItems:'center', flexWrap:'wrap' }}>
                  <input placeholder="Search name or receipt..." value={ritualSearch}
                  onChange={e=>setRitualSearch(e.target.value)} 
                  style={{ ...inputStyle, width:'auto', minWidth:250 }} />
                  
                  <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
                    <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                      onClick={() => openExportModal('pdf', 'annual')} style={{ ...btnPrimary, background:'#16a34a' }}>📥 PDF</motion.button>
                    <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                      onClick={() => openExportModal('doc', 'annual')} style={{ ...btnPrimary, background:'#2563eb' }}>📥 DOC</motion.button>
                    <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                      onClick={() => openExportModal('print', 'annual')} style={{ ...btnPrimary, background:'#7c3aed' }}>🖨️ Print</motion.button>
                  </div>'''
text = re.sub(r'\{ritualData && \(\s+<div style={{ marginLeft:\'auto\'.*?Total: \{ritualData\.totalMembers\}</span>\s+</div>\s+\)\}', annual_header, text, flags=re.DOTALL)

# Add Export Modal
export_modal = '''        {/* Export Modal */}
        <AnimatePresence>
          {exportModal && (
             <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.5)',
                backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
              onClick={()=>!exporting&&setExportModal(null)}>
              <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}}
                onClick={e=>e.stopPropagation()}
                style={{ borderRadius:24, padding:32, background:'white', maxWidth:420, width:'100%', boxShadow:'0 40px 100px rgba(0,0,0,0.3)' }}>
                <h3 style={{ fontSize:20, fontWeight:800, color:'var(--maroon)', marginBottom:20 }}>
                  Export {exportModal.toUpperCase()} - {exportTarget === 'ledger' ? 'Cashbook' : 'Annual Rituals'}
                </h3>
                {exportTarget === 'ledger' && (
                  <div style={{ marginBottom: 20 }}>
                     <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>Select a date range. Leave empty to export the currently loaded data.</p>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#9ca3af', marginBottom:4, textTransform:'uppercase' }}>From Date</label>
                          <input type="date" value={exportRange.from} onChange={e=>setExportRange({...exportRange, from: e.target.value})} style={inputStyle} />
                        </div>
                        <div>
                          <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#9ca3af', marginBottom:4, textTransform:'uppercase' }}>To Date</label>
                          <input type="date" value={exportRange.to} onChange={e=>setExportRange({...exportRange, to: e.target.value})} style={inputStyle} />
                        </div>
                     </div>
                  </div>
                )}
                {exportTarget === 'annual' && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 13, color: '#6b7280' }}>This will export the list of annual rituals for {ritualYear}. Any current search filters will be applied.</p>
                  </div>
                )}
                <div style={{ display:'flex', gap:12 }}>
                  <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}} disabled={exporting}
                    onClick={()=>setExportModal(null)}
                    style={{ flex:1, padding:13, borderRadius:12, border:'2px solid #ede8e0', cursor:'pointer', fontSize:14, fontWeight:700, color:'#6b7280', background:'white' }}>
                    Cancel
                  </motion.button>
                  <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}} disabled={exporting}
                    onClick={handleExport}
                    style={{ flex:1, padding:13, borderRadius:12, border:'none', cursor:'pointer', fontSize:14, fontWeight:700, color:'white', background: exporting?'#ccc':'linear-gradient(135deg,#FF6B35,#8B1A1A)' }}>
                    {exporting ? 'Generating...' : 'Generate'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit/Add Modal */}'''
text = re.sub(r'\{/\* Add/Edit Modal \*/\}', export_modal, text)

# Filter ritualData map in view
text = re.sub(r'\{ritualData\.members\.map\(\(m,i\)=>', r'''{(ritualData.members.filter(m => !ritualSearch || (m.name && m.name.toLowerCase().includes(ritualSearch.toLowerCase())) || (m.receiptNumber && m.receiptNumber.toLowerCase().includes(ritualSearch.toLowerCase())))).map((m,i)=>''', text)

with open('frontend/src/pages/admin/Cashbook.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("Finished Step 3")
