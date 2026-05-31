import mongoose from 'mongoose'

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
    unique: true,
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
cashbookEntrySchema.index({ receiptNumber: 1 })
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

// Static method: generate next receipt number for a given year
cashbookEntrySchema.statics.generateReceiptNumber = async function (year) {
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

const CashbookEntry = mongoose.model('CashbookEntry', cashbookEntrySchema)

export default CashbookEntry
