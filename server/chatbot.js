/**
 * BookNest AI Assistant - "Kaira" Backend NLP & AI Engine
 * Handles natural language conversations, catalog searches,
 * book recommendations, authentication-aware borrowing queries,
 * context memory, and external AI model integration with fallback.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

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

/**
 * Intelligent Local NLP Engine for Kaira
 */
function processLocalNLP(userMessage, books, userBorrows, userReservations, authenticatedUser, conversation) {
  const rawMsg = userMessage.trim();
  const lowerMsg = rawMsg.toLowerCase().replace(/[?!.,;:'"()]/g, ' ').replace(/\s+/g, ' ').trim();

  let reply = '';
  let matchedBooks = [];
  let suggestions = [
    '📚 Available Books',
    '🔍 Find a Book',
    '⭐ Recommend Books',
    '📖 Borrowing Help',
    '🕒 Return Policy',
    '👋 Say Hello'
  ];

  // -------------------------------------------------------------
  // 1. GREETINGS & SOCIAL COURTESIES
  // -------------------------------------------------------------
  const isHi = /^(hi|hello|hey|heya|hlo|hola|greetings|good day|good morning|good afternoon|good evening|howdy|sup)\b/i.test(lowerMsg);
  const isHowAreYou = /how are you|how r u|how are u|how do you do|hows it going|how is it going|how are you doing/i.test(lowerMsg);
  const isThanks = /\b(thank you|thanks|thx|thank u|many thanks|appreciate it|grateful)\b/i.test(lowerMsg);
  const isBye = /\b(bye|goodbye|cya|see you|farewell|see ya|have a good day|good night)\b/i.test(lowerMsg);

  if (isHowAreYou) {
    reply = "I'm doing great and ready to help you discover your next favorite book! 🌟 What are you interested in reading today? Feel free to ask for recommendations, search our catalogue, or check borrowing rules!";
    suggestions = ['📚 Available Books', '⭐ Recommend Books', '🔍 Search Catalogue'];
    return { reply, books: matchedBooks, suggestions };
  }

  if (isThanks) {
    reply = "You're very welcome! Happy reading! 📖 If there's anything else you need help with, just let me know.";
    suggestions = ['📚 Available Books', '⭐ Recommend Books', '📖 Borrowing Help'];
    return { reply, books: matchedBooks, suggestions };
  }

  if (isBye) {
    reply = "Goodbye! Have a wonderful day and enjoy your reading journey! 👋 Come back anytime you're looking for great books.";
    suggestions = ['👋 Say Hello', '📚 Available Books'];
    return { reply, books: matchedBooks, suggestions };
  }

  if (isHi && lowerMsg.split(' ').length <= 4) {
    const greetingName = authenticatedUser ? ` ${authenticatedUser.name.split(' ')[0]}` : '';
    reply = `Hello${greetingName}! 👋 Welcome to BookNest! I'm **Kaira**, your virtual library assistant. How can I help you today? Are you looking for a book, recommendations, or library information?`;
    suggestions = ['📚 Available Books', '⭐ Recommend Books', '📖 Borrowing Help', '🔍 Find a Book'];
    return { reply, books: matchedBooks, suggestions };
  }

  // -------------------------------------------------------------
  // 2. IDENTITY & ABOUT BOOKNEST
  // -------------------------------------------------------------
  if (/who are you|what is your name|whats your name|what are you|tell me about yourself/i.test(lowerMsg)) {
    reply = "I'm **Kaira**, your intelligent BookNest virtual library assistant! 🤖📚 I'm here to help you search our book collection, discover curated recommendations, answer library questions, and track your borrowed titles and return dates.";
    suggestions = ['📚 Available Books', '⭐ Recommend Books', '📖 Borrowing Help'];
    return { reply, books: matchedBooks, suggestions };
  }

  if (/what is booknest|about booknest|tell me about booknest|explain booknest/i.test(lowerMsg)) {
    reply = "🌟 **BookNest** is a state-of-the-art educational sanctuary and library management system. We offer access to thousands of books across literature, technology, history, self-help, and biographies, coupled with seamless 14-day book loans, reservation management, quiet study pods, and research archives.";
    suggestions = ['📚 Browse Catalogue', '📖 Borrowing Rules', '📍 Library Location'];
    return { reply, books: matchedBooks, suggestions };
  }

  if (/location|address|where are you located|where is the library|where is booknest|library address/i.test(lowerMsg)) {
    reply = "📍 **BookNest Central Library** is located at:\n**Central Library Chitkara**, Academic Block.\n\nOur front desk is staffed and always ready to assist you in person!";
    suggestions = ['🕒 Working Hours', '📞 Contact Support', '📚 Available Books'];
    return { reply, books: matchedBooks, suggestions };
  }

  if (/hours|timing|timings|open|opening hours|schedule|when do you open|closing time/i.test(lowerMsg)) {
    reply = "🕒 **BookNest Library Working Hours**:\n• **Monday - Friday:** 8:00 AM – 8:00 PM\n• **Saturday:** 9:00 AM – 5:00 PM\n• **Sunday:** Closed (Digital Catalogue accessible 24/7)\n\nFeel free to visit our reception or study halls during operating hours!";
    suggestions = ['📍 Library Location', '📚 Available Books', '📖 Borrowing Help'];
    return { reply, books: matchedBooks, suggestions };
  }

  if (/contact|phone|email|support|help desk|reach you/i.test(lowerMsg)) {
    reply = "📞 **Contact BookNest Support**:\n• **Phone:** 9876543214\n• **Email:** support@booknest.gmail.com\n• **Front Desk:** Central Library Chitkara\n\nYou can also submit an inquiry through our Contact page!";
    suggestions = ['🕒 Working Hours', '📚 Available Books'];
    return { reply, books: matchedBooks, suggestions };
  }

  // -------------------------------------------------------------
  // 3. AUTHENTICATED USER BORROWING & RETURN DUE DATES
  // -------------------------------------------------------------
  const isBorrowQuery = /what books have i borrowed|what did i borrow|my borrowed books|books i borrowed|my books|borrowed books|borrowing history|my loans/i.test(lowerMsg);
  const isDueQuery = /when is my return date|when is my book due|return date|due date|due dates|when to return|when do i have to return|overdue/i.test(lowerMsg);
  const isReservationQuery = /my reservations|active reservations|reserved books|what did i reserve/i.test(lowerMsg);

  if (isBorrowQuery) {
    if (!authenticatedUser) {
      reply = "Please log in to your BookNest account so I can securely check your borrowing details. 🔒\n\n<a href=\"login.html\" class=\"chatbot-link\">Click here to Login</a> to your account.";
      suggestions = ['🔑 Go to Login', '📚 Available Books', '📖 Borrowing Rules'];
      return { reply, books: matchedBooks, suggestions };
    }

    const activeBorrows = userBorrows.filter(b => b.status === 'Issued');
    if (activeBorrows.length === 0) {
      reply = `Hello **${authenticatedUser.name}**! You currently have no active borrowed books. 📚 You can browse our catalogue and borrow your next read anytime!`;
      suggestions = ['📚 Available Books', '⭐ Recommend Books', '👤 My Dashboard'];
    } else {
      reply = `Hello **${authenticatedUser.name}**! Here are your currently active borrowed books:\n\n` +
        activeBorrows.map((b, idx) => `• **${b.bookTitle}** by ${b.bookAuthor}\n  📅 *Issued:* ${b.issueDate} | ⏳ *Due Date:* **${b.dueDate}**`).join('\n\n') +
        `\n\nYou can easily return books or manage your loans in your **User Dashboard**.`;
      suggestions = ['🕒 When is my return date?', '👤 Open Dashboard', '📚 Browse More Books'];
    }
    return { reply, books: matchedBooks, suggestions };
  }

  if (isDueQuery) {
    if (!authenticatedUser) {
      reply = "Please log in to your BookNest account so I can look up your exact return due dates. 🔒\n\n<a href=\"login.html\" class=\"chatbot-link\">Click here to Login</a>.";
      suggestions = ['🔑 Go to Login', '📖 Return Policy', '📚 Available Books'];
      return { reply, books: matchedBooks, suggestions };
    }

    const activeBorrows = userBorrows.filter(b => b.status === 'Issued');
    if (activeBorrows.length === 0) {
      reply = `Hello **${authenticatedUser.name}**! You have no outstanding borrowed books due for return right now. All your loans are clear! 👍`;
      suggestions = ['📚 Available Books', '⭐ Recommend Books', '👤 Open Dashboard'];
    } else {
      reply = `Hello **${authenticatedUser.name}**! Here are the return due dates for your active books:\n\n` +
        activeBorrows.map(b => `• **${b.bookTitle}**: Due on **${b.dueDate}** (Standard 14-day loan)`).join('\n') +
        `\n\nPlease ensure books are returned on or before their due dates via your **User Dashboard**.`;
      suggestions = ['👤 Go to Dashboard', '🔄 How do I return a book?', '📚 Available Books'];
    }
    return { reply, books: matchedBooks, suggestions };
  }

  if (isReservationQuery) {
    if (!authenticatedUser) {
      reply = "Please log in to your BookNest account so I can check your active reservations. 🔒\n\n<a href=\"login.html\" class=\"chatbot-link\">Click here to Login</a>.";
      suggestions = ['🔑 Go to Login', '📚 Available Books'];
      return { reply, books: matchedBooks, suggestions };
    }

    const activeReservations = userReservations.filter(r => r.status === 'Active');
    if (activeReservations.length === 0) {
      reply = `Hello **${authenticatedUser.name}**! You do not have any active reservations. When a book is checked out, you can reserve it so it's held for you once returned!`;
      suggestions = ['📚 Available Books', '👤 Open Dashboard'];
    } else {
      reply = `Hello **${authenticatedUser.name}**! Here are your active book reservations:\n\n` +
        activeReservations.map(r => `• **${r.bookTitle}** by ${r.bookAuthor} (Reserved on ${r.reservedDate})`).join('\n') +
        `\n\nWe will notify you the moment your reserved book becomes available for pickup!`;
      suggestions = ['👤 Open Dashboard', '📚 Available Books'];
    }
    return { reply, books: matchedBooks, suggestions };
  }

  // -------------------------------------------------------------
  // 4. LIBRARY WORKFLOWS (BORROWING, RETURNING, RESERVING)
  // -------------------------------------------------------------
  if (/how can i borrow a book|how do i borrow|how to borrow|borrow a book|borrow book|borrowing process|borrowing help|borrowing rules|borrowing policy/i.test(lowerMsg)) {
    reply = "Borrowing a book at BookNest is simple and quick! 📚\n\n" +
      "1. **Browse Catalogue:** Visit the **Books** page to find a title you'd like to read.\n" +
      "2. **Check Availability:** Available books have a green badge and a **Borrow Now** button.\n" +
      "3. **Instant Loan:** Click **Borrow Now** (or visit Book Details) while logged in. The book will be instantly issued to your account for **14 days**.\n" +
      "4. **Manage in Dashboard:** Review your due date, renew, or return books at any time from your **User Dashboard**.";
    suggestions = ['📚 Browse Available Books', '🕒 Return Policy', '👤 Go to Dashboard'];
    return { reply, books: matchedBooks, suggestions };
  }

  if (/how do i return a book|how to return|return a book|return book|return process|returning help|return policy/i.test(lowerMsg)) {
    reply = "Returning a borrowed book is seamless! 🔄\n\n" +
      "1. Navigate to your **User Dashboard**.\n" +
      "2. Go to the **My Borrowed Books** tab.\n" +
      "3. Find the title you wish to return and click the **Return Book** button.\n" +
      "4. The return is recorded immediately, your loan is marked as Returned, and the book becomes available for others.";
    suggestions = ['👤 Go to Dashboard', '📖 How to borrow a book?', '📚 Browse Books'];
    return { reply, books: matchedBooks, suggestions };
  }

  if (/how do i reserve a book|how to reserve|reserve a book|reservation process|reservation policy/i.test(lowerMsg)) {
    reply = "When a book is currently borrowed by another reader (status: Checked Out), you can reserve it! 📌\n\n" +
      "1. Open the book's details page.\n" +
      "2. Click the **Reserve Book** button.\n" +
      "3. You will be prioritized in the queue as soon as the current borrower returns it.";
    suggestions = ['📚 View Catalogue', '👤 My Dashboard'];
    return { reply, books: matchedBooks, suggestions };
  }

  // -------------------------------------------------------------
  // 5. CONTEXTUAL FOLLOW-UP QUESTIONS
  // -------------------------------------------------------------
  // If user previously said "I want something interesting" or asked for suggestions
  if (/i want something interesting|suggest something interesting|recommend something interesting|bored/i.test(lowerMsg)) {
    conversation.lastTopic = 'interesting_prompt';
    reply = "Sure! I'd love to help! 📖 Do you prefer mystery, fiction, science & history, self-help, or something technological?";
    suggestions = ['🕵️ Mystery', '🚀 Fiction', '🧠 Self Help', '💻 Technology', '📜 History'];
    return { reply, books: matchedBooks, suggestions };
  }

  // If user replies to "interesting" with a genre
  if (conversation.lastTopic === 'interesting_prompt') {
    if (/mystery|detective|crime/i.test(lowerMsg)) {
      conversation.lastTopic = null;
      conversation.lastCategory = 'Fiction';
      matchedBooks = books.filter(b => b.id === 1 || b.title.includes('Murder'));
      reply = "Great choice! 🕵️ Here is a thrilling mystery novel from our collection:";
      conversation.lastBooks = matchedBooks;
      suggestions = ['🔍 Tell me more about this book', '📚 Show more fiction', '📖 How to borrow?'];
      return { reply, books: matchedBooks, suggestions };
    }
  }

  // "Which one is best for beginners?" (Contextual follow-up)
  if (/which one is best for beginners|which book is best for beginners|best for beginners|beginner friendly/i.test(lowerMsg)) {
    if (conversation.lastBooks && conversation.lastBooks.length > 0) {
      // Pick best beginner book from last recommended books
      const candidate = conversation.lastBooks.find(b =>
        b.id === 13 || b.id === 10 || b.id === 6 || b.id === 7 || b.id === 16 || b.id === 8
      ) || conversation.lastBooks[0];

      reply = `From the books we just discussed, I highly recommend **${candidate.title}** by ${candidate.author}! ⭐ It is written in a clear, engaging, and beginner-friendly style that is very accessible.`;
      matchedBooks = [candidate];
      suggestions = [`📖 How to borrow ${candidate.title}`, '📚 Show all available books', '⭐ More recommendations'];
      return { reply, books: matchedBooks, suggestions };
    }
  }

  // -------------------------------------------------------------
  // 6. SPECIFIC BOOK SEARCH BY TITLE (WITH FUZZY / TYPO MATCHING)
  // -------------------------------------------------------------
  // Check if query is looking for a specific book
  const titleSearchRegexes = [
    { title: 'Harry Potter', keywords: ['harry potter', 'hary poter', 'harry poter', 'potter', 'jk rowling'] },
    { title: 'Clean Code', keywords: ['clean code', 'cleen code', 'robert martin', 'uncle bob', 'cleancode'] },
    { title: 'The Pragmatic Programmer', keywords: ['pragmatic programmer', 'pragmatic', 'andrew hunt', 'david thomas'] },
    { title: 'Introduction to Algorithms', keywords: ['algorithms', 'introduction to algorithms', 'cormen', 'clrs', 'data structures'] },
    { title: 'Good Girls Guide To Murder', keywords: ['good girls guide to murder', 'good girls guide', 'holly jackson', 'murder mystery', 'pip fitz'] },
    { title: 'Merchant of Venice', keywords: ['merchant of venice', 'shakespeare', 'shylock', 'antonio'] },
    { title: 'Ikigai', keywords: ['ikigai', 'ikigye', 'hector garcia', 'japanese secret', 'francesc miralles'] },
    { title: 'Atomic Habits', keywords: ['atomic habits', 'atomic habit', 'james clear', 'habit building'] },
    { title: 'Wings of Fire', keywords: ['wings of fire', 'abdul kalam', 'kalam autobiography', 'apj abdul kalam'] },
    { title: 'Diary of a Young Girl', keywords: ['diary of a young girl', 'anne frank', 'anne frank diary'] },
    { title: 'The Autobiography Of Benjamin Franklin', keywords: ['benjamin franklin', 'franklin autobiography'] },
    { title: 'Sapiens', keywords: ['sapiens', 'yuval noah harari', 'harari', 'brief history of humankind'] },
    { title: 'The Discovery of India', keywords: ['discovery of india', 'jawaharlal nehru', 'nehru'] },
    { title: 'Guns, Germs, and Steel', keywords: ['guns germs and steel', 'jared diamond'] },
    { title: 'The Psychology of Money', keywords: ['psychology of money', 'morgan housel'] },
    { title: 'Rich Dad Poor Dad', keywords: ['rich dad poor dad', 'robert kiyosaki', 'rich dad'] },
    { title: 'The Intelligent Investor', keywords: ['intelligent investor', 'benjamin graham', 'value investing'] },
    { title: 'The Art of Letting Go', keywords: ['art of letting go', 'rania naim', 'letting go'] }
  ];

  let matchedTitleMeta = null;
  for (const item of titleSearchRegexes) {
    for (const kw of item.keywords) {
      if (lowerMsg.includes(kw) || fuzzyMatch(lowerMsg, kw, 2)) {
        matchedTitleMeta = item;
        break;
      }
    }
    if (matchedTitleMeta) break;
  }

  // Also test direct Levenshtein matching against all book titles in DB
  if (!matchedTitleMeta) {
    for (const b of books) {
      if (fuzzyMatch(lowerMsg, b.title, 3) || lowerMsg.includes(b.title.toLowerCase())) {
        matchedTitleMeta = { title: b.title };
        break;
      }
    }
  }

  if (matchedTitleMeta) {
    const book = books.find(b => b.title.toLowerCase() === matchedTitleMeta.title.toLowerCase());
    if (book) {
      matchedBooks = [book];
      conversation.lastBooks = matchedBooks;
      conversation.lastCategory = book.category;

      const availStatus = book.availability
        ? '✅ **Currently Available** for borrowing!'
        : '⏳ **Currently Checked Out** (You can place a reservation!)';

      if (/isbn/i.test(lowerMsg)) {
        reply = `The ISBN for **${book.title}** by ${book.author} is **${book.isbn}**. It is published by ${book.publisher} (${book.publishedYear}) and has ${book.pages} pages.`;
      } else if (/how many copies|availability|is it available/i.test(lowerMsg)) {
        reply = `**${book.title}** is ${availStatus}\n• **Rating:** ⭐ ${book.rating}/5.0\n• **Category:** ${book.category}\n• **ISBN:** ${book.isbn}`;
      } else {
        reply = `Yes, we have **${book.title}** by ${book.author} in our collection! 📖\n\n${availStatus}\n\n"${book.description}"`;
      }

      suggestions = [
        book.availability ? `📖 Borrow ${book.title}` : `📌 Reserve ${book.title}`,
        `⭐ Suggest books similar to ${book.title}`,
        '📚 View More Books'
      ];
      return { reply, books: matchedBooks, suggestions };
    }
  }

  // Check if user is asking for a specific non-existent title (e.g. "Do you have Harry Potter 7", "The Great Gatsby", "Lord of the Rings")
  const specificBookQuery = lowerMsg.match(/(?:do you have|do u have|looking for|search for|is there a book called|book named)\s+([a-z0-9\s]+)/i);
  if (specificBookQuery) {
    const requestedTitle = specificBookQuery[1].trim();
    // Verify it's not a category query
    const isCategoryWord = /fiction|history|programming|coding|self help|business|finance|technology|biography/i.test(requestedTitle);
    if (!isCategoryWord && requestedTitle.length > 2) {
      // Find closest category to recommend alternatives
      const alternatives = books.filter(b => b.availability).slice(0, 3);
      reply = `We currently do not have "**${requestedTitle}**" listed in the BookNest collection. However, our catalogue features many popular titles across Fiction, Technology, Self-Help, and History! Here are some great alternatives you might enjoy:`;
      matchedBooks = alternatives;
      conversation.lastBooks = matchedBooks;
      suggestions = ['📚 Show Available Books', '⭐ Recommend Top Rated Books', '🔍 Find a Book'];
      return { reply, books: matchedBooks, suggestions };
    }
  }

  // -------------------------------------------------------------
  // 7. CATEGORY & THEMATIC RECOMMENDATIONS
  // -------------------------------------------------------------
  // Technology / Programming / Python / Coding
  if (/programming|python|coding|code|developer|software|algorithm|computer science|tech\b|technology/i.test(lowerMsg)) {
    matchedBooks = books.filter(b => b.category === 'Technology');
    conversation.lastBooks = matchedBooks;
    conversation.lastCategory = 'Technology';

    if (/python/i.test(lowerMsg)) {
      reply = "While we do not have a dedicated Python-only title, BookNest features premier software engineering and algorithms classics that are essential for every programmer, including Python developers:";
    } else {
      reply = "Of course! 💻 Here are the top programming and software craftsmanship books from our BookNest Technology collection:";
    }
    suggestions = ['⭐ Which one is best for beginners?', '📚 Show Available Books', '📖 How to borrow?'];
    return { reply, books: matchedBooks, suggestions };
  }

  // Mystery / Thriller
  if (/mystery|thriller|crime|detective|investigation/i.test(lowerMsg)) {
    matchedBooks = books.filter(b => b.title.includes('Murder') || b.id === 1);
    conversation.lastBooks = matchedBooks;
    conversation.lastCategory = 'Fiction';
    reply = "Here is our premier mystery and thriller novel from the BookNest Fiction collection:";
    suggestions = ['📖 Borrow Good Girls Guide', '📚 Show other fiction books', '⭐ Top rated books'];
    return { reply, books: matchedBooks, suggestions };
  }

  // Fiction / Novels
  if (/fiction|novel|drama|story books|stories|classic play/i.test(lowerMsg)) {
    matchedBooks = books.filter(b => b.category === 'Fiction');
    conversation.lastBooks = matchedBooks;
    conversation.lastCategory = 'Fiction';
    reply = "Here are the captivating **Fiction & Literature** titles available in BookNest:";
    suggestions = ['⭐ Recommend a mystery novel', '📚 Show Available Books', '📖 Borrowing Help'];
    return { reply, books: matchedBooks, suggestions };
  }

  // Self Help / Habits / Psychology / Mindset
  if (/self help|habits|mindset|productivity|motivation|wellness|letting go/i.test(lowerMsg)) {
    matchedBooks = books.filter(b => b.category === 'Self Help');
    conversation.lastBooks = matchedBooks;
    conversation.lastCategory = 'Self Help';
    reply = "Here are our transformative **Self-Help & Personal Growth** books:";
    suggestions = ['⭐ Which one is best for beginners?', '📚 Show Available Books', '📖 Borrowing Help'];
    return { reply, books: matchedBooks, suggestions };
  }

  // History / Civilizations
  if (/history|historical|civilization|india history|world war|harari|nehru/i.test(lowerMsg)) {
    matchedBooks = books.filter(b => b.category === 'History');
    conversation.lastBooks = matchedBooks;
    conversation.lastCategory = 'History';
    reply = "Here are the profound **History & Civilization** books from our collection:";
    suggestions = ['⭐ Tell me about Sapiens', '📚 Show Available Books', '📖 Borrowing Help'];
    return { reply, books: matchedBooks, suggestions };
  }

  // Autobiography / Biography
  if (/autobiography|biography|memoir|real life story|abdul kalam|anne frank|franklin/i.test(lowerMsg)) {
    matchedBooks = books.filter(b => b.category === 'Autobiography');
    conversation.lastBooks = matchedBooks;
    conversation.lastCategory = 'Autobiography';
    reply = "Here are the inspiring **Autobiographies & Memoirs** in BookNest:";
    suggestions = ['⭐ Tell me about Wings of Fire', '📚 Show Available Books', '📖 Borrowing Help'];
    return { reply, books: matchedBooks, suggestions };
  }

  // Business / Finance / Investing / Money
  if (/business|finance|money|investing|investor|wealth|economics/i.test(lowerMsg)) {
    matchedBooks = books.filter(b => b.category === 'Business & Finance');
    conversation.lastBooks = matchedBooks;
    conversation.lastCategory = 'Business & Finance';
    reply = "Here are our highly acclaimed **Business, Finance & Investing** titles:";
    suggestions = ['⭐ Tell me about Psychology of Money', '📚 Show Available Books', '📖 Borrowing Help'];
    return { reply, books: matchedBooks, suggestions };
  }

  // -------------------------------------------------------------
  // 8. AVAILABILITY, TOP-RATED & BEGINNER QUERIES
  // -------------------------------------------------------------
  // What books are available
  if (/what books are available|show available books|available books|which books are available|books currently available|books available/i.test(lowerMsg)) {
    matchedBooks = books.filter(b => b.availability).slice(0, 4);
    conversation.lastBooks = matchedBooks;
    reply = "Let me check our BookNest collection! 📚 Here are some books currently available for instant borrowing:";
    suggestions = ['💻 Suggest programming books', '⭐ Recommend a mystery novel', '📖 How can I borrow?'];
    return { reply, books: matchedBooks, suggestions };
  }

  // Which books are currently unavailable
  if (/which books are currently unavailable|unavailable books|currently unavailable|out of stock|checked out/i.test(lowerMsg)) {
    matchedBooks = books.filter(b => !b.availability);
    conversation.lastBooks = matchedBooks;
    reply = "Here are the books that are currently checked out by other readers. You can reserve them to be notified when they're returned:";
    suggestions = ['📌 How do I reserve a book?', '📚 Show available books', '⭐ Recommend available books'];
    return { reply, books: matchedBooks, suggestions };
  }

  // Top rated / Best books
  if (/top rated|top-rated|best books|highest rating|highest rated|popular books|most popular/i.test(lowerMsg)) {
    matchedBooks = [...books].sort((a, b) => b.rating - a.rating).slice(0, 4);
    conversation.lastBooks = matchedBooks;
    reply = "Here are the highest-rated books across our entire BookNest catalogue (rated 4.8+ by readers):";
    suggestions = ['⭐ Which one is best for beginners?', '📚 Show available books', '📖 How to borrow?'];
    return { reply, books: matchedBooks, suggestions };
  }

  // Suggest books for beginners
  if (/suggest books for beginners|books for beginners|for beginners|beginner books|starter books/i.test(lowerMsg)) {
    matchedBooks = books.filter(b => [7, 10, 16, 6].includes(b.id));
    conversation.lastBooks = matchedBooks;
    reply = "Here are some of the most engaging and beginner-friendly books in BookNest across different genres:";
    suggestions = ['⭐ Tell me more about Sapiens', '📚 Show Available Books', '📖 How to borrow?'];
    return { reply, books: matchedBooks, suggestions };
  }

  // General recommendation query
  if (/recommend|recommendation|suggest a book|suggest books|what should i read/i.test(lowerMsg)) {
    matchedBooks = books.filter(b => b.availability && b.rating >= 4.8).slice(0, 3);
    conversation.lastBooks = matchedBooks;
    reply = "Here are some handpicked recommendations from our top-rated available collection:";
    suggestions = ['💻 Programming Books', '🕵️ Mystery Books', '📜 History Books', '🧠 Self Help'];
    return { reply, books: matchedBooks, suggestions };
  }

  // Similar books query
  if (/similar to|books like/i.test(lowerMsg)) {
    // Look up which book they mentioned
    const refBook = books.find(b => lowerMsg.includes(b.title.toLowerCase()) || fuzzyMatch(lowerMsg, b.title, 2));
    if (refBook) {
      matchedBooks = books.filter(b => b.category === refBook.category && b.id !== refBook.id);
      conversation.lastBooks = matchedBooks;
      reply = `If you enjoy **${refBook.title}**, here are similar books in the **${refBook.category}** category from BookNest:`;
      suggestions = ['📚 View Available Books', '📖 Borrowing Help'];
      return { reply, books: matchedBooks, suggestions };
    }
  }

  // -------------------------------------------------------------
  // 9. GENERAL / UNRELATED QUESTIONS FALLBACK
  // -------------------------------------------------------------
  // E.g. "capital of France", "joke", "weather", math, etc.
  if (/capital of|weather|tell me a joke|joke|who won|who is president|meaning of life|solve/i.test(lowerMsg)) {
    if (/capital of france/i.test(lowerMsg)) {
      reply = "The capital of France is Paris! 🗼 While I'm happy to help with general trivia, my primary role is assisting you as BookNest's virtual librarian. Can I help you find a book on French history, geography, or world literature?";
    } else if (/joke/i.test(lowerMsg)) {
      reply = "Here's a library joke for you! 😄\n\n*Why did the book go to the doctor?*\n*Because it lost its cover and had too many loose leaves!*\n\nNeed any real book recommendations today?";
    } else {
      reply = "That's an interesting question! As your BookNest library assistant, I'm happy to chat, but my main specialty is helping you explore our book catalogue, discover recommendations, and navigate your library account. Would you like to explore our collection?";
    }
    suggestions = ['📚 Available Books', '⭐ Recommend Books', '🔍 Find a Book'];
    return { reply, books: matchedBooks, suggestions };
  }

  // -------------------------------------------------------------
  // 10. DEFAULT FRIENDLY FALLBACK (Never remains silent!)
  // -------------------------------------------------------------
  reply = `I'd love to help you with that! 😊 As your BookNest assistant, I can help you search books, discover recommendations by genre (Fiction, Technology, Self-Help, History, Business), check return dates, and explain library policies. What would you like to explore?`;
  suggestions = ['📚 Available Books', '⭐ Recommend Books', '🔍 Search Catalogue', '📖 Borrowing Help'];
  return { reply, books: matchedBooks, suggestions };
}

/**
 * Optional External AI Call (Google Gemini / OpenAI)
 * Falls back safely to processLocalNLP if unavailable, disabled, or times out.
 */
async function callExternalAI(userMessage, books, authenticatedUser, conversation) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!geminiKey && !openaiKey) return null;

  const catalogSummary = books.map(b =>
    `- ID ${b.id}: "${b.title}" by ${b.author} | Category: ${b.category} | Rating: ${b.rating} | Available: ${b.availability ? 'Yes' : 'No'} | ISBN: ${b.isbn}`
  ).join('\n');

  const systemInstruction = `You are Kaira, the smart, friendly, and helpful virtual library assistant for BookNest Library Management System.
The real BookNest book catalogue is strictly limited to these books:
${catalogSummary}

User Authentication State: ${authenticatedUser ? `Logged in as ${authenticatedUser.name} (${authenticatedUser.username})` : 'Guest (Not logged in)'}.
Rules:
1. Always greet warmly and be polite.
2. Only recommend or mention books that actually exist in the BookNest catalogue above. Never invent book titles, ISBNs, or fake transactions.
3. If asked about user loans/borrowings and the user is NOT logged in, tell them to log in at login.html.
4. Keep responses concise, friendly, and helpful. Mention relevant book titles in bold.`;

  if (geminiKey) {
    try {
      const payload = JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\nUser Question: ${userMessage}` }]
          }
        ],
        generationConfig: {
          maxOutputTokens: 350,
          temperature: 0.7
        }
      });

      const result = await new Promise((resolve, reject) => {
        const req = https.request(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payload)
            },
            timeout: 4000
          },
          (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
              if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                  const parsed = JSON.parse(data);
                  const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                  resolve(text);
                } catch (e) {
                  reject(e);
                }
              } else {
                reject(new Error(`Gemini status ${res.statusCode}: ${data}`));
              }
            });
          }
        );

        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Gemini API timeout'));
        });
        req.write(payload);
        req.end();
      });

      if (result && typeof result === 'string' && result.trim()) {
        return result.trim();
      }
    } catch (e) {
      // Fallback to local NLP on error
      console.warn('Gemini API call failed, falling back to local NLP:', e.message);
    }
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
        message: 'Please provide a valid message to chat with Kaira.'
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
      // Import activeSessions from server
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

    // Always run the deterministic local NLP engine to extract structured book recommendations and base reply
    const localResult = processLocalNLP(
      message,
      books,
      userBorrows,
      userReservations,
      authenticatedUser,
      conversation
    );

    let finalReply = localResult.reply;

    // If external AI is available and query is a conversational or general question, try AI enrichment
    const isSpecialLocalQuery = localResult.books.length > 0 ||
      /what books have i borrowed|when is my return date|my reservations/i.test(message);

    if (!isSpecialLocalQuery) {
      const aiResponse = await callExternalAI(message, books, authenticatedUser, conversation);
      if (aiResponse) {
        finalReply = aiResponse;
      }
    }

    // Record interaction in conversation memory
    conversation.messages.push({ role: 'user', text: message, timestamp: Date.now() });
    conversation.messages.push({ role: 'assistant', text: finalReply, timestamp: Date.now() });

    // Format matched books structure
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
        '⭐ Recommend Books',
        '📖 Borrowing Help'
      ],
      conversationId: conversation.id
    });
  } catch (err) {
    console.error('Chatbot error:', err);
    return res.status(500).json({
      success: false,
      message: 'Kaira is having trouble processing your message right now. Please try again.',
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
