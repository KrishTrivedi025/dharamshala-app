import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const ADMIN_NAME = 'Super Admin'
const ADMIN_EMAIL = 'admin@dharamshala.com'
const ADMIN_PASSWORD = 'Admin@1234'
const ADMIN_PHONE = '9000000000'

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
