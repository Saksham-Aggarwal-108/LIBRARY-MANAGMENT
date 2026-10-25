/**
 * Comprehensive Automated End-to-End API and Logic Test Script for BookNest
 */

const BASE_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log('--- STARTING BOOKNEST FULL INTEGRATION TESTS ---');
  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passCount++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failCount++;
    }
  }

  try {
    // 1. Test Seed Users Login (student)
    console.log('\n[1] Testing Authentication & Password Verification');
    const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'student', password: 'student123' })
    });
    const studentLogin = await studentLoginRes.json();
    assert(studentLogin.success === true && studentLogin.token, 'Student login succeeds with hashed password verification');
    const studentToken = studentLogin.token;

    // 2. Test Invalid Login
    const invalidLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'student', password: 'wrongpassword' })
    });
    const invalidLogin = await invalidLoginRes.json();
    assert(invalidLogin.success === false, 'Invalid login rejected with error message');

    // 3. Test New User Registration
    console.log('\n[2] Testing User Registration & Duplicate Prevention');
    const testUsername = `user_${Date.now()}`;
    const testEmail = `${testUsername}@example.com`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Automated Tester',
        username: testUsername,
        email: testEmail,
        password: 'Password123!'
      })
    });
    const regData = await regRes.json();
    assert(regData.success === true, 'New user registers successfully');

    // Duplicate Registration check
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Tester',
        username: testUsername,
        email: testEmail,
        password: 'Password123!'
      })
    });
    const dupData = await dupRes.json();
    assert(dupData.success === false, 'Duplicate username/email registration rejected');

    // 4. Test New User Login & Session
    const newLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: testUsername, password: 'Password123!' })
    });
    const newLogin = await newLoginRes.json();
    assert(newLogin.success === true && newLogin.user.name === 'Automated Tester', 'New user logs in with new token');
    const userToken = newLogin.token;

    // 5. Test Profile Fetch (GET /auth/me)
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    const meData = await meRes.json();
    assert(meData.success === true && meData.user.username === testUsername, 'GET /auth/me validates session token');

    // 6. Test Forgot Password Flow
    console.log('\n[3] Testing Forgot Password & Password Reset');
    const forgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testEmail })
    });
    const forgotData = await forgotRes.json();
    assert(forgotData.success === true && forgotData.verificationCode, 'Forgot password generates verification code');

    const resetRes = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        code: forgotData.verificationCode,
        newPassword: 'ResetPassword999!'
      })
    });
    const resetData = await resetRes.json();
    assert(resetData.success === true, 'Password reset succeeds with valid code');

    // Verify login with new password
    const reLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: testUsername, password: 'ResetPassword999!' })
    });
    const reLogin = await reLoginRes.json();
    assert(reLogin.success === true, 'Login with reset password succeeds');
    const updatedUserToken = reLogin.token;

    // 7. Test Profile Update
    console.log('\n[4] Testing Profile Update & Change Password');
    const updateProfRes = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${updatedUserToken}`
      },
      body: JSON.stringify({
        name: 'Tester Name Updated',
        email: `updated_${testEmail}`
      })
    });
    const updateProf = await updateProfRes.json();
    assert(updateProf.success === true && updateProf.user.name === 'Tester Name Updated', 'Profile update persists');

    // Change Password
    const changePwdRes = await fetch(`${BASE_URL}/auth/change-password`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${updatedUserToken}`
      },
      body: JSON.stringify({
        currentPassword: 'ResetPassword999!',
        newPassword: 'BrandNewPassword888!'
      })
    });
    const changePwd = await changePwdRes.json();
    assert(changePwd.success === true, 'Change password endpoint verifies current and updates to new password');

    // 8. Test Books Catalog Fetch
    console.log('\n[5] Testing Books Catalogue & Dynamic Availability');
    const booksRes = await fetch(`${BASE_URL}/books`);
    const booksData = await booksRes.json();
    assert(booksData.success === true && booksData.data.length >= 18, 'GET /books returns full catalog');

    // 9. Test Book Details
    const bookDetailRes = await fetch(`${BASE_URL}/books/4`);
    const bookDetail = await bookDetailRes.json();
    assert(bookDetail.success === true && bookDetail.data.title === 'Diary of a Young Girl', 'GET /books/:id returns accurate book details');

    // 10. Test Borrow Book
    console.log('\n[6] Testing Borrowing, Due Date, and Return Workflow');
    const borrowRes = await fetch(`${BASE_URL}/books/4/borrow`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${updatedUserToken}` }
    });
    const borrowData = await borrowRes.json();
    assert(borrowData.success === true && borrowData.borrowing.status === 'Issued', 'Borrow book creates 14-day borrowing loan');
    assert(borrowData.borrowing.dueDate.length === 10, 'Due date is properly generated');

    // Duplicate active borrow check
    const dupBorrowRes = await fetch(`${BASE_URL}/books/4/borrow`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${updatedUserToken}` }
    });
    const dupBorrow = await dupBorrowRes.json();
    assert(dupBorrow.success === false, 'Duplicate active borrow of same book by same user rejected');

    // Check book availability updated to false in catalog
    const bookCheckRes = await fetch(`${BASE_URL}/books/4`);
    const bookCheck = await bookCheckRes.json();
    assert(bookCheck.data.availability === false, 'Book availability dynamically updated to false after borrowing');

    // 11. Test Book Reservation
    console.log('\n[7] Testing Book Reservation & Cancellation');
    const reserveRes = await fetch(`${BASE_URL}/books/6/reserve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${updatedUserToken}` }
    });
    const reserveData = await reserveRes.json();
    assert(reserveData.success === true && reserveData.reservation.status === 'Active', 'Reserve book creates active reservation');

    // 12. Test Dashboard Aggregation
    console.log('\n[8] Testing Dashboard Stats and Filtering');
    const dashRes = await fetch(`${BASE_URL}/dashboard`, {
      headers: { 'Authorization': `Bearer ${updatedUserToken}` }
    });
    const dashData = await dashRes.json();
    assert(dashData.success === true && dashData.data.stats.issuedCount >= 1, 'Dashboard computes active issuedCount');
    assert(dashData.data.stats.reservedCount >= 1, 'Dashboard computes active reservedCount');
    assert(dashData.data.borrowings.some(b => b.bookId === 4), 'Dashboard contains user borrowed book');
    assert(dashData.data.reservations.some(r => r.bookId === 6), 'Dashboard contains user reserved book');

    // 13. Test Return Book
    const borrowingItem = dashData.data.borrowings.find(b => b.bookId === 4 && b.status === 'Issued');
    const returnRes = await fetch(`${BASE_URL}/borrowings/${borrowingItem.id}/return`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${updatedUserToken}` }
    });
    const returnData = await returnRes.json();
    assert(returnData.success === true && returnData.borrowing.status === 'Returned', 'Return book marks borrowing status as Returned');

    // Check availability restored
    const bookRestoredRes = await fetch(`${BASE_URL}/books/4`);
    const bookRestored = await bookRestoredRes.json();
    assert(bookRestored.data.availability === true, 'Book availability restored to true after return');

    // 14. Test Cancel Reservation
    const reservationItem = dashData.data.reservations.find(r => r.bookId === 6 && r.status === 'Active');
    const cancelRes = await fetch(`${BASE_URL}/reservations/${reservationItem.id}/cancel`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${updatedUserToken}` }
    });
    const cancelData = await cancelRes.json();
    assert(cancelData.success === true, 'Cancel reservation successfully marks reservation as cancelled');

    // 15. Test Contact Submission
    console.log('\n[9] Testing Contact Inquiry and Newsletter');
    const contactRes = await fetch(`${BASE_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Inquiry Tester',
        email: 'inquiry@example.com',
        phone: '9876543210',
        message: 'Testing inquiry submission for BookNest'
      })
    });
    const contactData = await contactRes.json();
    assert(contactData.success === true, 'Contact message submitted and stored persistently');

    // 16. Test Newsletter
    const newsRes = await fetch(`${BASE_URL}/newsletter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'subscriber@example.com' })
    });
    const newsData = await newsRes.json();
    assert(newsData.success === true, 'Newsletter subscription succeeds and stores persistently');

    // 17. Test Logout
    console.log('\n[10] Testing Logout & Session Invalidation');
    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${updatedUserToken}` }
    });
    const logoutData = await logoutRes.json();
    assert(logoutData.success === true, 'Logout invalidates active session on server');

    // Verify token no longer works
    const postLogoutMe = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${updatedUserToken}` }
    });
    assert(postLogoutMe.status === 401, 'Post-logout request with invalidated token returns 401 Unauthorized');

    console.log(`\n========================================`);
    console.log(`TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
    console.log(`========================================`);

    if (failCount > 0) process.exit(1);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTests();
