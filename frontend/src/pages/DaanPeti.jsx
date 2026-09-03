import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { daanPetiAPI } from '../utils/api'
import html2canvas from 'html2canvas'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { ReceiptHeader, SANSTHAN_NAME } from '../components/ReceiptHeader'
import {
  WarningCircle, X, CheckCircle, DownloadSimple,
  LockSimple, Receipt, User, Heart,
} from '@phosphor-icons/react'
import { cardStyleSolid, inputStyle as themeInput } from '../styles/theme'
import { useIsMobile } from './admin/AdminDashboard'

const PRESET_AMOUNTS = [101, 251, 501, 1001, 2100, 5001]

const DHARAMSHALA_INFO = {
  name: SANSTHAN_NAME,
  address: 'Mahalakshmi Temple, Brahmpuri, Sanderao - 306708, Tehsil Sumerpur, District Pali (Raj.)',
  phone: '+91 97699 22866',
  email: 'info@dharamshala.org',
}

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: 'var(--text-muted)', marginBottom: 6,
  textTransform: 'uppercase', letterSpacing: '0.5px',
}

function DaanPeti() {
  const isMobile = useIsMobile()
  const { user } = useAuth()

  const [form, setForm] = useState({
    donorName: user?.name || '',
    donorPhone: user?.phone || '',
    donorEmail: user?.email || '',
    purpose: '',
    amount: '',
    customAmount: '',
  })
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [step, setStep] = useState('form')
  const [receipt, setReceipt] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const receiptRef = useRef(null)

  const finalAmount = selectedPreset
    ? selectedPreset
    : form.customAmount
      ? parseFloat(form.customAmount)
      : parseFloat(form.amount) || 0

  const handlePreset = (amt) => {
    setSelectedPreset(amt)
    setForm(f => ({ ...f, customAmount: '', amount: amt }))
  }

  const handleCustomAmount = (val) => {
    setSelectedPreset(null)
    setForm(f => ({ ...f, customAmount: val, amount: val }))
  }

  const validateForm = () => {
    if (!form.donorName.trim()) return 'Please enter your name'
    if (!form.donorPhone.trim() || form.donorPhone.trim().length < 10) return 'Please enter a valid 10-digit phone number'
    if (!form.purpose.trim()) return 'Please enter the purpose of donation'
    if (!finalAmount || finalAmount < 1) return 'Please select or enter a donation amount'
    return null
  }

  const handleDonate = async () => {
    const validationError = validateForm()
    if (validationError) { setError(validationError); return }
    setError(null)
    setLoading(true)
    try {
      const orderRes = await daanPetiAPI.createOrder({
        donorName: form.donorName.trim(),
        donorPhone: form.donorPhone.trim(),
        donorEmail: form.donorEmail.trim(),
        purpose: form.purpose.trim(),
        amount: finalAmount,
      })
      const { orderId, amount, currency, donationId: dId, receiptNumber, keyId } = orderRes.data
      const options = {
        key: keyId, amount, currency,
        name: DHARAMSHALA_INFO.name,
        description: form.purpose.trim(),
        order_id: orderId,
        prefill: {
          name: form.donorName.trim(),
          email: form.donorEmail.trim(),
          contact: form.donorPhone.trim(),
        },
        theme: { color: '#8B1A1A' },
        handler: async (response) => {
          setStep('processing')
          try {
            await daanPetiAPI.verifyPayment({
              donationId: dId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            setReceipt({
              receiptNumber,
              donorName: form.donorName.trim(),
              donorPhone: form.donorPhone.trim(),
              donorEmail: form.donorEmail.trim(),
              purpose: form.purpose.trim(),
              amount: finalAmount,
              paymentMode: 'Online',
              paymentId: response.razorpay_payment_id,
              date: new Date(),
            })
            setStep('success')
          } catch {
            setError('Payment verification failed. Please contact admin.')
            setStep('form')
          }
        },
        modal: { ondismiss: () => { setLoading(false); setStep('form') } }
      }
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://checkout.razorpay.com/v1/checkout.js'
          script.onload = resolve
          script.onerror = reject
          document.body.appendChild(script)
        })
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      setError(err.message || 'Failed to initiate payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const downloadReceipt = async () => {
    if (!receiptRef.current) return
    try {
      await document.fonts.ready
      const canvas = await html2canvas(receiptRef.current, { scale: 2, backgroundColor: '#fff', logging: false })
      const link = document.createElement('a')
      link.download = `Daan-Receipt-${receipt.receiptNumber}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Download error:', err)
    }
  }

  const resetForm = () => {
    setStep('form'); setReceipt(null); setSelectedPreset(null)
    setForm({ donorName: user?.name || '', donorPhone: user?.phone || '', donorEmail: user?.email || '', purpose: '', amount: '', customAmount: '' })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div style={{ flex: 1, paddingBottom: 60 }}>
        {/* Hero Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1a0000 0%, #5a0e0e 50%, #8B1A1A 100%)',
          padding: '60px 24px 48px', textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute', borderRadius: '50%',
              border: '1px solid rgba(247,201,72,0.15)',
              width: 200 + i * 120, height: 200 + i * 120,
              top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)', pointerEvents: 'none',
            }} />
          ))}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 64, marginBottom: 12 }}>🪔</div>
            <h1 style={{ fontSize: 36, fontWeight: 900, color: '#F7C948', marginBottom: 8, letterSpacing: '-0.5px' }}>
              Daan Peti
            </h1>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', maxWidth: 480, margin: '0 auto' }}>
              Contribute to Shri Dharamshala Trust with love and devotion. Every donation is blessed. 🙏
            </p>
          </motion.div>
        </div>

        <div style={{ maxWidth: 620, margin: '0 auto', padding: '40px 20px 80px', position: 'relative', zIndex: 2 }}>
          <AnimatePresence mode="wait">

            {/* FORM STEP */}
            {step === 'form' && (
              <motion.div key="form"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                style={{ ...cardStyleSolid, padding: isMobile ? '20px 16px' : '36px', boxShadow: 'var(--shadow-xl)' }}>

                <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--maroon)', marginBottom: 24 }}>
                  Make a Donation
                </h2>

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{
                        borderRadius: 12, marginBottom: 16, overflow: 'hidden',
                        border: '1px solid rgba(220,38,38,0.18)',
                        boxShadow: '0 2px 12px rgba(220,38,38,0.08)',
                      }}>
                      <div style={{
                        padding: '11px 16px',
                        background: 'var(--error-subtle)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(220,38,38,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <WarningCircle size={16} weight="duotone" color="var(--error-text)" />
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--error-text)' }}>Payment Failed</div>
                            <div style={{ fontSize: 11, color: 'var(--error-text)', opacity: 0.8, marginTop: 1 }}>{error}</div>
                          </div>
                        </div>
                        <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error-text)', display: 'flex', alignItems: 'center', opacity: 0.7, flexShrink: 0 }}>
                          <X size={15} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Full Name *</label>
                      <input
                        value={form.donorName}
                        onChange={e => setForm(f => ({ ...f, donorName: e.target.value }))}
                        placeholder="Your full name"
                        style={themeInput()}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Phone Number *</label>
                      <input
                        value={form.donorPhone}
                        onChange={e => setForm(f => ({ ...f, donorPhone: e.target.value }))}
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        style={themeInput()}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Email (Optional)</label>
                    <input
                      value={form.donorEmail}
                      onChange={e => setForm(f => ({ ...f, donorEmail: e.target.value }))}
                      placeholder="your@email.com"
                      style={themeInput()}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Purpose / In Name Of *</label>
                    <input
                      value={form.purpose}
                      onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
                      placeholder="e.g. Birthday of Ram ji, In memory of Shyam ji..."
                      style={themeInput()}
                    />
                  </div>

                  {/* Amount Presets */}
                  <div>
                    <label style={labelStyle}>Donation Amount (₹) *</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                      {PRESET_AMOUNTS.map(amt => (
                        <motion.button key={amt}
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => handlePreset(amt)}
                          style={{
                            padding: '9px 18px', borderRadius: 10, cursor: 'pointer',
                            fontSize: 14, fontWeight: 700, border: 'none',
                            background: selectedPreset === amt
                              ? 'linear-gradient(135deg, var(--primary), var(--maroon))'
                              : 'var(--primary-subtle)',
                            color: selectedPreset === amt ? 'white' : 'var(--maroon)',
                            transition: 'all 0.2s',
                          }}>
                          ₹{amt.toLocaleString()}
                        </motion.button>
                      ))}
                    </div>
                    <input
                      type="number"
                      value={form.customAmount}
                      onChange={e => handleCustomAmount(e.target.value)}
                      placeholder="Or enter custom amount..."
                      min={1}
                      style={themeInput()}
                    />
                  </div>

                  {finalAmount > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{
                        padding: '12px 16px', borderRadius: 12,
                        background: 'var(--success-subtle)', border: '1.5px solid rgba(5,150,105,0.2)',
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                      <Heart size={20} weight="fill" color="var(--success-text)" />
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--success-text)' }}>
                        You are donating ₹{finalAmount.toLocaleString()}
                      </span>
                    </motion.div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: 'var(--shadow-xl)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDonate}
                    disabled={loading}
                    style={{
                      width: '100%', padding: '16px', borderRadius: 14, border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: 16, fontWeight: 800, color: 'white',
                      background: loading ? 'var(--neutral-300)' : 'linear-gradient(135deg, var(--primary) 0%, var(--maroon) 100%)',
                      boxShadow: 'var(--shadow-lg)',
                      marginTop: 4,
                    }}>
                    {loading ? 'Processing...' : '🪔 Donate Now via Razorpay'}
                  </motion.button>

                  <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                    <LockSimple size={13} weight="fill" color="var(--text-muted)" />
                    Secure payment powered by Razorpay. Your donation is safe and encrypted.
                  </p>
                </div>
              </motion.div>
            )}

            {/* PROCESSING */}
            {step === 'processing' && (
              <motion.div key="processing"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ ...cardStyleSolid, padding: '60px 36px', textAlign: 'center', boxShadow: 'var(--shadow-xl)' }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{
                    width: 56, height: 56, borderRadius: '50%',
                    border: '4px solid var(--primary-subtle)',
                    borderTop: '4px solid var(--primary)',
                    margin: '0 auto 20px',
                  }}
                />
                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--maroon)' }}>Verifying Payment...</h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>Please wait, do not close this window.</p>
              </motion.div>
            )}

            {/* SUCCESS */}
            {step === 'success' && receipt && (
              <motion.div key="success"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                <div style={{
                  borderRadius: 20, padding: '24px',
                  background: 'var(--success-subtle)',
                  border: '1.5px solid rgba(5,150,105,0.25)',
                  textAlign: 'center',
                }}>
                  <CheckCircle size={48} weight="duotone" color="var(--success)" style={{ marginBottom: 8 }} />
                  <h3 style={{ fontSize: 22, fontWeight: 900, color: 'var(--success-text)', marginBottom: 4 }}>
                    Donation Successful!
                  </h3>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                    Thank you for your generous contribution. 🙏 May God bless you always.
                  </p>
                </div>

                {/* E-Receipt */}
                <div ref={receiptRef} style={{
                  borderRadius: 20, overflow: 'hidden', background: 'white',
                  boxShadow: '0 20px 60px rgba(139,26,26,0.12)',
                  border: '1.5px solid rgba(255,107,53,0.1)',
                }}>
                  <ReceiptHeader
                    badge="DONATION RECEIPT"
                    subtitle={`${DHARAMSHALA_INFO.address} · ${DHARAMSHALA_INFO.phone} | ${DHARAMSHALA_INFO.email}`}
                  />

                  <div style={{ padding: '24px 28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: '1px dashed #f5ede0' }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Receipt No.</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#8B1A1A', fontFamily: 'monospace' }}>{receipt.receiptNumber}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>
                          {new Date(receipt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    {[
                      { label: 'Donor Name', value: receipt.donorName },
                      { label: 'Phone', value: receipt.donorPhone },
                      ...(receipt.donorEmail ? [{ label: 'Email', value: receipt.donorEmail }] : []),
                      { label: 'Purpose', value: receipt.purpose },
                      { label: 'Payment Mode', value: receipt.paymentMode },
                      ...(receipt.paymentId ? [{ label: 'Transaction ID', value: receipt.paymentId }] : []),
                    ].map((row, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f5ede0' }}>
                        <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>{row.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', maxWidth: '60%', textAlign: 'right' }}>{row.value}</span>
                      </div>
                    ))}

                    <div style={{ marginTop: 20, padding: '16px 20px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(22,163,74,0.08), rgba(22,163,74,0.04))', border: '1.5px solid rgba(22,163,74,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: '#16a34a', lineHeight: 1 }}>Amount Donated</span>
                      <span style={{ fontSize: 24, fontWeight: 900, color: '#16a34a', lineHeight: 1 }}>₹{receipt.amount.toLocaleString()}</span>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: 20, padding: '12px' }}>
                      <div style={{ fontSize: 20, marginBottom: 6 }}>🙏</div>
                      <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 4 }}>
                        Thank you for your generous contribution to
                      </p>
                      <p style={{ fontFamily: "'Cinzel', 'Segoe UI', serif", fontWeight: 700, fontSize: 15, color: '#8B1A1A', lineHeight: 1.4, marginBottom: 8 }}>
                        {DHARAMSHALA_INFO.name}
                      </p>
                      <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
                        Your kindness helps us serve the community with devotion.
                      </p>
                      <div style={{ marginTop: 12, fontSize: 11, color: '#d1d5db', fontStyle: 'italic' }}>
                        This is a computer-generated receipt and does not require a signature.
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={downloadReceipt}
                    style={{
                      flex: 1, padding: '14px', borderRadius: 14, border: 'none',
                      cursor: 'pointer', fontSize: 15, fontWeight: 800, color: 'white',
                      background: 'linear-gradient(135deg, var(--primary), var(--maroon))',
                      boxShadow: 'var(--shadow-lg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                    <DownloadSimple size={18} /> Download Receipt
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={resetForm}
                    style={{
                      flex: 1, padding: '14px', borderRadius: 14,
                      border: '2px solid var(--primary-border)',
                      cursor: 'pointer', fontSize: 15, fontWeight: 700, color: 'var(--maroon)',
                      background: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                    🪔 Donate Again
                  </motion.button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Info Cards — premium horizontal row */}
          {step === 'form' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 20 }}>
              {[
                { Icon: LockSimple,    title: 'Secure',    desc: 'Razorpay gateway', bg: 'var(--success-subtle)', color: 'var(--success-text)' },
                { Icon: Receipt,       title: 'Receipt',   desc: 'Instant download', bg: 'var(--info-subtle)', color: 'var(--info-text)' },
                { Icon: User,          title: 'Open',      desc: 'No login needed', bg: 'var(--primary-subtle)', color: 'var(--maroon)' },
              ].map(({ Icon, title, desc, bg, color }, i) => (
                <div key={i} style={{
                  borderRadius: 14, padding: '12px 10px',
                  background: bg, border: `1px solid ${color}20`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center',
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <Icon size={18} weight="duotone" color={color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color }}>{title}</div>
                    <div style={{ fontSize: 10, color, opacity: 0.7, marginTop: 1, lineHeight: 1.3 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default DaanPeti
