import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to a user']
  },
  hallName: {
    type: String,
    default: 'Main Hall'
  },
  eventName: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true,
    maxlength: [100, 'Event name cannot exceed 100 characters']
  },
  eventType: {
    type: String,
    enum: ['wedding', 'reception', 'birthday', 'conference', 'meeting', 'religious', 'other'],
    default: 'other'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  eventDate: {
    type: Date,
    required: [true, 'Event date is required']
  },
  additionalDates: [{
    type: Date
  }],
  startTime: {
    type: String,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required']
  },
  expectedGuests: {
    type: Number,
    min: [0, 'Cannot be negative'],
    max: [1000, 'Cannot exceed 1000 guests'],
    default: 0
  },
  contactName: {
    type: String,
    required: [true, 'Contact name is required'],
    trim: true
  },
  contactPhone: {
    type: String,
    required: [true, 'Contact phone is required'],
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
  },
  contactEmail: {
    type: String,
    required: [true, 'Contact email is required'],
    lowercase: true,
    trim: true
  },
  specialRequests: {
    type: String,
    trim: true,
    maxlength: [1000, 'Special requests cannot exceed 1000 characters'],
    default: ''
  },
  baseAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentId: {
    type: String,
    default: null
  },
  receiptNumber: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  adminNotes: {
    type: String,
    trim: true,
    default: ''
  },
  rejectionReason: {
    type: String,
    trim: true,
    default: ''
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  cancellationReason: {
    type: String,
    trim: true,
    default: ''
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundStatus: {
    type: String,
    enum: ['none', 'pending', 'processed', 'failed'],
    default: 'none'
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

bookingSchema.index({ user: 1, status: 1 })
bookingSchema.index({ eventDate: 1, status: 1 })
bookingSchema.index({ status: 1, createdAt: -1 })

const Booking = mongoose.model('Booking', bookingSchema)

export default Booking