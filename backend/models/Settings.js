import mongoose from 'mongoose'

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Static method to get a setting by key, with a default fallback
settingsSchema.statics.get = async function (key, defaultValue = null) {
  const setting = await this.findOne({ key })
  return setting ? setting.value : defaultValue
}

// Static method to set / upsert a setting
settingsSchema.statics.set = async function (key, value, updatedBy = null, description = '') {
  return await this.findOneAndUpdate(
    { key },
    { key, value, updatedBy, description },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
}

const Settings = mongoose.model('Settings', settingsSchema)

export default Settings
