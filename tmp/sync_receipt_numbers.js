import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const Booking = mongoose.model('Booking', new mongoose.Schema({
  paymentStatus: String,
  receiptNumber: String,
  paymentId: String
}));

const CashbookEntry = mongoose.model('CashbookEntry', new mongoose.Schema({
  receiptNumber: String,
  bookingId: mongoose.Schema.Types.ObjectId,
  paymentId: String
}));

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const paidBookings = await Booking.find({ 
      paymentStatus: 'paid', 
      receiptNumber: { $eq: null } 
    });

    console.log(`Found ${paidBookings.length} paid bookings needing receipt numbers.`);

    for (const booking of paidBookings) {
      const entry = await CashbookEntry.findOne({ bookingId: booking._id });
      if (entry && entry.receiptNumber) {
        booking.receiptNumber = entry.receiptNumber;
        await booking.save();
        console.log(`Updated booking ${booking._id} with receipt number ${entry.receiptNumber}`);
      } else {
        console.warn(`No cashbook entry found for paid booking ${booking._id}`);
      }
    }

    console.log('Migration completed.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
