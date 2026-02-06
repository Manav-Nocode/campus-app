const express = require('express')
const jwt = require('jsonwebtoken')
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

// Create a new listing
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, description, price, category, condition, location, imageUrl } =
      req.body

    if (!title || !price) {
      return res.status(400).json({ error: 'Title and price are required' })
    }

    const listing = await Listing.create({
      title,
      description,
      price,
      category,
      condition,
      location,
      images: imageUrl ? [imageUrl] : [],
      seller: req.user.userId
    })

    res.status(201).json(listing)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get all listings (simple feed)
router.get('/', async (req, res) => {
  try {
    const listings = await Listing.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('seller', 'uid name')
    res.json(listings)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router


