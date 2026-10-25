# BookNest – Library Management System

A library management system built with semantic **HTML5**, modern **CSS3**, and **Vanilla JavaScript (ES6+)** with **Native Promises**, **Async/Await**, and a secure **Node.js Express** backend.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+ or v24+ recommended)
- npm (v9+)

### Installation & Startup

1. Open your terminal and navigate to the project directory:
   ```bash
   cd "/Users/parishajindal/Desktop/LIBRARY MANAGEMENT FINAL/LIBRARY-MANAGMENT"
   ```

2. Install dependencies (only lightweight `express` and `cors` are used):
   ```bash
   npm install
   ```

3. Start the BookNest server:
   ```bash
   npm start
   ```

4. Open your web browser and navigate to:
   ```
   http://localhost:3000
   ```
   Or directly access pages:
   - **Home**: `http://localhost:3000/index.html`
   - **Books Catalog**: `http://localhost:3000/books.html`
   - **User Dashboard**: `http://localhost:3000/user-dashboard.html`
   - **Login**: `http://localhost:3000/login.html`
   - **Register**: `http://localhost:3000/register.html`
   - **About**: `http://localhost:3000/about.html`
   - **Gallery**: `http://localhost:3000/gallery.html`
   - **Contact**: `http://localhost:3000/contact.html`

---

## 🔑 Default Test Accounts

| Role | Username | Email | Password | Library Card ID |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | `student` | `student@library.com` | `student123` | `BN-98234-2026` |
| **Librarian / Admin** | `librarian` | `admin@library.com` | `admin123` | `BN-10001-2026` |

*Note: Passwords are automatically salted and hashed using Node.js cryptographic Scrypt algorithm with timing-safe comparison on the server.*

---

## 🛡️ Authentication & Security Implementation

1. **Cryptographic Password Hashing**:
   - Implemented via Node.js native `crypto.scryptSync` with unique 16-byte random salts.
   - Verified using `crypto.timingSafeEqual` to prevent timing attacks.
   - Plaintext passwords and auth secrets are **NEVER** stored in `localStorage`.
2. **Server-Validated Sessions**:
   - Cryptographically random 32-byte tokens generated upon login.
   - Passed via standard `Authorization: Bearer <token>` HTTP headers.
   - Client-side token storage in `sessionStorage` (or `localStorage` only if "Remember session" is checked).
   - Validated on protected page visits and API calls (`/api/auth/me`).
3. **Route & Action Protection**:
   - Unauthenticated access to `user-dashboard.html`, book borrowing, and reservations redirects to `login.html?redirect=...`.
   - Authenticated users attempting to visit `login.html` or `register.html` are automatically redirected to `user-dashboard.html`.
4. **Logout & Session Invalidation**:
   - Invoking logout invalidates the session token on the server.
   - Client session token is destroyed and page is redirected to `index.html`.
   - Browser back-button cache (`bfcache`) checks prevent unauthenticated users from seeing protected data after logout.

---

## ⚡ JavaScript Promises & Async/Await Architecture

Native ES6+ Promises (`new Promise()`, `.then()`, `.catch()`, `.finally()`, `async/await`, and `Promise.all()`) are strictly utilized across all application workflows:

1. **User Registration**: `BookNestAPI.auth.register()`
2. **User Login**: `BookNestAPI.auth.login()`
3. **Session Verification**: `BookNestAuth.checkSession()`
4. **User Logout**: `BookNestAPI.auth.logout()`
5. **Forgot Password & Reset**: `BookNestAPI.auth.forgotPassword()`, `BookNestAPI.auth.resetPassword()`
6. **Books Catalogue Fetching**: `BookNestAPI.books.getAll()`
7. **Book Details Retrieval**: `BookNestAPI.books.getById()`
8. **Parallel Multi-Data Loading**: `Promise.all([fetchBooksCatalog(), BookNestAuth.checkSession(), BookNestAPI.dashboard.getData()])`
9. **Book Borrowing**: `BookNestAPI.books.borrow()`
10. **Book Returning**: `BookNestAPI.borrowings.returnBook()`
11. **Book Reservations**: `BookNestAPI.books.reserve()`
12. **Cancel Reservations**: `BookNestAPI.reservations.cancel()`
13. **Dashboard Data Loading**: `BookNestAPI.dashboard.getData()`
14. **Profile Updates**: `BookNestAPI.auth.updateProfile()`
15. **Password Changes**: `BookNestAPI.auth.changePassword()`
16. **Contact Form Inquiries**: `BookNestAPI.contact.submit()`
17. **Newsletter Subscriptions**: `BookNestAPI.newsletter.subscribe()`
18. **Destructive Action Confirmations**: `window.showConfirmDialog()` returns a native Promise

---

## 📁 Project Structure

```
LIBRARY-MANAGMENT/
├── assets/
│   ├── css/
│   │   ├── variables.css      # Theme colors, spacing, typography tokens
│   │   ├── style.css          # Core layouts, cards, modals, toast alerts
│   │   ├── responsive.css     # Mobile, tablet, desktop breakpoints
│   │   └── animations.css     # Scroll reveal, shimmers, pulse effects
│   ├── js/
│   │   ├── api.js             # Promise-based REST API client module
│   │   ├── auth.js            # Route protection, session manager, dynamic navbar
│   │   ├── main.js            # Theme toggle, dialogs, newsletter, modals
│   │   ├── books.js           # Catalog search/filter/sort, borrow/reserve/return
│   │   ├── dashboard.js       # Dashboard stats, issued table, reservations, profile
│   │   ├── validation.js      # Forms validation (login, register, contact, forgot pwd)
│   │   └── gallery.js         # Lightbox modal viewer & keyboard controls
│   └── images/                # Book covers, logos, facilities, gallery photos
├── data/
│   └── books.json             # Initial base book catalogue
├── server/
│   └── data/                  # Persistent server storage (users, borrowings, reservations, contacts)
├── server.js                  # Node.js Express backend server
├── test_all.js                # Automated end-to-end integration test suite
├── index.html                 # Public home page
├── books.html                 # Books catalog with live search & filters
├── book-details.html          # Selected book details, borrow & reserve actions
├── login.html                 # Login page with password toggle & forgot password
├── register.html              # Registration with password strength meter
├── user-dashboard.html        # Member dashboard with issued, reserved, history tabs
├── about.html                 # About BookNest, facilities, objectives
├── gallery.html               # Visual facilities gallery with modal viewer
├── contact.html               # Contact inquiry form & office details
└── package.json               # Node.js scripts and dependencies
```

---

## 🧪 Testing

To run the automated integration test suite:
```bash
node test_all.js
```
The test suite validates 29 test cases across authentication, password hashing, sessions, catalog querying, live availability tracking, 14-day loan policies, return handling, reservations, profile editing, and contact forms.
