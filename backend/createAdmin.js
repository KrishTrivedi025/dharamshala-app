import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import crypto from 'crypto'

dotenv.config()

const ADMIN_NAME = process.env.ADMIN_NAME || 'Super Admin'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const ADMIN_PHONE = process.env.ADMIN_PHONE || '9000000000'
// Generate a random password if ADMIN_PASSWORD isn't provided — never ship a
// hardcoded default here, this account gets full admin access.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || crypto.randomBytes(12).toString('base64url')

if (!ADMIN_EMAIL) {
  console.error('❌ Set ADMIN_EMAIL (and ideally ADMIN_PASSWORD) in your .env before running this script.')
  process.exit(1)
}

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true },
  phone: String,
  password: { type: String, select: false },
  address: { type: String, default: '' },
  role: { type: String, default: 'user' },
  avatar: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },
}, { timestamps: true })

const User = mongoose.models.User || mongoose.model('User', userSchema)

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    const existing = await User.findOne({ email: ADMIN_EMAIL })
    if (existing) {
      if (existing.role !== 'admin') {
        existing.role = 'admin'
        await existing.save()
        console.log('✅ Existing user upgraded to admin!')
      } else {
        console.log('ℹ️  Admin already exists!')
      }
      await mongoose.disconnect()
      return
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt)

    await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      phone: ADMIN_PHONE,
      password: hashedPassword,
      role: 'admin',
      address: 'Dharamshala Office',
      isActive: true,
    })

    console.log('🎉 Admin created successfully!')
    console.log('📧 Email:', ADMIN_EMAIL)
    console.log('🔐 Password:', ADMIN_PASSWORD)
    console.log('⚠️  Please change the password after first login!')

    await mongoose.disconnect()
    console.log('✅ Done!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

createAdmin()
