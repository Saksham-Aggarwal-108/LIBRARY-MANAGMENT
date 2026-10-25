/**
 * BookNest Comprehensive Browser UI Audit
 * Runs headless in real System Chrome using Playwright
 * Audits:
 * 1. Console errors on all pages
 * 2. Responsiveness (Desktop 1280px, Tablet 768px, Mobile 375px)
 * 3. Login, Logout, Route protection
 * 4. Borrow, Return, Reserve, Cancel workflows
 * 5. Forgot Password & Profile Update
 * 6. Interactive elements, modals, lightboxes, filters, sorting
 */

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:3000';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const auditResults = [];

function record(category, testName, passed, details = '') {
  auditResults.push({ category, testName, passed, details });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} [${category}] ${testName}${details ? ` - ${details}` : ''}`);
}

async function runAudit() {
  console.log('=====================================================');
  console.log('   STARTING BOOKNEST BROWSER UI & RESPONSIVE AUDIT   ');
  console.log('=====================================================\n');

  let browser;
  try {
    browser = await chromium.launch({
      executablePath: CHROME_PATH,
      headless: true
    });
  } catch (e) {
    console.error('Failed to launch Chrome:', e);
    process.exit(1);
  }

  const pagesToAudit = [
    { name: 'Home Page', url: `${BASE_URL}/index.html` },
    { name: 'Books Page', url: `${BASE_URL}/books.html` },
    { name: 'Book Details Page', url: `${BASE_URL}/book-details.html?id=1` },
    { name: 'Login Page', url: `${BASE_URL}/login.html` },
    { name: 'Register Page', url: `${BASE_URL}/register.html` },
    { name: 'About Page', url: `${BASE_URL}/about.html` },
    { name: 'Gallery Page', url: `${BASE_URL}/gallery.html` },
    { name: 'Contact Page', url: `${BASE_URL}/contact.html` }
  ];

  // -----------------------------------------------------------------
  // 1. Console Errors & Responsiveness Audit across all public pages
  // -----------------------------------------------------------------
  console.log('--- Phase 1: Console Errors & Responsive Viewports ---');

  for (const pageInfo of pagesToAudit) {
    const consoleErrors = [];
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', err => {
      consoleErrors.push(err.message);
    });

    try {
      await page.goto(pageInfo.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(300);

      // Check Console errors
      const hasErrors = consoleErrors.length > 0;
      record('Console Errors', `${pageInfo.name} Clean Console`, !hasErrors, hasErrors ? consoleErrors.join('; ') : 'No errors');

      // Test Desktop (1280x800)
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.waitForTimeout(100);
      const desktopNavVisible = await page.isVisible('.nav-menu');
      record('Responsiveness', `${pageInfo.name} Desktop (1280px)`, desktopNavVisible, 'Navigation renders correctly');

      // Test Tablet (768x1024)
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(100);
      const tabletNavToggle = await page.isVisible('.nav-toggle');
      record('Responsiveness', `${pageInfo.name} Tablet (768px)`, tabletNavToggle, 'Mobile/tablet nav toggle present');

      // Test Mobile (375x667)
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(100);
      const mobileNavToggle = await page.isVisible('.nav-toggle');
      record('Responsiveness', `${pageInfo.name} Mobile (375px)`, mobileNavToggle, 'Mobile layout adapts cleanly');

    } catch (err) {
      record('Page Load', `${pageInfo.name} Load Error`, false, err.message);
    } finally {
      await context.close();
    }
  }

  // -----------------------------------------------------------------
  // 2. Protected Routes Redirection Audit
  // -----------------------------------------------------------------
  console.log('\n--- Phase 2: Route Protection Audit ---');
  {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Try opening user-dashboard.html as unauthenticated guest
    await page.goto(`${BASE_URL}/user-dashboard.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    const redirectedUrl = page.url();
    const isRedirectedToLogin = redirectedUrl.includes('login.html');
    record('Route Protection', 'Unauthenticated Dashboard Access Redirects to Login', isRedirectedToLogin, `URL: ${redirectedUrl}`);

    // Try borrowing book 1 directly as unauthenticated guest
    await page.goto(`${BASE_URL}/book-details.html?id=1`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const borrowBtn = await page.$('#borrow-btn');
    if (borrowBtn) {
      await borrowBtn.click();
      await page.waitForTimeout(800);
      const afterBorrowUrl = page.url();
      const redirected = afterBorrowUrl.includes('login.html');
      record('Route Protection', 'Guest Borrow Attempt Redirects to Login', redirected, `URL: ${afterBorrowUrl}`);
    }

    await context.close();
  }

  // -----------------------------------------------------------------
  // 3. User Registration UI Flow
  // -----------------------------------------------------------------
  console.log('\n--- Phase 3: Registration UI Flow ---');
  const auditUsername = `browser_user_${Date.now()}`;
  const auditEmail = `${auditUsername}@library.com`;
  const auditPassword = 'SecurePassword123!';

  {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${BASE_URL}/register.html`, { waitUntil: 'domcontentloaded' });

    // Test password toggle
    const toggleBtn = await page.$('.password-toggle-btn');
    const pwdInput = await page.$('#reg-password');
    let initialType = await pwdInput.getAttribute('type');
    await toggleBtn.click();
    let toggledType = await pwdInput.getAttribute('type');
    record('Password Visibility', 'Register Password Toggle Switches text/password', initialType === 'password' && toggledType === 'text');
    await toggleBtn.click(); // Toggle back

    // Fill form
    await page.fill('#reg-name', 'Browser Test User');
    await page.fill('#reg-username', auditUsername);
    await page.fill('#reg-email', auditEmail);
    await page.fill('#reg-password', auditPassword);
    await page.fill('#reg-confirm-password', auditPassword);

    // Verify strength bar
    const strengthBarWidth = await page.$eval('.strength-bar', el => el.style.width);
    record('Form Validation', 'Password Strength Meter Evaluates Input', parseInt(strengthBarWidth) >= 60, `Width: ${strengthBarWidth}`);

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    const redirectedToLogin = currentUrl.includes('login.html');
    record('Registration Flow', 'Registration Form Submits and Redirects to Login', redirectedToLogin, `URL: ${currentUrl}`);

    await context.close();
  }

  // -----------------------------------------------------------------
  // 4. Login UI Flow, Forgot Password & Session Management
  // -----------------------------------------------------------------
  console.log('\n--- Phase 4: Login UI, Forgot Password Modal & Session ---');
  let userContext;
  let userPage;

  {
    userContext = await browser.newContext();
    userPage = await userContext.newPage();

    await userPage.goto(`${BASE_URL}/login.html`, { waitUntil: 'domcontentloaded' });

    // Test Invalid Login
    await userPage.fill('#login-username', auditUsername);
    await userPage.fill('#login-password', 'WrongPassword!');
    await userPage.click('button[type="submit"]');
    await userPage.waitForTimeout(800);

    const hasErrorAlert = await userPage.$('.custom-alert.error');
    record('Authentication', 'Invalid Credentials Triggers Error Notification', !!hasErrorAlert);

    // Test Forgot Password Modal Flow
    await userPage.click('#forgot-password-link');
    await userPage.waitForTimeout(400);

    const fpModal = await userPage.$('#forgot-password-modal.active');
    record('Forgot Password', 'Forgot Password Modal Opens', !!fpModal);

    await userPage.fill('#fp-identifier', auditEmail);
    await userPage.click('#fp-submit-step1');
    await userPage.waitForTimeout(1000);

    const step2Visible = await userPage.isVisible('#fp-step-2');
    record('Forgot Password', 'Verification Code Generated & Step 2 Displayed', step2Visible);

    const newAuditedPassword = 'NewSecretPassword456!';
    await userPage.fill('#fp-new-password', newAuditedPassword);
    await userPage.fill('#fp-confirm-password', newAuditedPassword);
    await userPage.click('#fp-submit-step2');
    await userPage.waitForTimeout(1000);

    const resetSuccessAlert = await userPage.$('.custom-alert.success');
    record('Forgot Password', 'Password Reset Confirmed with Success Alert', !!resetSuccessAlert);

    // Log in with new credentials
    await userPage.fill('#login-username', auditUsername);
    await userPage.fill('#login-password', newAuditedPassword);
    await userPage.click('button[type="submit"]');
    await userPage.waitForTimeout(2000);

    const postLoginUrl = userPage.url();
    const loggedIn = postLoginUrl.includes('user-dashboard.html');
    record('Authentication', 'Valid Login Redirects to User Dashboard', loggedIn, `URL: ${postLoginUrl}`);

    // Verify Welcome name on dashboard
    const welcomeText = await userPage.textContent('#overview-welcome-name');
    record('Dashboard UI', 'Dashboard Greets Authenticated User Name', welcomeText.includes('Browser Test User'), `Greeting: ${welcomeText}`);
  }

  // -----------------------------------------------------------------
  // 5. Dashboard Tab Switching, Profile Update & Password Change
  // -----------------------------------------------------------------
  console.log('\n--- Phase 5: Dashboard Tabs, Profile Edit & Password Change ---');
  {
    // Switch to Profile Tab
    await userPage.click('a[data-panel="dashboard-profile"]');
    await userPage.waitForTimeout(300);
    const profilePanelActive = await userPage.isVisible('#panel-dashboard-profile.active');
    record('Dashboard UI', 'Switch to Profile Information Tab', profilePanelActive);

    // Update Profile Name
    await userPage.fill('#prof-fullname', 'Browser Test User Renamed');
    await userPage.click('#profile-edit-form button[type="submit"]');
    await userPage.waitForTimeout(1000);

    const widgetName = await userPage.textContent('#widget-name');
    record('Dashboard UI', 'Profile Name Update Persists in Widget', widgetName.includes('Browser Test User Renamed'), `Widget: ${widgetName}`);

    // Switch to Change Password Tab
    await userPage.click('a[data-panel="dashboard-password"]');
    await userPage.waitForTimeout(300);

    await userPage.fill('#pwd-current', 'NewSecretPassword456!');
    await userPage.fill('#pwd-new', 'UltraSecurePassword789!');
    await userPage.fill('#pwd-confirm', 'UltraSecurePassword789!');
    await userPage.click('#dashboard-pwd-form button[type="submit"]');
    await userPage.waitForTimeout(1000);

    const pwdSuccessAlert = await userPage.$('.custom-alert.success');
    record('Dashboard UI', 'Change Password in Dashboard Succeeds', !!pwdSuccessAlert);
  }

  // -----------------------------------------------------------------
  // 6. Complete Borrow, Return, Reserve, and Cancel Workflows
  // -----------------------------------------------------------------
  console.log('\n--- Phase 6: Borrow, Return, Reserve, Cancel Workflows ---');
  {
    // Navigate to Books Catalog
    await userPage.goto(`${BASE_URL}/books.html`, { waitUntil: 'domcontentloaded' });
    await userPage.waitForTimeout(800);

    // Test Search Bar
    await userPage.fill('#catalog-search-input', 'harry');
    await userPage.waitForTimeout(400);
    const bookTitleAfterSearch = await userPage.textContent('.book-card-title');
    record('Catalog UI', 'Catalog Search Filters Live by Query', bookTitleAfterSearch.includes('Harry Potter'), `Found: ${bookTitleAfterSearch}`);

    // Test Clear Filters
    await userPage.click('#clear-filters-btn');
    await userPage.waitForTimeout(400);
    const categoryCount = await userPage.$$('.category-section');
    record('Catalog UI', 'Clear All Filters Restores All Categories', categoryCount.length >= 4, `Categories: ${categoryCount.length}`);

    // Borrow Book 1 (Good Girls Guide To Murder)
    await userPage.goto(`${BASE_URL}/book-details.html?id=1`, { waitUntil: 'domcontentloaded' });
    await userPage.waitForTimeout(600);

    const borrowBtn = await userPage.$('#borrow-btn');
    await borrowBtn.click();
    await userPage.waitForTimeout(1500);

    const borrowAlert = await userPage.$('.custom-alert.success');
    record('Borrowing Workflow', 'Authenticated User Borrows Available Book', !!borrowAlert);

    // Reserve Book 6 (Harry Potter)
    await userPage.goto(`${BASE_URL}/book-details.html?id=6`, { waitUntil: 'domcontentloaded' });
    await userPage.waitForTimeout(600);

    const reserveBtn = await userPage.$('#reserve-btn');
    await reserveBtn.click();
    await userPage.waitForTimeout(1500);

    const reserveAlert = await userPage.$('.custom-alert.success');
    record('Reservation Workflow', 'Authenticated User Reserves Book', !!reserveAlert);

    // Go to Dashboard and verify active loan and reservation
    await userPage.goto(`${BASE_URL}/user-dashboard.html`, { waitUntil: 'domcontentloaded' });
    await userPage.waitForTimeout(800);

    // Check Issued Books Tab
    await userPage.click('a[data-panel="dashboard-issued"]');
    await userPage.waitForTimeout(400);

    const issuedTableText = await userPage.textContent('#issued-books-tbody');
    record('Dashboard Loans', 'Borrowed Book Displays in Issued Books Table', issuedTableText.includes('Good Girls Guide To Murder'));

    // Click Return on Book 1
    const returnBtn = await userPage.$('.return-action-btn');
    await returnBtn.click();
    await userPage.waitForTimeout(400);

    // Confirm dialog
    const confirmModal = await userPage.$('#bn-confirm-modal.active');
    record('Promise Dialogs', 'Confirmation Dialog Pops Up for Return Action', !!confirmModal);
    await userPage.click('#confirm-btn-ok');
    await userPage.waitForTimeout(1500);

    const returnAlert = await userPage.$('.custom-alert.success');
    record('Return Workflow', 'Book Return Confirmed & Processed', !!returnAlert);

    // Check Reserved Books Tab
    await userPage.click('a[data-panel="dashboard-reserved"]');
    await userPage.waitForTimeout(400);

    const reservedTableText = await userPage.textContent('#reserved-books-tbody');
    record('Dashboard Reservations', 'Reserved Book Displays in Active Reservations', reservedTableText.includes('Harry Potter'));

    // Cancel Reservation
    const cancelResBtn = await userPage.$('.cancel-res-btn');
    await cancelResBtn.click();
    await userPage.waitForTimeout(400);
    await userPage.click('#confirm-btn-ok');
    await userPage.waitForTimeout(1500);

    const cancelAlert = await userPage.$('.custom-alert.info');
    record('Reservation Workflow', 'Reservation Cancelled with Immediate UI Update', !!cancelAlert);

    // Check Borrowing History Tab
    await userPage.click('a[data-panel="dashboard-history"]');
    await userPage.waitForTimeout(400);

    const historyTableText = await userPage.textContent('#history-books-tbody');
    record('Borrowing History', 'Returned Book Recorded in Borrowing History', historyTableText.includes('Good Girls Guide To Murder'));
  }

  // -----------------------------------------------------------------
  // 7. Interactive Modals, Theme Toggle, Lightbox & Contact
  // -----------------------------------------------------------------
  console.log('\n--- Phase 7: Interactive Elements, Theme, Modals, Contact ---');
  {
    // Home Page Theme Toggle
    await userPage.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
    const isDarkInitial = await userPage.$eval('html', el => el.classList.contains('dark-mode'));
    await userPage.click('#theme-toggle');
    await userPage.waitForTimeout(300);
    const isDarkAfter = await userPage.$eval('html', el => el.classList.contains('dark-mode'));
    record('Theme Toggle', 'Theme Button Toggles Dark/Light Class on <html>', isDarkInitial !== isDarkAfter);

    // Privacy Policy Modal in footer
    await userPage.click('footer a[href="#privacy-policy"]');
    await userPage.waitForTimeout(400);
    const privacyModalOpen = await userPage.isVisible('#privacy-policy-modal.active');
    record('Footer Modals', 'Footer Privacy Policy Link Opens Modal Dialog', privacyModalOpen);
    await userPage.click('#privacy-modal-close');
    await userPage.waitForTimeout(300);

    // Contact Page Submission
    await userPage.goto(`${BASE_URL}/contact.html`, { waitUntil: 'domcontentloaded' });
    await userPage.fill('#contact-name', 'Auditor Alex');
    await userPage.fill('#contact-email', 'auditor@example.com');
    await userPage.fill('#contact-phone', '9876543210');
    await userPage.fill('#contact-message', 'Inquiring about group reservation policies.');
    await userPage.click('#contact-form button[type="submit"]');
    await userPage.waitForTimeout(1500);

    const contactAlert = await userPage.$('.custom-alert.success');
    record('Contact Page', 'Contact Form Successfully Submits Inquiry', !!contactAlert);

    // Gallery Lightbox Modal
    await userPage.goto(`${BASE_URL}/gallery.html`, { waitUntil: 'domcontentloaded' });
    await userPage.click('.gallery-item');
    await userPage.waitForTimeout(400);
    const lightboxOpen = await userPage.isVisible('#lightbox-modal.active');
    record('Gallery Page', 'Clicking Gallery Card Opens Lightbox Modal', lightboxOpen);
    await userPage.click('#lightbox-close');
    await userPage.waitForTimeout(300);
    const lightboxClosed = !(await userPage.isVisible('#lightbox-modal.active'));
    record('Gallery Page', 'Lightbox Close Button Dismisses Modal', lightboxClosed);
  }

  // -----------------------------------------------------------------
  // 8. Logout & Session Invalidation
  // -----------------------------------------------------------------
  console.log('\n--- Phase 8: Logout & Session Invalidation ---');
  {
    await userPage.goto(`${BASE_URL}/user-dashboard.html`, { waitUntil: 'domcontentloaded' });
    await userPage.waitForTimeout(400);

    // Click Sidebar Logout
    await userPage.click('#dashboard-sidebar-logout');
    await userPage.waitForTimeout(1500);

    const postLogoutUrl = userPage.url();
    const redirectedHome = postLogoutUrl.includes('index.html');
    record('Logout Flow', 'Logout Redirects to index.html', redirectedHome, `URL: ${postLogoutUrl}`);

    // Check navbar shows guest buttons
    const guestOnlyVisible = await userPage.$eval('.guest-only', el => el.style.display !== 'none');
    record('Dynamic Navbar', 'Post-Logout Navbar Displays Login and Register Buttons', guestOnlyVisible);

    // Try navigating back to dashboard directly
    await userPage.goto(`${BASE_URL}/user-dashboard.html`, { waitUntil: 'domcontentloaded' });
    await userPage.waitForTimeout(800);
    const blockedUrl = userPage.url();
    const isBlocked = blockedUrl.includes('login.html');
    record('Session Security', 'Direct Access to Dashboard After Logout Blocked', isBlocked, `URL: ${blockedUrl}`);

    await userContext.close();
  }

  await browser.close();

  // -----------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------
  const passCount = auditResults.filter(r => r.passed).length;
  const failCount = auditResults.filter(r => !r.passed).length;

  console.log('\n=====================================================');
  console.log(` AUDIT COMPLETE: ${passCount} PASSED, ${failCount} FAILED out of ${auditResults.length} checks`);
  console.log('=====================================================');

  if (failCount > 0) process.exit(1);
}

runAudit();
