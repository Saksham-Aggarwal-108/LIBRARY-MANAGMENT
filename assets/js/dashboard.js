/**
 * BookNest Library Management System - User Dashboard Logic
 * Pure Vanilla JavaScript (ES6+), Native Promises, Async/Await
 */

document.addEventListener('DOMContentLoaded', () => {
  // Enforce route protection via BookNestAuth
  if (!window.BookNestAuth) return;

  window.BookNestAuth.requireAuth('user-dashboard.html')
    .then((user) => {
      initDashboardTabs();
      loadDashboardData();
      initProfileForm();
      initPasswordForm();
    })
    .catch((err) => {
      console.log('Unauthenticated access blocked:', err);
    });
});

/**
 * Handle Dashboard Tab Switching
 */
function initDashboardTabs() {
  const tabBtns = document.querySelectorAll('.dashboard-tab-btn');
  const panels = document.querySelectorAll('.dashboard-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      
      const panelId = btn.getAttribute('data-panel');
      if (!panelId) return;

      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      panels.forEach(p => p.classList.remove('active'));
      const targetPanel = document.getElementById(`panel-${panelId}`);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });
}

/**
 * Load User Dashboard Data Asynchronously via Native Promises
 */
function loadDashboardData() {
  if (!window.BookNestAPI) return Promise.reject(new Error('API not available'));

  return window.BookNestAPI.dashboard.getData()
    .then((res) => {
      if (!res || !res.success || !res.data) {
        throw new Error('Invalid dashboard payload');
      }

      const { user, stats, borrowings, reservations } = res.data;

      renderUserProfile(user);
      renderStats(stats);
      renderIssuedBooks(borrowings);
      renderReservations(reservations);
      renderBorrowingHistory(borrowings);
    })
    .catch((err) => {
      console.error('Error fetching dashboard data:', err);
      window.showCustomAlert('Error loading dashboard records. Please refresh.', 'error');
    });
}

/**
 * Render Profile Summary in Sidebar and Overview
 */
function renderUserProfile(user) {
  const name = user.name || user.username;
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2) || 'BN';

  const avatarEl = document.getElementById('widget-avatar');
  const nameEl = document.getElementById('widget-name');
  const userEl = document.getElementById('widget-username');
  const welcomeEl = document.getElementById('overview-welcome-name');

  if (avatarEl) avatarEl.textContent = initials;
  if (nameEl) nameEl.textContent = name;
  if (userEl) userEl.textContent = `@${user.username}`;
  if (welcomeEl) welcomeEl.textContent = name;

  // Pre-fill profile form fields
  const profNameInput = document.getElementById('prof-fullname');
  const profEmailInput = document.getElementById('prof-email');
  const profUserInput = document.getElementById('prof-username');
  const profCardInput = document.getElementById('prof-cardid');

  if (profNameInput) profNameInput.value = user.name || '';
  if (profEmailInput) profEmailInput.value = user.email || '';
  if (profUserInput) profUserInput.value = user.username || '';
  if (profCardInput) profCardInput.value = user.cardId || 'BN-98234-2026';
}

/**
 * Render Overview Statistic Counters
 */
function renderStats(stats) {
  const statIssued = document.getElementById('stat-issued-count');
  const statReturned = document.getElementById('stat-returned-count');
  const statOverdue = document.getElementById('stat-overdue-count');
  const statReserved = document.getElementById('stat-reserved-count');

  if (statIssued) statIssued.textContent = stats.issuedCount || 0;
  if (statReturned) statReturned.textContent = stats.returnedCount || 0;
  if (statOverdue) statOverdue.textContent = stats.overdueCount || 0;
  if (statReserved) statReserved.textContent = stats.reservedCount || 0;
}

/**
 * Render Issued Books Table with Return Action
 */
function renderIssuedBooks(borrowings) {
  const tbody = document.getElementById('issued-books-tbody');
  if (!tbody) return;

  const activeLoans = borrowings.filter(b => b.status === 'Issued' && !b.returnDate);

  if (activeLoans.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: var(--spacing-xl); color: var(--text-muted);">
          No active books currently borrowed. <a href="books.html" style="color: var(--accent-color); font-weight: 600;">Browse catalog</a> to check out books!
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = '';
  activeLoans.forEach(item => {
    const row = document.createElement('tr');

    const issue = new Date(item.issueDate);
    const due = new Date(item.dueDate);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const issueStr = issue.toLocaleDateString('en-US', options);
    const dueStr = due.toLocaleDateString('en-US', options);

    let statusBadge = '';
    let daysLeftHtml = '';

    if (item.isOverdue) {
      statusBadge = `<span class="badge badge-unavailable" style="background-color:#fee2e2; color:#ef4444;">Overdue</span>`;
      daysLeftHtml = `<span style="color: #ef4444; font-weight: 600;">Overdue by ${Math.abs(item.daysLeft)} days</span>`;
      row.style.backgroundColor = 'rgba(239, 68, 68, 0.03)';
    } else {
      statusBadge = `<span class="badge badge-category">Issued</span>`;
      daysLeftHtml = `<span style="font-weight: 500;">${item.daysLeft} days left</span>`;
    }

    row.innerHTML = `
      <td><strong>${item.bookTitle}</strong></td>
      <td>${item.bookAuthor}</td>
      <td>${issueStr}</td>
      <td>${dueStr}</td>
      <td>${statusBadge}</td>
      <td>${daysLeftHtml}</td>
      <td>
        <button type="button" class="btn btn-secondary btn-sm return-action-btn" data-id="${item.id}" data-title="${item.bookTitle}">
          Return
        </button>
      </td>
    `;

    tbody.appendChild(row);
  });

  // Attach Return button handlers with Promise confirmation
  tbody.querySelectorAll('.return-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const borrowingId = btn.getAttribute('data-id');
      const bookTitle = btn.getAttribute('data-title');

      window.showConfirmDialog(
        'Return Book',
        `Are you ready to return "${bookTitle}"? This will update library inventory availability immediately.`,
        'Return Book',
        'Keep Book'
      ).then((confirmed) => {
        if (!confirmed) return;

        btn.classList.add('btn-loading');
        btn.disabled = true;

        window.BookNestAPI.borrowings.returnBook(borrowingId)
          .then((res) => {
            window.showCustomAlert(res.message || 'Book returned successfully!', 'success');
            loadDashboardData();
          })
          .catch((err) => {
            window.showCustomAlert(err.message || 'Failed to return book.', 'error');
            btn.classList.remove('btn-loading');
            btn.disabled = false;
          });
      });
    });
  });
}

/**
 * Render Reserved Books Table with Cancel Action
 */
function renderReservations(reservations) {
  const tbody = document.getElementById('reserved-books-tbody');
  if (!tbody) return;

  const activeReservations = reservations.filter(r => r.status === 'Active');

  if (activeReservations.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: var(--spacing-xl); color: var(--text-muted);">
          You have no active reservations. <a href="books.html" style="color: var(--accent-color); font-weight: 600;">Reserve a book</a> from our catalog!
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = '';
  activeReservations.forEach(item => {
    const row = document.createElement('tr');
    const resDate = new Date(item.reserveDate);
    const dateStr = resDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    row.innerHTML = `
      <td><strong>${item.bookTitle}</strong></td>
      <td>${item.bookAuthor}</td>
      <td>${dateStr}</td>
      <td><span class="badge badge-category">Active Reservation</span></td>
      <td>
        <button type="button" class="btn btn-secondary btn-sm cancel-res-btn" data-id="${item.id}" data-title="${item.bookTitle}">
          Cancel
        </button>
      </td>
    `;

    tbody.appendChild(row);
  });

  // Attach Cancel Reservation handlers
  tbody.querySelectorAll('.cancel-res-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const resId = btn.getAttribute('data-id');
      const bookTitle = btn.getAttribute('data-title');

      window.showConfirmDialog(
        'Cancel Reservation',
        `Are you sure you want to cancel your reservation for "${bookTitle}"?`,
        'Cancel Reservation',
        'Keep Reservation'
      ).then((confirmed) => {
        if (!confirmed) return;

        btn.classList.add('btn-loading');
        btn.disabled = true;

        window.BookNestAPI.reservations.cancel(resId)
          .then((res) => {
            window.showCustomAlert(res.message || 'Reservation cancelled.', 'info');
            loadDashboardData();
          })
          .catch((err) => {
            window.showCustomAlert(err.message || 'Failed to cancel reservation.', 'error');
            btn.classList.remove('btn-loading');
            btn.disabled = false;
          });
      });
    });
  });
}

/**
 * Render Borrowing History Table (Returned books)
 */
function renderBorrowingHistory(borrowings) {
  const tbody = document.getElementById('history-books-tbody');
  if (!tbody) return;

  const returnedList = borrowings.filter(b => b.status === 'Returned' || b.returnDate);

  if (returnedList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: var(--spacing-xl); color: var(--text-muted);">
          No borrowing history records found.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = '';
  returnedList.forEach(item => {
    const row = document.createElement('tr');
    const issueStr = new Date(item.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const dueStr = new Date(item.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const retStr = item.returnDate 
      ? new Date(item.returnDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : '-';

    row.innerHTML = `
      <td><strong>${item.bookTitle}</strong></td>
      <td>${item.bookAuthor}</td>
      <td>${issueStr}</td>
      <td>${dueStr}</td>
      <td>${retStr}</td>
      <td><span class="badge badge-available">Returned</span></td>
    `;
    tbody.appendChild(row);
  });
}

/**
 * Profile Edit Form with Native Promises
 */
function initProfileForm() {
  const form = document.getElementById('profile-edit-form');
  if (!form) return;

  const nameEl = document.getElementById('prof-fullname');
  const emailEl = document.getElementById('prof-email');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = nameEl.value.trim();
    const email = emailEl.value.trim();

    if (!name || !email) {
      window.showCustomAlert('Name and email fields cannot be blank.', 'error');
      return;
    }

    if (!email.includes('@')) {
      window.showCustomAlert('Please provide a valid email address.', 'error');
      return;
    }

    if (submitBtn) {
      submitBtn.classList.add('btn-loading');
      submitBtn.disabled = true;
    }

    window.BookNestAPI.auth.updateProfile({ name, email })
      .then((res) => {
        window.showCustomAlert(res.message || 'Profile changes saved successfully.', 'success');
        renderUserProfile(res.user);
        if (window.BookNestAuth) {
          window.BookNestAuth.updateNavbar(res.user);
        }
      })
      .catch((err) => {
        window.showCustomAlert(err.message || 'Failed to update profile.', 'error');
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
 * Change Password Form with Native Promises
 */
function initPasswordForm() {
  const form = document.getElementById('dashboard-pwd-form');
  if (!form) return;

  const currentEl = document.getElementById('pwd-current');
  const newEl = document.getElementById('pwd-new');
  const confirmEl = document.getElementById('pwd-confirm');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const currentPassword = currentEl.value;
    const newPassword = newEl.value;
    const confirmPassword = confirmEl.value;

    if (!currentPassword || !newPassword || !confirmPassword) {
      window.showCustomAlert('All password fields are required.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      window.showCustomAlert('New password must be at least 6 characters.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      window.showCustomAlert('New passwords do not match.', 'error');
      return;
    }

    if (submitBtn) {
      submitBtn.classList.add('btn-loading');
      submitBtn.disabled = true;
    }

    window.BookNestAPI.auth.changePassword({ currentPassword, newPassword })
      .then((res) => {
        window.showCustomAlert(res.message || 'Password updated successfully!', 'success');
        form.reset();
      })
      .catch((err) => {
        window.showCustomAlert(err.message || 'Failed to update password.', 'error');
      })
      .finally(() => {
        if (submitBtn) {
          submitBtn.classList.remove('btn-loading');
          submitBtn.disabled = false;
        }
      });
  });
}
