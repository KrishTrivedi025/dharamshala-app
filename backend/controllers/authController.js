import User from '../models/User.js'
import jwt from 'jsonwebtoken'

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    { expiresIn: '7d' }
  )
}

export const register = async (req, res) => {
  try {
    const { name, email, phone, password, address } = req.body
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields: name, email, phone, password' })
    }
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' })
    }
    const existingPhone = await User.findOne({ phone })
    if (existingPhone) {
      return res.status(400).json({ success: false, message: 'User with this phone number already exists' })
    }
    const user = await User.create({ name, email, phone, password, address: address || '' })
    const token = generateToken(user._id)
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: { id: user._id, name: user.name, email: user.email, phone: user.phone, address: user.address, role: user.role },
        token
      }
    })
  } catch (error) {
    console.error('Register error:', error)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({ success: false, message: messages.join(', ') })
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      return res.status(400).json({ success: false, message: `User with this ${field} already exists` })
    }
    res.status(500).json({ success: false, message: 'Server error during registration' })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' })
    }
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Your account has been deactivated. Please contact admin.' })
    }
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }
    user.lastLogin = new Date()
    await user.save()
    const token = generateToken(user._id)
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: { id: user._id, name: user.name, email: user.email, phone: user.phone, address: user.address, role: user.role, avatar: user.avatar },
        token
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ success: false, message: 'Server error during login' })
  }
}

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    res.status(200).json({
      success: true,
      data: { id: user._id, name: user.name, email: user.email, phone: user.phone, address: user.address, role: user.role, avatar: user.avatar, createdAt: user.createdAt }
    })
  } catch (error) {
    console.error('Get me error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, address, avatar } = req.body
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    if (name) user.name = name
    if (phone) user.phone = phone
    if (address !== undefined) user.address = address
    if (avatar !== undefined) user.avatar = avatar
    await user.save()
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { id: user._id, name: user.name, email: user.email, phone: user.phone, address: user.address, role: user.role, avatar: user.avatar }
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ success: false, message: 'Server error during profile update' })
  }
}

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password' })
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' })
    }
    const user = await User.findById(req.user.id).select('+password')
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' })
    }
    user.password = newPassword
    await user.save()
    res.status(200).json({ success: true, message: 'Password changed successfully' })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ success: false, message: 'Server error during password change' })
  }
}

export const logout = async (req, res) => {
  try {
    res.status(200).json({ success: true, message: 'Logged out successfully' })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ success: false, message: 'Server error during logout' })
  }
}

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 })
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    })
  } catch (error) {
    console.error('Get all users error:', error)
    res.status(500).json({ success: false, message: 'Server error while fetching users' })
  }
}

export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot deactivate admin account' })
    }
    user.isActive = !user.isActive
    await user.save()
    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    })
  } catch (error) {
    console.error('Toggle user status error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
