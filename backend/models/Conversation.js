const mongoose = require('mongoose')

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      }
    ],
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Conversation', conversationSchema)


