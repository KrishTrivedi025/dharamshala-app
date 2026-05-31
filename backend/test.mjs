import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()
console.log('URI:', process.env.MONGODB_URI)
mongoose.connect(process.env.MONGODB_URI)
  .then(()=>console.log('CONNECTED!'))
  .catch(e=>console.log('ERROR:', e.message))