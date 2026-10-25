/**
 * BookNest Library Management System - Form Validation & Authentication Flow
 * Pure Vanilla JavaScript (ES6+), Native Promises, Async/Await
 */

document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggles();
  initContactValidation();
  initLoginValidation();
  initRegisterValidation();
  initForgotPasswordModal();
});

// Common Validation Utility Functions
const isRequired = value => value && value.trim() !== '';

const isValidEmail = email => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

const isValidPhone = phone => {
  const re = /^\+?[0-9]{10,14}$/;
  return re.test(phone.replace(/[\s-()]/g, ''));
};

function showError(input, message) {
  if (!input) return;
  const formGroup = input.parentElement.closest('.form-group') || input.parentElement;
  input.classList.remove('success');
  input.classList.add('error');
  
  let errorEl = formGroup.querySelector('.error-msg');
  if (!errorEl) {
    errorEl = document.createElement('div');
    errorEl.className = 'error-msg';
    formGroup.appendChild(errorEl);
  }
  errorEl.textContent = message;
  errorEl.style.display = 'block';
}

function showSuccess(input) {
  if (!input) return;
  const formGroup = input.parentElement.closest('.form-group') || input.parentElement;
  input.classList.remove('error');
  input.classList.add('success');
  
  const errorEl = formGroup.querySelector('.error-msg');
  if (errorEl) {
    errorEl.style.display = 'none';
  }
}

function clearFieldStatus(input) {
  if (!input) return;
  const formGroup = input.parentElement.closest('.form-group') || input.parentElement;
  input.classList.remove('error');
  input.classList.remove('success');
  const errorEl = formGroup.querySelector('.error-msg');
  if (errorEl) errorEl.style.display = 'none';
}

// Password Visibility Toggles
function initPasswordToggles() {
  const passwordWraps = document.querySelectorAll('.password-input-wrap');
  passwordWraps.forEach(wrap => {
    const toggleBtn = wrap.querySelector('.password-toggle-btn');
    const input = wrap.querySelector('input');
    
    if (toggleBtn && input) {
      toggleBtn.type = 'button';
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        toggleBtn.textContent = type === 'password' ? '👁️' : '🙈';
        toggleBtn.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
      });
    }
  });
}

/**
 * 1. Contact Form Validation with Native Promises
 */
function initContactValidation() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const nameEl = document.getElementById('contact-name');
  const emailEl = document.getElementById('contact-email');
  const phoneEl = document.getElementById('contact-phone');
  const msgEl = document.getElementById('contact-message');
  const submitBtn = form.querySelector('button[type="submit"]');

  const checkName = () => {
    const name = nameEl.value.trim();
    if (!isRequired(name)) {
      showError(nameEl, 'Full name cannot be blank.');
      return false;
    }
    showSuccess(nameEl);
    return true;
  };

  const checkEmail = () => {
    const email = emailEl.value.trim();
    if (!isRequired(email)) {
      showError(emailEl, 'Email address cannot be blank.');
      return false;
    }
    if (!isValidEmail(email)) {
      showError(emailEl, 'Please enter a valid email address.');
      return false;
    }
    showSuccess(emailEl);
    return true;
  };

  const checkPhone = () => {
    const phone = phoneEl.value.trim();
    if (!isRequired(phone)) {
      showError(phoneEl, 'Phone number cannot be blank.');
      return false;
    }
    if (!isValidPhone(phone)) {
      showError(phoneEl, 'Phone must be a valid number (10-14 digits).');
      return false;
    }
    showSuccess(phoneEl);
    return true;
  };

  const checkMsg = () => {
    const msg = msgEl.value.trim();
    if (!isRequired(msg)) {
      showError(msgEl, 'Inquiry message cannot be blank.');
      return false;
    }
    if (msg.length < 10) {
      showError(msgEl, 'Message must be at least 10 characters.');
      return false;
    }
    showSuccess(msgEl);
    return true;
  };

  nameEl.addEventListener('input', checkName);
  emailEl.addEventListener('input', checkEmail);
  phoneEl.addEventListener('input', checkPhone);
  msgEl.addEventListener('input', checkMsg);

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const isNameValid = checkName();
    const isEmailValid = checkEmail();
    const isPhoneValid = checkPhone();
    const isMsgValid = checkMsg();

    if (!isNameValid || !isEmailValid || !isPhoneValid || !isMsgValid) {
      window.showCustomAlert('Please correct the highlighted form errors.', 'error');
      return;
    }

    const payload = {
      name: nameEl.value.trim(),
      email: emailEl.value.trim(),
      phone: phoneEl.value.trim(),
      message: msgEl.value.trim()
    };

    if (submitBtn) {
      submitBtn.classList.add('btn-loading');
      submitBtn.disabled = true;
    }

    // Submit via Promise-based API call
    window.BookNestAPI.contact.submit(payload)
      .then((res) => {
        window.showCustomAlert(res.message || 'Thank you! Your message was sent successfully.', 'success');
        form.reset();
        [nameEl, emailEl, phoneEl, msgEl].forEach(clearFieldStatus);
      })
      .catch((err) => {
        window.showCustomAlert(err.message || 'Failed to submit inquiry. Please try again.', 'error');
      })
      .finally(() => {
        if (submitBtn) {
          submitBtn.classList.remove('btn-loading');
          submitBtn.disabled = false;
        }
      });
  });
}

/**
 * 2. Login Form Validation with Native Promises
 */
function initLoginValidation() {
  const form = document.getElementById('login-form');
  if (!form) return;

  // If already authenticated, redirect to dashboard
  if (window.BookNestAuth) {
    window.BookNestAuth.redirectIfAuthenticated('user-dashboard.html');
  }

  const userEl = document.getElementById('login-username');
  const passwordEl = document.getElementById('login-password');
  const rememberEl = document.getElementById('login-remember');
  const submitBtn = form.querySelector('button[type="submit"]');

  const checkUser = () => {
    if (!isRequired(userEl.value.trim())) {
      showError(userEl, 'Username or Email is required.');
      return false;
    }
    showSuccess(userEl);
    return true;
  };

  const checkPassword = () => {
    if (!isRequired(passwordEl.value.trim())) {
      showError(passwordEl, 'Password is required.');
      return false;
    }
    showSuccess(passwordEl);
    return true;
  };

  userEl.addEventListener('input', checkUser);
  passwordEl.addEventListener('input', checkPassword);

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const isUserValid = checkUser();
    const isPassValid = checkPassword();

    if (!isUserValid || !isPassValid) {
      window.showCustomAlert('Please provide both username/email and password.', 'error');
      return;
    }

    const credentials = {
      username: userEl.value.trim(),
      password: passwordEl.value,
      remember: rememberEl ? rememberEl.checked : false
    };

    if (submitBtn) {
      submitBtn.classList.add('btn-loading');
      submitBtn.disabled = true;
    }

    // Promise-based login request to backend
    window.BookNestAPI.auth.login(credentials)
      .then((response) => {
        window.showCustomAlert(response.message || 'Login successful!', 'success');
        
        // Update navbar immediately
        if (window.BookNestAuth) {
          window.BookNestAuth.checkSession();
        }

        // Determine destination redirect
        const urlParams = new URLSearchParams(window.location.search);
        const destination = urlParams.get('redirect') ? decodeURIComponent(urlParams.get('redirect')) : 'user-dashboard.html';

        setTimeout(() => {
          window.location.replace(destination);
        }, 1000);
      })
      .catch((err) => {
        showError(userEl, 'Invalid credentials.');
        showError(passwordEl, 'Invalid credentials.');
        window.showCustomAlert(err.message || 'Login failed. Please verify your credentials.', 'error');
      })
      .finally(() => {
        if (submitBtn) {
          submitBtn.classList.remove('btn-loading');
          submitBtn.disabled = false;
        }
      });
  });
}

/**
 * 3. Register Form Validation with Native Promises
 */
function initRegisterValidation() {
  const form = document.getElementById('register-form');
  if (!form) return;

  // If already authenticated, redirect to dashboard
  if (window.BookNestAuth) {
    window.BookNestAuth.redirectIfAuthenticated('user-dashboard.html');
  }

  const nameEl = document.getElementById('reg-name');
  const userEl = document.getElementById('reg-username');
  const emailEl = document.getElementById('reg-email');
  const passwordEl = document.getElementById('reg-password');
  const confirmEl = document.getElementById('reg-confirm-password');
  const submitBtn = form.querySelector('button[type="submit"]');

  const strengthBar = document.querySelector('.strength-bar');
  const strengthText = document.querySelector('.strength-text');

  const checkName = () => {
    if (!isRequired(nameEl.value.trim())) {
      showError(nameEl, 'Full name cannot be blank.');
      return false;
    }
    showSuccess(nameEl);
    return true;
  };

  const checkUsername = () => {
    const val = userEl.value.trim();
    if (!isRequired(val)) {
      showError(userEl, 'Username cannot be blank.');
      return false;
    }
    if (val.length < 4) {
      showError(userEl, 'Username must be at least 4 characters long.');
      return false;
    }
    showSuccess(userEl);
    return true;
  };

  const checkEmail = () => {
    const val = emailEl.value.trim();
    if (!isRequired(val)) {
      showError(emailEl, 'Email cannot be blank.');
      return false;
    }
    if (!isValidEmail(val)) {
      showError(emailEl, 'Email format is invalid.');
      return false;
    }
    showSuccess(emailEl);
    return true;
  };

  const evaluatePassword = () => {
    const pwd = passwordEl.value;
    let strength = 0;
    
    if (pwd.length >= 6) strength += 1;
    if (pwd.length >= 10) strength += 1;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength += 1;
    if (/[0-9]/.test(pwd)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) strength += 1;

    let width = '0%';
    let color = '#ef4444';
    let text = 'Too short';

    if (pwd.length > 0) {
      if (strength <= 1) {
        width = '25%';
        color = '#ef4444';
        text = 'Weak';
      } else if (strength === 2 || strength === 3) {
        width = '60%';
        color = '#f59e0b';
        text = 'Medium Strength';
      } else if (strength >= 4) {
        width = '100%';
        color = '#10b981';
        text = 'Strong Password';
      }
    } else {
      text = '';
    }

    if (strengthBar) {
      strengthBar.style.width = width;
      strengthBar.style.backgroundColor = color;
    }
    if (strengthText) {
      strengthText.textContent = text;
      strengthText.style.color = color;
    }

    return strength;
  };

  const checkPassword = () => {
    const pwd = passwordEl.value;
    if (!isRequired(pwd)) {
      showError(passwordEl, 'Password cannot be empty.');
      return false;
    }
    if (pwd.length < 6) {
      showError(passwordEl, 'Password must be at least 6 characters.');
      return false;
    }
    showSuccess(passwordEl);
    return true;
  };

  const checkConfirmPassword = () => {
    const pwd = passwordEl.value;
    const confirm = confirmEl.value;

    if (!isRequired(confirm)) {
      showError(confirmEl, 'Please confirm your password.');
      return false;
    }
    if (pwd !== confirm) {
      showError(confirmEl, 'Passwords do not match.');
      return false;
    }
    showSuccess(confirmEl);
    return true;
  };

  nameEl.addEventListener('input', checkName);
  userEl.addEventListener('input', checkUsername);
  emailEl.addEventListener('input', checkEmail);
  passwordEl.addEventListener('input', () => {
    evaluatePassword();
    checkPassword();
  });
  confirmEl.addEventListener('input', checkConfirmPassword);

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const isNameValid = checkName();
    const isUserValid = checkUsername();
    const isEmailValid = checkEmail();
    const isPassValid = checkPassword();
    const isConfValid = checkConfirmPassword();

    if (!isNameValid || !isUserValid || !isEmailValid || !isPassValid || !isConfValid) {
      window.showCustomAlert('Please resolve the errors highlighted on the form.', 'error');
      return;
    }

    const payload = {
      name: nameEl.value.trim(),
      username: userEl.value.trim(),
      email: emailEl.value.trim(),
      password: passwordEl.value
    };

    if (submitBtn) {
      submitBtn.classList.add('btn-loading');
      submitBtn.disabled = true;
    }

    // Promise-based registration request to backend
    window.BookNestAPI.auth.register(payload)
      .then((res) => {
        window.showCustomAlert(res.message || 'Registration successful! Redirecting to login...', 'success');
        form.reset();
        [nameEl, userEl, emailEl, passwordEl, confirmEl].forEach(clearFieldStatus);
        
        setTimeout(() => {
          window.location.replace('login.html');
        }, 1500);
      })
      .catch((err) => {
        if (err.message.includes('Username')) {
          showError(userEl, err.message);
        } else if (err.message.includes('Email')) {
          showError(emailEl, err.message);
        }
        window.showCustomAlert(err.message || 'Registration failed.', 'error');
      })
      .finally(() => {
        if (submitBtn) {
          submitBtn.classList.remove('btn-loading');
          submitBtn.disabled = false;
        }
      });
  });
}

/**
 * 4. Forgot Password Flow with Native Promises & Multi-step Verification
 */
function initForgotPasswordModal() {
  const triggerBtn = document.getElementById('forgot-password-link');
  if (!triggerBtn) return;

  triggerBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openForgotPasswordModal();
  });
}

function openForgotPasswordModal() {
  let modal = document.getElementById('forgot-password-modal');
  if (modal) modal.remove();

  modal = document.createElement('div');
  modal.id = 'forgot-password-modal';
  modal.className = 'bn-modal-backdrop';
  modal.innerHTML = `
    <div class="bn-modal-card" role="dialog" aria-modal="true" aria-labelledby="fp-title">
      <div class="bn-modal-header">
        <h3 id="fp-title">Reset Your Password</h3>
        <button type="button" class="bn-modal-close" id="fp-close-btn" aria-label="Close dialog">&times;</button>
      </div>
      <div class="bn-modal-body">
        
        <!-- Step 1: Identifier Input -->
        <div id="fp-step-1">
          <p style="margin-bottom: 15px; color: var(--text-muted); font-size: 0.95rem;">
            Enter your registered username or email address. We will generate a verification code to authenticate your identity.
          </p>
          <div class="form-group">
            <label for="fp-identifier">Username or Email</label>
            <input type="text" id="fp-identifier" class="form-control" placeholder="e.g. student or student@library.com">
          </div>
          <button type="button" class="btn btn-primary" id="fp-submit-step1" style="width: 100%; margin-top: 10px;">
            Send Reset Code
          </button>
        </div>

        <!-- Step 2: Code Verification & New Password -->
        <div id="fp-step-2" style="display: none;">
          <div id="fp-demo-notice" style="background: var(--accent-light); padding: 10px 14px; border-radius: 6px; font-size: 0.85rem; color: var(--accent-hover); margin-bottom: 15px; border-left: 3px solid var(--accent-color);">
            Verification code sent!
          </div>

          <div class="form-group">
            <label for="fp-code">6-Digit Verification Code</label>
            <input type="text" id="fp-code" class="form-control" placeholder="Enter 6-digit code">
          </div>

          <div class="form-group">
            <label for="fp-new-password">New Password</label>
            <div class="password-input-wrap">
              <input type="password" id="fp-new-password" class="form-control" placeholder="At least 6 characters">
              <button type="button" class="password-toggle-btn">👁️</button>
            </div>
          </div>

          <div class="form-group">
            <label for="fp-confirm-password">Confirm New Password</label>
            <div class="password-input-wrap">
              <input type="password" id="fp-confirm-password" class="form-control" placeholder="Confirm new password">
              <button type="button" class="password-toggle-btn">👁️</button>
            </div>
          </div>

          <button type="button" class="btn btn-primary" id="fp-submit-step2" style="width: 100%; margin-top: 10px;">
            Set New Password
          </button>
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(modal);
  initPasswordToggles();

  setTimeout(() => modal.classList.add('active'), 20);

  const closeModal = () => {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
  };

  document.getElementById('fp-close-btn').onclick = closeModal;
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };

  let verifiedEmail = '';

  // Step 1: Request Reset Code via Promise
  const step1Btn = document.getElementById('fp-submit-step1');
  const identifierInput = document.getElementById('fp-identifier');

  step1Btn.onclick = () => {
    const identifier = identifierInput.value.trim();
    if (!identifier) {
      showError(identifierInput, 'Please enter username or email.');
      return;
    }

    step1Btn.classList.add('btn-loading');
    step1Btn.disabled = true;

    window.BookNestAPI.auth.forgotPassword(identifier)
      .then((res) => {
        verifiedEmail = res.email;
        document.getElementById('fp-step-1').style.display = 'none';
        document.getElementById('fp-step-2').style.display = 'block';

        const notice = document.getElementById('fp-demo-notice');
        notice.innerHTML = `🔑 <strong>Verification Code:</strong> <code>${res.verificationCode}</code><br><span style="font-size:0.8rem;">(Simulated delivery for ${res.email})</span>`;
        
        // Pre-fill code for convenience
        document.getElementById('fp-code').value = res.verificationCode;
      })
      .catch((err) => {
        showError(identifierInput, err.message || 'Account not found.');
        window.showCustomAlert(err.message || 'Error initiating password reset.', 'error');
      })
      .finally(() => {
        step1Btn.classList.remove('btn-loading');
        step1Btn.disabled = false;
      });
  };

  // Step 2: Confirm Reset with New Password via Promise
  const step2Btn = document.getElementById('fp-submit-step2');
  const codeInput = document.getElementById('fp-code');
  const newPwdInput = document.getElementById('fp-new-password');
  const confPwdInput = document.getElementById('fp-confirm-password');

  step2Btn.onclick = () => {
    const code = codeInput.value.trim();
    const newPwd = newPwdInput.value;
    const confPwd = confPwdInput.value;

    if (!code) {
      showError(codeInput, 'Verification code is required.');
      return;
    }
    if (!newPwd || newPwd.length < 6) {
      showError(newPwdInput, 'Password must be at least 6 characters.');
      return;
    }
    if (newPwd !== confPwd) {
      showError(confPwdInput, 'Passwords do not match.');
      return;
    }

    step2Btn.classList.add('btn-loading');
    step2Btn.disabled = true;

    window.BookNestAPI.auth.resetPassword({
      email: verifiedEmail,
      code,
      newPassword: newPwd
    })
      .then((res) => {
        window.showCustomAlert(res.message || 'Password reset successful! Please log in.', 'success');
        closeModal();
      })
      .catch((err) => {
        showError(codeInput, err.message || 'Failed to reset password.');
        window.showCustomAlert(err.message || 'Failed to reset password.', 'error');
      })
      .finally(() => {
        step2Btn.classList.remove('btn-loading');
        step2Btn.disabled = false;
      });
  };
}
