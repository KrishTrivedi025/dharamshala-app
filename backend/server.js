import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import bookingRoutes from './routes/bookingRoutes.js'
import lockedDateRoutes from './routes/lockedDateRoutes.js'
import cashbookRoutes from './routes/cashbookRoutes.js'
import daanPetiRoutes from './routes/daanPetiRoutes.js'
import settingsRoutes from './routes/settingsRoutes.js'
import ritualRoutes from './routes/ritualRoutes.js'

dotenv.config()

connectDB()

const app = express()

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:4173']

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))
app.use(express.json())

app.get('/', (req, res) => {
  res.json({
    message: 'Dharamshala API is running! 🙏',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      bookings: '/api/bookings',
      lockedDates: '/api/locked-dates',
      health: '/'
    }
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/locked-dates', lockedDateRoutes)
app.use('/api/cashbook', cashbookRoutes)
app.use('/api/daan-peti', daanPetiRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/ritual', ritualRoutes)

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({ success: false, message: 'Server error', error: err.message })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
