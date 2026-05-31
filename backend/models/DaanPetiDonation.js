import mongoose from 'mongoose'

const daanPetiDonationSchema = new mongoose.Schema({
  donorName: {
    type: String,
    required: [true, 'Donor name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  donorPhone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  donorEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  purpose: {
    type: String,
    required: [true, 'Purpose is required'],
    trim: true,
    maxlength: [300, 'Purpose cannot exceed 300 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [1, 'Amount must be at least ₹1']
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'online'],
    default: 'online'
  },
  paymentId: {
    type: String,
    default: null
  },
  orderId: {
    type: String,
    default: null
  },
  receiptNumber: {
    type: String,
    unique: true,
    required: [true, 'Receipt number is required']
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'failed'],
    default: 'pending'
  },
  cashbookEntryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CashbookEntry',
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

daanPetiDonationSchema.index({ status: 1 })
daanPetiDonationSchema.index({ userId: 1 })
daanPetiDonationSchema.index({ receiptNumber: 1 })
daanPetiDonationSchema.index({ createdAt: -1 })

const DaanPetiDonation = mongoose.model('DaanPetiDonation', daanPetiDonationSchema)

export default DaanPetiDonation
