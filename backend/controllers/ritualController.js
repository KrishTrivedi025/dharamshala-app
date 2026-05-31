import Razorpay from 'razorpay'
import crypto from 'crypto'
import CashbookEntry from '../models/CashbookEntry.js'
import Settings from '../models/Settings.js'

// Helper: create Razorpay instance lazily so dotenv is already loaded
const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// @desc    Get the current user's annual ritual payment status for the current year
// @route   GET /api/ritual/my-status
// @access  Private
export const getMyRitualStatus = async (req, res) => {
  try {
    const year = new Date().getFullYear()
    const fee = await Settings.get('annualRitualFee', 1200)

    const entry = await CashbookEntry.findOne({
      userId: req.user._id,
      source: 'annual_ritual',
      year
    })

    res.status(200).json({
      success: true,
      data: {
        year,
        fee,
        hasPaid: entry ? entry.status === 'completed' : false,
        isPending: entry ? entry.status === 'pending' : false,
        status: entry ? entry.status : 'not_paid',
        entry: entry ? {
          _id: entry._id,
          status: entry.status,
          paymentMode: entry.paymentMode,
          paymentDate: entry.paymentDate,
          receiptNumber: entry.receiptNumber,
          amount: entry.amount,
          userName: entry.name || req.user.name,
          userPhone: entry.phone || req.user.phone,
          year: entry.year
        } : null
      }
    })
  } catch (error) {
    console.error('Get my ritual status error:', error)
    res.status(500).json({ success: false, message: 'Server error while fetching ritual status' })
  }
}

// @desc    Create Razorpay order for annual ritual
// @route   POST /api/ritual/create-order
// @access  Private
export const createRitualOrder = async (req, res) => {
  try {
    const year = new Date().getFullYear()
    const fee = await Settings.get('annualRitualFee', 1200)

    // Check if already paid
    const existing = await CashbookEntry.findOne({
      userId: req.user._id,
      source: 'annual_ritual',
      year
    })

    if (existing && existing.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Annual ritual payment already completed for this year.'
      })
    }

    const options = {
      amount: fee * 100, // paise
      currency: 'INR',
      receipt: `ritual_${req.user._id}_${year}`,
      notes: {
        userId: req.user._id.toString(),
        year: year.toString(),
        type: 'annual_ritual'
      }
    }

    const razorpay = getRazorpay()
    const order = await razorpay.orders.create(options)

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: fee,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
        userName: req.user.name,
        userEmail: req.user.email,
        userPhone: req.user.phone,
        year
      }
    })
  } catch (error) {
    console.error('Create ritual order error:', error)
    res.status(500).json({ success: false, message: 'Server error while creating payment order' })
  }
}

// @desc    Verify Razorpay payment and record the ritual payment
// @route   POST /api/ritual/verify-payment
// @access  Private
export const verifyRitualPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification data is incomplete' })
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment signature verification failed' })
    }

    const year = new Date().getFullYear()
    const fee = await Settings.get('annualRitualFee', 1200)
    const now = new Date()

    // Check if entry already exists (cash req that became online, or duplicate)
    let entry = await CashbookEntry.findOne({
      userId: req.user._id,
      source: 'annual_ritual',
      year
    })

    if (entry) {
      // Update the existing entry to completed/online
      entry.status = 'completed'
      entry.paymentMode = 'online'
      entry.paymentDate = now
      entry.amount = fee
      entry.description = `Annual ritual payment for year ${year} — Online (Razorpay: ${razorpay_payment_id})`
      entry.updatedBy = req.user._id
      await entry.save()
    } else {
      const receiptNumber = await CashbookEntry.generateReceiptNumber(year)
      entry = await CashbookEntry.create({
        entryDate: now,
        paymentDate: now,
        name: req.user.name,
        phone: req.user.phone || '',
        userId: req.user._id,
        category: 'Annual Ritual Payment (Pooja Shulk)',
        receiptNumber,
        paymentMode: 'online',
        type: 'credit',
        amount: fee,
        status: 'completed',
        description: `Annual ritual payment for year ${year} — Online (Razorpay: ${razorpay_payment_id})`,
        source: 'annual_ritual',
        createdBy: req.user._id,
        year,
        month: now.getMonth() + 1
      })
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified and recorded successfully',
      data: {
        receiptNumber: entry.receiptNumber,
        amount: entry.amount,
        paymentDate: entry.paymentDate,
        paymentMode: entry.paymentMode,
        status: entry.status,
        year,
        userName: req.user.name,
        userPhone: req.user.phone,
        entryId: entry._id
      }
    })
  } catch (error) {
    console.error('Verify ritual payment error:', error)
    res.status(500).json({ success: false, message: 'Server error while verifying payment' })
  }
}

// @desc    Submit a cash payment request (creates a pending entry)
// @route   POST /api/ritual/cash-payment
// @access  Private
export const submitCashPayment = async (req, res) => {
  try {
    const year = new Date().getFullYear()
    const fee = await Settings.get('annualRitualFee', 1200)

    // Check if already exists
    const existing = await CashbookEntry.findOne({
      userId: req.user._id,
      source: 'annual_ritual',
      year
    })

    if (existing) {
      if (existing.status === 'completed') {
        return res.status(400).json({ success: false, message: 'Annual ritual payment already completed for this year.' })
      }
      // Already pending — return it
      return res.status(200).json({
        success: true,
        message: 'Your cash payment request is already submitted and awaiting admin confirmation.',
        data: {
          receiptNumber: existing.receiptNumber,
          status: existing.status,
          entryId: existing._id
        }
      })
    }

    const now = new Date()
    const receiptNumber = await CashbookEntry.generateReceiptNumber(year)

    const entry = await CashbookEntry.create({
      entryDate: now,
      paymentDate: null,
      name: req.user.name,
      phone: req.user.phone || '',
      userId: req.user._id,
      category: 'Annual Ritual Payment (Pooja Shulk)',
      receiptNumber,
      paymentMode: 'cash',
      type: 'credit',
      amount: fee,
      status: 'pending',
      description: `Annual ritual cash payment request for year ${year} — awaiting admin confirmation`,
      source: 'annual_ritual',
      createdBy: req.user._id,
      year,
      month: now.getMonth() + 1
    })

    res.status(201).json({
      success: true,
      message: 'Cash payment request submitted. A ticket will be generated once confirmed by admin.',
      data: {
        receiptNumber: entry.receiptNumber,
        status: entry.status,
        amount: fee,
        entryId: entry._id,
        year
      }
    })
  } catch (error) {
    console.error('Submit cash payment error:', error)
    res.status(500).json({ success: false, message: 'Server error while submitting cash payment' })
  }
}

// @desc    Download receipt for annual ritual payment
// @route   GET /api/ritual/receipt/:entryId
// @access  Private
export const getRitualReceipt = async (req, res) => {
  try {
    const entry = await CashbookEntry.findById(req.params.entryId).populate('userId', 'name email phone')

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Receipt not found' })
    }

    // Ensure only the owner or admin can access
    const isOwner = entry.userId && entry.userId._id.toString() === req.user._id.toString()
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }

    if (entry.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Receipt is only available for completed payments' })
    }

    res.status(200).json({
      success: true,
      data: {
        receiptNumber: entry.receiptNumber,
        name: entry.name,
        phone: entry.phone,
        amount: entry.amount,
        paymentDate: entry.paymentDate,
        paymentMode: entry.paymentMode,
        year: entry.year,
        status: entry.status,
        category: entry.category,
        description: entry.description
      }
    })
  } catch (error) {
    console.error('Get ritual receipt error:', error)
    res.status(500).json({ success: false, message: 'Server error while fetching receipt' })
  }
}
