const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Paths
const DATA_DIR = path.join(__dirname, 'server', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const BOOKS_FILE = path.join(DATA_DIR, 'books.json');
const BORROWINGS_FILE = path.join(DATA_DIR, 'borrowings.json');
const RESERVATIONS_FILE = path.join(DATA_DIR, 'reservations.json');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');
const NEWSLETTER_FILE = path.join(DATA_DIR, 'newsletter.json');
const RESET_TOKENS_FILE = path.join(DATA_DIR, 'reset_tokens.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// JSON file helper functions
function readJson(filePath, defaultValue = []) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf8');
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultValue;
  }
}

function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// Cryptographic Password Hashing using Scrypt (secure, salted)
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, key] = storedHash.split(':');
  const keyBuffer = Buffer.from(key, 'hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

// Initialize Seed Data
function initSeedData() {
  // Initialize Books
  if (!fs.existsSync(BOOKS_FILE)) {
    const originalBooksPath = path.join(__dirname, 'data', 'books.json');
    let initialBooks = [];
    if (fs.existsSync(originalBooksPath)) {
      try {
        initialBooks = JSON.parse(fs.readFileSync(originalBooksPath, 'utf8'));
      } catch (e) {
        console.error('Failed to parse original books.json', e);
      }
    }
    writeJson(BOOKS_FILE, initialBooks);
  }

  // Initialize Users
  let users = readJson(USERS_FILE, []);
  let updated = false;

  if (!users.some(u => u.username === 'student')) {
    users.push({
      id: 'usr_student_01',
      name: 'Jane Student',
      username: 'student',
      email: 'student@library.com',
      passwordHash: hashPassword('student123'),
      cardId: 'BN-98234-2026',
      createdAt: new Date().toISOString()
    });
    updated = true;
  }

  if (!users.some(u => u.username === 'librarian')) {
    users.push({
      id: 'usr_librarian_01',
      name: 'Librarian Admin',
      username: 'librarian',
      email: 'admin@library.com',
      passwordHash: hashPassword('admin123'),
      cardId: 'BN-10001-2026',
      createdAt: new Date().toISOString()
    });
    updated = true;
  }

  if (updated) {
    writeJson(USERS_FILE, users);
  }

  // Initialize initial borrowings for demo if empty
  let borrowings = readJson(BORROWINGS_FILE, []);
  if (borrowings.length === 0) {
    borrowings = [
      {
        id: 'brw_1',
        userId: 'usr_student_01',
        username: 'student',
        bookId: 2,
        bookTitle: 'Merchant of Venice',
        bookAuthor: 'William Shakespeare',
        issueDate: '2026-07-15',
        dueDate: '2026-07-29',
        returnDate: null,
        status: 'Issued'
      },
      {
        id: 'brw_2',
        userId: 'usr_student_01',
        username: 'student',
        bookId: 1,
        bookTitle: 'Good Girls Guide To Murder',
        bookAuthor: 'Holly Jackson',
        issueDate: '2026-07-01',
        dueDate: '2026-07-15',
        returnDate: '2026-07-14',
        status: 'Returned'
      },
      {
        id: 'brw_3',
        userId: 'usr_student_01',
        username: 'student',
        bookId: 3,
        bookTitle: 'Ikigai',
        bookAuthor: 'Héctor García and Francesc Miralles',
        issueDate: '2026-07-02',
        dueDate: '2026-07-16',
        returnDate: null,
        status: 'Issued'
      },
      {
        id: 'brw_4',
        userId: 'usr_student_01',
        username: 'student',
        bookId: 5,
        bookTitle: 'Wings of Fire',
        bookAuthor: 'A. P. J. Abdul Kalam',
        issueDate: '2026-05-10',
        dueDate: '2026-05-24',
        returnDate: '2026-05-22',
        status: 'Returned'
      }
    ];
    writeJson(BORROWINGS_FILE, borrowings);
  }

  readJson(RESERVATIONS_FILE, []);
  readJson(CONTACTS_FILE, []);
  readJson(NEWSLETTER_FILE, []);
  readJson(RESET_TOKENS_FILE, []);
}

initSeedData();

// In-Memory Active Sessions Store
// token -> { userId, username, email, name, cardId, expiresAt }
const activeSessions = new Map();
global.activeSessions = activeSessions;

function createSession(user, remember = false) {
  const token = crypto.randomBytes(32).toString('hex');
  const durationMs = remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 30 days vs 24 hours
  const expiresAt = Date.now() + durationMs;

  const sessionData = {
    userId: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    cardId: user.cardId || `BN-${Math.floor(10000 + Math.random() * 90000)}-2026`,
    expiresAt
  };

  activeSessions.set(token, sessionData);
  return { token, sessionData };
}

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in to proceed.'
    });
  }

  const session = activeSessions.get(token);
  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session. Please log in again.'
    });
  }

  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return res.status(401).json({
      success: false,
      message: 'Session expired. Please log in again.'
    });
  }

  req.user = session;
  req.token = token;
  next();
}

// Helper to compute book availability based on active borrowings
function getBooksWithAvailability() {
  const books = readJson(BOOKS_FILE, []);
  const borrowings = readJson(BORROWINGS_FILE, []);
  
  // Set of book IDs that are currently issued and not returned
  const currentlyBorrowedBookIds = new Set(
    borrowings
      .filter(b => b.status === 'Issued' && !b.returnDate)
      .map(b => b.bookId)
  );

  return books.map(book => {
    // If someone has actively borrowed it, it's unavailable
    const isBorrowed = currentlyBorrowedBookIds.has(book.id);
    return {
      ...book,
      availability: !isBorrowed && book.availability !== false
    };
  });
}

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// Register
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }
    if (!username || username.trim().length < 4) {
      return res.status(400).json({ success: false, message: 'Username must be at least 4 characters.' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const trimmedUsername = username.trim().toLowerCase();
    const trimmedEmail = email.trim().toLowerCase();

    const users = readJson(USERS_FILE, []);

    if (users.some(u => u.username.toLowerCase() === trimmedUsername)) {
      return res.status(400).json({ success: false, message: 'Username is already taken.' });
    }
    if (users.some(u => u.email.toLowerCase() === trimmedEmail)) {
      return res.status(400).json({ success: false, message: 'Email is already registered.' });
    }

    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      username: trimmedUsername,
      email: trimmedEmail,
      passwordHash: hashPassword(password),
      cardId: `BN-${Math.floor(10000 + Math.random() * 90000)}-2026`,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeJson(USERS_FILE, users);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully! You can now log in.'
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password, remember } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/Email and Password are required.'
      });
    }

    const identifier = username.trim().toLowerCase();
    const users = readJson(USERS_FILE, []);

    const user = users.find(u => 
      u.username.toLowerCase() === identifier || u.email.toLowerCase() === identifier
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username/email or password.'
      });
    }

    const isMatch = verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username/email or password.'
      });
    }

    const { token, sessionData } = createSession(user, !!remember);

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: sessionData.userId,
        username: sessionData.username,
        email: sessionData.email,
        name: sessionData.name,
        cardId: sessionData.cardId
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
});

// Verify Current Session
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const users = readJson(USERS_FILE, []);
  const user = users.find(u => u.id === req.user.userId);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      cardId: user.cardId || req.user.cardId
    }
  });
});

// Logout
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  activeSessions.delete(req.token);
  res.json({
    success: true,
    message: 'Logged out successfully.'
  });
});

// Forgot Password - Initiate Reset
app.post('/api/auth/forgot-password', (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter your username or registered email.' });
    }

    const trimmed = identifier.trim().toLowerCase();
    const users = readJson(USERS_FILE, []);
    const user = users.find(u => u.username.toLowerCase() === trimmed || u.email.toLowerCase() === trimmed);

    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered account found with that email or username.' });
    }

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const tokens = readJson(RESET_TOKENS_FILE, []);
    
    // Store token valid for 15 minutes
    tokens.push({
      userId: user.id,
      email: user.email,
      code: resetCode,
      expiresAt: Date.now() + 15 * 60 * 1000
    });
    writeJson(RESET_TOKENS_FILE, tokens);

    return res.json({
      success: true,
      message: `Password reset verification code generated for ${user.email}.`,
      verificationCode: resetCode, // Provided for user demonstration convenience
      email: user.email
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Reset Password - Complete Reset
app.post('/api/auth/reset-password', (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, verification code, and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const tokens = readJson(RESET_TOKENS_FILE, []);
    const tokenIndex = tokens.findIndex(t => 
      t.email.toLowerCase() === email.trim().toLowerCase() && 
      t.code === code.trim() && 
      t.expiresAt > Date.now()
    );

    if (tokenIndex === -1) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code.' });
    }

    const tokenEntry = tokens[tokenIndex];
    tokens.splice(tokenIndex, 1);
    writeJson(RESET_TOKENS_FILE, tokens);

    const users = readJson(USERS_FILE, []);
    const userIndex = users.findIndex(u => u.id === tokenEntry.userId);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    users[userIndex].passwordHash = hashPassword(newPassword);
    writeJson(USERS_FILE, users);

    res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.'
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Update Profile
app.put('/api/auth/profile', authenticateToken, (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name cannot be blank.' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'A valid email is required.' });
    }

    const users = readJson(USERS_FILE, []);
    const userIndex = users.findIndex(u => u.id === req.user.userId);

    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Check if new email taken by another user
    const existingWithEmail = users.find(u => 
      u.email.toLowerCase() === email.trim().toLowerCase() && u.id !== req.user.userId
    );
    if (existingWithEmail) {
      return res.status(400).json({ success: false, message: 'This email is already in use by another account.' });
    }

    users[userIndex].name = name.trim();
    users[userIndex].email = email.trim().toLowerCase();
    writeJson(USERS_FILE, users);

    // Update session
    req.user.name = users[userIndex].name;
    req.user.email = users[userIndex].email;
    activeSessions.set(req.token, req.user);

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: users[userIndex].id,
        username: users[userIndex].username,
        email: users[userIndex].email,
        name: users[userIndex].name,
        cardId: users[userIndex].cardId || req.user.cardId
      }
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Change Password
app.put('/api/auth/change-password', authenticateToken, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const users = readJson(USERS_FILE, []);
    const userIndex = users.findIndex(u => u.id === req.user.userId);

    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = verifyPassword(currentPassword, users[userIndex].passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    users[userIndex].passwordHash = hashPassword(newPassword);
    writeJson(USERS_FILE, users);

    res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// ==========================================
// BOOKS & CATALOG ROUTES
// ==========================================

// Get All Books (with live availability)
app.get('/api/books', (req, res) => {
  try {
    const books = getBooksWithAvailability();
    res.json({ success: true, count: books.length, data: books });
  } catch (err) {
    console.error('Fetch books error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve books.' });
  }
});

// Get Single Book by ID
app.get('/api/books/:id', (req, res) => {
  try {
    const bookId = parseInt(req.params.id, 10);
    const books = getBooksWithAvailability();
    const book = books.find(b => b.id === bookId);

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }

    res.json({ success: true, data: book });
  } catch (err) {
    console.error('Fetch book error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve book.' });
  }
});

// ==========================================
// BORROWING & RESERVATION ROUTES
// ==========================================

// Borrow a Book
app.post('/api/books/:id/borrow', authenticateToken, (req, res) => {
  try {
    const bookId = parseInt(req.params.id, 10);
    const books = getBooksWithAvailability();
    const book = books.find(b => b.id === bookId);

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found in library inventory.' });
    }

    if (!book.availability) {
      return res.status(400).json({
        success: false,
        message: 'This book is currently unavailable or out of stock.'
      });
    }

    const borrowings = readJson(BORROWINGS_FILE, []);

    // Check if this user already actively borrowed this book
    const alreadyBorrowed = borrowings.some(b => 
      b.userId === req.user.userId && b.bookId === bookId && b.status === 'Issued'
    );
    if (alreadyBorrowed) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active loan for this book.'
      });
    }

    const now = new Date();
    const issueDateStr = now.toISOString().split('T')[0];
    
    // Borrowing Policy: 14 days loan period
    const dueDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    const newBorrowing = {
      id: `brw_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: req.user.userId,
      username: req.user.username,
      bookId: book.id,
      bookTitle: book.title,
      bookAuthor: book.author,
      issueDate: issueDateStr,
      dueDate: dueDateStr,
      returnDate: null,
      status: 'Issued'
    };

    borrowings.unshift(newBorrowing);
    writeJson(BORROWINGS_FILE, borrowings);

    // If user had an active reservation for this book, mark it fulfilled
    const reservations = readJson(RESERVATIONS_FILE, []);
    const resIdx = reservations.findIndex(r => 
      r.userId === req.user.userId && r.bookId === bookId && r.status === 'Active'
    );
    if (resIdx !== -1) {
      reservations[resIdx].status = 'Fulfilled';
      writeJson(RESERVATIONS_FILE, reservations);
    }

    res.status(201).json({
      success: true,
      message: `"${book.title}" borrowed successfully! Due on ${dueDateStr}.`,
      borrowing: newBorrowing
    });
  } catch (err) {
    console.error('Borrow error:', err);
    res.status(500).json({ success: false, message: 'Failed to borrow book.' });
  }
});

// Reserve a Book
app.post('/api/books/:id/reserve', authenticateToken, (req, res) => {
  try {
    const bookId = parseInt(req.params.id, 10);
    const books = getBooksWithAvailability();
    const book = books.find(b => b.id === bookId);

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }

    const borrowings = readJson(BORROWINGS_FILE, []);
    const userAlreadyHasBook = borrowings.some(b => 
      b.userId === req.user.userId && b.bookId === bookId && b.status === 'Issued'
    );
    if (userAlreadyHasBook) {
      return res.status(400).json({
        success: false,
        message: 'You already have this book borrowed.'
      });
    }

    const reservations = readJson(RESERVATIONS_FILE, []);
    const alreadyReserved = reservations.some(r => 
      r.userId === req.user.userId && r.bookId === bookId && r.status === 'Active'
    );
    if (alreadyReserved) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active reservation for this book.'
      });
    }

    const newReservation = {
      id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: req.user.userId,
      username: req.user.username,
      bookId: book.id,
      bookTitle: book.title,
      bookAuthor: book.author,
      reserveDate: new Date().toISOString().split('T')[0],
      status: 'Active'
    };

    reservations.unshift(newReservation);
    writeJson(RESERVATIONS_FILE, reservations);

    res.status(201).json({
      success: true,
      message: `"${book.title}" reserved successfully! Check your dashboard for updates.`,
      reservation: newReservation
    });
  } catch (err) {
    console.error('Reserve error:', err);
    res.status(500).json({ success: false, message: 'Failed to reserve book.' });
  }
});

// Return a Borrowed Book
app.post('/api/borrowings/:id/return', authenticateToken, (req, res) => {
  try {
    const borrowingId = req.params.id;
    const borrowings = readJson(BORROWINGS_FILE, []);
    const index = borrowings.findIndex(b => b.id === borrowingId);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Borrowing transaction not found.' });
    }

    const borrowing = borrowings[index];
    if (borrowing.userId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized action.' });
    }

    if (borrowing.status === 'Returned') {
      return res.status(400).json({ success: false, message: 'This book has already been returned.' });
    }

    const returnDateStr = new Date().toISOString().split('T')[0];
    borrowing.returnDate = returnDateStr;
    borrowing.status = 'Returned';
    borrowings[index] = borrowing;
    writeJson(BORROWINGS_FILE, borrowings);

    res.json({
      success: true,
      message: `"${borrowing.bookTitle}" returned successfully! Thank you.`,
      borrowing
    });
  } catch (err) {
    console.error('Return error:', err);
    res.status(500).json({ success: false, message: 'Failed to process return.' });
  }
});

// Cancel a Reservation
app.post('/api/reservations/:id/cancel', authenticateToken, (req, res) => {
  try {
    const reservationId = req.params.id;
    const reservations = readJson(RESERVATIONS_FILE, []);
    const index = reservations.findIndex(r => r.id === reservationId);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Reservation not found.' });
    }

    const reservation = reservations[index];
    if (reservation.userId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized action.' });
    }

    if (reservation.status !== 'Active') {
      return res.status(400).json({ success: false, message: 'Reservation is not active.' });
    }

    reservation.status = 'Cancelled';
    reservations[index] = reservation;
    writeJson(RESERVATIONS_FILE, reservations);

    res.json({
      success: true,
      message: `Reservation for "${reservation.bookTitle}" has been cancelled.`
    });
  } catch (err) {
    console.error('Cancel reservation error:', err);
    res.status(500).json({ success: false, message: 'Failed to cancel reservation.' });
  }
});

// Dashboard Data Aggregation for Logged-In User
app.get('/api/dashboard', authenticateToken, (req, res) => {
  try {
    const users = readJson(USERS_FILE, []);
    const user = users.find(u => u.id === req.user.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const allBorrowings = readJson(BORROWINGS_FILE, []);
    const allReservations = readJson(RESERVATIONS_FILE, []);

    // Filter strictly for this authenticated user
    const userBorrowings = allBorrowings.filter(b => b.userId === user.id);
    const userReservations = allReservations.filter(r => r.userId === user.id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let issuedCount = 0;
    let returnedCount = 0;
    let overdueCount = 0;

    const processedBorrowings = userBorrowings.map(item => {
      const due = new Date(item.dueDate);
      due.setHours(0, 0, 0, 0);
      const returned = item.returnDate ? new Date(item.returnDate) : null;

      let isOverdue = false;
      let daysLeft = 0;

      if (item.status === 'Returned' || returned) {
        returnedCount++;
      } else {
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        daysLeft = diffDays;

        if (diffDays < 0) {
          overdueCount++;
          isOverdue = true;
        } else {
          issuedCount++;
        }
      }

      return {
        ...item,
        isOverdue,
        daysLeft
      };
    });

    const activeReservations = userReservations.filter(r => r.status === 'Active');

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          cardId: user.cardId || req.user.cardId
        },
        stats: {
          issuedCount,
          returnedCount,
          overdueCount,
          reservedCount: activeReservations.length
        },
        borrowings: processedBorrowings,
        reservations: userReservations
      }
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve dashboard data.' });
  }
});

// ==========================================
// CONTACT & NEWSLETTER ROUTES
// ==========================================

// Submit Contact Inquiry
app.post('/api/contact', (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required fields.'
      });
    }

    const contacts = readJson(CONTACTS_FILE, []);
    const newEntry = {
      id: `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email: email.trim(),
      phone: (phone || '').trim(),
      message: message.trim(),
      submittedAt: new Date().toISOString()
    };

    contacts.push(newEntry);
    writeJson(CONTACTS_FILE, contacts);

    res.status(201).json({
      success: true,
      message: 'Thank you! Your message has been received by our library support team.'
    });
  } catch (err) {
    console.error('Contact submit error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit contact message.' });
  }
});

// Newsletter Subscription
app.post('/api/newsletter', (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }

    const subscribers = readJson(NEWSLETTER_FILE, []);
    const normalized = email.trim().toLowerCase();

    if (subscribers.some(s => s.email.toLowerCase() === normalized)) {
      return res.json({
        success: true,
        message: 'You are already subscribed to the BookNest newsletter!'
      });
    }

    subscribers.push({
      id: `sub_${Date.now()}`,
      email: normalized,
      subscribedAt: new Date().toISOString()
    });
    writeJson(NEWSLETTER_FILE, subscribers);

    res.status(201).json({
      success: true,
      message: 'Subscription successful! Welcome to BookNest reading announcements.'
    });
  } catch (err) {
    console.error('Newsletter error:', err);
    res.status(500).json({ success: false, message: 'Failed to subscribe.' });
  }
});

// ==========================================
// CHATBOT ENDPOINTS (Kaira AI Assistant)
// ==========================================
const { handleChatbotMessage, clearChatbotConversation } = require('./server/chatbot');
app.post('/api/chatbot/message', handleChatbotMessage);
app.post('/api/chatbot/clear', clearChatbotConversation);

// ==========================================
// STATIC FRONTEND SERVING
// ==========================================
app.use(express.static(__dirname));

// Default root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` BookNest Library Management System Server`);
  console.log(` Running on: http://localhost:${PORT}`);
  console.log(` Public Home: http://localhost:${PORT}/index.html`);
  console.log(`===============================================`);
});
