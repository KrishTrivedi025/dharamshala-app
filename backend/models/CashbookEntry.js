import mongoose from 'mongoose'
import Settings from './Settings.js'

const cashbookEntrySchema = new mongoose.Schema({
  entryDate: {
    type: Date,
    required: [true, 'Entry date is required'],
    default: Date.now
  },
  paymentDate: {
    type: Date,
    default: null
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    maxlength: [200, 'Category cannot exceed 200 characters']
  },
  receiptNumber: {
    type: String,
    required: [true, 'Receipt number is required']
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'online'],
    required: [true, 'Payment mode is required']
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: [true, 'Transaction type is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['completed', 'pending'],
    default: 'completed'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  source: {
    type: String,
    enum: ['booking', 'daan_peti', 'annual_ritual', 'manual'],
    default: 'manual'
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },
  donationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DaanPetiDonation',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  year: {
    type: Number,
    required: true
  },
  month: {
    type: Number,
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes for fast querying
cashbookEntrySchema.index({ year: 1, month: 1 })
// Receipt numbers only need to be unique within a given year, not globally —
// the same number can be reused across different years.
cashbookEntrySchema.index(
  { year: 1, receiptNumber: 1 },
  { unique: true, partialFilterExpression: { receiptNumber: { $exists: true } } }
)
cashbookEntrySchema.index({ type: 1, year: 1 })
cashbookEntrySchema.index({ source: 1 })
cashbookEntrySchema.index({ status: 1 })
cashbookEntrySchema.index({ entryDate: -1 })
cashbookEntrySchema.index({ name: 'text', category: 'text', receiptNumber: 'text' })

// Pre-save: auto-set year and month from entryDate
cashbookEntrySchema.pre('save', function () {
  if (this.entryDate) {
    const d = new Date(this.entryDate)
    this.year = d.getFullYear()
    this.month = d.getMonth() + 1 // 1-12
  }
})

// Internal helper: compute the next auto-incremented receipt number from existing entries
cashbookEntrySchema.statics._computeAutoReceiptNumber = async function (year) {
  const lastEntry = await this.findOne(
    { receiptNumber: new RegExp(`^DH-${year}-`) },
    { receiptNumber: 1 },
    { sort: { receiptNumber: -1 } }
  )

  let serial = 1
  if (lastEntry && lastEntry.receiptNumber) {
    const parts = lastEntry.receiptNumber.split('-')
    serial = parseInt(parts[2], 10) + 1
  }

  return `DH-${year}-${String(serial).padStart(4, '0')}`
}

// Static method: peek at the next receipt number without consuming any manual override
// (safe to call repeatedly, e.g. for UI preview/refresh)
cashbookEntrySchema.statics.peekNextReceiptNumber = async function (year) {
  const override = await Settings.get(`nextReceiptNumber_${year}`, null)
  if (override) return override
  return this._computeAutoReceiptNumber(year)
}

// Static method: generate the next receipt number for a given year, consuming
// (clearing) any manual override so it only applies once. Use only when an
// entry is actually being created/saved.
cashbookEntrySchema.statics.generateReceiptNumber = async function (year) {
  const overrideKey = `nextReceiptNumber_${year}`
  const override = await Settings.get(overrideKey, null)
  if (override) {
    await Settings.set(overrideKey, null)
    return override
  }

  return this._computeAutoReceiptNumber(year)
}

const CashbookEntry = mongoose.model('CashbookEntry', cashbookEntrySchema)

export default CashbookEntry
