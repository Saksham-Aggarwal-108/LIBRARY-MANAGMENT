/**
 * BookNest AI Assistant - "Kaira" API Client Module
 * Built strictly with Vanilla JavaScript and native JavaScript Promises
 * Supports: new Promise, async/await, .then(), .catch(), .finally()
 */

const BookNestChatbotAPI = (function () {
  const BASE_URL = (window.location.protocol.startsWith('http'))
    ? `${window.location.origin}/api/chatbot`
    : 'http://localhost:3000/api/chatbot';

  /**
   * Helper to fetch the current user auth token if present
   */
  function getAuthToken() {
    if (window.BookNestAPI && typeof window.BookNestAPI.getToken === 'function') {
      return window.BookNestAPI.getToken();
    }
    return sessionStorage.getItem('bn_session_token') || localStorage.getItem('bn_session_token');
  }

  /**
   * Send a message to Kaira AI Chatbot
   * @param {string} message - User query
   * @param {string} conversationId - Optional conversation tracking ID
   * @returns {Promise<Object>} Promise resolving to response { success, reply, books, suggestions, conversationId }
   */
  function sendMessage(message, conversationId = null) {
    return new Promise((resolve, reject) => {
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return reject(new Error('Please type a message before sending.'));
      }

      const headers = {
        'Content-Type': 'application/json'
      };

      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const payload = {
        message: message.trim(),
        conversationId: conversationId || undefined
      };

      fetch(`${BASE_URL}/message`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      })
        .then(async (response) => {
          let data;
          try {
            data = await response.json();
          } catch (e) {
            data = { success: false, message: 'Invalid response format from server.' };
          }

          if (response.ok && data.success !== false) {
            resolve(data);
          } else {
            const error = new Error(data.message || `Chatbot request failed with status ${response.status}`);
            error.status = response.status;
            error.data = data;
            reject(error);
          }
        })
        .catch((error) => {
          console.error('Chatbot API Network Error:', error);
          const customError = new Error(
            error.message && error.message.includes('Failed to fetch')
              ? 'Unable to connect to BookNest AI Assistant. Please check your network connection.'
              : error.message || 'Connection error'
          );
          reject(customError);
        });
    });
  }

  /**
   * Clear the current conversation context on the server
   * @param {string} conversationId
   * @returns {Promise<Object>}
   */
  function clearConversation(conversationId) {
    return new Promise((resolve, reject) => {
      fetch(`${BASE_URL}/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId })
      })
        .then(async (res) => {
          try {
            const json = await res.json();
            resolve(json);
          } catch (e) {
            resolve({ success: true });
          }
        })
        .catch((err) => {
          console.warn('Failed to clear conversation on server:', err);
          resolve({ success: true }); // Graceful fallback
        });
    });
  }

  return {
    sendMessage,
    clearConversation
  };
})();

// Attach globally
window.BookNestChatbotAPI = BookNestChatbotAPI;
