import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle, WarningCircle, CircleNotch,
  DownloadSimple, CreditCard, Money, ClipboardText, Ticket,
} from '@phosphor-icons/react'
import { ritualAPI } from '../utils/api'
import html2canvas from 'html2canvas'
import { ReceiptHeader, SANSTHAN_NAME } from './ReceiptHeader'

function ReceiptDownloader({ receipt, onClose }) {
  const receiptRef = useRef(null)

  const downloadReceipt = async () => {
    if (!receiptRef.current) return
    try {
      await document.fonts.ready
      const canvas = await html2canvas(receiptRef.current, { scale: 2, backgroundColor: '#fff', logging: false })
      const link = document.createElement('a')
      link.download = `Annual_Ritual_Receipt_${receipt.year}_${receipt.receiptNumber}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Download error:', err)
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 0.5 }}
        style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--success-subtle)',
          border: '2px solid var(--success)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', color: 'var(--success)',
        }}
      >
        <CheckCircle size={36} weight="fill" />
      </motion.div>
      <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 900, color: 'var(--success)', marginBottom: 8 }}>
        Payment Successful!
      </h3>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 20 }}>
        Your annual ritual payment for <strong>{receipt.year}</strong> is confirmed.
      </p>

      {/* Hidden receipt for html2canvas */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div ref={receiptRef} style={{
          width: '500px', borderRadius: 20, overflow: 'hidden',
          background: 'white', boxShadow: 'var(--shadow-xl)',
          border: '1.5px solid var(--border)', textAlign: 'left', fontFamily: 'sans-serif',
        }}>
          <ReceiptHeader />
          <div style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: '1px dashed #f5ede0' }}>
              <div>
                <div style={{ fontSize: 13, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Receipt No.</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#8B1A1A', fontFamily: 'monospace' }}>{receipt.receiptNumber}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#374151' }}>
                  {receipt.paymentDate
                    ? new Date(receipt.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>
            {[
              { label: 'Name', value: receipt.userName || receipt.name },
              { label: 'Phone', value: receipt.userPhone || receipt.phone || '-' },
              { label: 'Year', value: receipt.year },
              { label: 'Payment Mode', value: receipt.paymentMode === 'online' ? 'Online (Razorpay)' : 'Cash' },
              { label: 'Status', value: 'PAID ✓' },
              { label: 'Category', value: 'Annual Ritual (Pooja Shulk)' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f5ede0' }}>
                <span style={{ fontSize: 15, color: '#9ca3af', fontWeight: 600 }}>{row.label}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#374151', maxWidth: '60%', textAlign: 'right' }}>{row.value}</span>
              </div>
            ))}
            <div style={{
              position: 'relative', height: 54, marginTop: 20, padding: '0 20px', borderRadius: 14,
              background: 'rgba(22,163,74,0.06)', border: '1.5px solid rgba(22,163,74,0.2)',
            }}>
              <span style={{ position: 'absolute', left: 20, top: '50%', marginTop: -9, fontSize: 16, fontWeight: 800, color: '#16a34a' }}>Amount Paid</span>
              <span style={{ position: 'absolute', right: 20, top: '50%', marginTop: -13, fontSize: 24, fontWeight: 900, color: '#16a34a' }}>₹{receipt.amount?.toLocaleString()}</span>
            </div>
            <div style={{ textAlign: 'center', marginTop: 24, padding: '12px' }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>🙏</div>
              <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 4 }}>
                Thank you for your annual contribution to
              </p>
              <p style={{ fontFamily: "'Cinzel', 'Segoe UI', serif", fontWeight: 700, fontSize: 15, color: '#8B1A1A', lineHeight: 1.4 }}>
                {SANSTHAN_NAME}
              </p>
              <div style={{ marginTop: 16, fontSize: 11, color: '#d1d5db', fontStyle: 'italic' }}>
                This is a computer-generated receipt and does not require a signature.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt summary */}
      <div style={{
        marginBottom: 18, padding: '14px 18px', borderRadius: 'var(--radius-md)',
        background: 'var(--success-subtle)', border: '1.5px solid var(--success)',
      }}>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--success)', fontWeight: 700, marginBottom: 4, letterSpacing: '0.5px' }}>RECEIPT NUMBER</div>
        <div style={{ fontSize: 'var(--text-xl)', fontWeight: 900, color: 'var(--success-text)', letterSpacing: 1 }}>{receipt.receiptNumber}</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 6 }}>
          Amount: <strong>₹{receipt.amount?.toLocaleString()}</strong> · Mode: <strong>{receipt.paymentMode === 'online' ? 'Online' : 'Cash'}</strong>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.03, boxShadow: '0 10px 28px rgba(22,163,74,0.4)' }}
        whileTap={{ scale: 0.97 }}
        onClick={downloadReceipt}
        style={{
          width: '100%', padding: '13px', borderRadius: 'var(--radius-full)', border: 'none',
          cursor: 'pointer', fontSize: 'var(--text-base)', fontWeight: 700, color: 'white',
          background: 'linear-gradient(135deg, var(--success), #166534)',
          boxShadow: '0 6px 20px rgba(22,163,74,0.3)', marginBottom: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontFamily: 'inherit',
        }}
      >
        <DownloadSimple size={16} weight="bold" />
        Download Receipt
      </motion.button>
      <button
        onClick={onClose}
        style={{
          width: '100%', padding: '11px', borderRadius: 'var(--radius-full)',
          border: '1.5px solid var(--border)', cursor: 'pointer',
          fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)',
          background: 'transparent', fontFamily: 'inherit',
        }}
      >
        Close
      </button>
    </div>
  )
}

function RitualPaymentModal({ isOpen, onClose, ritualStatus, onPaymentSuccess }) {
  const [step, setStep] = useState('choose')
  const [paymentMode, setPaymentMode] = useState('online')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [receipt, setReceipt] = useState(null)

  useEffect(() => {
    if (isOpen) {
      if (ritualStatus?.hasPaid && ritualStatus?.entry) {
        setStep('success'); setReceipt(ritualStatus.entry)
      } else if (ritualStatus?.isPending) {
        setStep('cash_submitted')
      } else {
        setStep('choose')
      }
      setError(null); setLoading(false)
    }
  }, [isOpen, ritualStatus])

  const fee = ritualStatus?.fee || 1200
  const year = ritualStatus?.year || new Date().getFullYear()

  const handleOnlinePayment = async () => {
    setLoading(true); setError(null)
    try {
      const orderRes = await ritualAPI.createOrder()
      const { orderId, amount, currency, userName, userEmail, userPhone, keyId } = orderRes.data
      const options = {
        key: keyId, amount: amount * 100, currency,
        name: 'Shri Dharamshala Trust',
        description: `Annual Ritual Payment ${year}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            setStep('processing')
            const verifyRes = await ritualAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            setReceipt(verifyRes.data); setStep('success')
            if (onPaymentSuccess) onPaymentSuccess()
          } catch {
            setError('Payment verification failed. Please contact support.')
            setStep('choose')
          }
        },
        prefill: { name: userName, email: userEmail, contact: userPhone },
        theme: { color: '#8B1A1A' },
        modal: { ondismiss: () => setLoading(false) },
      }
      const rzp = new window.Razorpay(options)
      rzp.open(); setLoading(false)
    } catch (err) {
      setError(err.message || 'Failed to initiate payment'); setLoading(false)
    }
  }

  const handleCashPayment = async () => {
    setLoading(true); setError(null)
    try {
      await ritualAPI.submitCashPayment()
      setStep('cash_submitted')
      if (onPaymentSuccess) onPaymentSuccess()
    } catch (err) {
      setError(err.message || 'Failed to submit cash payment request')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = () => paymentMode === 'online' ? handleOnlinePayment() : handleCashPayment()

  const paymentMethods = [
    { key: 'online', icon: <CreditCard size={22} weight="duotone" />, label: 'Online Payment', desc: 'Razorpay — Instant confirmation & receipt' },
    { key: 'cash', icon: <Money size={22} weight="duotone" />, label: 'Cash Payment', desc: 'Pay in person — Admin will confirm' },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 'var(--z-modal)',
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
          onClick={() => !loading && step !== 'processing' && onClose()}
        >
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 460,
              borderRadius: 'var(--radius-xl)', overflow: 'hidden',
              boxShadow: '0 40px 120px rgba(0,0,0,0.5)', position: 'relative',
            }}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(160deg, #1a0000 0%, #5a0e0e 50%, #c94a1a 100%)',
              padding: '28px 28px 24px', position: 'relative', overflow: 'hidden',
            }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(247,201,72,0.06)' }} />
              {step !== 'processing' && step !== 'success' && (
                <button onClick={onClose} style={{
                  position: 'absolute', top: 14, right: 14,
                  background: 'rgba(255,255,255,0.14)', border: 'none',
                  borderRadius: '50%', width: 30, height: 30, cursor: 'pointer',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M1 1L11 11M11 1L1 11" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
              <div style={{ position: 'relative', zIndex: 2 }}>
                <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ fontSize: 44, marginBottom: 10 }}>🪔</motion.div>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 900, color: 'white', marginBottom: 3 }}>Annual Ritual Payment</h2>
                <p style={{ fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.55)', margin: 0 }}>Pooja Shulk — {year}</p>
              </div>
            </div>

            {/* Body */}
            <div style={{ background: 'var(--surface-solid)', padding: '24px 28px' }}>
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 8,
                      padding: '10px 13px', borderRadius: 'var(--radius-md)',
                      background: 'var(--error-subtle)', border: '1px solid var(--error)',
                      color: 'var(--error-text)', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 14,
                    }}
                  >
                    <WarningCircle size={15} weight="fill" style={{ flexShrink: 0, marginTop: 1 }} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {step === 'processing' && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-block', color: 'var(--primary)', marginBottom: 14 }}>
                    <CircleNotch size={44} weight="bold" />
                  </motion.div>
                  <p style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-secondary)' }}>Verifying your payment…</p>
                </div>
              )}

              {step === 'success' && receipt && <ReceiptDownloader receipt={receipt} onClose={onClose} />}

              {step === 'cash_submitted' && (
                <div style={{ textAlign: 'center' }}>
                  <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 0.45 }}
                    style={{
                      width: 60, height: 60, borderRadius: '50%',
                      background: 'var(--warning-subtle)', border: '2px solid var(--warning)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 16px', color: 'var(--warning)',
                    }}>
                    <Ticket size={30} weight="duotone" />
                  </motion.div>
                  <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--maroon)', marginBottom: 8 }}>Request Submitted!</h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
                    Your cash payment request has been submitted. A receipt will be generated once the amount is <strong>confirmed by the admin</strong>.
                  </p>
                  <div style={{
                    padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 18,
                    background: 'var(--warning-subtle)', border: '1px solid rgba(217,119,6,0.3)',
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                  }}>
                    <ClipboardText size={15} weight="duotone" style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--warning-text)', fontWeight: 600 }}>
                      You can track the payment status in your Dashboard.
                    </div>
                  </div>
                  <button onClick={onClose} style={{
                    width: '100%', padding: '13px', borderRadius: 'var(--radius-full)',
                    border: 'none', cursor: 'pointer', fontSize: 'var(--text-base)', fontWeight: 700, color: 'white',
                    background: 'linear-gradient(135deg, var(--primary), var(--maroon))',
                    fontFamily: 'inherit',
                  }}>
                    Got It
                  </button>
                </div>
              )}

              {step === 'choose' && (
                <>
                  {/* Amount */}
                  <div style={{
                    padding: '16px 20px', borderRadius: 'var(--radius-md)', marginBottom: 20,
                    background: 'var(--maroon-subtle)', border: '1px solid rgba(139,26,26,0.12)',
                    display: 'flex', alignItems: 'center', gap: 14,
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 'var(--radius-md)',
                      background: 'linear-gradient(135deg, var(--primary), var(--maroon))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22,
                    }}>🪔</div>
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>
                        Annual Pooja Shulk {year}
                      </div>
                      <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 900, color: 'var(--maroon)' }}>
                        ₹{fee.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Payment mode */}
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                      Select Payment Method
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {paymentMethods.map(m => (
                        <motion.button key={m.key}
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          onClick={() => setPaymentMode(m.key)}
                          style={{
                            padding: '14px 12px', borderRadius: 'var(--radius-lg)',
                            border: paymentMode === m.key ? '2px solid var(--maroon)' : '1.5px solid var(--border)',
                            cursor: 'pointer', textAlign: 'left',
                            background: paymentMode === m.key ? 'var(--maroon-subtle)' : 'var(--surface-solid)',
                            transition: 'all 0.18s', position: 'relative', fontFamily: 'inherit',
                          }}
                        >
                          <div style={{ color: paymentMode === m.key ? 'var(--maroon)' : 'var(--text-muted)', marginBottom: 6 }}>{m.icon}</div>
                          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: paymentMode === m.key ? 'var(--maroon)' : 'var(--text)', marginBottom: 3 }}>
                            {m.label}
                          </div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 1.4 }}>{m.desc}</div>
                          {paymentMode === m.key && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                              style={{
                                position: 'absolute', top: 9, right: 9,
                                width: 18, height: 18, borderRadius: '50%',
                                background: 'var(--maroon)', color: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path d="M2 5L4.2 7.5L8 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Info note */}
                  <div style={{
                    padding: '9px 12px', borderRadius: 'var(--radius-sm)', marginBottom: 18,
                    background: paymentMode === 'online' ? 'var(--info-subtle)' : 'var(--warning-subtle)',
                    border: `1px solid ${paymentMode === 'online' ? 'rgba(37,99,235,0.2)' : 'rgba(217,119,6,0.25)'}`,
                    fontSize: 'var(--text-xs)', color: paymentMode === 'online' ? 'var(--info-text)' : 'var(--warning-text)', fontWeight: 600,
                  }}>
                    {paymentMode === 'online'
                      ? 'Secure payment via Razorpay. Receipt will be generated instantly.'
                      : 'Submit your request. Bring cash to the Dharamshala office. Receipt after admin approval.'}
                  </div>

                  <motion.button
                    whileHover={loading ? {} : { scale: 1.02, boxShadow: '0 10px 28px var(--primary-border)' }}
                    whileTap={loading ? {} : { scale: 0.97 }}
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{
                      width: '100%', padding: '14px', borderRadius: 'var(--radius-full)', border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: 'var(--text-base)', fontWeight: 700, color: 'white',
                      background: loading ? 'var(--neutral-400)' : 'linear-gradient(135deg, var(--primary) 0%, var(--maroon) 100%)',
                      boxShadow: loading ? 'none' : '0 6px 22px var(--primary-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      fontFamily: 'inherit',
                    }}
                  >
                    {loading ? (
                      <>
                        <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}>
                          <CircleNotch size={16} weight="bold" />
                        </motion.span>
                        Please wait…
                      </>
                    ) : paymentMode === 'online' ? (
                      <><CreditCard size={16} weight="bold" /> Pay ₹{fee.toLocaleString()} Online</>
                    ) : (
                      <><ClipboardText size={16} weight="bold" /> Submit Cash Request</>
                    )}
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default RitualPaymentModal
