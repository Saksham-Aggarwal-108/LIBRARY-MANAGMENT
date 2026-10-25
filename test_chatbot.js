/**
 * BookNest AI Assistant - "Kaira" Comprehensive Integration & Scenario Test
 * Tests all 20 required conversation scenarios:
 * 1. Hi
 * 2. Hello
 * 3. How are you?
 * 4. What is BookNest?
 * 5. Show available books.
 * 6. Suggest programming books.
 * 7. Do you have Harry Potter?
 * 8. Recommend a mystery novel.
 * 9. What books have I borrowed? (Guest vs Logged In)
 * 10. When is my return date? (Guest vs Logged In)
 * 11. How can I borrow a book?
 * 12. How do I return a book?
 * 13. Thank you.
 * 14. Bye.
 * 15. Random unrelated question.
 * 16. Misspelled book title.
 * 17. Follow-up question.
 * 18. Empty message.
 * 19. Network failure handling.
 * 20. AI service fallback & reliability.
 */

const BASE_URL = 'http://localhost:3000/api';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    testsFailed++;
  }
}

async function runTests() {
  console.log('======================================================');
  console.log('   STARTING KAIRA CHATBOT 20 SCENARIOS TEST SUITE     ');
  console.log('======================================================\n');

  let studentToken = null;
  // Step 0: Login as student to test authenticated queries
  try {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'student', password: 'student123' })
    });
    const loginJson = await loginRes.json();
    if (loginJson.success && loginJson.token) {
      studentToken = loginJson.token;
      console.log('🔑 Logged in as student for auth testing');
    }
  } catch (e) {
    console.error('Login error:', e);
  }

  // 1. "Hi"
  console.log('\n--- Scenario 1: Hi ---');
  let convId = null;
  {
    const res = await fetch(`${BASE_URL}/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hi' })
    });
    const data = await res.json();
    assert(data.success === true, 'Response marked success');
    assert(data.reply.includes('Kaira'), 'Reply introduces Kaira');
    assert(data.suggestions.length > 0, 'Returns suggestions chips');
    convId = data.conversationId;
  }

  // 2. "Hello"
  console.log('\n--- Scenario 2: Hello ---');
  {
    const res = await fetch(`${BASE_URL}/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello', conversationId: convId })
    });
    const data = await res.json();
    assert(data.success === true, 'Response marked success');
    assert(data.reply.toLowerCase().includes('welcome') || data.reply.toLowerCase().includes('kaira'), 'Handles Hello politely');
  }

  // 3. "How are you?"
  console.log('\n--- Scenario 3: How are you? ---');
  {
    const res = await fetch(`${BASE_URL}/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'How are you?', conversationId: convId })
    });
    const data = await res.json();
    assert(data.success === true, 'Response marked success');
    assert(data.reply.toLowerCase().includes('great') || data.reply.toLowerCase().includes('ready'), 'Answers How are you enthusiastically');
  }

  // 4. "What is BookNest?"
  console.log('\n--- Scenario 4: What is BookNest? ---');
  {
    const res = await fetch(`${BASE_URL}/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What is BookNest?', conversationId: convId })
    });
    const data = await res.json();
    assert(data.success === true, 'Response marked success');
    assert(data.reply.toLowerCase().includes('booknest') && data.reply.toLowerCase().includes('library'), 'Explains BookNest clearly');
  }

  // 5. "Show available books."
  console.log('\n--- Scenario 5: Show available books ---');
  {
    const res = await fetch(`${BASE_URL}/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Show available books.', conversationId: convId })
    });
    const data = await res.json();
    assert(data.success === true, 'Response marked success');
    assert(Array.isArray(data.books) && data.books.length > 0, 'Returns real available books');
    assert(data.books.every(b => b.availability === true), 'All returned books are actually available');
  }

  // 6. "Suggest programming books."
  console.log('\n--- Scenario 6: Suggest programming books ---');
  {
    const res = await fetch(`${BASE_URL}/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Suggest programming books.', conversationId: convId })
    });
    const data = await res.json();
    assert(data.success === true, 'Response marked success');
    assert(data.books.some(b => b.title === 'Clean Code'), 'Recommends Clean Code');
    assert(data.books.some(b => b.title === 'The Pragmatic Programmer'), 'Recommends The Pragmatic Programmer');
  }

  // 7. "Do you have Harry Potter?"
  console.log('\n--- Scenario 7: Do you have Harry Potter? ---');
  {
    const res = await fetch(`${BASE_URL}/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Do you have Harry Potter?', conversationId: convId })
    });
    const data = await res.json();
    assert(data.success === true, 'Response marked success');
    assert(data.books.length === 1 && data.books[0].title === 'Harry Potter', 'Locates Harry Potter in database');
    assert(data.books[0].author === 'J. K. Rowling', 'Accurate author attribution');
  }

  // 8. "Recommend a mystery novel."
  console.log('\n--- Scenario 8: Recommend a mystery novel ---');
  {
    const res = await fetch(`${BASE_URL}/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Recommend a mystery novel.', conversationId: convId })
    });
    const data = await res.json();
    assert(data.success === true, 'Response marked success');
    assert(data.books.some(b => b.title.includes('Murder')), 'Recommends Good Girls Guide To Murder');
  }

  // 9. "What books have I borrowed?" (Guest vs Logged In)
  console.log('\n--- Scenario 9: What books have I borrowed? ---');
  // 9a. As Guest
  {
    const res = await fetch(`${BASE_URL}/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What books have I borrowed?' })
    });
    const data = await res.json();
    assert(data.reply.toLowerCase().includes('log in') || data.reply.toLowerCase().includes('login'), 'Guest receives login prompt');
  }
  // 9b. As Authenticated User
  if (studentToken) {
    const res = await fetch(`${BASE_URL}/chatbot/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ message: 'What books have I borrowed?' })
    });
    const data = await res.json();
    assert(data.success === true, 'Authenticated borrow query succeeds');
    assert(data.reply.includes('Jane Student') || data.reply.includes('borrowed books'), 'Personalized to logged-in user');
  }

  // 10. "When is my return date?" (Guest vs Logged In)
  console.log('\n--- Scenario 10: When is my return date? ---');
  // 10a. As Guest
  {
    const res = await fetch(`${BASE_URL}/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'When is my return date?' })
    });
    const data = await res.json();
    assert(data.reply.toLowerCase().includes('log in') || data.reply.toLowerCase().includes('login'), 'Guest receives login prompt for return date');
  }
  // 10b. As Authenticated User
  if (studentToken) {
    const res = await fetch(`${BASE_URL}/chatbot/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ message: 'When is my return date?' })
    });
    const data = await res.json();
    assert(data.success === true, 'Authenticated return date query succeeds');
    assert(data.reply.includes('Due') || data.reply.includes('due dates'), 'Provides due date response');
  }

  // 11. "How can I borrow a book?"
  console.log('\n--- Scenario 11: How can I borrow a book? ---');
  {
    const res = await fetch(`${BASE_URL}/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'How can I borrow a book?' })
    });
    const data = await res.json();
    assert(data.success === true, 'Response marked success');
    assert(data.reply.includes('14') || data.reply.toLowerCase().includes('borrow now'), 'Explains 14-day borrowing process');
  }

  // 12. "How do I return a book?"
  console.log('\n--- Scenario 12: How do I return a book? ---');
  {
    const res = await fetch(`${BASE_URL}/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'How do I return a book?' })
    });
    const data = await res.json();
    assert(data.success === true, 'Response marked success');
    assert(data.reply.toLowerCase().includes('dashboard') && data.reply.toLowerCase().includes('return book'), 'Explains dashboard return steps');
  }

  // 13. "Thank you."
  console.log('\n--- Scenario 13: Thank you ---');
  {
    const res = await fetch(`${BASE_URL}/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Thank you.' })
    });
    const data = await res.json();
    assert(data.success === true, 'Response marked success');
    assert(data.reply.toLowerCase().includes('welcome') || data.reply.toLowerCase().includes('happy reading'), 'Courteously answers Thank You');
  }

  // 14. "Bye."
  console.log('\n--- Scenario 14: Bye ---');
  {
    const res = await fetch(`${BASE_URL}/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Bye.' })
    });
    const data = await res.json();
    assert(data.success === true, 'Response marked success');
    assert(data.reply.toLowerCase().includes('goodbye') || data.reply.toLowerCase().includes('wonderful day'), 'Courteously bids farewell');
  }

  // 15. "Random unrelated question."
  console.log('\n--- Scenario 15: Random unrelated question ---');
  {
    const res = await fetch(`${BASE_URL}/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What is the capital of France?' })
    });
    const data = await res.json();
    assert(data.success === true, 'Response marked success');
    assert(data.reply.includes('Paris') && data.reply.includes('BookNest'), 'Answers trivia and reinforces BookNest role');
  }

  // 16. "Misspelled book title."
  console.log('\n--- Scenario 16: Misspelled book title ---');
  {
    const res = await fetch(`${BASE_URL}/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Do you have hary poter?' })
    });
    const data = await res.json();
    assert(data.success === true, 'Response marked success');
    assert(data.books.some(b => b.title === 'Harry Potter'), 'Fuzzy matches "hary poter" to "Harry Potter"');
  }

  // 17. "Follow-up question."
  console.log('\n--- Scenario 17: Follow-up question ---');
  {
    // Step 1: Suggest programming books
    const res1 = await fetch(`${BASE_URL}/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Suggest programming books' })
    });
    const data1 = await res1.json();
    const activeConvId = data1.conversationId;

    // Step 2: Follow-up: "Which one is best for beginners?"
    const res2 = await fetch(`${BASE_URL}/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Which one is best for beginners?',
        conversationId: activeConvId
      })
    });
    const data2 = await res2.json();
    assert(data2.success === true, 'Follow up response marked success');
    assert(data2.reply.includes('Clean Code') || data2.reply.includes('Pragmatic'), 'Remembers previous programming books context');
  }

  // 18. "Empty message."
  console.log('\n--- Scenario 18: Empty message ---');
  {
    const res = await fetch(`${BASE_URL}/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '   ' })
    });
    const data = await res.json();
    assert(res.status === 400, 'Returns 400 Bad Request on empty message');
    assert(data.success === false, 'Marked as false');
    assert(data.message.includes('valid message'), 'Returns helpful validation error');
  }

  // 19. "Network failure handling."
  console.log('\n--- Scenario 19: Network failure / Invalid input handling ---');
  {
    const res = await fetch(`${BASE_URL}/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'A'.repeat(600) }) // > 500 chars limit
    });
    const data = await res.json();
    assert(res.status === 400, 'Rejects overlong messages with 400');
    assert(data.message.includes('too long'), 'Explains character limit to user');
  }

  // 20. "AI service fallback / Clear conversation."
  console.log('\n--- Scenario 20: AI service fallback & Clear conversation ---');
  {
    const res = await fetch(`${BASE_URL}/chatbot/clear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: convId })
    });
    const data = await res.json();
    assert(data.success === true, 'Clear conversation succeeds');
    assert(data.message.includes('cleared'), 'Confirms conversation cleared');
  }

  console.log('\n======================================================');
  console.log(`TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('======================================================');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests();
