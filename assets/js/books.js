
const LOCAL_BOOKS_DATABASE = [
  {
    "id": 1,
    "title": "Good Girls Guide To Murder",
    "author": "Holly Jackson",
    "category": "Fiction",
    "publishedYear": 2019,
    "isbn": "978-1-496-71440-4",
    "rating": 4.8,
    "availability": true,
    "description": "A thrilling and gripping mystery about a high school senior who investigates a closed local murder case for her final project, uncovering dark secrets in her quiet town.",
    "cover": "assets/images/books/book1.jpg",
    "pages": 432,
    "publisher": "Aether Scroll Publishing",
    "language": "English"
  },
  {
    "id": 2,
    "title": "Merchant of Venice",
    "author": "William Shakespeare",
    "category": "Fiction",
    "publishedYear": 1600,
    "isbn": "978-0-743-47756-7",
    "rating": 4.9,
    "availability": true,
    "description": "A classic play examining themes of justice, mercy, revenge, and greed through the conflict between the merchant Antonio and the moneylender Shylock.",
    "cover": "assets/images/books/book2.jpg",
    "pages": 240,
    "publisher": "Classic Press",
    "language": "English"
  },
  {
    "id": 3,
    "title": "Ikigai",
    "author": "Héctor García and Francesc Miralles",
    "category": "Self Help",
    "publishedYear": 2016,
    "isbn": "978-0-143-13072-7",
    "rating": 4.5,
    "availability": false,
    "description": "An inspiring guide exploring the Japanese concept of finding your 'reason for being' to live a long, happy, and purposeful life.",
    "cover": "assets/images/books/book3.jpg",
    "pages": 208,
    "publisher": "Penguin Books",
    "language": "English"
  },
  {
    "id": 4,
    "title": "Diary of a Young Girl",
    "author": "Anne Frank",
    "category": "Autobiography",
    "publishedYear": 1947,
    "isbn": "978-0-307-27562-2",
    "rating": 4.6,
    "availability": true,
    "description": "The deeply moving and historic diary written by a young Jewish girl while hiding from Nazi occupation with her family in Amsterdam during World War II.",
    "cover": "assets/images/books/book4.jpg",
    "pages": 352,
    "publisher": "Doubleday",
    "language": "English"
  },
  {
    "id": 5,
    "title": "Wings of Fire",
    "author": "A. P. J. Abdul Kalam",
    "category": "Autobiography",
    "publishedYear": 1999,
    "isbn": "978-8-173-71146-6",
    "rating": 4.7,
    "availability": true,
    "description": "The inspiring autobiography of the former President of India, Dr. A.P.J. Abdul Kalam, detailing his journey from a humble background to becoming the leader of the country's missile program.",
    "cover": "assets/images/books/book5.jpg",
    "pages": 180,
    "publisher": "Universities Press",
    "language": "English"
  },
  {
    "id": 6,
    "title": "Harry Potter",
    "author": "J. K. Rowling",
    "category": "Fiction",
    "publishedYear": 1997,
    "isbn": "978-0-439-70818-0",
    "rating": 4.9,
    "availability": true,
    "description": "The magical story of a young orphan who discovers he is a wizard on his eleventh birthday and attends Hogwarts School of Witchcraft and Wizardry.",
    "cover": "assets/images/books/book6.jpg",
    "pages": 309,
    "publisher": "Scholastic",
    "language": "English"
  },
  {
    "id": 7,
    "title": "The Art of Letting Go",
    "author": "Rania Naim",
    "category": "Self Help",
    "publishedYear": 2021,
    "isbn": "978-1-949-74601-5",
    "rating": 4.4,
    "availability": true,
    "description": "A collection of thoughts and reflections on healing, self-love, letting go of what doesn't serve you, and moving forward with strength.",
    "cover": "assets/images/books/book7.jpg",
    "pages": 160,
    "publisher": "Thought Catalog",
    "language": "English"
  },
  {
    "id": 8,
    "title": "Atomic Habits",
    "author": "James Clear",
    "category": "Self Help",
    "publishedYear": 2018,
    "isbn": "978-0-735-21129-2",
    "rating": 4.3,
    "availability": false,
    "description": "A revolutionary guide explaining how small, incremental changes in behavior can lead to massive self-improvement and life-altering habits.",
    "cover": "assets/images/books/book8.jpg",
    "pages": 320,
    "publisher": "Avery",
    "language": "English"
  },
  {
    "id": 9,
    "title": "The Autobiography Of Benjamin Franklin",
    "author": "Benjamin Franklin",
    "category": "Autobiography",
    "publishedYear": 1791,
    "isbn": "978-0-486-29073-7",
    "rating": 4.7,
    "availability": true,
    "description": "The historic memoirs of Benjamin Franklin, chronicling his rise from a printer's apprentice to one of the most influential founding fathers of the United States.",
    "cover": "assets/images/books/book9.jpg",
    "pages": 160,
    "publisher": "Classic Press",
    "language": "English"
  },
  {
    "id": 10,
    "title": "Sapiens",
    "author": "Yuval Noah Harari",
    "category": "History",
    "publishedYear": 2014,
    "isbn": "978-0-062-31609-7",
    "rating": 4.8,
    "availability": true,
    "description": "Yuval Noah Harari spans the whole of human history, from the very first humans to walk the earth to the radical—and sometimes devious—breakthroughs of the Cognitive, Agricultural, and Scientific Revolutions.",
    "cover": "https://i.pinimg.com/1200x/69/2b/80/692b807e2837f9645592276778b72bef.jpg",
    "pages": 443,
    "publisher": "Harper",
    "language": "English"
  },
  {
    "id": 11,
    "title": "The Discovery of India",
    "author": "Jawaharlal Nehru",
    "category": "History",
    "publishedYear": 1946,
    "isbn": "978-0-195-62359-8",
    "rating": 4.7,
    "availability": true,
    "description": "Written during Nehru's imprisonment at Ahmednagar Fort (1942-1946), this book provides a broad overview of Indian history, culture, and philosophy from the Indus Valley Civilization to the British Raj.",
    "cover": "https://i.pinimg.com/1200x/7a/bc/d1/7abcd17a813bd73fff671f03bf63158e.jpg",
    "pages": 582,
    "publisher": "Oxford University Press",
    "language": "English"
  },
  {
    "id": 12,
    "title": "Guns, Germs, and Steel",
    "author": "Jared Diamond",
    "category": "History",
    "publishedYear": 1997,
    "isbn": "978-0-393-31755-8",
    "rating": 4.6,
    "availability": true,
    "description": "Jared Diamond argumentatively explains why Eurasian and North African civilizations survived and conquered others, while arguing against the idea of Eurasian intellectual or moral superiority.",
    "cover": "https://i.pinimg.com/1200x/f1/18/bc/f118bc2c12308bbbf1a5f7f659f5f30c.jpg",
    "pages": 480,
    "publisher": "W. W. Norton & Company",
    "language": "English"
  },
  {
    "id": 13,
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "category": "Technology",
    "publishedYear": 2008,
    "isbn": "978-0-132-35088-4",
    "rating": 4.8,
    "availability": true,
    "description": "A handbook of agile software craftsmanship that teaches developers how to write clean, readable, and maintainable code through practical examples and principles.",
    "cover": "https://i.pinimg.com/1200x/86/5d/f8/865df8cd1dcb751c97c4082f64a90a0c.jpg",
    "pages": 464,
    "publisher": "Prentice Hall",
    "language": "English"
  },
  {
    "id": 14,
    "title": "The Pragmatic Programmer",
    "author": "Andrew Hunt & David Thomas",
    "category": "Technology",
    "publishedYear": 2019,
    "isbn": "978-0-135-95705-9",
    "rating": 4.9,
    "availability": true,
    "description": "One of the most significant books in software development, providing timeless advice on coding, career, tool usage, testing, and team management.",
    "cover": "https://i.pinimg.com/1200x/81/21/dc/8121dc48ec937ecf919bc2c54aa961a4.jpg",
    "pages": 352,
    "publisher": "Addison-Wesley",
    "language": "English"
  },
  {
    "id": 15,
    "title": "Introduction to Algorithms",
    "author": "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, and Clifford Stein",
    "category": "Technology",
    "publishedYear": 2022,
    "isbn": "978-0-262-04630-5",
    "rating": 4.9,
    "availability": true,
    "description": "A comprehensive and standard textbook on computer algorithms, covering a broad range of algorithms in depth, yet making their design and analysis accessible to all levels of readers.",
    "cover": "https://i.pinimg.com/736x/5c/5a/0f/5c5a0f32568b1913a0393232a1464921.jpg",
    "pages": 1312,
    "publisher": "MIT Press",
    "language": "English"
  },
  {
    "id": 16,
    "title": "The Psychology of Money",
    "author": "Morgan Housel",
    "category": "Business & Finance",
    "publishedYear": 2020,
    "isbn": "978-0-857-19768-9",
    "rating": 4.8,
    "availability": true,
    "description": "Doing well with money isn’t necessarily about what you know. It’s about how you behave. Morgan Housel shares 19 short stories exploring the strange ways people think about money.",
    "cover": "https://i.pinimg.com/736x/a7/99/1e/a7991e90484f21b1a6715408dd902d78.jpg",
    "pages": 256,
    "publisher": "Harriman House",
    "language": "English"
  },
  {
    "id": 17,
    "title": "Rich Dad Poor Dad",
    "author": "Robert Kiyosaki",
    "category": "Business & Finance",
    "publishedYear": 1997,
    "isbn": "978-1-612-68019-4",
    "rating": 4.6,
    "availability": true,
    "description": "A personal finance classic that challenges conventional wisdom about money, investing, and assets, teaching kids and adults how to make money work for them.",
    "cover": "https://i.pinimg.com/736x/68/c0/89/68c089db6360e204c5e6aa026dec2932.jpg",
    "pages": 336,
    "publisher": "Plata Publishing",
    "language": "English"
  },
  {
    "id": 18,
    "title": "The Intelligent Investor",
    "author": "Benjamin Graham",
    "category": "Business & Finance",
    "publishedYear": 2003,
    "isbn": "978-0-060-55566-5",
    "rating": 4.7,
    "availability": true,
    "description": "Widely acclaimed as the greatest investment advisor of the twentieth century, Benjamin Graham taught and inspired people worldwide with his philosophy of 'value investing'.",
    "cover": "https://i.pinimg.com/736x/c7/09/7d/c7097d82207f3b523bb5ed84df05d5a3.jpg",
    "pages": 640,
    "publisher": "Harper Business",
    "language": "English"
  }
];

let booksData = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadBooksDatabase();
  
  if (document.getElementById('books-grid')) {
    initCatalogPage();
  }
  
  if (document.getElementById('book-details-page')) {
    initDetailsPage();
  }
});

async function loadBooksDatabase() {
  try {
    const response = await fetch('data/books.json');
    if (!response.ok) throw new Error('Network response was not OK');
    booksData = await response.json();
  } catch (error) {
    console.warn('Unable to fetch data/books.json, using local backup. This is expected if loaded directly via file:// URL protocol.', error);
    booksData = [...LOCAL_BOOKS_DATABASE];
  }
  
  const borrowedList = JSON.parse(localStorage.getItem('borrowedList') || '[]');
  booksData = booksData.map(book => {
    if (borrowedList.includes(book.id)) {
      return { ...book, availability: false };
    }
    return book;
  });
}

function initCatalogPage() {
  const booksGrid = document.getElementById('books-grid');
  const searchInput = document.getElementById('catalog-search-input');
  const sortSelect = document.getElementById('catalog-sort-select');
  const filterAvailable = document.getElementById('filter-available');
  const categoryFilters = document.querySelectorAll('.filter-category');

  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get('search');
  if (searchParam && searchInput) {
    searchInput.value = searchParam;
  }

  function renderBooks(booksList) {
    booksGrid.innerHTML = '';
    
    if (booksList.length === 0) {
      booksGrid.innerHTML = `
        <div class="no-results grid-col-full">
          <p>No books found matching your selected search or filters.</p>
        </div>
      `;
      return;
    }

    const CATEGORY_ORDER = ["Fiction", "Self Help", "History", "Biography", "Autobiography", "Technology", "Business & Finance"];

    // Group books by category
    const grouped = {};
    booksList.forEach(book => {
      if (!grouped[book.category]) {
        grouped[book.category] = [];
      }
      grouped[book.category].push(book);
    });

    // Determine category render order
    const categoriesToRender = CATEGORY_ORDER.filter(cat => grouped[cat]);
    Object.keys(grouped).forEach(cat => {
      if (!categoriesToRender.includes(cat)) {
        categoriesToRender.push(cat);
      }
    });

    // Render each category section
    categoriesToRender.forEach(category => {
      const categoryBooks = grouped[category];
      
      const section = document.createElement('section');
      section.className = 'category-section';
      
      const header = document.createElement('div');
      header.className = 'category-header';
      header.innerHTML = `
        <h2 class="category-title">${category}</h2>
        <span class="category-count">${categoryBooks.length} ${categoryBooks.length === 1 ? 'book' : 'books'}</span>
      `;
      
      const grid = document.createElement('div');
      grid.className = 'books-catalog-grid';
      
      categoryBooks.forEach(book => {
        const card = document.createElement('article');
        card.className = 'book-card scroll-reveal';
        
        const availabilityBadge = book.availability 
          ? `<span class="badge badge-available">Available</span>`
          : `<span class="badge badge-unavailable">Out of Stock</span>`;

        card.innerHTML = `
          <div class="book-card-img-wrap">
            <img src="${book.cover}" alt="Book Cover - ${book.title}">
            <div class="book-card-overlay">
              <a href="book-details.html?id=${book.id}" class="btn btn-primary btn-sm">View Details</a>
            </div>
          </div>
          <div class="book-card-content">
            <div class="book-card-meta">
              <span class="book-card-category">${book.category}</span>
              <span class="book-card-rating">★ ${book.rating}</span>
            </div>
            <h3 class="book-card-title">${book.title}</h3>
            <p class="book-card-author">by ${book.author}</p>
            <div class="book-card-footer">
              ${availabilityBadge}
              <a href="book-details.html?id=${book.id}" class="btn btn-secondary btn-sm">Browse</a>
            </div>
          </div>
        `;
        grid.appendChild(card);
      });
      
      section.appendChild(header);
      section.appendChild(grid);
      booksGrid.appendChild(section);
    });
    
    if (window.initScrollReveal) {
      window.initScrollReveal();
    }
  }

  function applyFiltersAndSort() {
    let filtered = [...booksData];

    const query = searchInput.value.toLowerCase().trim();
    if (query !== '') {
      filtered = filtered.filter(b => 
        b.title.toLowerCase().includes(query) || 
        b.author.toLowerCase().includes(query) || 
        b.isbn.includes(query)
      );
    }

    const activeCategories = Array.from(categoryFilters)
      .filter(cb => cb.checked)
      .map(cb => cb.value);
    
    if (activeCategories.length > 0) {
      filtered = filtered.filter(b => activeCategories.includes(b.category));
    }

    if (filterAvailable.checked) {
      filtered = filtered.filter(b => b.availability);
    }

    const sortVal = sortSelect.value;
    if (sortVal === 'title-asc') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortVal === 'title-desc') {
      filtered.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortVal === 'rating-desc') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortVal === 'year-desc') {
      filtered.sort((a, b) => b.publishedYear - a.publishedYear);
    } else if (sortVal === 'year-asc') {
      filtered.sort((a, b) => a.publishedYear - b.publishedYear);
    }

    renderBooks(filtered);
  }

  if (searchInput) searchInput.addEventListener('input', applyFiltersAndSort);
  if (sortSelect) sortSelect.addEventListener('change', applyFiltersAndSort);
  if (filterAvailable) filterAvailable.addEventListener('change', applyFiltersAndSort);
  categoryFilters.forEach(cb => cb.addEventListener('change', applyFiltersAndSort));

  applyFiltersAndSort();
}

function initDetailsPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = parseInt(urlParams.get('id'));
  
  if (!bookId) {
    window.location.href = 'books.html';
    return;
  }

  const book = booksData.find(b => b.id === bookId);
  if (!book) {
    window.location.href = 'books.html';
    return;
  }

  document.title = `${book.title} | Library Management System`;
  document.getElementById('detail-title').textContent = book.title;
  document.getElementById('detail-author').textContent = `by ${book.author}`;
  document.getElementById('detail-category').textContent = book.category;
  document.getElementById('detail-rating').textContent = `★ ${book.rating} / 5.0`;
  document.getElementById('detail-desc').textContent = book.description;
  
  document.getElementById('spec-isbn').textContent = book.isbn;
  document.getElementById('spec-year').textContent = book.publishedYear;
  document.getElementById('spec-pages').textContent = `${book.pages} pages`;
  document.getElementById('spec-publisher').textContent = book.publisher;
  document.getElementById('spec-language').textContent = book.language;

  const activeBreadcrumb = document.querySelector('.breadcrumb-active');
  if (activeBreadcrumb) activeBreadcrumb.textContent = book.title;

  const coverImg = document.getElementById('detail-cover-img');
  if (coverImg) {
    coverImg.src = book.cover;
    coverImg.alt = `Book Cover - ${book.title}`;
  }

  const availabilityBadge = document.getElementById('detail-availability');
  if (availabilityBadge) {
    if (book.availability) {
      availabilityBadge.textContent = 'Available';
      availabilityBadge.className = 'badge badge-available';
    } else {
      availabilityBadge.textContent = 'Out of Stock';
      availabilityBadge.className = 'badge badge-unavailable';
    }
  }

  const borrowBtn = document.getElementById('borrow-btn');
  if (borrowBtn) {

    if (!book.availability) {
      borrowBtn.textContent = 'Unavailable';
      borrowBtn.disabled = true;
      borrowBtn.style.opacity = '0.5';
      borrowBtn.style.cursor = 'not-allowed';
    }

    borrowBtn.addEventListener('click', () => {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        window.showCustomAlert('You must login first to reserve or borrow a book.', 'error');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500);
        return;
      }

      if (!book.availability) {
        window.showCustomAlert('Sorry, this book is currently out of stock.', 'error');
        return;
      }

      const borrowedList = JSON.parse(localStorage.getItem('borrowedList') || '[]');
      borrowedList.push(book.id);
      localStorage.setItem('borrowedList', JSON.stringify(borrowedList));

      window.showCustomAlert('Book reserved successfully! You can pick it up from the collection desk.', 'success');
      
      book.availability = false;
      availabilityBadge.textContent = 'Out of Stock';
      availabilityBadge.className = 'badge badge-unavailable';
      borrowBtn.textContent = 'Reserved';
      borrowBtn.disabled = true;
      borrowBtn.style.opacity = '0.5';
      borrowBtn.style.cursor = 'not-allowed';
    });
  }

  renderSimilarBooks(book);
}

function renderSimilarBooks(currentBook) {
  const container = document.getElementById('similar-books-grid');
  if (!container) return;

  const matches = booksData
    .filter(b => b.category === currentBook.category && b.id !== currentBook.id)
    .slice(0, 3);

  if (matches.length < 3) {
    const ids = matches.map(b => b.id);
    ids.push(currentBook.id);
    const fillers = booksData
      .filter(b => !ids.includes(b.id))
      .slice(0, 3 - matches.length);
    matches.push(...fillers);
  }

  container.innerHTML = '';
  matches.forEach(book => {
    const col = document.createElement('article');
    col.className = 'book-card scroll-reveal';
    const badge = book.availability
      ? `<span class="badge badge-available">Available</span>`
      : `<span class="badge badge-unavailable">Out of Stock</span>`;

    col.innerHTML = `
      <div class="book-card-img-wrap">
        <img src="${book.cover}" alt="Book Cover - ${book.title}">
        <div class="book-card-overlay">
          <a href="book-details.html?id=${book.id}" class="btn btn-primary btn-sm">View Details</a>
        </div>
      </div>
      <div class="book-card-content">
        <div class="book-card-meta">
          <span class="book-card-category">${book.category}</span>
          <span class="book-card-rating">★ ${book.rating}</span>
        </div>
        <h3 class="book-card-title">${book.title}</h3>
        <p class="book-card-author">by ${book.author}</p>
        <div class="book-card-footer">
          ${badge}
          <a href="book-details.html?id=${book.id}" class="btn btn-secondary btn-sm">Browse</a>
        </div>
      </div>
    `;
    container.appendChild(col);
  });
}
