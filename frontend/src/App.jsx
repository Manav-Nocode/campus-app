import React, { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [mode, setMode] = useState('login') // 'login' or 'signup'
  const [name, setName] = useState('')
  const [uid, setUid] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [token, setToken] = useState(null)
  const [currentUid, setCurrentUid] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [listings, setListings] = useState([])
  const [showListingForm, setShowListingForm] = useState(false)
  const [newListing, setNewListing] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Books',
    condition: 'used',
    location: '',
    imageUrl: ''
  })
  const [listingError, setListingError] = useState('')
  const [listingSuccess, setListingSuccess] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [chatListing, setChatListing] = useState(null)
  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [chatError, setChatError] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUid = localStorage.getItem('uid')
    const savedName = localStorage.getItem('name')
    if (savedToken) {
      setToken(savedToken)
      if (savedUid) setCurrentUid(savedUid)
      if (savedName) setName(savedName)
    }

    // Fetch listings
    fetch('https://campus-app-n2ab.onrender.com/listings')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setListings(data)
        }
      })
      .catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const isLogin = mode === 'login'
      const endpoint = isLogin
        ? 'https://campus-app-n2ab.onrender.com/auth/login'
        : 'https://campus-app-n2ab.onrender.com/auth/signup'

      const payload = isLogin
        ? { uid, password }
        : { uid, password, name }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

      // If this was signup, don't log in automatically.
      // Show message and switch to login mode.
      if (!isLogin) {
        // remember name for later login
        if (name) {
          localStorage.setItem('name', name)
        }
        setSuccess('Account created. Please log in with your UID and password.')
        setMode('login')
        setPassword('')
        return
      }

      // Login flow: store token & UID then show home page
      if (data.token) {
        localStorage.setItem('token', data.token)
        setToken(data.token)
      }

      if (data.user?.uid) {
        localStorage.setItem('uid', data.user.uid)
        setCurrentUid(data.user.uid)
      }

      if (data.user?.name) {
        localStorage.setItem('name', data.user.name)
        setName(data.user.name)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('uid')
    localStorage.removeItem('name')
    setToken(null)
    setCurrentUid('')
    setUid('')
    setPassword('')
    setName('')
    setMode('login')
  }

  const filteredListings = listings.filter((item) => {
    const matchesCategory = category === 'All' || item.category === category
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q)
    return matchesCategory && matchesSearch
  })

  const handleNewListingChange = (field, value) => {
    setNewListing((prev) => ({ ...prev, [field]: value }))
  }

  const handleCreateListing = async (e) => {
    e.preventDefault()
    setListingError('')
    setListingSuccess('')

    if (!newListing.title || !newListing.price) {
      setListingError('Title and price are required for a listing.')
      return
    }

    try {
      const res = await fetch('https://campus-app-n2ab.onrender.com/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newListing,
          price: Number(newListing.price)
        })  
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Could not create listing')
      }

      setListings((prev) => [data, ...prev])
      setShowListingForm(false)
      setNewListing({
        title: '',
        description: '',
        price: '',
        category: 'Books',
        condition: 'used',
        location: '',
        imageUrl: ''
      })
      setListingSuccess('Listing created.')
    } catch (err) {
      setListingError(err.message)
    }
  }

  const handleOpenChat = async (item) => {
    if (!token) {
      setError('Please log in again to start a chat.')
      return
    }
    setChatError('')
    setChatLoading(true)
    setChatOpen(true)
    setChatListing(item)
    setMessages([])

    try {
      const res = await fetch('https://campus-app-n2ab.onrender.com/chat/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ listingId: item._id || item.id })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Could not start chat')
      }

      setConversationId(data.conversationId)
      setMessages(data.messages || [])
    } catch (err) {
      setChatError(err.message)
    } finally {
      setChatLoading(false)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !conversationId) return
    setChatError('')

    try {
      const res = await fetch(
        `https://campus-app-n2ab.onrender.com/chat/${conversationId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ text: newMessage })
        }
      )

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Could not send message')
      }

      setMessages((prev) => [...prev, data])
      setNewMessage('')
    } catch (err) {
      setChatError(err.message)
    }
  }

  // If logged in, show home page
  if (token) {
    return (
      <div className="home-page">
        <header className="home-header">
          <div>
            <h1>Project Nexus</h1>
            <p>Used by students across your campus.</p>
          </div>
          <div className="home-user">
            <button
              className="primary-btn small"
              type="button"
              onClick={() => setShowListingForm(true)}
            >
              + List an item
            </button>
            <span className="home-uid">{name || 'Student'}</span>
            <button className="secondary-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <main className="home-main">
          <section className="home-filters">
            <input
              type="text"
              placeholder="Search by item or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="category-chips">
              {['All', 'Books', 'Electronics', 'Transport'].map((cat) => (
                <button
                  key={cat}
                  className={
                    category === cat ? 'chip chip-active' : 'chip'
                  }
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </section>

          <section className="home-listings">
            {filteredListings.map((item) => (
              <article key={item._id || item.id} className="listing-card">
                <div className="listing-body">
                  <h3>{item.title}</h3>
                  <p className="listing-meta">
                    <span>₹{item.price}</span>
                    <span>{item.condition}</span>
                  </p>
                  <p className="listing-location">{item.location}</p>
                  {item.seller?.uid && (
                    <p className="listing-seller">
                      Seller UID: {item.seller.uid}
                    </p>
                  )}
                </div>
                <button
                  className="primary-btn small"
                  type="button"
                  onClick={() => handleOpenChat(item)}
                >
                  Chat / Contact
                </button>
              </article>
            ))}

            {filteredListings.length === 0 && (
              <p className="no-results">
                No items match your search. Try changing filters.
              </p>
            )}
          </section>
        </main>

        {showListingForm && (
          <div className="listing-modal-backdrop">
            <div className="listing-modal">
              <h2>List a new item</h2>
              <form className="listing-form" onSubmit={handleCreateListing}>
                <label>
                  Title
                  <input
                    type="text"
                    value={newListing.title}
                    onChange={(e) =>
                      handleNewListingChange('title', e.target.value)
                    }
                    required
                  />
                </label>
                <label>
                  Description
                  <textarea
                    value={newListing.description}
                    onChange={(e) =>
                      handleNewListingChange('description', e.target.value)
                    }
                    rows={3}
                  />
                </label>
                <label>
                  Price (₹)
                  <input
                    type="number"
                    min="0"
                    value={newListing.price}
                    onChange={(e) =>
                      handleNewListingChange('price', e.target.value)
                    }
                    required
                  />
                </label>
                <div className="listing-row">
                  <label>
                    Category
                    <select
                      value={newListing.category}
                      onChange={(e) =>
                        handleNewListingChange('category', e.target.value)
                      }
                    >
                      <option value="Books">Books</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Transport">Transport</option>
                      <option value="Furniture">Furniture</option>
                      <option value="Others">Others</option>
                    </select>
                  </label>
                  <label>
                    Condition
                    <select
                      value={newListing.condition}
                      onChange={(e) =>
                        handleNewListingChange('condition', e.target.value)
                      }
                    >
                      <option value="new">New</option>
                      <option value="good">Good</option>
                      <option value="used">Used</option>
                    </select>
                  </label>
                </div>
                <label>
                  Location on campus
                  <input
                    type="text"
                    placeholder="e.g. Hostel B, Block 3"
                    value={newListing.location}
                    onChange={(e) =>
                      handleNewListingChange('location', e.target.value)
                    }
                  />
                </label>
                <label>
                  Image URL
                  <input
                    type="url"
                    placeholder="Paste a link to an image"
                    value={newListing.imageUrl}
                    onChange={(e) =>
                      handleNewListingChange('imageUrl', e.target.value)
                    }
                  />
                </label>
                <div className="listing-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setShowListingForm(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="primary-btn small">
                    Post listing
                  </button>
                </div>
                {listingError && (
                  <p className="auth-footer-text" style={{ color: '#f97373' }}>
                    {listingError}
                  </p>
                )}
                {listingSuccess && (
                  <p className="auth-footer-text" style={{ color: '#16a34a' }}>
                    {listingSuccess}
                  </p>
                )}
              </form>
            </div>
          </div>
        )}

        {chatOpen && (
          <div className="chat-panel">
            <div className="chat-header">
              <div>
                <h3>Chat about {chatListing?.title}</h3>
                {chatListing?.seller && (
                  <p>
                    With seller:{' '}
                    {chatListing.seller.name || chatListing.seller.uid}
                  </p>
                )}
              </div>
              <button
                className="secondary-btn"
                type="button"
                onClick={() => setChatOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="chat-messages">
              {chatLoading && <p>Loading chat...</p>}
              {!chatLoading &&
                messages.map((m) => (
                  <div
                    key={m._id}
                    className={
                      m.sender?.uid === currentUid
                        ? 'chat-message me'
                        : 'chat-message them'
                    }
                  >
                    <div className="chat-bubble">
                      <p>{m.text}</p>
                      <span>
                        {m.sender?.name || m.sender?.uid || 'User'}
                      </span>
                    </div>
                  </div>
                ))}
              {!chatLoading && messages.length === 0 && (
                <p className="no-results">No messages yet. Say hi!</p>
              )}
            </div>
            <form className="chat-input-row" onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button className="primary-btn small" type="submit">
                Send
              </button>
            </form>
            {chatError && (
              <p className="auth-footer-text" style={{ color: '#f97373' }}>
                {chatError}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Project Nexus</h1>
          <p>Your university community.</p>
        </div>

        <div className="auth-toggle">
          <button
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            className={mode === 'signup' ? 'active' : ''}
            onClick={() => setMode('signup')}
          >
            Sign up
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <label>
              Name
              <input
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
          )}
          <label>
            University ID
            <input
              type="text"
              placeholder="e.g. 2023CS123"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button type="submit" className="primary-btn">
            {loading
              ? mode === 'login'
                ? 'Logging in...'
                : 'Creating account...'
              : mode === 'login'
              ? 'Login'
              : 'Create account'}
          </button>
        </form>

        {error && <p className="auth-footer-text" style={{ color: '#fca5a5' }}>{error}</p>}
        {success && <p className="auth-footer-text" style={{ color: '#bbf7d0' }}>{success}</p>}

        {mode === 'login' ? (
          <p className="auth-footer-text">
            New here?{' '}
            <span onClick={() => setMode('signup')}>Create an account</span>
          </p>
        ) : (
          <p className="auth-footer-text">
            Already have an account?{' '}
            <span onClick={() => setMode('login')}>Login</span>
          </p>
        )}
      </div>
    </div>
  )
}

export default App
