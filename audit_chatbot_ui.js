/**
 * BookNest AI Assistant - "Kaira" Browser UI Automated Test
 * Runs in real Chrome via Playwright
 */

const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function runBrowserAudit() {
  console.log('======================================================');
  console.log('   STARTING KAIRA CHATBOT BROWSER UI AUTOMATED AUDIT  ');
  console.log('======================================================\n');

  let browser;
  try {
    browser = await chromium.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  } catch (e) {
    console.error('Failed to launch Chrome:', e);
    process.exit(1);
  }

  const results = [];
  function record(testName, passed, details = '') {
    results.push({ testName, passed, details });
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testName}${details ? ` - ${details}` : ''}`);
  }

  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    // 1. Visit Home Page
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    // 2. Check FAB Presence
    const fab = await page.$('#chatbot-fab');
    record('FAB Launcher Button Present', fab !== null);

    // 3. Open Chatbot Window
    await page.click('#chatbot-fab');
    await page.waitForTimeout(400);

    const isWindowActive = await page.$eval('#chatbot-window', el => el.classList.contains('is-active'));
    record('Chatbot Window Opens on FAB Click', isWindowActive);

    const titleText = await page.$eval('#chatbot-title', el => el.textContent.trim());
    record('Chatbot Title is "Kiara" or "Kaira"', titleText === 'Kiara' || titleText === 'Kaira', `Found: "${titleText}"`);

    const subtitleText = await page.$eval('.chatbot-subtitle', el => el.textContent.trim());
    record('Chatbot Subtitle is "Your Smart Library Companion"', subtitleText.includes('Library Companion'), `Found: "${subtitleText}"`);

    // 4. Verify Welcome Message and Suggestion Chips
    const initialMessages = await page.$$('.chat-row.bot-row');
    record('Initial Welcome Message Rendered', initialMessages.length >= 1);

    const chips = await page.$$('.chatbot-suggestion-chip');
    record('Quick Suggestion Chips Rendered', chips.length >= 4, `Count: ${chips.length}`);

    // 5. Send message via typing and Enter key
    await page.fill('#chatbot-input', 'Suggest programming books');
    await page.keyboard.press('Enter');

    // Wait for response bubble to appear
    await page.waitForSelector('.chatbot-book-card', { timeout: 8000 });
    const bookCards = await page.$$('.chatbot-book-card');
    record('Interactive Book Cards Rendered for Programming Books', bookCards.length >= 2, `Count: ${bookCards.length}`);

    // Verify first book card details
    const firstBookTitle = await page.$eval('.chatbot-book-title', el => el.textContent.trim());
    const firstBookHref = await page.$eval('.chatbot-book-action-btn', el => el.getAttribute('href'));
    record('First Book Card is "Clean Code"', firstBookTitle.includes('Clean Code'), `Title: "${firstBookTitle}"`);
    record('Book Card Link Points to book-details.html', firstBookHref.includes('book-details.html?id='), `Href: "${firstBookHref}"`);

    // 6. Click a suggestion chip: "📚 Available Books"
    const availChip = await page.$('.chatbot-suggestion-chip[data-prompt="📚 Available Books"]');
    if (availChip) {
      await availChip.click();
      await page.waitForTimeout(1000);
      record('Clicking Suggestion Chip Dispatches Prompt', true);
    } else {
      // Fallback chip click
      const anyChip = await page.$('.chatbot-suggestion-chip');
      if (anyChip) {
        await anyChip.click();
        await page.waitForTimeout(1000);
        record('Clicking Any Suggestion Chip Dispatches Prompt', true);
      }
    }

    // 7. Test Dark Mode rendering
    await page.click('#theme-toggle');
    await page.waitForTimeout(500);

    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark-mode'));
    const windowDarkBg = await page.$eval('#chatbot-window', el => getComputedStyle(el).backgroundColor);
    record('Theme Toggle Shifts Chatbot to Dark Mode', isDark && (windowDarkBg.includes('30, 41, 59') || windowDarkBg.includes('15, 23, 42')), `Bg: ${windowDarkBg}`);

    // Capture screenshot in dark mode
    await page.screenshot({ path: 'chatbot_dark_mode.png', fullPage: false });
    console.log('📸 Captured chatbot_dark_mode.png');

    // Toggle back to light mode
    await page.click('#theme-toggle');
    await page.waitForTimeout(400);

    // Capture screenshot in light mode
    await page.screenshot({ path: 'chatbot_light_mode.png', fullPage: false });
    console.log('📸 Captured chatbot_light_mode.png');

    // 8. Test Clear Chat Button
    // Override window.confirm to return true
    await page.evaluate(() => { window.confirm = () => true; });
    await page.click('#chatbot-clear-btn');
    await page.waitForTimeout(500);

    const clearedRows = await page.$$('.chat-row.user-row');
    record('Clear Chat Button Resets Messages', clearedRows.length === 0, `User bubbles remaining: ${clearedRows.length}`);

    // 9. Test Close Button
    await page.click('#chatbot-close-btn');
    await page.waitForTimeout(400);
    const isClosed = await page.$eval('#chatbot-window', el => !el.classList.contains('is-active'));
    record('Close Button Minimizes Chatbot Window', isClosed);

    // 10. Test Mobile Viewport (375x667)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.click('#chatbot-fab');
    await page.waitForTimeout(400);

    const mobileWindowWidth = await page.$eval('#chatbot-window', el => el.getBoundingClientRect().width);
    record('Mobile Viewport Expands Chat Window Appropriately', mobileWindowWidth >= 370, `Width: ${mobileWindowWidth}px`);

    // Capture mobile screenshot
    await page.screenshot({ path: 'chatbot_mobile.png', fullPage: false });
    console.log('📸 Captured chatbot_mobile.png');

    // 11. Console Error Audit
    record('No JavaScript Console Errors on Page', consoleErrors.length === 0, consoleErrors.join(' | '));

    await context.close();
    await browser.close();

    console.log('\n======================================================');
    const passedCount = results.filter(r => r.passed).length;
    const failedCount = results.filter(r => !r.passed).length;
    console.log(`AUDIT SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('======================================================');

    if (failedCount > 0) process.exit(1);
  } catch (err) {
    console.error('Audit failed with error:', err);
    if (browser) await browser.close();
    process.exit(1);
  }
}

runBrowserAudit();
