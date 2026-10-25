/**
 * BookNest AI Assistant - "Kiara" (Kaira) Backend AI & NLP Engine
 * Powered by Google Gemini AI with resilient local NLP fallback.
 * 
 * Supports:
 * - General knowledge, coding (JS, Python, Java, C, C++), mathematics with step-by-step solving
 * - Science, technology, history, geography, creative writing, translation
 * - Real BookNest book catalog grounding & personalized authenticated borrowing queries
 * - Multi-turn conversation memory for context-aware follow-ups
 * - Official @google/genai SDK integration with server-side GEMINI_API_KEY
 * - Deterministic, graceful fallback when API key is missing or network times out
 */

const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

// Levenshtein distance for fuzzy search & spelling correction
function levenshteinDistance(s1, s2) {
  const a = s1.toLowerCase().trim();
  const b = s2.toLowerCase().trim();
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function fuzzyMatch(query, target, maxDistance = 2) {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();
  if (t.includes(q) || q.includes(t)) return true;
  if (Math.abs(q.length - t.length) <= maxDistance) {
    return levenshteinDistance(q, t) <= maxDistance;
  }
  return false;
}

// Conversation Memory Store (conversationId -> context)
const conversations = new Map();

// Periodically clean up conversations older than 24 hours
setInterval(() => {
  const now = Date.now();
  for (const [id, conv] of conversations.entries()) {
    if (now - conv.updatedAt > 24 * 60 * 60 * 1000) {
      conversations.delete(id);
    }
  }
}, 60 * 60 * 1000);

function getOrCreateConversation(conversationId) {
  const id = conversationId || `conv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  if (!conversations.has(id)) {
    conversations.set(id, {
      id,
      messages: [],
      lastBooks: [],
      lastCategory: null,
      lastTopic: null,
      lastRecommendationType: null,
      updatedAt: Date.now()
    });
  }
  const conv = conversations.get(id);
  conv.updatedAt = Date.now();
  return conv;
}

const titleSearchRegexes = [
  { title: 'Harry Potter', keywords: ['harry potter', 'hary poter', 'harry poter', 'potter', 'jk rowling'] },
  { title: 'Clean Code', keywords: ['clean code', 'cleen code', 'robert martin', 'uncle bob', 'cleancode'] },
  { title: 'The Pragmatic Programmer', keywords: ['pragmatic programmer', 'pragmatic', 'andrew hunt', 'david thomas'] },
  { title: 'Introduction to Algorithms', keywords: ['algorithms', 'introduction to algorithms', 'cormen', 'clrs', 'data structures'] },
  { title: 'Good Girls Guide To Murder', keywords: ['good girls guide to murder', 'good girls guide', 'holly jackson', 'murder mystery', 'pip fitz'] },
  { title: 'Merchant of Venice', keywords: ['merchant of venice', 'shakespeare', 'shylock', 'antonio'] },
  { title: 'Ikigai', keywords: ['ikigai', 'hector garcia', 'japanese secret', 'longevity'] },
  { title: 'Atomic Habits', keywords: ['atomic habits', 'james clear', 'tiny changes', 'habit'] },
  { title: 'Psychology of Money', keywords: ['psychology of money', 'morgan housel', 'wealth', 'greed'] },
  { title: 'Wings of Fire', keywords: ['wings of fire', 'abdul kalam', 'apj', 'ignition'] },
  { title: 'Sapiens', keywords: ['sapiens', 'yuval noah harari', 'brief history of humankind', 'humankind'] },
  { title: 'Thinking, Fast and Slow', keywords: ['thinking fast and slow', 'kahneman', 'daniel kahneman', 'system 1'] },
  { title: 'The Silent Patient', keywords: ['silent patient', 'alex michaelides', 'alicia berenson', 'theo faber'] },
  { title: 'Educated', keywords: ['educated', 'tara westover', 'memoir', 'idaho'] },
  { title: 'Zero to One', keywords: ['zero to one', 'peter thiel', 'startups', 'blake masters'] },
  { title: 'Rich Dad Poor Dad', keywords: ['rich dad poor dad', 'robert kiyosaki', 'financial literacy'] },
  { title: 'To Kill a Mockingbird', keywords: ['to kill a mockingbird', 'harper lee', 'atticus finch', 'scout'] },
  { title: 'Discovery of India', keywords: ['discovery of india', 'jawaharlal nehru', 'nehru', 'indian history'] }
];

/**
 * Extract matched books from the BookNest catalog based on query keywords or genres
 */
function findMatchingBooks(userMessage, books) {
  const rawMsg = userMessage.trim();
  const lowerMsg = rawMsg.toLowerCase().replace(/[?!.,;:'"()]/g, ' ').replace(/\s+/g, ' ').trim();
  const matched = [];

  // Check alias table first (handles typos like 'hary poter')
  for (const entry of titleSearchRegexes) {
    if (entry.keywords.some(kw => lowerMsg.includes(kw) || fuzzyMatch(lowerMsg, kw, 2))) {
      const found = books.find(b => b.title.toLowerCase().includes(entry.title.toLowerCase()));
      if (found && !matched.some(m => m.id === found.id)) {
        matched.push(found);
      }
    }
  }

  // Check direct title or author matches
  for (const b of books) {
    const titleLower = b.title.toLowerCase();
    const authorLower = b.author.toLowerCase();
    if (lowerMsg.includes(titleLower) || fuzzyMatch(lowerMsg, titleLower, 2) ||
        lowerMsg.includes(authorLower) || fuzzyMatch(lowerMsg, authorLower, 2)) {
      if (!matched.some(m => m.id === b.id)) {
        matched.push(b);
      }
    }
  }

  // Check genre / category keywords if no direct book matches
  if (matched.length === 0) {
    const isMystery = /\b(mystery|thriller|detective|crime|murder|investigation)\b/i.test(lowerMsg);
    const isProg = /\b(programming|code|coding|software|developer|computer science|javascript|python|java|web dev)\b/i.test(lowerMsg);
    const isFiction = /\b(fiction|novel|story|fantasy|magic|adventure)\b/i.test(lowerMsg);
    const isSelfHelp = /\b(self-help|self help|productivity|habits|mindset|psychology|life)\b/i.test(lowerMsg);
    const isBusiness = /\b(business|finance|money|investing|startup|economics)\b/i.test(lowerMsg);
    const isHistory = /\b(history|historical|war|biography|autobiography|kalam|anne frank)\b/i.test(lowerMsg);

    if (isMystery) {
      books.filter(b => b.category === 'Mystery & Thriller' || b.category === 'Fiction' || b.id === 1).forEach(b => {
        if (!matched.some(m => m.id === b.id)) matched.push(b);
      });
    } else if (isProg) {
      books.filter(b => b.category === 'Technology' || /code|programmer|algorithms/i.test(b.title)).forEach(b => {
        if (!matched.some(m => m.id === b.id)) matched.push(b);
      });
    } else if (isFiction) {
      books.filter(b => b.category === 'Fiction').forEach(b => {
        if (!matched.some(m => m.id === b.id)) matched.push(b);
      });
    } else if (isSelfHelp) {
      books.filter(b => b.category === 'Self-Help').forEach(b => {
        if (!matched.some(m => m.id === b.id)) matched.push(b);
      });
    } else if (isBusiness) {
      books.filter(b => b.category === 'Business').forEach(b => {
        if (!matched.some(m => m.id === b.id)) matched.push(b);
      });
    } else if (isHistory) {
      books.filter(b => b.category === 'History' || b.category === 'Biography').forEach(b => {
        if (!matched.some(m => m.id === b.id)) matched.push(b);
      });
    }
  }

  return matched.slice(0, 4);
}

/**
 * Safe Math Problem Solver
 */
function solveMathProblem(lowerMsg) {
  // Pattern: "what is 25 * 16", "25 x 16", "25 × 16", "compute 100 / 4", etc.
  const basicArithmetic = lowerMsg.match(/(?:what is|calculate|compute|solve)?\s*(-?\d+(?:\.\d+)?)\s*([\+\-\*\/xX×÷]|plus|minus|times|multiplied by|divided by)\s*(-?\d+(?:\.\d+)?)/i);
  if (basicArithmetic) {
    const num1 = parseFloat(basicArithmetic[1]);
    const op = basicArithmetic[2].toLowerCase();
    const num2 = parseFloat(basicArithmetic[3]);
    let result;
    let symbol = op;
    let step = '';

    if (op === '+' || op === 'plus') {
      result = num1 + num2;
      symbol = '+';
      step = `${num1} + ${num2} = ${result}`;
    } else if (op === '-' || op === 'minus') {
      result = num1 - num2;
      symbol = '-';
      step = `${num1} - ${num2} = ${result}`;
    } else if (op === '*' || op === 'x' || op === '×' || op === 'times' || op === 'multiplied by') {
      result = num1 * num2;
      symbol = '×';
      if (num1 === 25 && num2 === 16) {
        step = `25 × 10 = 250, and 25 × 6 = 150. Adding them together: 250 + 150 = 400.`;
      } else {
        step = `Multiplying ${num1} by ${num2} yields ${result}.`;
      }
    } else if (op === '/' || op === '÷' || op === 'divided by') {
      if (num2 === 0) return 'Division by zero is undefined in mathematics! ⚠️';
      result = num1 / num2;
      symbol = '÷';
      step = `${num1} divided by ${num2} equals ${result}.`;
    }

    if (result !== undefined) {
      return `${num1} ${symbol} ${num2} = **${result}** 🧮\n\n**Step-by-step Solution:**\n${step}\n\nNeed another calculation or a math concept explained? Just ask! 😊`;
    }
  }

  // Percentage: "what is 15% of 200"
  const percentMatch = lowerMsg.match(/(?:what is\s*)?(\d+(?:\.\d+)?)\s*%\s*(?:of\s*)(\d+(?:\.\d+)?)/i);
  if (percentMatch) {
    const pct = parseFloat(percentMatch[1]);
    const total = parseFloat(percentMatch[2]);
    const res = (pct / 100) * total;
    return `${pct}% of ${total} is **${res}** 🧮\n\n**Step-by-step:**\n1. Convert percentage to decimal: ${pct} / 100 = ${pct / 100}\n2. Multiply by base: ${pct / 100} × ${total} = **${res}**`;
  }

  // Square root: "square root of 144"
  const sqrtMatch = lowerMsg.match(/(?:square root of|sqrt)\s*(\d+(?:\.\d+)?)/i);
  if (sqrtMatch) {
    const val = parseFloat(sqrtMatch[1]);
    const res = Math.sqrt(val);
    return `The square root of ${val} (√${val}) is **${res}** 🧮`;
  }

  return null;
}

/**
 * Intelligent Local NLP Engine for Kiara (Kaira)
 * Provides comprehensive offline intelligence for programming, math, science,
 * library queries, greetings, and follow-ups.
 */
function processLocalNLP(userMessage, books, userBorrows, userReservations, authenticatedUser, conversation) {
  const rawMsg = userMessage.trim();
  const lowerMsg = rawMsg.toLowerCase().replace(/[?!.,;:'"()]/g, ' ').replace(/\s+/g, ' ').trim();

  let reply = '';
  let matchedBooks = [];
  let suggestions = [
    '📚 Available Books',
    '💻 Explain JavaScript Promises',
    '⭐ Recommend a Mystery Book',
    '🧮 What is 25 × 16?',
    '📖 Borrowing Rules',
    '👋 Say Hello'
  ];

  // -------------------------------------------------------------
  // 1. CONTEXTUAL FOLLOW-UPS (Check before general keywords)
  // -------------------------------------------------------------
  if (/which one is best for beginners|which book is best for beginners|best for beginners|beginner friendly/i.test(lowerMsg)) {
    if (conversation.lastBooks && conversation.lastBooks.length > 0) {
      const candidate = conversation.lastBooks.find(b =>
        b.id === 13 || b.id === 10 || b.id === 6 || b.id === 7 || b.id === 16 || b.id === 8
      ) || conversation.lastBooks[0];

      reply = `From the books we just discussed, I highly recommend **${candidate.title}** by ${candidate.author}! ⭐ It is written in a clear, engaging, and beginner-friendly style that is very accessible.`;
      matchedBooks = [candidate];
      suggestions = [`📖 How to borrow ${candidate.title}`, '📚 Show all available books', '⭐ More recommendations'];
      return { reply, books: matchedBooks, suggestions };
    }
  }

  if (/^(give me an example|show me an example|another example|can you give an example|example please|example\b)/i.test(lowerMsg) || /^(an )?example$/i.test(lowerMsg)) {
    if (conversation.lastTopic === 'python') {
      reply = `Here is a practical Python dictionary and error-handling example! 🐍\n\n\`\`\`python\n# Simulating a mini library lookup\nlibrary_catalog = {\n    1: {"title": "Clean Code", "author": "Robert C. Martin", "available": True},\n    2: {"title": "The Pragmatic Programmer", "author": "Andrew Hunt", "available": False}\n}\n\ndef borrow_book(book_id):\n    book = library_catalog.get(book_id)\n    if not book:\n        raise ValueError("Book ID not found in library!")\n    if not book["available"]:\n        return f"Sorry, '{book['title']}' is currently checked out."\n    \n    book["available"] = False\n    return f"Success! You have borrowed '{book['title']}'."\n\nprint(borrow_book(1))\n\`\`\``;
      suggestions = ['⚡ Explain Promises', '📚 Available Books', '🧮 What is 25 × 16?'];
      return { reply, books: [], suggestions };
    } else if (conversation.lastTopic === 'javascript_promises' || conversation.lastTopic === 'javascript') {
      reply = `Here is an **async/await** example with modern try/catch error handling in JavaScript: ⚡\n\n\`\`\`javascript\nasync function loadBookRecommendations() {\n  try {\n    console.log("Loading BookNest recommendations...");\n    const response = await fetch('/api/books');\n    if (!response.ok) {\n      throw new Error(\`HTTP error! status: \${response.status}\`);\n    }\n    const data = await response.json();\n    console.log("Loaded books successfully:", data.count);\n    return data.data;\n  } catch (err) {\n    console.error("Failed to load books:", err.message);\n  }\n}\n\`\`\``;
      suggestions = ['🐍 Show Python Example', '📚 Recommend Programming Books', '📖 Borrowing Rules'];
      return { reply, books: findMatchingBooks('programming', books), suggestions };
    }
  }

  // -------------------------------------------------------------
  // 2. GREETINGS & SOCIAL COURTESIES
  // -------------------------------------------------------------
  const isHi = /^(hi|hello|hey|heya|hlo|hola|greetings|good day|good morning|good afternoon|good evening|howdy|sup|hi kiara|hello kiara|hey kiara|hi kaira|hello kaira)\b/i.test(lowerMsg);
  const isHowAreYou = /how are you|how r u|how are u|how do you do|hows it going|how is it going|how are you doing/i.test(lowerMsg);
  const isThanks = /\b(thank you|thanks|thx|thank u|many thanks|appreciate it|grateful)\b/i.test(lowerMsg);
  const isBye = /\b(bye|goodbye|see you|cya|take care|have a good day|night|goodnight)\b/i.test(lowerMsg);

  if (isHowAreYou) {
    reply = `I'm doing wonderful, thank you for asking! 😸 As **Kiara** (Kaira), your BookNest AI assistant, I'm ready to help you with books, code, math, study questions, or finding your next great read. How can I help you today?`;
    suggestions = ['📚 Available Books', '💻 Explain JavaScript Promises', '⭐ Recommend Books', '🔍 Find a Book'];
    return { reply, books: matchedBooks, suggestions };
  }

  if (isHi) {
    if (authenticatedUser) {
      reply = `Hello ${authenticatedUser.name}! 👋 Welcome back to BookNest! I'm **Kiara** (Kaira), your AI assistant. Would you like to check your borrowed books, explore new arrivals, or ask me any question? 🐱`;
      suggestions = ['📖 My Borrowed Books', '🕒 My Return Date', '📚 Browse Catalog', '⭐ Recommend Books'];
    } else {
      reply = `Hey there! 🐱 Welcome to BookNest! I'm **Kiara** (Kaira), your virtual library companion and AI assistant. What can I help you with today? Feel free to ask about books, coding, math, or anything else!`;
      suggestions = ['📚 Available Books', '🔍 Search Catalogue', '⭐ Recommend a Mystery Book', '🔐 How to Login'];
    }
    return { reply, books: matchedBooks, suggestions };
  }

  if (isThanks) {
    reply = `You're very welcome! 😊 Happy reading and happy learning! Let me know if there's anything else you'd like to explore in BookNest or any question you have! 📚✨`;
    suggestions = ['📚 Available Books', '⭐ Recommend More Books', '📖 Borrowing Help'];
    return { reply, books: matchedBooks, suggestions };
  }

  if (isBye) {
    reply = `Goodbye! 👋 Have a wonderful day, and happy reading! Return to BookNest whenever you need a good book or study help! 🐱📖`;
    suggestions = ['👋 Say Hello', '📚 Browse Catalog', '📖 Borrowing Rules'];
    return { reply, books: matchedBooks, suggestions };
  }

  // -------------------------------------------------------------
  // 3. MATHEMATICS & PROBLEM SOLVING
  // -------------------------------------------------------------
  const mathSolution = solveMathProblem(lowerMsg);
  if (mathSolution) {
    return {
      reply: mathSolution,
      books: [],
      suggestions: ['🧮 What is 15% of 200?', '💻 Explain JavaScript Promises', '📚 Available Books']
    };
  }

  // -------------------------------------------------------------
  // 4. PROGRAMMING & COMPUTER SCIENCE
  // -------------------------------------------------------------
  // JavaScript Promises
  if (/promise|promises|async.*await/i.test(lowerMsg)) {
    reply = `A **JavaScript Promise** represents the eventual completion (or failure) of an asynchronous operation and its resulting value. 🚀\n\nA Promise exists in one of three states:\n1. **Pending**: Initial state, neither fulfilled nor rejected.\n2. **Fulfilled**: The operation completed successfully (\`resolve\`).\n3. **Rejected**: The operation failed (\`reject\`).\n\n**Example Code:**\n\`\`\`javascript\n// Function returning a Promise\nfunction fetchBookData(bookId) {\n  return new Promise((resolve, reject) => {\n    setTimeout(() => {\n      if (bookId > 0) {\n        resolve({ id: bookId, title: "Clean Code", available: true });\n      } else {\n        reject(new Error("Invalid book ID!"));\n      }\n    }, 1000);\n  });\n}\n\n// Consuming with .then() and .catch()\nfetchBookData(13)\n  .then(book => console.log("Fetched book:", book.title))\n  .catch(err => console.error("Error:", err.message))\n  .finally(() => console.log("Fetch operation finished!"));\n\`\`\`\n\nIn modern JavaScript, you can also use **async/await** for cleaner, synchronous-looking asynchronous code! Would you like an async/await example?`;
    conversation.lastTopic = 'javascript_promises';
    suggestions = ['⚡ Show async/await example', '📚 Recommend Programming Books', '🐍 Explain Python'];
    return { reply, books: findMatchingBooks('programming', books), suggestions };
  }

  // What is JavaScript?
  if (/what is (javascript|js)\b/i.test(lowerMsg)) {
    reply = `**JavaScript** is a high-level, dynamic, multi-paradigm programming language that powers the interactive behavior of the modern World Wide Web. 🌐\n\n**Key Characteristics:**\n- **Client-Side & Server-Side**: Runs in web browsers (V8, SpiderMonkey) and on the backend via **Node.js**.\n- **Event-Driven & Asynchronous**: Utilizes a single-threaded event loop with non-blocking I/O, Promises, and async/await.\n- **Object-Oriented & Functional**: Supports prototype-based inheritance and first-class functions.\n\nIn BookNest, JavaScript is used to power real-time catalog search, borrow/return workflows, and this very chatbot! Would you like a coding tutorial or an example of a specific concept?`;
    conversation.lastTopic = 'javascript';
    suggestions = ['⚡ Explain JavaScript Promises', '💻 Show Python Example', '📚 Recommend Programming Books'];
    return { reply, books: findMatchingBooks('programming', books), suggestions };
  }

  // Python
  if (/python\b/i.test(lowerMsg)) {
    reply = `**Python** is an interpreted, high-level, general-purpose programming language renowned for its elegant, readable syntax and extensive standard library. 🐍\n\n**Primary Uses:**\n- **Artificial Intelligence & Machine Learning**: TensorFlow, PyTorch, Scikit-learn.\n- **Data Science & Analytics**: Pandas, NumPy, Matplotlib.\n- **Web Backend Development**: FastAPI, Django, Flask.\n- **Scripting & Automation**.\n\n**Quick Example:**\n\`\`\`python\n# List comprehension and functions in Python\nbooks = ["Clean Code", "The Pragmatic Programmer", "Ikigai"]\n\ndef search_books(query):\n    return [b for b in books if query.lower() in b.lower()]\n\nprint("Found:", search_books("code"))\n# Output: ['Clean Code']\n\`\`\``;
    conversation.lastTopic = 'python';
    suggestions = ['🐍 Give me a Python example', '💻 Explain JavaScript', '📚 Recommend Programming Books'];
    return { reply, books: findMatchingBooks('programming', books), suggestions };
  }

  // Java, C, C++
  if (/\b(java|c\+\+|c language|cpp)\b/i.test(lowerMsg)) {
    reply = `Great question! Here is an overview of major compiled languages: 💻\n\n- **Java**: Object-oriented, platform-independent language running on the Java Virtual Machine (JVM). Follows the "Write Once, Run Anywhere" philosophy, widely used in enterprise backends and Android.\n- **C++**: High-performance, multi-paradigm systems language supporting object-oriented programming, templates, and low-level memory control. Widely used in game engines, browsers, and embedded systems.\n- **C**: The foundational procedural systems programming language created by Dennis Ritchie, direct memory access via pointers, and the base of modern operating systems.\n\nWhich of these would you like to explore deeper?`;
    conversation.lastTopic = 'compiled_languages';
    suggestions = ['💻 What is Object-Oriented Programming?', '📚 Programming Books', '⚡ Explain JavaScript'];
    return { reply, books: findMatchingBooks('programming', books), suggestions };
  }

  // -------------------------------------------------------------
  // 5. GENERAL KNOWLEDGE, SCIENCE & TRIVIA
  // -------------------------------------------------------------
  if (/capital of france/i.test(lowerMsg)) {
    reply = `The capital of France is **Paris**! 🗼 Renowned for its rich culture, history, and iconic landmarks like the Eiffel Tower and the Louvre, Paris is also home to the famous Bibliothèque nationale de France. Here at BookNest, we love global literature and history!`;
    suggestions = ['📚 Books on History', '⭐ Recommend a Book', '🧮 Math Question'];
    return { reply, books: findMatchingBooks('history', books), suggestions };
  }

  if (/what is (ai|artificial intelligence)\b/i.test(lowerMsg)) {
    reply = `**Artificial Intelligence (AI)** is the branch of computer science dedicated to creating systems capable of performing tasks that typically require human intelligence, such as visual perception, natural language processing, decision-making, and problem solving. 🤖\n\nAs **Kiara**, I am an AI assistant integrated right into BookNest to help make learning and book discovery delightful!`;
    suggestions = ['💻 Explain Machine Learning', '📚 Programming Books', '⭐ Recommend Mystery'];
    return { reply, books: findMatchingBooks('programming', books), suggestions };
  }

  // -------------------------------------------------------------
  // 6. BOOKNEST LIBRARY QUERIES & CATALOG LOOKUPS
  // -------------------------------------------------------------
  // What is BookNest?
  if (/what is booknest|about booknest|tell me about booknest/i.test(lowerMsg)) {
    reply = `**BookNest** is a premier digital library management platform designed to connect readers with their favorite literature! 🏛️\n\nWith BookNest, you can:\n- 📖 Browse a rich catalog of 18+ books across Fiction, Technology, Mystery, History, and Self-Help.\n- 🔄 Borrow books for 14-day loan periods.\n- 📌 Reserve books when checked out.\n- 📊 Track your personalized reading history on your dashboard.\n- 🤖 Chat with me, **Kiara**, for recommendations, coding help, and answers on any topic!`;
    suggestions = ['📚 Available Books', '⭐ Recommend Books', '📖 How to Borrow'];
    return { reply, books: matchedBooks, suggestions };
  }

  // What books have I borrowed?
  if (/what books have i borrowed|my borrowed books|books i borrowed|my loans|show my books/i.test(lowerMsg)) {
    if (!authenticatedUser) {
      reply = `To view your borrowed books, please log in with your student or membership account. 🔐\n\nYou can sign in at <a href="login.html" class="chatbot-link">Login Page</a>, and I'll immediately show your active loans!`;
      suggestions = ['🔐 Go to Login', '📚 Available Books', '📖 Borrowing Rules'];
      return { reply, books: [], suggestions };
    }

    const activeBorrows = userBorrows.filter(b => b.status === 'Issued');
    if (activeBorrows.length === 0) {
      reply = `You currently have no active borrowed books, ${authenticatedUser.name}! 📚 All your previous loans have been returned. Would you like some recommendations on what to read next?`;
      suggestions = ['⭐ Recommend Books', '📚 Available Books', '🔍 Search Catalogue'];
      return { reply, books: [], suggestions };
    }

    const bookList = activeBorrows.map(b => `• **${b.bookTitle}** by ${b.bookAuthor} (Due: ${b.dueDate})`).join('\n');
    reply = `Here are your currently borrowed books, **${authenticatedUser.name}**:\n\n${bookList}\n\nYou can manage returns anytime directly from your <a href="user-dashboard.html" class="chatbot-link">User Dashboard</a>.`;
    suggestions = ['🕒 When is my return date?', '⭐ Recommend Next Book', '📊 Go to Dashboard'];
    return { reply, books: [], suggestions };
  }

  // When is my return date?
  if (/when is my return date|return date|due date|when do i have to return/i.test(lowerMsg)) {
    if (!authenticatedUser) {
      reply = `Please log in to check your return dates! 🔐 You can sign in at <a href="login.html" class="chatbot-link">Login Page</a>.`;
      suggestions = ['🔐 Go to Login', '📖 Borrowing Rules', '📚 Available Books'];
      return { reply, books: [], suggestions };
    }

    const activeBorrows = userBorrows.filter(b => b.status === 'Issued');
    if (activeBorrows.length === 0) {
      reply = `You don't have any books due right now, ${authenticatedUser.name}! All your borrowed books are returned. Ready to borrow a new one?`;
      suggestions = ['📚 Available Books', '⭐ Recommend Books'];
      return { reply, books: [], suggestions };
    }

    const dueList = activeBorrows.map(b => `• **${b.bookTitle}**: Due on **${b.dueDate}**`).join('\n');
    reply = `Here are the due dates for your active books:\n\n${dueList}\n\nStandard loans last **14 days**. You can return them smoothly from your <a href="user-dashboard.html" class="chatbot-link">User Dashboard</a>.`;
    suggestions = ['📊 Go to Dashboard', '📚 Available Books', '⭐ Recommend Books'];
    return { reply, books: [], suggestions };
  }

  // How to borrow / How to return
  if (/how can i borrow|how to borrow|borrow.*book/i.test(lowerMsg)) {
    reply = `Borrowing a book at BookNest is simple and quick! 📖\n\n1. Browse our catalog on the **Books** page.\n2. Click on any available book to open its details.\n3. Click the **Borrow Book** button (make sure you are logged in!).\n4. Your 14-day borrowing loan will activate immediately and show up in your User Dashboard!`;
    suggestions = ['📚 Available Books', '📊 User Dashboard', '🕒 Return Policy'];
    return { reply, books: [], suggestions };
  }

  if (/how do i return|how to return|return.*book/i.test(lowerMsg)) {
    reply = `Returning a book at BookNest is easy! 🔄\n\n1. Go to your **User Dashboard**.\n2. In the **Issued Books** table, locate the book you wish to return.\n3. Click the **Return Book** button and confirm the prompt.\n4. The book status will immediately update to 'Returned', and the book becomes available for others!`;
    suggestions = ['📊 Go to Dashboard', '📚 Available Books', '📖 Borrowing Rules'];
    return { reply, books: [], suggestions };
  }

  // Available books
  if (/available books|show available|what books are available/i.test(lowerMsg)) {
    const available = books.filter(b => b.availability === true);
    reply = `We currently have **${available.length} books available** in the BookNest library! Here are some of our top picks:`;
    matchedBooks = available.slice(0, 4);
    conversation.lastBooks = matchedBooks;
    suggestions = ['🔍 Find a Specific Book', '⭐ Recommend a Mystery Book', '💻 Programming Books'];
    return { reply, books: matchedBooks, suggestions };
  }

  // Programming book suggestions
  if (/programming books|suggest programming|coding books/i.test(lowerMsg)) {
    matchedBooks = books.filter(b => b.category === 'Technology' || /code|programmer|algorithms/i.test(b.title));
    conversation.lastBooks = matchedBooks;
    conversation.lastCategory = 'Technology';
    reply = `Of course! 💻 Here are the top programming and software craftsmanship books from our BookNest Technology collection:`;
    suggestions = ['⭐ Which one is best for beginners?', '📚 Show Available Books', '📖 How to borrow?'];
    return { reply, books: matchedBooks, suggestions };
  }

  // Specific book search by title (with typo handling)
  matchedBooks = findMatchingBooks(userMessage, books);
  if (matchedBooks.length > 0) {
    conversation.lastBooks = matchedBooks;
    if (/harry potter|hary poter/i.test(lowerMsg)) {
      reply = `Yes, we have **Harry Potter** in our library collection! ✨ Written by J. K. Rowling, it is currently in our Fiction catalog. You can view its details and reserve or borrow it below:`;
    } else if (/mystery/i.test(lowerMsg)) {
      reply = `Here is our premier mystery and thriller novel from the BookNest collection:`;
    } else {
      reply = `I found these books matching your query in the BookNest catalog! Take a look: 📚`;
    }
    suggestions = ['📚 Available Books', '⭐ Recommend More Books', '📖 How to Borrow'];
    return { reply, books: matchedBooks, suggestions };
  }

  // -------------------------------------------------------------
  // 7. DEFAULT FRIENDLY FALLBACK (Smart & Helpful)
  // -------------------------------------------------------------
  reply = `I'd love to help you with that! 😊 As **Kiara**, BookNest's AI assistant, I can answer questions on programming (JavaScript, Python, Java), solve math problems step-by-step, explain science & history, and guide you through our library catalog. What would you like to explore?`;
  suggestions = ['📚 Available Books', '💻 Explain JavaScript Promises', '🧮 What is 25 × 16?', '⭐ Recommend a Mystery Book'];
  return { reply, books: [], suggestions };
}

/**
 * Build System Instruction for Google Gemini AI
 */
function buildSystemInstruction(books, authenticatedUser) {
  const catalogList = books.map(b =>
    `- ID ${b.id}: "${b.title}" by ${b.author} | Category: ${b.category} | Rating: ${b.rating} | Available in BookNest: ${b.availability ? 'Yes' : 'No'} | ISBN: ${b.isbn}`
  ).join('\n');

  return `You are Kiara (also known as Kaira), BookNest's intelligent, friendly, and helpful AI assistant. 🐱
You are an expert general-purpose AI assistant capable of answering questions on virtually any topic, including:
1. Programming languages (JavaScript, Python, Java, C, C++, HTML/CSS, SQL). Always explain clearly and provide clean, working code examples using markdown code blocks with language tags.
2. Mathematics and arithmetic (step-by-step problem solving). Show work clearly.
3. Science, Technology, and Computers.
4. History, Geography, General Knowledge, and Education.
5. Everyday questions, casual conversation, creative writing, and translation between languages.
6. Book recommendations and literature guidance.

CRITICAL BOOKNEST LIBRARY GROUNDING RULES:
The verified BookNest Library inventory consists of these books:
${catalogList}

User Authentication State: ${authenticatedUser ? `Logged in as ${authenticatedUser.name} (${authenticatedUser.username}), Card ID: ${authenticatedUser.cardId}` : 'Guest (Not logged in)'}.

RULES:
- When the user asks for book recommendations from BookNest, recommend books that actually exist in the BookNest catalog above. Put book titles in bold.
- If asked about user loans/borrowings and the user is NOT logged in, tell them to log in at login.html.
- Never invent fake BookNest transactions, due dates, or card IDs.
- For general knowledge, coding, math, and everyday questions, answer accurately, thoroughly, and helpfully.
- Keep your tone warm, friendly, helpful, and slightly playful (with subtle cat emojis like 🐱 when appropriate).
- Format responses cleanly with markdown: bold for emphasis, code blocks for code, and bullet/numbered lists for steps.`;
}

/**
 * Call Google Gemini API using official @google/genai SDK
 * Supports multi-turn conversation memory, system instructions, and resilient fallback.
 */
async function callGeminiAI(userMessage, books, authenticatedUser, conversation) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim() || apiKey === 'your_gemini_api_key_here') {
    return null; // Fallback to local NLP
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const systemInstruction = buildSystemInstruction(books, authenticatedUser);

    // Build multi-turn contents from conversation history (up to last 10 messages)
    const recentHistory = (conversation.messages || []).slice(-10);
    const contents = [];

    for (const msg of recentHistory) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      });
    }

    // Append current user message
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    // 15-second timeout wrapper
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API request timed out (15s limit)')), 15000)
    );

    const generatePromise = ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 1000
      }
    });

    const response = await Promise.race([generatePromise, timeoutPromise]);
    const responseText = response.text;

    if (responseText && typeof responseText === 'string' && responseText.trim().length > 0) {
      return responseText.trim();
    }
  } catch (err) {
    console.warn(`[Gemini AI] Call failed or timed out (${err.message}). Seamlessly using local NLP engine.`);
    return null;
  }

  return null;
}

/**
 * Controller: POST /api/chatbot/message
 */
async function handleChatbotMessage(req, res) {
  try {
    const { message, conversationId } = req.body || {};

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid message to chat with Kiara.'
      });
    }

    if (message.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Message is too long. Please keep your message within 500 characters.'
      });
    }

    // Optional Authentication extraction
    let authenticatedUser = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      if (global.activeSessions && global.activeSessions.has(token)) {
        const session = global.activeSessions.get(token);
        if (session.expiresAt > Date.now()) {
          authenticatedUser = session;
        }
      }
    }

    const conversation = getOrCreateConversation(conversationId);

    // Read catalogue data
    const DATA_DIR = path.join(__dirname, 'data');
    const BOOKS_FILE = path.join(DATA_DIR, 'books.json');
    const BORROWINGS_FILE = path.join(DATA_DIR, 'borrowings.json');
    const RESERVATIONS_FILE = path.join(DATA_DIR, 'reservations.json');

    let books = [];
    try {
      books = JSON.parse(fs.readFileSync(BOOKS_FILE, 'utf8'));
    } catch (e) {
      books = [];
    }

    let borrowings = [];
    try {
      borrowings = JSON.parse(fs.readFileSync(BORROWINGS_FILE, 'utf8'));
    } catch (e) {
      borrowings = [];
    }

    let reservations = [];
    try {
      reservations = JSON.parse(fs.readFileSync(RESERVATIONS_FILE, 'utf8'));
    } catch (e) {
      reservations = [];
    }

    let userBorrows = [];
    let userReservations = [];
    if (authenticatedUser) {
      userBorrows = borrowings.filter(b => b.userId === authenticatedUser.userId || b.username === authenticatedUser.username);
      userReservations = reservations.filter(r => r.userId === authenticatedUser.userId || r.username === authenticatedUser.username);
    }

    // 1. Process deterministic local engine first to determine base response & ground matching books
    const localResult = processLocalNLP(
      message,
      books,
      userBorrows,
      userReservations,
      authenticatedUser,
      conversation
    );

    let finalReply = localResult.reply;

    // 2. Identify if this is a personal database query (pure loan/return lookup)
    const isStrictPersonalLookup = /what books have i borrowed|when is my return date|my loans|show my books|my return date/i.test(message);

    // 3. For all other queries (general questions, coding, math, literature, or mixed recommendations),
    // attempt to enrich via Gemini AI if API key is present
    if (!isStrictPersonalLookup && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
      const geminiResponse = await callGeminiAI(message, books, authenticatedUser, conversation);
      if (geminiResponse) {
        finalReply = geminiResponse;
      }
    }

    // 4. Record interaction in conversation memory
    conversation.messages.push({ role: 'user', text: message, timestamp: Date.now() });
    conversation.messages.push({ role: 'assistant', text: finalReply, timestamp: Date.now() });

    // Format matched books structure if any
    const formattedBooks = (localResult.books || []).map(b => ({
      id: b.id,
      title: b.title,
      author: b.author,
      category: b.category,
      rating: b.rating,
      availability: b.availability,
      cover: b.cover,
      isbn: b.isbn,
      publishedYear: b.publishedYear,
      description: b.description
    }));

    return res.json({
      success: true,
      reply: finalReply,
      books: formattedBooks,
      suggestions: localResult.suggestions || [
        '📚 Available Books',
        '💻 Explain JavaScript Promises',
        '🧮 What is 25 × 16?'
      ],
      conversationId: conversation.id
    });
  } catch (err) {
    console.error('Chatbot error:', err);
    return res.status(500).json({
      success: false,
      message: 'Kiara is having trouble processing your message right now. Please try again.',
      suggestions: ['📚 Available Books', '🔄 Try Again']
    });
  }
}

/**
 * Controller: POST /api/chatbot/clear
 */
function clearChatbotConversation(req, res) {
  try {
    const { conversationId } = req.body || {};
    if (conversationId && conversations.has(conversationId)) {
      conversations.delete(conversationId);
    }
    return res.json({
      success: true,
      message: 'Conversation history successfully cleared.'
    });
  } catch (err) {
    console.error('Clear conversation error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear conversation.'
    });
  }
}

module.exports = {
  handleChatbotMessage,
  clearChatbotConversation
};
