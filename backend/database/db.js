const mongoose = require('mongoose')

// For hackathon you can paste your URI directly here,
// but in a real project prefer putting it in an environment variable.
const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb+srv://admin:tESc5ezIMwpQR5zz@cluster0.hyaxvxa.mongodb.net/campus_market?retryWrites=true&w=majority'

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI)
    console.log('✅ Connected to MongoDB')
  } catch (err) {
    console.error('MongoDB connection error:', err.message)
    process.exit(1)
  }
}

module.exports = connectDB


