/**
 * BookNest Library Management System - API Client Module
 * Built with Vanilla JavaScript, Native Promises, Async/Await, and Fetch API
 */

const BookNestAPI = (function () {
  // Use current origin if running on HTTP server, or fallback to localhost:3000
  const BASE_URL = (window.location.protocol.startsWith('http')) 
    ? `${window.location.origin}/api` 
    : 'http://localhost:3000/api';

  const TOKEN_KEY = 'bn_session_token';

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
  }

  function setToken(token, persist = false) {
    if (persist) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  function removeToken() {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }

  /**
   * Core Promise-based HTTP Request wrapper
   * Explicitly utilizes new Promise, fetch, async/await, and error propagation
   */
  function request(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
      const url = `${BASE_URL}${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      };

      const token = getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const fetchOptions = {
        ...options,
        headers
      };

      fetch(url, fetchOptions)
        .then(async (response) => {
          let json;
          try {
            json = await response.json();
          } catch (e) {
            json = { success: false, message: response.statusText || 'Invalid response from server' };
          }

          if (response.ok && json.success !== false) {
            resolve(json);
          } else {
            // If session expired or unauthorized, emit session error
            if (response.status === 401) {
              removeToken();
              window.dispatchEvent(new CustomEvent('auth:expired', { detail: json }));
            }
            const err = new Error(json.message || `Request failed with status ${response.status}`);
            err.status = response.status;
            err.data = json;
            reject(err);
          }
        })
        .catch((error) => {
          console.error(`API Network Error [${options.method || 'GET'} ${endpoint}]:`, error);
          const customError = new Error(
            error.message.includes('Failed to fetch')
              ? 'Unable to connect to BookNest backend server. Please verify the server is running.'
              : error.message
          );
          reject(customError);
        });
    });
  }

  return {
    getToken,
    setToken,
    removeToken,

    // Authentication API
    auth: {
      register(userData) {
        return request('/auth/register', {
          method: 'POST',
          body: JSON.stringify(userData)
        });
      },

      login(credentials) {
        return request('/auth/login', {
          method: 'POST',
          body: JSON.stringify(credentials)
        }).then(data => {
          if (data.token) {
            setToken(data.token, !!credentials.remember);
          }
          return data;
        });
      },

      getProfile() {
        return request('/auth/me', {
          method: 'GET'
        });
      },

      logout() {
        return request('/auth/logout', {
          method: 'POST'
        }).finally(() => {
          removeToken();
        });
      },

      forgotPassword(identifier) {
        return request('/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ identifier })
        });
      },

      resetPassword(payload) {
        return request('/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      },

      updateProfile(profileData) {
        return request('/auth/profile', {
          method: 'PUT',
          body: JSON.stringify(profileData)
        });
      },

      changePassword(passwordData) {
        return request('/auth/change-password', {
          method: 'PUT',
          body: JSON.stringify(passwordData)
        });
      }
    },

    // Books Catalog API
    books: {
      getAll() {
        return request('/books', {
          method: 'GET'
        });
      },

      getById(id) {
        return request(`/books/${id}`, {
          method: 'GET'
        });
      },

      borrow(bookId) {
        return request(`/books/${bookId}/borrow`, {
          method: 'POST'
        });
      },

      reserve(bookId) {
        return request(`/books/${bookId}/reserve`, {
          method: 'POST'
        });
      }
    },

    // Transactions API
    borrowings: {
      returnBook(borrowingId) {
        return request(`/borrowings/${borrowingId}/return`, {
          method: 'POST'
        });
      }
    },

    // Reservations API
    reservations: {
      cancel(reservationId) {
        return request(`/reservations/${reservationId}/cancel`, {
          method: 'POST'
        });
      }
    },

    // Dashboard API
    dashboard: {
      getData() {
        return request('/dashboard', {
          method: 'GET'
        });
      }
    },

    // Inquiries & Community
    contact: {
      submit(contactData) {
        return request('/contact', {
          method: 'POST',
          body: JSON.stringify(contactData)
        });
      }
    },

    newsletter: {
      subscribe(email) {
        return request('/newsletter', {
          method: 'POST',
          body: JSON.stringify({ email })
        });
      }
    }
  };
})();

// Attach globally
window.BookNestAPI = BookNestAPI;
