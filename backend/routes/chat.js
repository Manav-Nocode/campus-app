const express = require('express')
const jwt = require('jsonwebtoken')
const Conversation = require('../models/Conversation')
const Message = require('../models/Message')
const Listing = require('../models/Listing')

const router = express.Router()

const JWT_SECRET = process.env.JWT_SECRET || 'dev_hackathon_secret_key'

// Simple auth middleware using Bearer token
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null

  if (!token) {
    return res.status(401).json({ error: 'Missing auth token' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// Start or get a conversation for a listing between current user and seller
router.post('/start', requireAuth, async (req, res) => {
  try {
    const { listingId } = req.body
    if (!listingId) {
      return res.status(400).json({ error: 'listingId is required' })
    }

    const listing = await Listing.findById(listingId).populate('seller', 'uid name')
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' })
    }

    const buyerId = req.user.userId
    const sellerId = listing.seller._id.toString()

    if (buyerId === sellerId) {
      return res.status(400).json({ error: 'You cannot chat with yourself on your own listing' })
    }

    let conversation = await Conversation.findOne({
      listing: listingId,
      participants: { $all: [buyerId, sellerId] }
    })

    if (!conversation) {
      conversation = await Conversation.create({
        listing: listingId,
        participants: [buyerId, sellerId]
      })
    }

    const messages = await Message.find({ conversation: conversation._id })
      .sort({ createdAt: 1 })
      .populate('sender', 'uid name')

    res.json({
      conversationId: conversation._id,
      listing: {
        id: listing._id,
        title: listing.title,
        seller: listing.seller
      },
      messages
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Send a message in a conversation
router.post('/:conversationId/messages', requireAuth, async (req, res) => {
  try {
    const { conversationId } = req.params
    const { text } = req.body

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text is required' })
    }

    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    // Optional: ensure user is participant
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user.userId
    )
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not part of this conversation' })
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user.userId,
      text: text.trim()
    })

    const populated = await message.populate('sender', 'uid name')

    res.status(201).json(populated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get messages for a conversation
router.get('/:conversationId/messages', requireAuth, async (req, res) => {
  try {
    const { conversationId } = req.params

    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user.userId
    )
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not part of this conversation' })
    }

    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: 1 })
      .populate('sender', 'uid name')

    res.json(messages)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router


