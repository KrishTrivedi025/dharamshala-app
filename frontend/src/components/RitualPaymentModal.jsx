import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ritualAPI } from '../utils/api'
import html2canvas from 'html2canvas'
import { useRef } from 'react'
import jsPDF from 'jspdf' // keeping jsPDF for other potential uses or removing later

function ReceiptDownloader({ receipt, onClose }) {
  const receiptRef = useRef(null)

  const downloadReceipt = async () => {
    if (!receiptRef.current) return
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#fff',
        logging: false,
      })
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
        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 0.6 }}
        style={{ fontSize: 64, marginBottom: 16 }}
      >
        🎉
      </motion.div>
      <h3 style={{ fontSize: 22, fontWeight: 900, color: '#16a34a', marginBottom: 8 }}>
        Payment Successful!
      </h3>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
        Your annual ritual payment for <strong>{receipt.year}</strong> is confirmed.
      </p>

      {/* Beautiful E-Receipt (Hidden from main UI, only for HTML2Canvas to capture) */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div ref={receiptRef} style={{
          width: '500px',
          borderRadius: 20, overflow: 'hidden',
          background: 'white',
          boxShadow: '0 20px 60px rgba(139,26,26,0.12)',
          border: '1.5px solid rgba(255,107,53,0.1)',
          textAlign: 'left',
          fontFamily: 'sans-serif'
        }}>
          {/* Receipt Header */}
          <div style={{
            background: 'linear-gradient(135deg, #1a0000 0%, #5a0e0e 60%, #8B1A1A 100%)',
            padding: '28px 28px 20px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 6 }}>🛕</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#F7C948', letterSpacing: '0.5px' }}>
              Shri Dharamshala Trust
            </div>
            <div style={{
              marginTop: 14, display: 'inline-block',
              padding: '6px 16px', borderRadius: 99,
              background: 'rgba(247,201,72,0.2)',
              border: '1px solid rgba(247,201,72,0.4)',
              fontSize: 14, fontWeight: 700, color: '#F7C948',
            }}>
              ANNUAL RITUAL RECEIPT
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
                <div style={{ fontSize: 16, fontWeight: 800, color: '#8B1A1A', fontFamily: 'monospace' }}>
                  {receipt.receiptNumber}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>
                  {receipt.paymentDate ? new Date(receipt.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
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
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '10px 0', borderBottom: '1px solid #f5ede0',
              }}>
                <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', maxWidth: '60%', textAlign: 'right' }}>{row.value}</span>
              </div>
            ))}

            {/* Amount highlight */}
            <div style={{
              marginTop: 20, padding: '16px 20px', borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(22,163,74,0.08), rgba(22,163,74,0.04))',
              border: '1.5px solid rgba(22,163,74,0.2)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#16a34a' }}>Amount Paid</span>
              <span style={{ fontSize: 24, fontWeight: 900, color: '#16a34a' }}>
                ₹{receipt.amount?.toLocaleString()}
              </span>
            </div>

            {/* Thank you */}
            <div style={{ textAlign: 'center', marginTop: 24, padding: '12px' }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>🙏</div>
              <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
                Thank you for your annual contribution to <strong>Shri Dharamshala Trust</strong>.
              </p>
              <div style={{
                marginTop: 16, fontSize: 11, color: '#d1d5db',
                fontStyle: 'italic',
              }}>
                This is a computer-generated receipt and does not require a signature.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: 10, marginBottom: '20px', padding: '16px 20px', borderRadius: 14,
        background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
        border: '1.5px solid #86efac',
      }}>
        <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700, marginBottom: 4 }}>RECEIPT NUMBER</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#15803d', letterSpacing: 1 }}>
          {receipt.receiptNumber}
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
          Amount: <strong>₹{receipt.amount?.toLocaleString()}</strong> | Mode: <strong>{receipt.paymentMode === 'online' ? '💳 Online' : '💵 Cash'}</strong>
        </div>
      </div>
      <motion.button
        whileHover={{ scale: 1.04, boxShadow: '0 12px 30px rgba(22,163,74,0.4)' }}
        whileTap={{ scale: 0.97 }}
        onClick={downloadReceipt}
        style={{
          width: '100%', padding: '14px', borderRadius: 14, border: 'none',
          cursor: 'pointer', fontSize: 15, fontWeight: 800, color: 'white',
          background: 'linear-gradient(135deg, #16a34a, #166534)',
          boxShadow: '0 6px 20px rgba(22,163,74,0.3)', marginBottom: 10,
        }}
      >
        📥 Download Receipt Image
      </motion.button>
      <button
        onClick={onClose}
        style={{
          width: '100%', padding: '12px', borderRadius: 14,
          border: '2px solid #e5e7eb', cursor: 'pointer',
          fontSize: 14, fontWeight: 600, color: '#6b7280', background: 'transparent',
        }}
      >
        Close
      </button>
    </div>
  )
}

function RitualPaymentModal({ isOpen, onClose, ritualStatus, onPaymentSuccess }) {
  const [step, setStep] = useState('choose') // 'choose' | 'processing' | 'success' | 'cash_submitted'
  const [paymentMode, setPaymentMode] = useState('online')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [receipt, setReceipt] = useState(null)

  useEffect(() => {
    if (isOpen) {
      if (ritualStatus?.hasPaid && ritualStatus?.entry) {
        setStep('success')
        setReceipt(ritualStatus.entry)
      } else if (ritualStatus?.isPending) {
        setStep('cash_submitted')
      } else {
        setStep('choose')
      }
      setError(null)
      setLoading(false)
    }
  }, [isOpen, ritualStatus])

  const fee = ritualStatus?.fee || 1200
  const year = ritualStatus?.year || new Date().getFullYear()

  const handleOnlinePayment = async () => {
    setLoading(true)
    setError(null)
    try {
      const orderRes = await ritualAPI.createOrder()
      const { orderId, amount, currency, userName, userEmail, userPhone, keyId } = orderRes.data

      const options = {
        key: keyId,
        amount: amount * 100,
        currency,
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
            setReceipt(verifyRes.data)
            setStep('success')
            if (onPaymentSuccess) onPaymentSuccess()
          } catch (err) {
            setError('Payment verification failed. Please contact support.')
            setStep('choose')
          }
        },
        prefill: { name: userName, email: userEmail, contact: userPhone },
        theme: { color: '#8B1A1A' },
        modal: {
          ondismiss: () => setLoading(false)
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
      setLoading(false)
    } catch (err) {
      setError(err.message || 'Failed to initiate payment')
      setLoading(false)
    }
  }

  const handleCashPayment = async () => {
    setLoading(true)
    setError(null)
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

  const handleSubmit = () => {
    if (paymentMode === 'online') {
      handleOnlinePayment()
    } else {
      handleCashPayment()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => !loading && step !== 'processing' && onClose()}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 480,
              borderRadius: 28,
              overflow: 'hidden',
              boxShadow: '0 40px 120px rgba(0,0,0,0.5)',
              position: 'relative',
            }}
          >
            {/* Header gradient */}
            <div style={{
              background: 'linear-gradient(160deg, #1a0000 0%, #5a0e0e 50%, #c94a1a 100%)',
              padding: '32px 32px 28px',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute', top: -60, right: -60,
                  width: 200, height: 200, borderRadius: '50%',
                  background: 'rgba(247,201,72,0.07)',
                }}
              />
              {step !== 'processing' && step !== 'success' && (
                <button
                  onClick={onClose}
                  style={{
                    position: 'absolute', top: 16, right: 16,
                    background: 'rgba(255,255,255,0.15)', border: 'none',
                    borderRadius: '50%', width: 32, height: 32, cursor: 'pointer',
                    color: 'white', fontSize: 16, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >✕</button>
              )}
              <div style={{ position: 'relative', zIndex: 2 }}>
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ fontSize: 48, marginBottom: 12 }}
                >🪔</motion.div>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: 'white', marginBottom: 4 }}>
                  Annual Ritual Payment
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                  Pooja Shulk — {year}
                </p>
              </div>
            </div>

            {/* Body */}
            <div style={{
              background: 'white',
              padding: '28px 32px',
            }}>
              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{
                      padding: '10px 14px', borderRadius: 10,
                      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                      color: '#ef4444', fontSize: 13, fontWeight: 600, marginBottom: 16,
                    }}
                  >⚠️ {error}</motion.div>
                )}
              </AnimatePresence>

              {step === 'processing' && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{
                      width: 52, height: 52, borderRadius: '50%',
                      border: '4px solid rgba(255,107,53,0.15)',
                      borderTop: '4px solid #FF6B35', margin: '0 auto 16px',
                    }}
                  />
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#6b7280' }}>Verifying your payment...</p>
                </div>
              )}

              {step === 'success' && receipt && (
                <ReceiptDownloader receipt={receipt} onClose={onClose} />
              )}

              {step === 'cash_submitted' && (
                <div style={{ textAlign: 'center' }}>
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 0.5 }}
                    style={{ fontSize: 64, marginBottom: 16 }}
                  >🎫</motion.div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--maroon, #8B1A1A)', marginBottom: 8 }}>
                    Request Submitted!
                  </h3>
                  <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
                    Your cash payment request has been submitted.
                    A receipt ticket will be generated once the amount is <strong>confirmed by the admin</strong>.
                  </p>
                  <div style={{
                    padding: '14px 20px', borderRadius: 14,
                    background: 'linear-gradient(135deg, rgba(247,201,72,0.1), rgba(255,107,53,0.05))',
                    border: '1.5px solid rgba(247,201,72,0.3)', marginBottom: 20,
                  }}>
                    <div style={{ fontSize: 13, color: '#d97706', fontWeight: 700 }}>
                      📋 You can track the payment status in your Dashboard.
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    style={{
                      width: '100%', padding: '13px', borderRadius: 14,
                      border: 'none', cursor: 'pointer',
                      fontSize: 15, fontWeight: 700, color: 'white',
                      background: 'linear-gradient(135deg, #FF6B35, #8B1A1A)',
                    }}
                  >
                    Got It 👍
                  </button>
                </div>
              )}

              {step === 'choose' && (
                <>
                  {/* Amount Card */}
                  <div style={{
                    padding: '18px 22px', borderRadius: 16, marginBottom: 22,
                    background: 'linear-gradient(135deg, rgba(139,26,26,0.05), rgba(255,107,53,0.05))',
                    border: '1.5px solid rgba(139,26,26,0.1)',
                    display: 'flex', alignItems: 'center', gap: 16,
                  }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 14, fontSize: 24,
                      background: 'linear-gradient(135deg, #FF6B35, #8B1A1A)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>🪔</div>
                    <div>
                      <div style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600, marginBottom: 2 }}>
                        Annual Pooja Shulk {year}
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: '#8B1A1A' }}>
                        ₹{fee.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Payment Mode */}
                  <div style={{ marginBottom: 22 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                      Select Payment Method
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {[
                        { key: 'online', icon: '💳', label: 'Online Payment', desc: 'Razorpay — Instant confirmation & receipt' },
                        { key: 'cash', icon: '💵', label: 'Cash Payment', desc: 'Pay in person — Admin will confirm' },
                      ].map(m => (
                        <motion.button
                          key={m.key}
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          onClick={() => setPaymentMode(m.key)}
                          style={{
                            padding: '16px 14px', borderRadius: 16,
                            border: paymentMode === m.key ? '2.5px solid #8B1A1A' : '2px solid #e5e7eb',
                            cursor: 'pointer', textAlign: 'left',
                            background: paymentMode === m.key ? 'rgba(139,26,26,0.04)' : 'white',
                            transition: 'all 0.2s',
                          }}
                        >
                          <div style={{ fontSize: 24, marginBottom: 6 }}>{m.icon}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: paymentMode === m.key ? '#8B1A1A' : '#374151', marginBottom: 3 }}>
                            {m.label}
                          </div>
                          <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.4 }}>{m.desc}</div>
                          {paymentMode === m.key && (
                            <motion.div
                              initial={{ scale: 0 }} animate={{ scale: 1 }}
                              style={{
                                position: 'absolute', top: 10, right: 10,
                                width: 20, height: 20, borderRadius: '50%',
                                background: '#8B1A1A', color: 'white',
                                fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}
                            >✓</motion.div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Info note */}
                  <div style={{
                    padding: '10px 14px', borderRadius: 10, marginBottom: 20,
                    background: paymentMode === 'online' ? 'rgba(37,99,235,0.06)' : 'rgba(247,201,72,0.1)',
                    border: `1px solid ${paymentMode === 'online' ? 'rgba(37,99,235,0.2)' : 'rgba(247,201,72,0.3)'}`,
                    fontSize: 12, color: paymentMode === 'online' ? '#1d4ed8' : '#92400e', fontWeight: 600,
                  }}>
                    {paymentMode === 'online'
                      ? '💳 Secure payment via Razorpay. Receipt will be generated instantly.'
                      : '💵 Submit your request. Bring cash to the Dharamshala office. Receipt after admin approval.'}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.03, boxShadow: '0 12px 32px rgba(255,107,53,0.45)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{
                      width: '100%', padding: '15px', borderRadius: 14, border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: 16, fontWeight: 800, color: 'white',
                      background: loading ? '#ccc' : 'linear-gradient(135deg, #FF6B35 0%, #8B1A1A 100%)',
                      boxShadow: loading ? 'none' : '0 6px 24px rgba(255,107,53,0.35)',
                    }}
                  >
                    {loading
                      ? '⏳ Please wait...'
                      : paymentMode === 'online'
                        ? `💳 Pay ₹${fee.toLocaleString()} Online`
                        : '📋 Submit Cash Request'}
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
