
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavbar();
  initScrollEffects();
  initScrollReveal();
  checkUserSession();
});

function initNavbar() {
  const header = document.querySelector('header');
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
    });

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
      });
    });
  }

  const currentPath = window.location.pathname;
  const pageName = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === pageName) {
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
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => observer.observe(el));
  } else {

    revealElements.forEach(el => el.classList.add('revealed'));
  }
}

function checkUserSession() {
  const currentUserJson = localStorage.getItem('currentUser');
  const guestLinks = document.querySelectorAll('.guest-only');
  const userLinks = document.querySelectorAll('.user-only');
  const userWelcomeText = document.getElementById('user-welcome-text');

  if (currentUserJson) {
    const currentUser = JSON.parse(currentUserJson);

    guestLinks.forEach(el => el.style.display = 'none');
    userLinks.forEach(el => el.style.display = 'flex');
    if (userWelcomeText) {
      userWelcomeText.textContent = `Welcome, ${currentUser.name || currentUser.username}`;
    }
  } else {

    guestLinks.forEach(el => el.style.display = 'flex');
    userLinks.forEach(el => el.style.display = 'none');
    if (userWelcomeText) {
      userWelcomeText.textContent = '';
    }
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('currentUser');
      showCustomAlert('Logout successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
    });
  }
}

window.showCustomAlert = function(message, type = 'info') {

  const existingAlert = document.querySelector('.custom-alert');
  if (existingAlert) {
    existingAlert.remove();
  }

  const alertDiv = document.createElement('div');
  alertDiv.className = `custom-alert ${type}`;
  
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
  }, 10);

  setTimeout(() => {
    alertDiv.classList.remove('active');
    setTimeout(() => {
      alertDiv.remove();
    }, 400);
  }, 3000);
};

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
