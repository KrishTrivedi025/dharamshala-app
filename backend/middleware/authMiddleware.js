import jwt from 'jsonwebtoken'
import User from '../models/User.js'

// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
  try {
    let token

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please login.'
      })
    }

    try {
      // Verify token
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'REDACTED'
      )

      // Get user from token
      const user = await User.findById(decoded.id)

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Please login again.'
        })
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Your account has been deactivated. Please contact admin.'
        })
      }

      // Add user to request object
      req.user = user
      next()
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.'
      })
    }
  } catch (error) {
    console.error('Auth middleware error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    })
  }
}

// Admin only access
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next()
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    })
  }
}

// Optional auth - doesn't require login but sets user if token exists
export const optionalAuth = async (req, res, next) => {
  try {
    let token

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (token) {
      try {
        const decoded = jwt.verify(
          token, 
          process.env.JWT_SECRET || 'REDACTED'
        )
        const user = await User.findById(decoded.id)
        if (user && user.isActive) {
          req.user = user
        }
      } catch (error) {
        // Token invalid, but continue without user
        req.user = null
      }
    }
    next()
  } catch (error) {
    next()
  }
}