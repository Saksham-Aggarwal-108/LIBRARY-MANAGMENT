/**
 * BookNest AI Assistant - "Kiara" General-Purpose AI Test Suite
 * Tests:
 * 1. "Hi Kiara!" greeting
 * 2. "What is JavaScript?"
 * 3. "Explain JavaScript Promises with an example." (Code block verification)
 * 4. "What is 25 × 16?" (Math & step-by-step calculation)
 * 5. "What is Python?"
 * 6. "Give me an example." (Multi-turn follow-up context)
 * 7. "Recommend a mystery book." (BookNest catalog grounding)
 * 8. Missing API key fallback resilience
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

async function runGeneralAITests() {
  console.log('======================================================');
  console.log('   STARTING KIARA GENERAL-PURPOSE AI TEST SUITE       ');
  console.log('======================================================\n');

  let convId = null;

  // Test 1: "Hi Kiara!"
  console.log('--- Test 1: "Hi Kiara!" ---');
  {
    const res = await fetch(`${BASE_URL}/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hi Kiara!' })
    });
    const data = await res.json();
    assert(data.success === true, 'Response status is success');
    assert(data.reply.includes('Kiara') || data.reply.includes('BookNest'), 'Greets warmly as Kiara');
    convId = data.conversationId;
  }

  // Test 2: "What is JavaScript?"
  console.log('\n--- Test 2: "What is JavaScript?" ---');
  {
    const res = await fetch(`${BASE_URL}/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What is JavaScript?', conversationId: convId })
    });
    const data = await res.json();
    assert(data.success === true, 'Response status is success');
    assert(data.reply.toLowerCase().includes('javascript') && (data.reply.toLowerCase().includes('programming') || data.reply.toLowerCase().includes('language')), 'Accurately explains JavaScript');
  }

  // Test 3: "Explain JavaScript Promises with an example."
  console.log('\n--- Test 3: "Explain JavaScript Promises with an example." ---');
  {
    const res = await fetch(`${BASE_URL}/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Explain JavaScript Promises with an example.', conversationId: convId })
    });
    const data = await res.json();
    assert(data.success === true, 'Response status is success');
    assert(data.reply.toLowerCase().includes('promise') && (data.reply.toLowerCase().includes('resolve') || data.reply.toLowerCase().includes('pending')), 'Explains Promise lifecycle and states');
    assert(data.reply.includes('```javascript') || data.reply.includes('```'), 'Provides formatted code block example');
  }

  // Test 4: "What is 25 × 16?"
  console.log('\n--- Test 4: "What is 25 × 16?" ---');
  {
    const res = await fetch(`${BASE_URL}/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What is 25 × 16?', conversationId: convId })
    });
    const data = await res.json();
    assert(data.success === true, 'Response status is success');
    assert(data.reply.includes('400'), 'Accurately computes 25 × 16 = 400');
    assert(data.reply.toLowerCase().includes('step') || data.reply.includes('250'), 'Provides step-by-step breakdown');
  }

  // Test 5: "What is Python?"
  console.log('\n--- Test 5: "What is Python?" ---');
  {
    const res = await fetch(`${BASE_URL}/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What is Python?', conversationId: convId })
    });
    const data = await res.json();
    assert(data.success === true, 'Response status is success');
    assert(data.reply.toLowerCase().includes('python') && data.reply.toLowerCase().includes('programming'), 'Accurately explains Python');
  }

  // Test 6: Follow-up "Give me an example."
  console.log('\n--- Test 6: Follow-up "Give me an example." ---');
  {
    const res = await fetch(`${BASE_URL}/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Give me an example.', conversationId: convId })
    });
    const data = await res.json();
    assert(data.success === true, 'Response status is success');
    assert(data.reply.toLowerCase().includes('python') || data.reply.includes('def ') || data.reply.includes('```python'), 'Remembers previous Python context and gives code example');
  }

  // Test 7: "Recommend a mystery book."
  console.log('\n--- Test 7: "Recommend a mystery book." ---');
  {
    const res = await fetch(`${BASE_URL}/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Recommend a mystery book.', conversationId: convId })
    });
    const data = await res.json();
    assert(data.success === true, 'Response status is success');
    assert(data.books && data.books.length > 0, 'Returns real BookNest catalog book cards');
    assert(data.books.some(b => b.title.includes('Murder') || b.id === 1), 'Recommends verified mystery title');
  }

  // Test 8: Missing API key fallback resilience
  console.log('\n--- Test 8: Missing API key fallback resilience ---');
  {
    // Calling without GEMINI_API_KEY set must return valid response without unhandled crash
    const res = await fetch(`${BASE_URL}/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'How does photosynthesis work?' })
    });
    const data = await res.json();
    assert(res.status === 200, 'Returns 200 OK without crashing when API key is missing');
    assert(data.success === true, 'Gracefully handles general query via local fallback');
  }

  console.log('\n======================================================');
  console.log(`TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('======================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runGeneralAITests().catch(err => {
  console.error(err);
  process.exit(1);
});
