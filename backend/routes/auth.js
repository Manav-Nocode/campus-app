const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

const router = express.Router()

const JWT_SECRET = process.env.JWT_SECRET || 'dev_hackathon_secret_key'

// Sign up: create a new user with uid + password
router.post('/signup', async (req, res) => {
  try {
    const { uid, password, name } = req.body

    if (!uid || !password || !name) {
      return res.status(400).json({ error: 'UID, name and password are required' })
    }

    const existing = await User.findOne({ uid })
    if (existing) {
      return res.status(409).json({ error: 'User with this UID already exists' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await User.create({
      uid,
      name,
      passwordHash
    })

    const token = jwt.sign(
      { userId: user._id, uid: user.uid },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      message: 'User created',
      token,
      user: { uid: user.uid, id: user._id, name: user.name }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Login: check uid + password
router.post('/login', async (req, res) => {
  try {
    const { uid, password } = req.body

    if (!uid || !password) {
      return res.status(400).json({ error: 'UID and password are required' })
    }

    const user = await User.findOne({ uid })
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { userId: user._id, uid: user.uid },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      message: 'Logged in',
      token,
      user: { uid: user.uid, id: user._id, name: user.name }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router


