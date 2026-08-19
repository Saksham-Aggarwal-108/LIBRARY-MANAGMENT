
document.addEventListener('DOMContentLoaded', () => {
  initContactValidation();
  initLoginValidation();
  initRegisterValidation();
});

const isRequired = value => value.trim() !== '';
const isValidEmail = email => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};
const isValidPhone = phone => {
  const re = /^\+?[0-9]{10,14}$/;
  return re.test(phone.replace(/[\s-()]/g, ''));
};

const passwordWraps = document.querySelectorAll('.password-input-wrap');
passwordWraps.forEach(wrap => {
  const toggleBtn = wrap.querySelector('.password-toggle-btn');
  const input = wrap.querySelector('input');
  
  if (toggleBtn && input) {
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
      input.setAttribute('type', type);
      toggleBtn.textContent = type === 'password' ? '👁️' : '🙈';
    });
  }
});

function showError(input, message) {
  const formGroup = input.parentElement.closest('.form-group');
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
  const formGroup = input.parentElement.closest('.form-group');
  input.classList.remove('error');
  input.classList.add('success');
  
  const errorEl = formGroup.querySelector('.error-msg');
  if (errorEl) {
    errorEl.style.display = 'none';
  }
}

function initContactValidation() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const nameEl = document.getElementById('contact-name');
  const emailEl = document.getElementById('contact-email');
  const phoneEl = document.getElementById('contact-phone');
  const msgEl = document.getElementById('contact-message');

  const checkName = () => {
    let valid = false;
    const name = nameEl.value.trim();
    if (!isRequired(name)) {
      showError(nameEl, 'Name cannot be blank.');
    } else {
      showSuccess(nameEl);
      valid = true;
    }
    return valid;
  };

  const checkEmail = () => {
    let valid = false;
    const email = emailEl.value.trim();
    if (!isRequired(email)) {
      showError(emailEl, 'Email cannot be blank.');
    } else if (!isValidEmail(email)) {
      showError(emailEl, 'Email is not valid.');
    } else {
      showSuccess(emailEl);
      valid = true;
    }
    return valid;
  };

  const checkPhone = () => {
    let valid = false;
    const phone = phoneEl.value.trim();
    if (!isRequired(phone)) {
      showError(phoneEl, 'Phone number cannot be blank.');
    } else if (!isValidPhone(phone)) {
      showError(phoneEl, 'Phone must be a valid number (10-14 digits).');
    } else {
      showSuccess(phoneEl);
      valid = true;
    }
    return valid;
  };

  const checkMsg = () => {
    let valid = false;
    const msg = msgEl.value.trim();
    if (!isRequired(msg)) {
      showError(msgEl, 'Message cannot be blank.');
    } else {
      showSuccess(msgEl);
      valid = true;
    }
    return valid;
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

    const isFormValid = isNameValid && isEmailValid && isPhoneValid && isMsgValid;

    if (isFormValid) {
      window.showCustomAlert('Thank you! Your message was sent successfully.', 'success');
      form.reset();

      [nameEl, emailEl, phoneEl, msgEl].forEach(el => el.classList.remove('success'));
    } else {
      window.showCustomAlert('Please correct the highlighted errors.', 'error');
    }
  });
}

function initLoginValidation() {
  const form = document.getElementById('login-form');
  if (!form) return;

  const userEl = document.getElementById('login-username');
  const passwordEl = document.getElementById('login-password');

  const checkUser = () => {
    let valid = false;
    if (!isRequired(userEl.value.trim())) {
      showError(userEl, 'Username or Email is required.');
    } else {
      showSuccess(userEl);
      valid = true;
    }
    return valid;
  };

  const checkPassword = () => {
    let valid = false;
    if (!isRequired(passwordEl.value.trim())) {
      showError(passwordEl, 'Password is required.');
    } else {
      showSuccess(passwordEl);
      valid = true;
    }
    return valid;
  };

  userEl.addEventListener('input', checkUser);
  passwordEl.addEventListener('input', checkPassword);

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const isUserValid = checkUser();
    const isPassValid = checkPassword();

    if (isUserValid && isPassValid) {
      const usernameInput = userEl.value.trim();
      const passwordInput = passwordEl.value;

      const usersList = JSON.parse(localStorage.getItem('users') || '[]');

      if (usersList.length === 0) {
        usersList.push({
          username: 'student',
          email: 'student@library.com',
          password: 'student123',
          name: 'Jane Student'
        });
        usersList.push({
          username: 'librarian',
          email: 'admin@library.com',
          password: 'admin123',
          name: 'Librarian Admin'
        });
        localStorage.setItem('users', JSON.stringify(usersList));
      }

      const matchedUser = usersList.find(u => 
        (u.username === usernameInput || u.email === usernameInput) && u.password === passwordInput
      );

      if (matchedUser) {

        localStorage.setItem('currentUser', JSON.stringify(matchedUser));
        window.showCustomAlert(`Login successful! Welcome, ${matchedUser.name || matchedUser.username}.`, 'success');
        
        setTimeout(() => {
          window.location.href = 'user-dashboard.html';
        }, 1500);
      } else {
        showError(passwordEl, 'Invalid username/email or password.');
        showError(userEl, 'Invalid username/email or password.');
        window.showCustomAlert('Login failed. Please check credentials.', 'error');
      }
    }
  });
}

function initRegisterValidation() {
  const form = document.getElementById('register-form');
  if (!form) return;

  const nameEl = document.getElementById('reg-name');
  const userEl = document.getElementById('reg-username');
  const emailEl = document.getElementById('reg-email');
  const passwordEl = document.getElementById('reg-password');
  const confirmEl = document.getElementById('reg-confirm-password');

  const strengthBar = document.querySelector('.strength-bar');
  const strengthText = document.querySelector('.strength-text');

  const checkName = () => {
    let valid = false;
    if (!isRequired(nameEl.value.trim())) {
      showError(nameEl, 'Full name cannot be blank.');
    } else {
      showSuccess(nameEl);
      valid = true;
    }
    return valid;
  };

  const checkUsername = () => {
    let valid = false;
    const val = userEl.value.trim();
    if (!isRequired(val)) {
      showError(userEl, 'Username cannot be blank.');
    } else if (val.length < 4) {
      showError(userEl, 'Username must be at least 4 characters long.');
    } else {
      showSuccess(userEl);
      valid = true;
    }
    return valid;
  };

  const checkEmail = () => {
    let valid = false;
    const val = emailEl.value.trim();
    if (!isRequired(val)) {
      showError(emailEl, 'Email cannot be blank.');
    } else if (!isValidEmail(val)) {
      showError(emailEl, 'Email format is invalid.');
    } else {
      showSuccess(emailEl);
      valid = true;
    }
    return valid;
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
    let valid = false;
    const pwd = passwordEl.value;
    if (!isRequired(pwd)) {
      showError(passwordEl, 'Password cannot be empty.');
    } else if (pwd.length < 6) {
      showError(passwordEl, 'Password must be at least 6 characters.');
    } else {
      showSuccess(passwordEl);
      valid = true;
    }
    return valid;
  };

  const checkConfirmPassword = () => {
    let valid = false;
    const pwd = passwordEl.value;
    const confirm = confirmEl.value;

    if (!isRequired(confirm)) {
      showError(confirmEl, 'Please confirm your password.');
    } else if (pwd !== confirm) {
      showError(confirmEl, 'Passwords do not match.');
    } else {
      showSuccess(confirmEl);
      valid = true;
    }
    return valid;
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

    if (isNameValid && isUserValid && isEmailValid && isPassValid && isConfValid) {

      const newUser = {
        name: nameEl.value.trim(),
        username: userEl.value.trim(),
        email: emailEl.value.trim(),
        password: passwordEl.value
      };

      const usersList = JSON.parse(localStorage.getItem('users') || '[]');
      
      if (usersList.some(u => u.username === newUser.username)) {
        showError(userEl, 'Username is already taken.');
        window.showCustomAlert('Username already exists.', 'error');
        return;
      }
      
      if (usersList.some(u => u.email === newUser.email)) {
        showError(emailEl, 'Email is already registered.');
        window.showCustomAlert('Email already registered.', 'error');
        return;
      }

      usersList.push(newUser);
      localStorage.setItem('users', JSON.stringify(usersList));

      window.showCustomAlert('Registration successful! Redirecting to login...', 'success');
      form.reset();

      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    } else {
      window.showCustomAlert('Please fix the registration issues.', 'error');
    }
  });
}
