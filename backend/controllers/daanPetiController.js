import DaanPetiDonation from '../models/DaanPetiDonation.js'
import CashbookEntry from '../models/CashbookEntry.js'
import Razorpay from 'razorpay'
import crypto from 'crypto'

let _razorpay = null
const getRazorpay = () => {
  if (!_razorpay) {
    _razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  }
  return _razorpay
}

// @desc    Create Razorpay order for Daan Peti donation
// @route   POST /api/daan-peti/create-order
// @access  Public (optionalAuth)
export const createDonationOrder = async (req, res) => {
  try {
    const { donorName, donorPhone, donorEmail, purpose, amount } = req.body

    if (!donorName || !donorPhone || !purpose || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide donorName, donorPhone, purpose, and amount'
      })
    }

    if (parseFloat(amount) < 1) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be at least ₹1'
      })
    }

    const now = new Date()
    const yr = now.getFullYear()
    const receiptNumber = await CashbookEntry.generateReceiptNumber(yr)

    // Create donation record
    const donation = await DaanPetiDonation.create({
      donorName,
      donorPhone,
      donorEmail: donorEmail || '',
      userId: req.user ? req.user.id : null,
      purpose,
      amount: parseFloat(amount),
      paymentMode: 'online',
      receiptNumber,
      status: 'pending'
    })

    // Create Razorpay order
    const options = {
      amount: Math.round(parseFloat(amount) * 100), // paise
      currency: 'INR',
      receipt: `daan_${donation._id}`,
      notes: {
        donationId: donation._id.toString(),
        donorName,
        purpose
      }
    }

    const order = await getRazorpay().orders.create(options)

    donation.orderId = order.id
    await donation.save()

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        donationId: donation._id,
        receiptNumber: donation.receiptNumber,
        keyId: process.env.RAZORPAY_KEY_ID
      }
    })
  } catch (error) {
    console.error('Create donation order error:', error)
    res.status(500).json({ success: false, message: 'Failed to create donation order' })
  }
}

// @desc    Verify Razorpay payment for donation
// @route   POST /api/daan-peti/verify-payment
// @access  Public (optionalAuth)
export const verifyDonationPayment = async (req, res) => {
  try {
    const { donationId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    const donation = await DaanPetiDonation.findById(donationId)

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' })
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      donation.status = 'failed'
      await donation.save()
      return res.status(400).json({ success: false, message: 'Payment verification failed' })
    }

    // Update donation
    donation.paymentId = razorpay_payment_id
    donation.status = 'completed'
    await donation.save()

    // Auto-create cashbook entry
    const now = new Date()
    const cashbookEntry = await CashbookEntry.create({
      entryDate: now,
      paymentDate: now,
      name: donation.donorName,
      phone: donation.donorPhone,
      userId: donation.userId || null,
      category: donation.purpose,
      receiptNumber: donation.receiptNumber,
      paymentMode: 'online',
      type: 'credit',
      amount: donation.amount,
      status: 'completed',
      description: `Daan Peti donation: ${donation.purpose}`,
      source: 'daan_peti',
      donationId: donation._id,
      year: now.getFullYear(),
      month: now.getMonth() + 1
    })

    donation.cashbookEntryId = cashbookEntry._id
    await donation.save()

    res.status(200).json({
      success: true,
      message: 'Donation payment verified successfully',
      data: {
        donation,
        receiptNumber: donation.receiptNumber
      }
    })
  } catch (error) {
    console.error('Verify donation payment error:', error)
    res.status(500).json({ success: false, message: 'Donation payment verification failed' })
  }
}

// @desc    Get donation receipt data
// @route   GET /api/daan-peti/receipt/:id
// @access  Public
export const getReceipt = async (req, res) => {
  try {
    const donation = await DaanPetiDonation.findById(req.params.id)

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' })
    }

    if (donation.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Payment not completed yet' })
    }

    res.status(200).json({
      success: true,
      data: {
        receiptNumber: donation.receiptNumber,
        donorName: donation.donorName,
        donorPhone: donation.donorPhone,
        donorEmail: donation.donorEmail,
        purpose: donation.purpose,
        amount: donation.amount,
        paymentMode: donation.paymentMode,
        paymentId: donation.paymentId,
        date: donation.createdAt,
        // Dharamshala header info (placeholder for now)
        dharamshala: {
          name: 'Shri Dharamshala Trust',
          address: '123, Temple Road, City, State - 000000',
          phone: '+91 98765 43210',
          email: 'info@dharamshala.org'
        }
      }
    })
  } catch (error) {
    console.error('Get receipt error:', error)
    res.status(500).json({ success: false, message: 'Server error while fetching receipt' })
  }
}

// @desc    Get logged-in user's donation history
// @route   GET /api/daan-peti/my-donations
// @access  Private
export const getMyDonations = async (req, res) => {
  try {
    const donations = await DaanPetiDonation.find({ userId: req.user.id })
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: donations.length,
      data: donations
    })
  } catch (error) {
    console.error('Get my donations error:', error)
    res.status(500).json({ success: false, message: 'Server error while fetching donations' })
  }
}
