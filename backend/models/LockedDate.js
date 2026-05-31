import mongoose from 'mongoose'

const lockedDateSchema = new mongoose.Schema({
  // Date range for locking
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  
  // Reason for locking
  reason: {
    type: String,
    required: [true, 'Reason for locking is required'],
    trim: true,
    maxlength: [200, 'Reason cannot exceed 200 characters']
  },
  
  // Lock type
  lockType: {
    type: String,
    enum: ['full', 'partial'],
    default: 'full'
  },
  
  // For partial locks - specific time slots
  timeSlots: [{
    startTime: String,
    endTime: String
  }],
  
  // Admin who created the lock
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Whether the lock is active
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Notes
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
})

// Index for efficient date queries
lockedDateSchema.index({ startDate: 1, endDate: 1 })
lockedDateSchema.index({ isActive: 1 })

// Method to check if a date falls within the locked range
lockedDateSchema.methods.containsDate = function(date) {
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  
  const start = new Date(this.startDate)
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(this.endDate)
  end.setHours(23, 59, 59, 999)
  
  return checkDate >= start && checkDate <= end
}

// Static method to find locks for a specific date
lockedDateSchema.statics.findLocksForDate = async function(date) {
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  
  return await this.find({
    isActive: true,
    startDate: { $lte: checkDate },
    endDate: { $gte: checkDate }
  }).populate('createdBy', 'name email')
}

const LockedDate = mongoose.model('LockedDate', lockedDateSchema)

export default LockedDate