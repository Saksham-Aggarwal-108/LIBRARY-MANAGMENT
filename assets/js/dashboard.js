
const MOCK_ISSUED_BOOKS = [
  {
    bookName: "Merchant of Venice",
    author: "William Shakespeare",
    issueDate: "2026-07-15",
    dueDate: "2026-08-05",
    returnDate: null,
    status: "Issued"
  },
  {
    bookName: "Good Girls Guide To Murder",
    author: "Holly Jackson",
    issueDate: "2026-07-01",
    dueDate: "2026-07-20",
    returnDate: "2026-07-19",
    status: "Returned"
  },
  {
    bookName: "Ikigai",
    author: "Héctor García and Francesc Miralles",
    issueDate: "2026-07-02",
    dueDate: "2026-07-18",
    returnDate: null,
    status: "Issued"
  },
  {
    bookName: "Wings of Fire",
    author: "A. P. J. Abdul Kalam",
    issueDate: "2026-05-10",
    dueDate: "2026-05-30",
    returnDate: "2026-05-28",
    status: "Returned"
  }
];

document.addEventListener('DOMContentLoaded', () => {
  const currentUserJson = localStorage.getItem('currentUser');
  
  if (!currentUserJson) {
    window.location.href = 'login.html';
    return;
  }

  const currentUser = JSON.parse(currentUserJson);

  initDashboardLayout(currentUser);
  initIssuedTable();
  initProfileForm(currentUser);
  initPasswordForm(currentUser);
});

function initDashboardLayout(user) {

  const name = user.name || user.username;
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  
  document.getElementById('widget-avatar').textContent = initials;
  document.getElementById('widget-name').textContent = name;
  document.getElementById('widget-username').textContent = `@${user.username}`;
  document.getElementById('overview-welcome-name').textContent = name;

  const tabBtns = document.querySelectorAll('.dashboard-tab-btn');
  const panels = document.querySelectorAll('.dashboard-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      
      const panelId = btn.getAttribute('data-panel');
      
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      panels.forEach(p => p.classList.remove('active'));
      document.getElementById(`panel-${panelId}`).classList.add('active');
    });
  });

  const logoutBtn = document.getElementById('dashboard-sidebar-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('currentUser');
      if (window.showCustomAlert) {
        window.showCustomAlert('Logout successful! Redirecting...', 'success');
      }
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
    });
  }
}

function initIssuedTable() {
  const tbody = document.getElementById('issued-books-tbody');
  if (!tbody) return;

  const today = new Date();
  
  let issuedCount = 0;
  let returnedCount = 0;
  let overdueCount = 0;

  tbody.innerHTML = '';

  MOCK_ISSUED_BOOKS.forEach(item => {
    const row = document.createElement('tr');
    
    const issue = new Date(item.issueDate);
    const due = new Date(item.dueDate);
    const returned = item.returnDate ? new Date(item.returnDate) : null;
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const issueStr = issue.toLocaleDateString('en-US', options);
    const dueStr = due.toLocaleDateString('en-US', options);
    const returnStr = returned ? returned.toLocaleDateString('en-US', options) : '-';

    let statusHtml = '';
    let daysLeftText = '';

    if (item.status === 'Returned') {
      returnedCount++;
      statusHtml = `<span class="badge badge-available" style="background-color:#d1fae5; color:var(--secondary-color);">Returned</span>`;
      daysLeftText = '-';
    } else {

      const diffTime = due - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 0) {
        issuedCount++;
        statusHtml = `<span class="badge badge-category">Issued</span>`;
        daysLeftText = `${diffDays} days left`;
      } else {
        overdueCount++;
        statusHtml = `<span class="badge badge-unavailable" style="background-color:#fee2e2; color:#ef4444;">Overdue</span>`;
        daysLeftText = `Overdue by ${Math.abs(diffDays)} days`;
        row.style.backgroundColor = 'rgba(239, 68, 68, 0.03)';
      }
    }

    row.innerHTML = `
      <td><strong>${item.bookName}</strong></td>
      <td>${item.author}</td>
      <td>${issueStr}</td>
      <td>${dueStr}</td>
      <td>${returnStr}</td>
      <td>${statusHtml}</td>
      <td style="font-weight: 500; color: ${daysLeftText.includes('Overdue') ? '#ef4444' : 'inherit'};">${daysLeftText}</td>
    `;
    tbody.appendChild(row);
  });

  document.getElementById('stat-issued-count').textContent = issuedCount;
  document.getElementById('stat-returned-count').textContent = returnedCount;
  document.getElementById('stat-overdue-count').textContent = overdueCount;
}

function initProfileForm(user) {
  const form = document.getElementById('profile-edit-form');
  if (!form) return;

  const nameEl = document.getElementById('prof-fullname');
  const emailEl = document.getElementById('prof-email');
  const usernameEl = document.getElementById('prof-username');

  nameEl.value = user.name || '';
  emailEl.value = user.email || '';
  usernameEl.value = user.username || '';

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const newName = nameEl.value.trim();
    const newEmail = emailEl.value.trim();

    if (newName === '' || newEmail === '') {
      if (window.showCustomAlert) {
        window.showCustomAlert('Name and Email fields cannot be blank.', 'error');
      }
      return;
    }

    const updatedUser = { ...user, name: newName, email: newEmail };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));

    const usersList = JSON.parse(localStorage.getItem('users') || '[]');
    const matchIndex = usersList.findIndex(u => u.username === user.username);
    if (matchIndex !== -1) {
      usersList[matchIndex].name = newName;
      usersList[matchIndex].email = newEmail;
      localStorage.setItem('users', JSON.stringify(usersList));
    }

    initDashboardLayout(updatedUser);

    if (window.showCustomAlert) {
      window.showCustomAlert('Profile changes saved successfully.', 'success');
    }
  });
}

function initPasswordForm(user) {
  const form = document.getElementById('dashboard-pwd-form');
  if (!form) return;

  const currentEl = document.getElementById('pwd-current');
  const newEl = document.getElementById('pwd-new');
  const confirmEl = document.getElementById('pwd-confirm');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const currentPwd = currentEl.value;
    const newPwd = newEl.value;
    const confirmPwd = confirmEl.value;

    if (currentPwd === '' || newPwd === '' || confirmPwd === '') {
      if (window.showCustomAlert) {
        window.showCustomAlert('All password fields are required.', 'error');
      }
      return;
    }

    if (currentPwd !== user.password) {
      if (window.showCustomAlert) {
        window.showCustomAlert('Current password incorrect.', 'error');
      }
      return;
    }

    if (newPwd.length < 6) {
      if (window.showCustomAlert) {
        window.showCustomAlert('New password must be at least 6 characters.', 'error');
      }
      return;
    }

    if (newPwd !== confirmPwd) {
      if (window.showCustomAlert) {
        window.showCustomAlert('New passwords do not match.', 'error');
      }
      return;
    }

    const updatedUser = { ...user, password: newPwd };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));

    const usersList = JSON.parse(localStorage.getItem('users') || '[]');
    const matchIndex = usersList.findIndex(u => u.username === user.username);
    if (matchIndex !== -1) {
      usersList[matchIndex].password = newPwd;
      localStorage.setItem('users', JSON.stringify(usersList));
    }

    form.reset();
    if (window.showCustomAlert) {
      window.showCustomAlert('Password updated successfully.', 'success');
    }
  });
}
