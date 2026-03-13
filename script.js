/* ============================
   SH Waqar's Library - JavaScript
   ============================ */

// ============================
// Data Management
// ============================

// Initialize library data from localStorage
let library = JSON.parse(localStorage.getItem('swl-library')) || [];
let currentView = 'grid';
let currentViewMode = 'grid';
let bookToDelete = null;

// Sample demo data (only if library is empty)
const DEMO_BOOKS = [
    {
        id: Date.now() + 1,
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        genre: 'Fiction',
        isbn: '9780743273565',
        year: 1925,
        pages: 180,
        language: 'English',
        status: 'Read',
        rating: 4.5,
        cover: '📖',
        notes: 'A masterpiece of American literature set in the Jazz Age.',
        isFavorite: true,
        dateAdded: new Date().toISOString().split('T')[0]
    },
    {
        id: Date.now() + 2,
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        genre: 'Fiction',
        isbn: '9780061120084',
        year: 1960,
        pages: 324,
        language: 'English',
        status: 'Read',
        rating: 5,
        cover: '📚',
        notes: 'A gripping tale of racial injustice and moral growth.',
        isFavorite: true,
        dateAdded: new Date().toISOString().split('T')[0]
    },
    {
        id: Date.now() + 3,
        title: '1984',
        author: 'George Orwell',
        genre: 'Science Fiction',
        isbn: '9780451524935',
        year: 1949,
        pages: 328,
        language: 'English',
        status: 'Unread',
        rating: 0,
        cover: '🔮',
        notes: 'A dystopian novel exploring totalitarianism.',
        isFavorite: false,
        dateAdded: new Date().toISOString().split('T')[0]
    },
    {
        id: Date.now() + 4,
        title: 'Pride and Prejudice',
        author: 'Jane Austen',
        genre: 'Romance',
        isbn: '9780141440716',
        year: 1813,
        pages: 406,
        language: 'English',
        status: 'Currently Reading',
        rating: 4,
        cover: '💕',
        notes: 'A classic romantic novel with witty characters.',
        isFavorite: true,
        dateAdded: new Date().toISOString().split('T')[0]
    },
    {
        id: Date.now() + 5,
        title: 'The Catcher in the Rye',
        author: 'J.D. Salinger',
        genre: 'Fiction',
        isbn: '9780316769174',
        year: 1951,
        pages: 277,
        language: 'English',
        status: 'Want to Read',
        rating: 0,
        cover: '🎓',
        notes: 'A story about teenage alienation and angst.',
        isFavorite: false,
        dateAdded: new Date().toISOString().split('T')[0]
    }
];

// ============================
// Utilities
// ============================

// Save library to localStorage
function saveLibrary() {
    localStorage.setItem('swl-library', JSON.stringify(library));
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const messageEl = document.getElementById('notificationMessage');
    
    messageEl.textContent = message;
    notification.className = `notification ${type} active`;
    
    setTimeout(() => {
        notification.classList.remove('active');
    }, 3000);
}

// Close notification
function closeNotification() {
    document.getElementById('notification').classList.remove('active');
}

// Generate unique ID
function generateId() {
    return Date.now() + Math.random();
}

// Get status badge color
function getStatusBadgeClass(status) {
    const statusMap = {
        'Read': 'read',
        'Unread': 'unread',
        'Currently Reading': 'reading',
        'Want to Read': 'want'
    };
    return statusMap[status] || '';
}

// Generate star rating
function generateStars(rating) {
    const fullStar = '★';
    const emptyStar = '☆';
    const roundedRating = Math.round(rating * 2) / 2;
    let stars = '';
    
    for (let i = 0; i < 5; i++) {
        if (i < Math.floor(roundedRating)) {
            stars += fullStar;
        } else if (i === Math.floor(roundedRating) && roundedRating % 1 === 0.5) {
            stars += '⯨'; // Half star
        } else {
            stars += emptyStar;
        }
    }
    
    return stars;
}

// Download JSON helper
function downloadJSON(data, filename) {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

// Fetch book cover + description from Open Library
async function fetchOpenLibraryData({ isbn, title, author }) {
    const cleanIsbn = (isbn || '').replace(/[^0-9Xx]/g, '');
    const makeCoverUrl = (id) => `https://covers.openlibrary.org/b/id/${id}-L.jpg`;
    const makeIsbnCoverUrl = (isbnVal) => `https://covers.openlibrary.org/b/isbn/${isbnVal}-L.jpg`;

    try {
        if (cleanIsbn) {
            const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`;
            const response = await fetch(url);
            const data = await response.json();
            const bookData = data[`ISBN:${cleanIsbn}`];
            if (bookData) {
                const cover = bookData.cover?.large || bookData.cover?.medium || bookData.cover?.small || makeIsbnCoverUrl(cleanIsbn);
                const description = typeof bookData.description === 'string'
                    ? bookData.description
                    : bookData.description?.value || '';
                return {
                    cover: cover || '',
                    description: description || '',
                    title: bookData.title || title || '',
                    author: (bookData.authors && bookData.authors[0]?.name) ? bookData.authors[0].name : author || ''
                };
            }
        }

        // Fallback to search API (title + author)
        const qParts = [];
        if (title) qParts.push(`title=${encodeURIComponent(title)}`);
        if (author) qParts.push(`author=${encodeURIComponent(author)}`);
        if (qParts.length === 0) {
            return { cover: '', description: '' };
        }
        const searchUrl = `https://openlibrary.org/search.json?${qParts.join('&')}&limit=1`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        const doc = searchData.docs?.[0];
        if (!doc) return { cover: '', description: '' };

        const cover = doc.cover_i ? makeCoverUrl(doc.cover_i) : '';
        const description = Array.isArray(doc.first_sentence)
            ? doc.first_sentence.join(' ')
            : doc.first_sentence || doc.subtitle || '';
        return {
            cover,
            description: description || '',
            title: doc.title || title || '',
            author: (doc.author_name && doc.author_name[0]) ? doc.author_name[0] : author || ''
        };
    } catch (err) {
        console.warn('OpenLibrary fetch failed', err);
        return { cover: '', description: '' };
    }
}

// Export library to PDF (summary + book list)
function exportLibraryToPDF() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        showNotification('PDF export library not loaded', 'error');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const margin = 40;
    const lineHeight = 16;
    let y = margin;

    const totalBooks = library.length;
    const readBooks = library.filter(b => b.status === 'Read').length;
    const unreadBooks = library.filter(b => b.status === 'Unread').length;
    const currentlyReading = library.filter(b => b.status === 'Currently Reading').length;
    const favorites = library.filter(b => b.isFavorite).length;
    const avgRating = totalBooks > 0 ? (library.reduce((sum, b) => sum + (b.rating || 0), 0) / totalBooks).toFixed(1) : '0';

    doc.setFontSize(18);
    doc.text('SH Waqar\'s Library Export', margin, y);
    y += lineHeight * 1.5;

    doc.setFontSize(11);
    doc.text(`Export Date: ${new Date().toLocaleString()}`, margin, y);
    y += lineHeight;

    doc.text(`Total Books: ${totalBooks}`, margin, y);
    y += lineHeight;
    doc.text(`Books Read: ${readBooks}`, margin, y);
    y += lineHeight;
    doc.text(`Unread Books: ${unreadBooks}`, margin, y);
    y += lineHeight;
    doc.text(`Currently Reading: ${currentlyReading}`, margin, y);
    y += lineHeight;
    doc.text(`Favorites: ${favorites}`, margin, y);
    y += lineHeight;
    doc.text(`Average Rating: ${avgRating}/5`, margin, y);
    y += lineHeight * 2;

    const genreCount = {};
    library.forEach(b => {
        genreCount[b.genre] = (genreCount[b.genre] || 0) + 1;
    });

    const topGenres = Object.entries(genreCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    if (topGenres.length) {
        doc.setFontSize(13);
        doc.text('Top Genres:', margin, y);
        y += lineHeight;
        doc.setFontSize(11);
        topGenres.forEach(([genre, count]) => {
            doc.text(`${genre}: ${count}`, margin + 10, y);
            y += lineHeight;
        });
        y += lineHeight;
    }

    doc.addPage();
    y = margin;

    doc.setFontSize(16);
    doc.text('Books', margin, y);
    y += lineHeight * 1.5;
    doc.setFontSize(11);

    const pageHeight = doc.internal.pageSize.height;
    const lineLimit = pageHeight - margin;

    const sortedBooks = [...library].sort((a, b) => a.title.localeCompare(b.title));
    sortedBooks.forEach(book => {
        const bookLines = [
            `Title: ${book.title}`,
            `Author: ${book.author}`,
            `Genre: ${book.genre} | Status: ${book.status} | Rating: ${book.rating || 0}`,
            `ISBN: ${book.isbn || 'N/A'}`,
            `Notes: ${book.notes ? book.notes.replace(/\s+/g, ' ') : 'N/A'}`
        ];

        bookLines.forEach(line => {
            if (y + lineHeight > lineLimit) {
                doc.addPage();
                y = margin;
            }
            doc.text(line, margin, y);
            y += lineHeight;
        });

        y += lineHeight;
    });

    const fileName = `swl-library-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    showNotification('Library exported to PDF.', 'success');
}

// ============================
// Navigation & Page Management
// ============================

function goToPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    document.getElementById(pageName).classList.add('active');
    
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageName) {
            link.classList.add('active');
        }
    });
    
    // Close mobile menu
    document.getElementById('navMenu').classList.remove('active');
    document.getElementById('hamburger').classList.remove('active');
    
    // Render page specific content
    if (pageName === 'library') {
        renderBooks(library);
        updateFilters();
    } else if (pageName === 'favorites') {
        const favorites = library.filter(book => book.isFavorite);
        renderBooks(favorites, 'favoritesContainer');
    } else if (pageName === 'dashboard') {
        updateDashboard();
    } else if (pageName === 'stats') {
        updateStatistics();
    }
    
    window.scrollTo(0, 0);
}

// Setup nav links event listeners
function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            goToPage(page);
        });
    });
    
    // Hamburger menu
    document.getElementById('hamburger').addEventListener('click', () => {
        document.getElementById('navMenu').classList.toggle('active');
        document.getElementById('hamburger').classList.toggle('active');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        const nav = document.querySelector('.navbar');
        if (!nav.contains(e.target)) {
            document.getElementById('navMenu').classList.remove('active');
            document.getElementById('hamburger').classList.remove('active');
        }
    });
}

// ============================
// Theme Management
// ============================

function setupTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('swl-theme') || 'light';
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.querySelector('.theme-icon').textContent = '☀️';
    }
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('swl-theme', isDark ? 'dark' : 'light');
        themeToggle.querySelector('.theme-icon').textContent = isDark ? '☀️' : '🌙';
    });
}

// ============================
// Book Form Management
// ============================

function setupAddBookForm() {
    const form = document.getElementById('addBookForm');
    const ratingInput = document.getElementById('bookRating');
    const ratingDisplay = document.getElementById('ratingDisplay');
    
    // Update rating display
    ratingInput.addEventListener('input', (e) => {
        const rating = parseFloat(e.target.value) || 0;
        ratingDisplay.textContent = generateStars(rating);
    });

    // Fetch cover & description from Open Library
    const fetchButton = document.getElementById('fetchBookDataBtn');
    if (fetchButton) {
        fetchButton.addEventListener('click', async () => {
            const isbn = document.getElementById('bookISBN').value;
            const title = document.getElementById('bookTitle').value;
            const author = document.getElementById('bookAuthor').value;

            const result = await fetchOpenLibraryData({ isbn, title, author });
            if (result.cover) {
                document.getElementById('bookCover').value = result.cover;
            }
            if (result.description) {
                const notesEl = document.getElementById('bookNotes');
                if (!notesEl.value) {
                    notesEl.value = result.description;
                }
            }
            if (result.title) {
                document.getElementById('bookTitle').value = result.title;
            }
            if (result.author) {
                document.getElementById('bookAuthor').value = result.author;
            }
            showNotification('Fetched book info from Open Library!', 'success');
        });
    }
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newBook = {
            id: generateId(),
            title: document.getElementById('bookTitle').value,
            author: document.getElementById('bookAuthor').value,
            genre: document.getElementById('bookGenre').value,
            isbn: document.getElementById('bookISBN').value,
            year: parseInt(document.getElementById('bookYear').value) || new Date().getFullYear(),
            pages: parseInt(document.getElementById('bookPages').value) || 0,
            language: document.getElementById('bookLanguage').value || 'English',
            status: document.getElementById('bookStatus').value,
            rating: parseFloat(document.getElementById('bookRating').value) || 0,
            cover: document.getElementById('bookCover').value,
            notes: document.getElementById('bookNotes').value,
            isFavorite: false,
            dateAdded: new Date().toISOString().split('T')[0]
        };
        
        library.unshift(newBook);
        saveLibrary();
        form.reset();
        ratingDisplay.textContent = '☆☆☆☆☆';
        
        showNotification(`"${newBook.title}" has been added to your library!`, 'success');
        
        // Go to library page
        setTimeout(() => {
            goToPage('library');
        }, 500);
    });
}

// ============================
// Book Display & Rendering
// ============================

function renderBooks(books = library, containerId = 'booksContainer') {
    const container = document.getElementById(containerId);
    
    if (books.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>✨ No books found. ${containerId === 'booksContainer' ? '<a href="#" onclick="goToPage(\'add-book\')">Add one now!</a>' : 'Add books to see them here!'}</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = books.map(book => createBookCard(book)).join('');
    
    // Add event listeners to book cards
    document.querySelectorAll('.book-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.book-actions')) {
                showBookModal(card.dataset.bookId);
            }
        });
    });
}

function createBookCard(book) {
    const statusClass = getStatusBadgeClass(book.status);
    const starRating = generateStars(book.rating);
    const coverEmoji = book.cover || '📖';
    
    return `
        <div class="book-card ${currentViewMode === 'list' ? 'list-item' : ''}" data-book-id="${book.id}">
            <div class="book-cover">
                ${book.cover && book.cover.startsWith('http') ? `<img src="${book.cover}" alt="${book.title}">` : coverEmoji}
            </div>
            <div class="favorite-badge ${book.isFavorite ? '' : 'inactive'}" onclick="toggleFavorite('${book.id}')" title="Add to Favorites">
                ${book.isFavorite ? '⭐' : '☆'}
            </div>
            <div class="book-info">
                <div class="book-title">${book.title}</div>
                <div class="book-author">by ${book.author}</div>
                <div class="book-meta">
                    <span class="book-genre">${book.genre}</span>
                    <span class="book-rating">${starRating}</span>
                </div>
                <div class="book-status ${statusClass}">${book.status}</div>
                <div class="book-actions">
                    <button class="btn btn-small" onclick="openEditModal('${book.id}')" title="Edit">✏️ Edit</button>
                    <button class="btn btn-small btn-danger" onclick="confirmDelete('${book.id}')" title="Delete">🗑️ Delete</button>
                </div>
            </div>
        </div>
    `;
}

// ============================
// Book Modal Management
// ============================

function showBookModal(bookId) {
    const book = library.find(b => b.id == bookId);
    if (!book) return;
    
    const modal = document.getElementById('bookModal');
    const modalBody = document.getElementById('modalBody');
    const coverEmoji = book.cover || '📖';
    
    modalBody.innerHTML = `
        <div class="modal-book-cover">
            ${book.cover && book.cover.startsWith('http') ? `<img src="${book.cover}" alt="${book.title}">` : coverEmoji}
        </div>
        <h2>${book.title}</h2>
        <p style="color: var(--text-secondary); margin-bottom: var(--spacing-lg);">by ${book.author}</p>
        
        <div class="modal-book-info">
            <div class="modal-book-field">
                <label>Author</label>
                <value>${book.author}</value>
            </div>
            <div class="modal-book-field">
                <label>Genre</label>
                <value>${book.genre}</value>
            </div>
            <div class="modal-book-field">
                <label>Status</label>
                <value>${book.status}</value>
            </div>
            <div class="modal-book-field">
                <label>Rating</label>
                <value>${generateStars(book.rating)} (${book.rating}/5)</value>
            </div>
            <div class="modal-book-field">
                <label>Published</label>
                <value>${book.year}</value>
            </div>
            <div class="modal-book-field">
                <label>Pages</label>
                <value>${book.pages || 'N/A'}</value>
            </div>
            <div class="modal-book-field">
                <label>Language</label>
                <value>${book.language || 'English'}</value>
            </div>
            <div class="modal-book-field">
                <label>ISBN</label>
                <value>${book.isbn || 'N/A'}</value>
            </div>
        </div>
        
        ${book.notes ? `
            <div class="modal-book-notes">
                <h4>Notes</h4>
                <p>${book.notes}</p>
            </div>
        ` : ''}
        
        <div class="modal-actions">
            <button class="btn btn-primary" onclick="openEditModal('${book.id}')">✏️ Edit Book</button>
            <button class="btn btn-danger" onclick="confirmDelete('${book.id}')">🗑️ Delete Book</button>
        </div>
    `;
    
    modal.classList.add('active');
    document.getElementById('closeModal').addEventListener('click', closeBookModal);
}

function closeBookModal() {
    document.getElementById('bookModal').classList.remove('active');
}

// ============================
// Edit Book Modal
// ============================

function openEditModal(bookId) {
    const book = library.find(b => b.id == bookId);
    if (!book) return;
    
    document.getElementById('editBookId').value = book.id;
    document.getElementById('editBookTitle').value = book.title;
    document.getElementById('editBookAuthor').value = book.author;
    document.getElementById('editBookGenre').value = book.genre;
    document.getElementById('editBookISBN').value = book.isbn || '';
    document.getElementById('editBookYear').value = book.year || '';
    document.getElementById('editBookPages').value = book.pages || '';
    document.getElementById('editBookLanguage').value = book.language || 'English';
    document.getElementById('editBookStatus').value = book.status;
    document.getElementById('editBookRating').value = book.rating || 0;
    document.getElementById('editBookCover').value = book.cover || '';
    document.getElementById('editBookNotes').value = book.notes || '';
    
    document.getElementById('editBookModal').classList.add('active');
    closeBookModal();
}

function closeEditModal() {
    document.getElementById('editBookModal').classList.remove('active');
}

function setupEditForm() {
    const form = document.getElementById('editBookForm');
    const fetchEditButton = document.getElementById('fetchEditBookDataBtn');

    if (fetchEditButton) {
        fetchEditButton.addEventListener('click', async () => {
            const isbn = document.getElementById('editBookISBN').value;
            const title = document.getElementById('editBookTitle').value;
            const author = document.getElementById('editBookAuthor').value;

            const result = await fetchOpenLibraryData({ isbn, title, author });
            if (result.cover) {
                document.getElementById('editBookCover').value = result.cover;
            }
            if (result.description) {
                const notesEl = document.getElementById('editBookNotes');
                if (!notesEl.value) {
                    notesEl.value = result.description;
                }
            }
            if (result.title) {
                document.getElementById('editBookTitle').value = result.title;
            }
            if (result.author) {
                document.getElementById('editBookAuthor').value = result.author;
            }
            showNotification('Fetched book info from Open Library!', 'success');
        });
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const bookId = document.getElementById('editBookId').value;
        const book = library.find(b => b.id == bookId);
        
        if (book) {
            book.title = document.getElementById('editBookTitle').value;
            book.author = document.getElementById('editBookAuthor').value;
            book.genre = document.getElementById('editBookGenre').value;
            book.isbn = document.getElementById('editBookISBN').value;
            book.year = parseInt(document.getElementById('editBookYear').value) || new Date().getFullYear();
            book.pages = parseInt(document.getElementById('editBookPages').value) || 0;
            book.language = document.getElementById('editBookLanguage').value || 'English';
            book.status = document.getElementById('editBookStatus').value;
            book.rating = parseFloat(document.getElementById('editBookRating').value) || 0;
            book.cover = document.getElementById('editBookCover').value;
            book.notes = document.getElementById('editBookNotes').value;
            
            saveLibrary();
            showNotification(`"${book.title}" has been updated!`, 'success');
            closeEditModal();
            renderBooks(library);
        }
    });
}

// ============================
// Delete Book Management
// ============================

function confirmDelete(bookId) {
    const book = library.find(b => b.id == bookId);
    if (!book) return;
    
    bookToDelete = bookId;
    document.getElementById('deleteBookTitle').textContent = book.title;
    document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    bookToDelete = null;
}

function confirmDeleteBook() {
    if (!bookToDelete) return;
    
    const book = library.find(b => b.id == bookToDelete);
    const bookTitle = book.title;
    
    library = library.filter(b => b.id != bookToDelete);
    saveLibrary();
    
    closeDeleteModal();
    closeBookModal();
    closeEditModal();
    
    showNotification(`"${bookTitle}" has been deleted`, 'success');
    renderBooks(library);
    updateDashboard();
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDeleteBook);
});

// ============================
// Favorites Management
// ============================

function toggleFavorite(bookId) {
    const book = library.find(b => b.id == bookId);
    if (book) {
        book.isFavorite = !book.isFavorite;
        saveLibrary();
        renderBooks(library);
        showNotification(
            book.isFavorite ? 'Added to favorites!' : 'Removed from favorites',
            'success'
        );
    }
}

// ============================
// Search & Filter
// ============================

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = library.filter(book =>
            book.title.toLowerCase().includes(query) ||
            book.author.toLowerCase().includes(query) ||
            book.genre.toLowerCase().includes(query)
        );
        renderBooks(filtered);
    });
}

function setupFilters() {
    const genreFilter = document.getElementById('genreFilter');
    const statusFilter = document.getElementById('statusFilter');
    const ratingFilter = document.getElementById('ratingFilter');
    const sortBy = document.getElementById('sortBy');
    
    [genreFilter, statusFilter, ratingFilter, sortBy].forEach(filter => {
        filter.addEventListener('change', applyFilters);
    });
}

function applyFilters() {
    let filtered = [...library];
    
    // Apply filters
    const genre = document.getElementById('genreFilter').value;
    if (genre) {
        filtered = filtered.filter(book => book.genre === genre);
    }
    
    const status = document.getElementById('statusFilter').value;
    if (status) {
        filtered = filtered.filter(book => book.status === status);
    }
    
    const rating = document.getElementById('ratingFilter').value;
    if (rating) {
        filtered = filtered.filter(book => book.rating >= parseFloat(rating));
    }
    
    // Apply sorting
    const sortBy = document.getElementById('sortBy').value;
    switch (sortBy) {
        case 'title-asc':
            filtered.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'title-desc':
            filtered.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case 'author':
            filtered.sort((a, b) => a.author.localeCompare(b.author));
            break;
        case 'rating':
            filtered.sort((a, b) => b.rating - a.rating);
            break;
        case 'year':
            filtered.sort((a, b) => b.year - a.year);
            break;
        case 'recent':
        default:
            filtered.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    }
    
    renderBooks(filtered);
}

function updateFilters() {
    // Get unique genres
    const genres = [...new Set(library.map(book => book.genre))].sort();
    const genreSelect = document.getElementById('genreFilter');
    genreSelect.innerHTML = '<option value="">All Genres</option>' +
        genres.map(genre => `<option value="${genre}">${genre}</option>`).join('');
}

// ============================
// View Toggle
// ============================

function setupViewToggle() {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const view = btn.dataset.view;
            currentViewMode = view;
            
            const container = document.getElementById('booksContainer');
            if (view === 'list') {
                container.classList.add('list-view');
            } else {
                container.classList.remove('list-view');
            }
            
            renderBooks(library);
        });
    });
}

// ============================
// Dashboard Management
// ============================

function updateDashboard() {
    // Update stats
    const totalBooks = library.length;
    const readBooks = library.filter(b => b.status === 'Read').length;
    const unreadBooks = library.filter(b => b.status === 'Unread').length;
    const favorites = library.filter(b => b.isFavorite).length;
    const currentlyReading = library.filter(b => b.status === 'Currently Reading').length;
    const avgRating = totalBooks > 0
        ? (library.reduce((sum, b) => sum + (b.rating || 0), 0) / totalBooks).toFixed(1)
        : 0;
    
    document.getElementById('totalBooksCount').textContent = totalBooks;
    document.getElementById('readBooksCount').textContent = readBooks;
    document.getElementById('unreadBooksCount').textContent = unreadBooks;
    document.getElementById('favoriteBooksCount').textContent = favorites;
    document.getElementById('readingBooksCount').textContent = currentlyReading;
    document.getElementById('avgRatingCount').textContent = avgRating;
    
    // Render recent books
    const recent = library.slice(0, 6);
    renderBooks(recent, 'recentBooksContainer');
}

// ============================
// Statistics Page
// ============================

function updateStatistics() {
    const totalBooks = library.length;
    const readBooks = library.filter(b => b.status === 'Read').length;
    const unreadBooks = library.filter(b => b.status === 'Unread').length;
    const currentlyReading = library.filter(b => b.status === 'Currently Reading').length;
    const favorites = library.filter(b => b.isFavorite).length;
    const avgRating = totalBooks > 0
        ? (library.reduce((sum, b) => sum + (b.rating || 0), 0) / totalBooks).toFixed(1)
        : 0;
    
    // Update quick stats
    document.getElementById('statTotalBooks').textContent = totalBooks;
    document.getElementById('statBooksRead').textContent = readBooks;
    document.getElementById('statBooksUnread').textContent = unreadBooks;
    document.getElementById('statCurrentlyReading').textContent = currentlyReading;
    document.getElementById('statFavorites').textContent = favorites;
    document.getElementById('statAvgRating').textContent = `${avgRating}/5`;
    
    // Update genre distribution
    updateGenreStats();
    
    // Update progress bars
    updateProgressBars(totalBooks, readBooks, unreadBooks, currentlyReading);
    
    // Update top genres
    updateTopGenres();
}

function updateGenreStats() {
    const genreCount = {};
    library.forEach(book => {
        genreCount[book.genre] = (genreCount[book.genre] || 0) + 1;
    });
    
    const genreList = document.getElementById('genreStats');
    
    if (Object.keys(genreCount).length === 0) {
        genreList.innerHTML = '<p class="empty-message">Add books to see genre distribution</p>';
        return;
    }
    
    genreList.innerHTML = Object.entries(genreCount)
        .sort((a, b) => b[1] - a[1])
        .map(([genre, count]) => `
            <div class="genre-item">
                <span>${genre}</span>
                <span class="genre-count">${count}</span>
            </div>
        `)
        .join('');
}

function updateProgressBars(total, read, unread, reading) {
    const readPercent = total > 0 ? (read / total * 100).toFixed(0) : 0;
    const unreadPercent = total > 0 ? (unread / total * 100).toFixed(0) : 0;
    const readingPercent = total > 0 ? (reading / total * 100).toFixed(0) : 0;
    
    document.getElementById('progressRead').style.width = `${readPercent}%`;
    document.getElementById('progressRead').textContent = readPercent > 10 ? `${readPercent}%` : '';
    document.getElementById('progressReadText').textContent = `${readPercent}%`;
    
    document.getElementById('progressUnread').style.width = `${unreadPercent}%`;
    document.getElementById('progressUnread').textContent = unreadPercent > 10 ? `${unreadPercent}%` : '';
    document.getElementById('progressUnreadText').textContent = `${unreadPercent}%`;
    
    document.getElementById('progressReading').style.width = `${readingPercent}%`;
    document.getElementById('progressReading').textContent = readingPercent > 10 ? `${readingPercent}%` : '';
    document.getElementById('progressReadingText').textContent = `${readingPercent}%`;
}

function updateTopGenres() {
    const genreCount = {};
    library.forEach(book => {
        genreCount[book.genre] = (genreCount[book.genre] || 0) + 1;
    });
    
    const topGenres = document.getElementById('topGenres');
    
    if (Object.keys(genreCount).length === 0) {
        topGenres.innerHTML = '<p class="empty-message">Add books to see top genres</p>';
        return;
    }
    
    const sorted = Object.entries(genreCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const maxCount = Math.max(...sorted.map(g => g[1]));
    
    topGenres.innerHTML = sorted
        .map(([genre, count]) => {
            const percent = (count / maxCount * 100).toFixed(0);
            return `
                <div class="genre-bar">
                    <div class="genre-name">${genre}</div>
                    <div class="genre-bar-fill" style="width: ${percent}%">${count}</div>
                </div>
            `;
        })
        .join('');
}

// ============================
// Import / Export
// ============================

function setupImportExport() {
    const backupBtn = document.getElementById('backupBtn');
    const restoreBtn = document.getElementById('restoreBtn');
    const restoreFile = document.getElementById('restoreFile');
    const exportBtn = document.getElementById('exportBtn');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile');
    const resetBtn = document.getElementById('resetBtn');

    const processImportFile = (file, successMessage) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target.result);
                if (Array.isArray(imported)) {
                    library = imported;
                    saveLibrary();
                    showNotification(successMessage, 'success');
                    renderBooks(library);
                    updateDashboard();
                } else {
                    showNotification('Invalid file format', 'error');
                }
            } catch (err) {
                showNotification('Error reading file', 'error');
            }
        };
        reader.readAsText(file);
    };

    backupBtn.addEventListener('click', () => {
        const fileName = `swl-library-backup-${new Date().toISOString().split('T')[0]}.json`;
        downloadJSON(library, fileName);
        showNotification('Library backup downloaded', 'success');
    });

    restoreBtn.addEventListener('click', () => {
        restoreFile.click();
    });

    restoreFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!confirm('Restoring will replace your current library. Continue?')) return;
        processImportFile(file, 'Library restored successfully!');
        restoreFile.value = '';
    });

    exportBtn.addEventListener('click', () => {
        const fileName = `swl-library-${new Date().toISOString().split('T')[0]}.json`;
        downloadJSON(library, fileName);
        showNotification('Library exported successfully!', 'success');
    });

    exportPdfBtn.addEventListener('click', () => {
        exportLibraryToPDF();
    });

    importBtn.addEventListener('click', () => {
        importFile.click();
    });

    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        processImportFile(file, 'Library imported successfully!');
        importFile.value = '';
    });

    resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset your entire library? This cannot be undone!')) {
            library = [];
            saveLibrary();
            showNotification('Library has been reset', 'success');
            renderBooks(library);
            updateDashboard();
        }
    });
}

// ============================
// Modal Close on Outside Click
// ============================

function setupModalClose() {
    [document.getElementById('bookModal'), document.getElementById('editBookModal'), document.getElementById('deleteModal')].forEach(modal => {
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// ============================
// Mobile-Friendly Enhancements
// ============================

function setupMobileOptimizations() {
    // Prevent zoom on input focus for iOS
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            // Add viewport meta tag adjustment if needed
            const viewport = document.querySelector('meta[name=viewport]');
            if (viewport) {
                viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
            }
        });

        input.addEventListener('blur', () => {
            // Reset viewport
            const viewport = document.querySelector('meta[name=viewport]');
            if (viewport) {
                viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
            }
        });
    });

    // Better touch handling for book cards
    document.addEventListener('touchstart', function() {}, { passive: true });

    // Improve modal scrolling on mobile
    const modals = document.querySelectorAll('.modal-content');
    modals.forEach(modal => {
        modal.addEventListener('touchmove', (e) => {
            // Allow scrolling within modal
            e.stopPropagation();
        }, { passive: true });
    });

    // Handle orientation changes
    window.addEventListener('orientationchange', () => {
        // Small delay to allow orientation to complete
        setTimeout(() => {
            window.scrollTo(0, 0);
        }, 100);
    });

    // Detect if device supports touch
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) {
        document.body.classList.add('touch-device');
    }
}

// ============================
// Initialize Application
// ============================

document.addEventListener('DOMContentLoaded', () => {
    // Load demo data if library is empty
    if (library.length === 0) {
        library = [...DEMO_BOOKS];
        saveLibrary();
    }
    
    // Setup all features
    setupTheme();
    setupNavigation();
    setupAddBookForm();
    setupEditForm();
    setupSearch();
    setupFilters();
    setupViewToggle();
    setupImportExport();
    setupModalClose();
    setupMobileOptimizations();
    
    // Initial render
    updateDashboard();
    updateStatistics();
    
    // Go to dashboard
    goToPage('dashboard');
});
