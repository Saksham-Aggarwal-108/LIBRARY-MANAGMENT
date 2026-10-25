/**
 * BookNest Library Management System - Main Application Logic
 * Pure Vanilla JavaScript (ES6+), Promises, Micro-interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavbar();
  initScrollEffects();
  initScrollReveal();
  initPrivacyModal();
  initSocialLinks();
  initNewsletterForm();
});

function initNavbar() {
  const header = document.querySelector('header');
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  
  window.addEventListener('scroll', () => {
    if (header) {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  });

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
      navToggle.setAttribute('aria-expanded', navToggle.classList.contains('active'));
    });

    const navLinks = document.querySelectorAll('.nav-link, .btn');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Highlight active link
  const currentPath = window.location.pathname;
  const pageName = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && (href === pageName || (pageName === '' && href === 'index.html'))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

function initScrollEffects() {
  const backToTopBtn = document.querySelector('.back-to-top');
  
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
}

function initScrollReveal() {
  const revealElements = document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right');
  
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => observer.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('revealed'));
  }
}

function initTheme() {
  const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');
  
  const updateAriaLabel = (isDark) => {
    themeToggleBtns.forEach(btn => {
      btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    });
  };

  const isDark = document.documentElement.classList.contains('dark-mode');
  updateAriaLabel(isDark);

  themeToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const currentlyDark = document.documentElement.classList.contains('dark-mode');
      if (currentlyDark) {
        document.documentElement.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
        updateAriaLabel(false);
      } else {
        document.documentElement.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
        updateAriaLabel(true);
      }
    });
  });
}

/**
 * Global Custom Toast Notification
 */
window.showCustomAlert = function(message, type = 'info') {
  const existingAlert = document.querySelector('.custom-alert');
  if (existingAlert) {
    existingAlert.remove();
  }

  const alertDiv = document.createElement('div');
  alertDiv.className = `custom-alert ${type}`;
  alertDiv.setAttribute('role', 'status');
  alertDiv.setAttribute('aria-live', 'polite');
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';
  if (type === 'warning') icon = '⚠️';

  alertDiv.innerHTML = `
    <span class="custom-alert-icon">${icon}</span>
    <span class="custom-alert-message">${message}</span>
  `;

  document.body.appendChild(alertDiv);

  setTimeout(() => {
    alertDiv.classList.add('active');
  }, 15);

  setTimeout(() => {
    alertDiv.classList.remove('active');
    setTimeout(() => {
      alertDiv.remove();
    }, 400);
  }, 3500);
};

/**
 * Global Promise-Based Confirmation Dialog
 */
window.showConfirmDialog = function(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
  return new Promise((resolve) => {
    const existing = document.getElementById('bn-confirm-modal');
    if (existing) existing.remove();

    const backdrop = document.createElement('div');
    backdrop.id = 'bn-confirm-modal';
    backdrop.className = 'bn-modal-backdrop';
    backdrop.innerHTML = `
      <div class="bn-modal-card" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
        <div class="bn-modal-header">
          <h3 id="confirm-modal-title">${title}</h3>
          <button type="button" class="bn-modal-close" id="confirm-cancel-x" aria-label="Close dialog">&times;</button>
        </div>
        <div class="bn-modal-body">
          <p>${message}</p>
        </div>
        <div class="bn-modal-footer">
          <button type="button" class="btn btn-secondary btn-sm" id="confirm-btn-cancel">${cancelText}</button>
          <button type="button" class="btn btn-primary btn-sm" id="confirm-btn-ok">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    setTimeout(() => backdrop.classList.add('active'), 20);

    const cleanup = (result) => {
      backdrop.classList.remove('active');
      setTimeout(() => backdrop.remove(), 300);
      resolve(result);
    };

    document.getElementById('confirm-btn-ok').onclick = () => cleanup(true);
    document.getElementById('confirm-btn-cancel').onclick = () => cleanup(false);
    document.getElementById('confirm-cancel-x').onclick = () => cleanup(false);

    backdrop.onclick = (e) => {
      if (e.target === backdrop) cleanup(false);
    };

    const keyHandler = (e) => {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', keyHandler);
        cleanup(false);
      }
    };
    document.addEventListener('keydown', keyHandler);
  });
};

/**
 * Privacy Policy Modal Dialog
 */
function initPrivacyModal() {
  document.querySelectorAll('footer a, a.privacy-policy-link').forEach(a => {
    if (a.textContent.trim().toLowerCase().includes('privacy policy')) {
      a.setAttribute('href', '#privacy-policy');
      a.addEventListener('click', (e) => {
        e.preventDefault();
        openPrivacyPolicyModal();
      });
    }
  });
}

function openPrivacyPolicyModal() {
  let modal = document.getElementById('privacy-policy-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'privacy-policy-modal';
    modal.className = 'bn-modal-backdrop';
    modal.innerHTML = `
      <div class="bn-modal-card" role="dialog" aria-modal="true" aria-labelledby="privacy-modal-title">
        <div class="bn-modal-header">
          <h3 id="privacy-modal-title">BookNest Privacy Policy</h3>
          <button type="button" class="bn-modal-close" id="privacy-modal-close" aria-label="Close modal">&times;</button>
        </div>
        <div class="bn-modal-body">
          <p><strong>Effective Date:</strong> October 2026</p>
          <p style="margin-top: 10px;">At <strong>BookNest Library Management System</strong>, your academic privacy and personal data integrity are our highest priorities.</p>
          <h4 style="margin: 15px 0 5px; color: var(--accent-color);">1. Data We Collect</h4>
          <p>We only store information necessary for academic library operations: your name, library card ID, email address, password hash, and library borrowing records.</p>
          <h4 style="margin: 15px 0 5px; color: var(--accent-color);">2. Security & Passwords</h4>
          <p>All passwords are cryptographically salted and hashed. We never store plaintext passwords or share your reading records with third-party advertising services.</p>
          <h4 style="margin: 15px 0 5px; color: var(--accent-color);">3. Account Rights</h4>
          <p>You can review, update, or modify your profile details and change your security credentials at any time from your member dashboard.</p>
        </div>
        <div class="bn-modal-footer">
          <button type="button" class="btn btn-primary btn-sm" id="privacy-modal-ok">Got it</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeModal = () => modal.classList.remove('active');
    document.getElementById('privacy-modal-close').onclick = closeModal;
    document.getElementById('privacy-modal-ok').onclick = closeModal;
    modal.onclick = (e) => { if (e.target === modal) closeModal(); };
  }

  modal.classList.add('active');
}

/**
 * Working Social Links (prevents dead href="#")
 */
function initSocialLinks() {
  const socials = document.querySelectorAll('.footer-social-link');
  socials.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const platform = link.getAttribute('aria-label') || 'Social media';
      window.showCustomAlert(`Visiting BookNest official ${platform} community.`, 'info');
    });
  });
}

/**
 * Newsletter Form Submission with Native Promises
 */
function initNewsletterForm() {
  const newsForm = document.getElementById('newsletter-form');
  if (!newsForm) return;

  newsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = newsForm.querySelector('input[type="email"]');
    const submitBtn = newsForm.querySelector('button[type="submit"]');

    if (!input || !input.value.trim()) {
      window.showCustomAlert('Please enter a valid email address.', 'error');
      return;
    }

    const email = input.value.trim();

    if (submitBtn) {
      submitBtn.classList.add('btn-loading');
      submitBtn.disabled = true;
    }

    if (window.BookNestAPI) {
      window.BookNestAPI.newsletter.subscribe(email)
        .then((res) => {
          window.showCustomAlert(res.message || 'Subscribed successfully!', 'success');
          newsForm.reset();
        })
        .catch((err) => {
          window.showCustomAlert(err.message || 'Subscription failed. Please try again.', 'error');
        })
        .finally(() => {
          if (submitBtn) {
            submitBtn.classList.remove('btn-loading');
            submitBtn.disabled = false;
          }
        });
    } else {
      window.showCustomAlert('Subscribed successfully!', 'success');
      newsForm.reset();
      if (submitBtn) {
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
      }
    }
  });
}
