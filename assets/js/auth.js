/**
 * BookNest Library Management System - Authentication & Session Manager
 * Built with Vanilla JavaScript, Native Promises, Async/Await
 */

const BookNestAuth = (function () {
  let currentUser = null;
  let authCheckPromise = null;

  /**
   * Promise-based verification of current session against the server
   */
  function checkSession() {
    if (!window.BookNestAPI) {
      return Promise.reject(new Error('BookNestAPI not loaded'));
    }

    const token = window.BookNestAPI.getToken();
    if (!token) {
      currentUser = null;
      updateNavbar(null);
      return Promise.resolve(null);
    }

    // Reuse in-flight promise if multiple components check simultaneously
    if (authCheckPromise) {
      return authCheckPromise;
    }

    authCheckPromise = new Promise((resolve) => {
      window.BookNestAPI.auth.getProfile()
        .then((res) => {
          if (res && res.success && res.user) {
            currentUser = res.user;
            updateNavbar(currentUser);
            resolve(currentUser);
          } else {
            currentUser = null;
            window.BookNestAPI.removeToken();
            updateNavbar(null);
            resolve(null);
          }
        })
        .catch(() => {
          currentUser = null;
          window.BookNestAPI.removeToken();
          updateNavbar(null);
          resolve(null);
        })
        .finally(() => {
          authCheckPromise = null;
        });
    });

    return authCheckPromise;
  }

  function getCurrentUser() {
    return currentUser;
  }

  /**
   * Guard for protected pages (Dashboard, borrowing, profile, reservations)
   */
  function requireAuth(redirectPath = null) {
    return new Promise((resolve, reject) => {
      checkSession().then((user) => {
        if (!user) {
          const currentUrl = encodeURIComponent(redirectPath || window.location.pathname + window.location.search);
          if (window.showCustomAlert) {
            window.showCustomAlert('Please log in to access this protected library service.', 'warning');
          }
          setTimeout(() => {
            window.location.replace(`login.html?redirect=${currentUrl}`);
          }, 300);
          reject(new Error('Unauthorized'));
        } else {
          resolve(user);
        }
      });
    });
  }

  /**
   * Guard for guest pages (login.html, register.html) - prevent logged in users from re-entering
   */
  function redirectIfAuthenticated(targetUrl = 'user-dashboard.html') {
    return new Promise((resolve) => {
      checkSession().then((user) => {
        if (user) {
          window.location.replace(targetUrl);
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }

  /**
   * Logout handler with session invalidation
   */
  function logout() {
    return new Promise((resolve) => {
      const finishLogout = () => {
        currentUser = null;
        updateNavbar(null);
        if (window.showCustomAlert) {
          window.showCustomAlert('You have been logged out securely.', 'success');
        }
        setTimeout(() => {
          window.location.replace('index.html');
          resolve();
        }, 800);
      };

      if (window.BookNestAPI) {
        window.BookNestAPI.auth.logout()
          .then(finishLogout)
          .catch(finishLogout);
      } else {
        finishLogout();
      }
    });
  }

  /**
   * Dynamically update navbar elements on all pages
   */
  function updateNavbar(user) {
    const guestLinks = document.querySelectorAll('.guest-only');
    const userLinks = document.querySelectorAll('.user-only');
    const userWelcomeText = document.getElementById('user-welcome-text');

    if (user) {
      guestLinks.forEach(el => { el.style.display = 'none'; });
      userLinks.forEach(el => { el.style.display = 'inline-flex'; });
      if (userWelcomeText) {
        userWelcomeText.textContent = `Welcome, ${user.name || user.username}`;
      }
    } else {
      guestLinks.forEach(el => { el.style.display = 'inline-flex'; });
      userLinks.forEach(el => { el.style.display = 'none'; });
      if (userWelcomeText) {
        userWelcomeText.textContent = '';
      }
    }

    // Attach logout click listener
    const logoutBtns = document.querySelectorAll('#logout-btn, .action-logout-btn, #dashboard-sidebar-logout');
    logoutBtns.forEach(btn => {
      // Remove prior listeners by cloning or replace
      btn.onclick = (e) => {
        e.preventDefault();
        logout();
      };
    });
  }

  // Handle browser Back button cache (bfcache) - prevent restoring protected views after logout
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      checkSession().then((user) => {
        const isDashboard = window.location.pathname.includes('user-dashboard');
        if (isDashboard && !user) {
          window.location.replace('login.html');
        }
      });
    }
  });

  // Listen for session expiry from API calls
  window.addEventListener('auth:expired', () => {
    currentUser = null;
    updateNavbar(null);
    if (window.showCustomAlert) {
      window.showCustomAlert('Your session has expired. Please sign in again.', 'warning');
    }
    const isDashboard = window.location.pathname.includes('user-dashboard');
    if (isDashboard) {
      setTimeout(() => {
        window.location.replace('login.html');
      }, 1000);
    }
  });

  // Initialize navbar on page load
  document.addEventListener('DOMContentLoaded', () => {
    checkSession();
  });

  return {
    checkSession,
    getCurrentUser,
    requireAuth,
    redirectIfAuthenticated,
    logout,
    updateNavbar
  };
})();

// Attach globally
window.BookNestAuth = BookNestAuth;
