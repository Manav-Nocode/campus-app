const mongoose = require('mongoose')

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    category: {
      type: String,
      trim: true
      // e.g. "Books", "Electronics", "Furniture"
    },
    images: [
      {
        type: String // URLs or file paths
      }
    ],
    condition: {
      type: String,
      enum: ['new', 'good', 'used'],
      default: 'used'
    },
    location: {
      type: String,
      trim: true // hostel / block / campus area
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Listing', listingSchema)


