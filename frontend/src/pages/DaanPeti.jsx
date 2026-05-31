import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { daanPetiAPI } from '../utils/api'
import html2canvas from 'html2canvas'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
const PRESET_AMOUNTS = [101, 251, 501, 1001, 2100, 5001]

const DHARAMSHALA_INFO = {
  name: 'Shri Dharamshala Trust',
  address: '123, Temple Road, City, State - 000000',
  phone: '+91 98765 43210',
  email: 'info@dharamshala.org',
}

function DaanPeti() {
  const { user, isLoggedIn } = useAuth()

  const [form, setForm] = useState({
    donorName: user?.name || '',
    donorPhone: user?.phone || '',
    donorEmail: user?.email || '',
    purpose: '',
    amount: '',
    customAmount: '',
  })
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [step, setStep] = useState('form') // 'form' | 'processing' | 'success'
  const [receipt, setReceipt] = useState(null)
  const [donationId, setDonationId] = useState(null)
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
      // Create Razorpay order
      const orderRes = await daanPetiAPI.createOrder({
        donorName: form.donorName.trim(),
        donorPhone: form.donorPhone.trim(),
        donorEmail: form.donorEmail.trim(),
        purpose: form.purpose.trim(),
        amount: finalAmount,
      })

      const { orderId, amount, currency, donationId: dId, receiptNumber, keyId } = orderRes.data

      // Open Razorpay checkout
      const options = {
        key: keyId,
        amount,
        currency,
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
            const verifyRes = await daanPetiAPI.verifyPayment({
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
            setDonationId(dId)
            setStep('success')
          } catch (err) {
            setError('Payment verification failed. Please contact admin.')
            setStep('form')
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false)
            setStep('form')
          }
        }
      }

      if (!window.Razorpay) {
        // Load Razorpay script dynamically
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
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#fff',
        logging: false,
      })
      const link = document.createElement('a')
      link.download = `Daan-Receipt-${receipt.receiptNumber}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Download error:', err)
    }
  }

  const resetForm = () => {
    setStep('form')
    setReceipt(null)
    setDonationId(null)
    setSelectedPreset(null)
    setForm({
      donorName: user?.name || '',
      donorPhone: user?.phone || '',
      donorEmail: user?.email || '',
      purpose: '',
      amount: '',
      customAmount: '',
    })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Navbar />

      <div style={{ flex: 1, paddingBottom: 60 }}>
        {/* Hero Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1a0000 0%, #5a0e0e 50%, #8B1A1A 100%)',
          padding: '60px 24px 48px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* decorative circles */}
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            borderRadius: '50%',
            border: '1px solid rgba(247,201,72,0.15)',
            width: 200 + i * 120, height: 200 + i * 120,
            top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            pointerEvents: 'none',
          }} />
        ))}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          style={{ position: 'relative', zIndex: 1 }}
        >
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
              style={{
                borderRadius: 24, padding: '36px',
                background: 'rgba(255,255,255,0.98)',
                backdropFilter: 'blur(20px)',
                border: '1.5px solid rgba(255,107,53,0.1)',
                boxShadow: '0 20px 60px rgba(139,26,26,0.12)',
              }}>

              <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--maroon)', marginBottom: 24 }}>
                Make a Donation
              </h2>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{
                      padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                      fontSize: 13, color: '#ef4444', fontWeight: 600,
                      display: 'flex', justifyContent: 'space-between',
                    }}>
                    <span>⚠️ {error}</span>
                    <span onClick={() => setError(null)} style={{ cursor: 'pointer' }}>✕</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Full Name *</label>
                    <input
                      value={form.donorName}
                      onChange={e => setForm(f => ({ ...f, donorName: e.target.value }))}
                      placeholder="Your full name"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone Number *</label>
                    <input
                      value={form.donorPhone}
                      onChange={e => setForm(f => ({ ...f, donorPhone: e.target.value }))}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Email (Optional)</label>
                  <input
                    value={form.donorEmail}
                    onChange={e => setForm(f => ({ ...f, donorEmail: e.target.value }))}
                    placeholder="your@email.com"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Purpose / In Name Of *</label>
                  <input
                    value={form.purpose}
                    onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
                    placeholder="e.g. Birthday of Ram ji, In memory of Shyam ji..."
                    style={inputStyle}
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
                            ? 'linear-gradient(135deg,#FF6B35,#8B1A1A)'
                            : 'rgba(255,107,53,0.08)',
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
                    style={inputStyle}
                  />
                </div>

                {finalAmount > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{
                      padding: '12px 16px', borderRadius: 12,
                      background: 'rgba(22,163,74,0.08)', border: '1.5px solid rgba(22,163,74,0.2)',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                    <span style={{ fontSize: 20 }}>💚</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#16a34a' }}>
                      You are donating ₹{finalAmount.toLocaleString()}
                    </span>
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 12px 32px rgba(255,107,53,0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDonate}
                  disabled={loading}
                  style={{
                    width: '100%', padding: '16px', borderRadius: 14, border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: 16, fontWeight: 800, color: 'white',
                    background: loading ? '#ccc' : 'linear-gradient(135deg,#FF6B35 0%,#8B1A1A 100%)',
                    boxShadow: '0 6px 20px rgba(255,107,53,0.35)',
                    marginTop: 4,
                  }}>
                  {loading ? '⏳ Processing...' : '🪔 Donate Now via Razorpay'}
                </motion.button>

                <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
                  🔒 Secure payment powered by Razorpay. Your donation is safe and encrypted.
                </p>
              </div>
            </motion.div>
          )}

          {/* PROCESSING */}
          {step === 'processing' && (
            <motion.div key="processing"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{
                borderRadius: 24, padding: '60px 36px', textAlign: 'center',
                background: 'rgba(255,255,255,0.98)',
                boxShadow: '0 20px 60px rgba(139,26,26,0.12)',
              }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{
                  width: 56, height: 56, borderRadius: '50%',
                  border: '4px solid rgba(255,107,53,0.2)',
                  borderTop: '4px solid #FF6B35',
                  margin: '0 auto 20px',
                }}
              />
              <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--maroon)' }}>Verifying Payment...</h3>
              <p style={{ fontSize: 14, color: '#9ca3af', marginTop: 8 }}>Please wait, do not close this window.</p>
            </motion.div>
          )}

          {/* SUCCESS */}
          {step === 'success' && receipt && (
            <motion.div key="success"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Success banner */}
              <div style={{
                borderRadius: 20, padding: '24px',
                background: 'rgba(22,163,74,0.08)',
                border: '1.5px solid rgba(22,163,74,0.25)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
                <h3 style={{ fontSize: 22, fontWeight: 900, color: '#16a34a', marginBottom: 4 }}>
                  Donation Successful!
                </h3>
                <p style={{ fontSize: 14, color: '#6b7280' }}>
                  Thank you for your generous contribution. 🙏 May God bless you always.
                </p>
              </div>

              {/* E-Receipt */}
              <div ref={receiptRef} style={{
                borderRadius: 20, overflow: 'hidden',
                background: 'white',
                boxShadow: '0 20px 60px rgba(139,26,26,0.12)',
                border: '1.5px solid rgba(255,107,53,0.1)',
              }}>
                {/* Receipt Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #1a0000 0%, #5a0e0e 60%, #8B1A1A 100%)',
                  padding: '28px 28px 20px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 40, marginBottom: 6 }}>🛕</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#F7C948', letterSpacing: '0.5px' }}>
                    {DHARAMSHALA_INFO.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
                    {DHARAMSHALA_INFO.address}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                    {DHARAMSHALA_INFO.phone} | {DHARAMSHALA_INFO.email}
                  </div>
                  <div style={{
                    marginTop: 14, display: 'inline-block',
                    padding: '4px 16px', borderRadius: 99,
                    background: 'rgba(247,201,72,0.2)',
                    border: '1px solid rgba(247,201,72,0.4)',
                    fontSize: 13, fontWeight: 700, color: '#F7C948',
                  }}>
                    DONATION RECEIPT
                  </div>
                </div>

                {/* Receipt Body */}
                <div style={{ padding: '24px 28px' }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 20,
                    paddingBottom: 16, borderBottom: '1px dashed #f5ede0',
                  }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Receipt No.</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--maroon)', fontFamily: 'monospace' }}>
                        {receipt.receiptNumber}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
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
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '10px 0', borderBottom: '1px solid #f5ede0',
                    }}>
                      <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>{row.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', maxWidth: '60%', textAlign: 'right' }}>{row.value}</span>
                    </div>
                  ))}

                  {/* Amount highlight */}
                  <div style={{
                    marginTop: 20, padding: '16px 20px', borderRadius: 14,
                    background: 'linear-gradient(135deg, rgba(22,163,74,0.08), rgba(22,163,74,0.04))',
                    border: '1.5px solid rgba(22,163,74,0.2)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#16a34a' }}>Amount Donated</span>
                    <span style={{ fontSize: 24, fontWeight: 900, color: '#16a34a' }}>
                      ₹{receipt.amount.toLocaleString()}
                    </span>
                  </div>

                  {/* Thank you */}
                  <div style={{ textAlign: 'center', marginTop: 20, padding: '12px' }}>
                    <div style={{ fontSize: 20, marginBottom: 6 }}>🙏</div>
                    <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
                      Thank you for your generous contribution to <strong>{DHARAMSHALA_INFO.name}</strong>.<br />
                      Your kindness helps us serve the community with devotion.
                    </p>
                    <div style={{
                      marginTop: 12, fontSize: 11, color: '#d1d5db',
                      fontStyle: 'italic',
                    }}>
                      This is a computer-generated receipt and does not require a signature.
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12 }}>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={downloadReceipt}
                  style={{
                    flex: 1, padding: '14px', borderRadius: 14, border: 'none',
                    cursor: 'pointer', fontSize: 15, fontWeight: 800, color: 'white',
                    background: 'linear-gradient(135deg,#FF6B35,#8B1A1A)',
                    boxShadow: '0 6px 20px rgba(255,107,53,0.35)',
                  }}>
                  📥 Download Receipt
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={resetForm}
                  style={{
                    flex: 1, padding: '14px', borderRadius: 14,
                    border: '2px solid rgba(255,107,53,0.2)',
                    cursor: 'pointer', fontSize: 15, fontWeight: 700, color: 'var(--maroon)',
                    background: 'white',
                  }}>
                  🪔 Donate Again
                </motion.button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Info Cards */}
        {step === 'form' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginTop: 20 }}>
            {[
              { icon: '🔒', title: 'Secure Payment', desc: 'Via Razorpay gateway' },
              { icon: '🧾', title: 'Instant Receipt', desc: 'Download after payment' },
              { icon: '👤', title: 'No Login Required', desc: 'Anyone can donate' },
            ].map((c, i) => (
              <div key={i} style={{
                borderRadius: 16, padding: '16px',
                background: 'rgba(255,255,255,0.85)',
                border: '1.5px solid rgba(255,107,53,0.08)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{c.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--maroon)', marginBottom: 3 }}>{c.title}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>{c.desc}</div>
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

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: '#9ca3af', marginBottom: 6,
  textTransform: 'uppercase', letterSpacing: '0.5px',
}

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: 12,
  border: '2px solid #ede8e0', outline: 'none', fontSize: 14,
  boxSizing: 'border-box', fontFamily: 'inherit',
  transition: 'border-color 0.2s',
}

export default DaanPeti
