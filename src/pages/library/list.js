import React from "react";
import Data from "../../utils/data"; // Adjust path as needed
import BookModal from "./add"; // The new ref-based modal
import PDFReviewModal from "./PDFReviewModal"; // PDF review modal
import VideoPlayerModal from "./VideoPlayerModal"; // Video custom player modal
import "./Library.css"; // The Apple-style CSS

const NO_COVER_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 200"><rect width="100%" height="100%" fill="%23f3f4f6" rx="8"/><rect x="8" y="8" width="134" height="184" fill="none" stroke="%23e5e7eb" stroke-width="2" stroke-dasharray="4" rx="6"/><path d="M55 75h40v6H55zm0 14h40v6H55zm0 14h25v6H55z" fill="%239ca3af"/><text x="75" y="150" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" fill="%239ca3af" text-anchor="middle">No Cover</text></svg>`;

class LibraryList extends React.Component {
  state = {
    books: [],
    filteredBooks: [],
    searchTerm: "",
    activeCategory: "All",
    loading: true,
    reviewBook: null,
    showReviewModal: false,
    videoBook: null,
    showVideoModal: false,
    deleteBook: null,
    showDeleteModal: false,
    isDeleting: false,
    libsLoaded: false
  };

  componentDidMount() {
    // 1. Dynamically Load Plyr CSS and JS for video player
    this.loadPlyrLibrary();

    // 2. Subscribe to live data updates
    this._subscription = Data.books.subscribe(({ books }) => {
      this.setState({ books: books || [], loading: false }, () => {
        this.filterBooks();
      });
    });
  }

  componentWillUnmount() {
    if (this._subscription) this._subscription();
  }

  loadPlyrLibrary = () => {
    // Load Plyr CSS
    if (!document.getElementById("plyr-css")) {
      const link = document.createElement("link");
      link.id = "plyr-css";
      link.rel = "stylesheet";
      link.href = "https://cdn.plyr.io/3.7.8/plyr.css";
      document.head.appendChild(link);
    }

    // Load Plyr JS
    if (!window.Plyr) {
      const script = document.createElement("script");
      script.src = "https://cdn.plyr.io/3.7.8/plyr.js";
      document.head.appendChild(script);
    }
  };


  // --- Filtering Logic ---

  filterBooks = () => {
    const { books, searchTerm, activeCategory } = this.state;
    // Filter out deleted books
    let filtered = (books || []).filter((b) => !b.isDeleted);

    // 1. Filter by Tag (formerly Category)
    if (activeCategory !== "All") {
      filtered = filtered.filter((b) => (b.tags || []).includes(activeCategory));
    }

    // 2. Filter by Search Term
    if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (b) =>
              (b.title || "").toLowerCase().includes(lower) ||
              (b.author || "").toLowerCase().includes(lower) ||
              (b.tags || []).some(t => t.toLowerCase().includes(lower))
        );
      }

    this.setState({ filteredBooks: filtered });
  };

  handleSearch = (e) => {
    this.setState({ searchTerm: e.target.value }, this.filterBooks);
  };

  handleCategoryChange = (category) => {
    this.setState({ activeCategory: category }, this.filterBooks);
  };

  // --- Modal & CRUD Actions ---

  /**
   * Opens the modal in "Add Mode" (clears form)
   */
  openAddModal = () => {
    if (this.modalRef) {
      this.modalRef.show(); 
    }
  };

  /**
   * Opens the modal in "Edit Mode" (populates form)
   */
  openEditModal = (book) => {
    if (this.modalRef) {
      this.modalRef.show(book); 
    }
  };

  /**
   * Handles both Create and Update logic based on ID existence
   */
  handleSaveBook = (bookData) => {
    // If ID exists, we are updating. If empty, we are creating.
    if (bookData.id) {
      return Data.books.update(bookData)
        .then(() => window.toastr.success("Book updated successfully"))
        .catch((err) => {
          console.error(err);
          window.toastr.error("Failed to update book");
          throw err;
        });
    } else {
      // Remove the empty ID string so the backend generates a new one
      const { id, ...newBook } = bookData;
      return Data.books.create(newBook)
        .then(() => window.toastr.success("Book added successfully"))
        .catch((err) => {
          console.error(err);
          window.toastr.error("Failed to add book");
          throw err;
        });
    }
  };

  downloadBook = (book) => {
    try {
      let downloadUrl;
      let filename;
      
      if (book.pdfUrl.startsWith('data:application/pdf;base64,')) {
        // Create blob from base64
        const base64Data = book.pdfUrl.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        downloadUrl = URL.createObjectURL(blob);
        filename = `${book.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      } else {
        // Use regular URL
        downloadUrl = book.pdfUrl;
        filename = book.pdfUrl.split('/').pop() || `${book.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      }
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup blob URL if created
      if (downloadUrl.startsWith('blob:')) {
        URL.revokeObjectURL(downloadUrl);
      }
      
      window.toastr.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      window.toastr.error('Failed to download book');
    }
  };

  openReviewMode = (book) => {
    this.setState({ reviewBook: book, showReviewModal: true });
  };

  closeReviewMode = () => {
    this.setState({ reviewBook: null, showReviewModal: false });
  };

  deleteBook = (book) => {
    this.setState({ deleteBook: book, showDeleteModal: true });
  };

  closeDeleteModal = () => {
    this.setState({ deleteBook: null, showDeleteModal: false });
  };

  confirmDeleteBook = () => {
    const { deleteBook } = this.state;
    if (!deleteBook) return;

    this.setState({ isDeleting: true });
    Data.books.delete(deleteBook)
      .then(() => {
        window.toastr.success("Book deleted successfully");
        this.setState({ isDeleting: false, showDeleteModal: false, deleteBook: null });
      })
      .catch((err) => {
        console.error(err);
        window.toastr.error("Failed to delete book");
        this.setState({ isDeleting: false });
      });
  };

  // --- Video Custom Player Helpers ---
  openVideoPlayer = (book) => {
    this.setState({ videoBook: book, showVideoModal: true });
  };

  closeVideoPlayer = () => {
    this.setState({ videoBook: null, showVideoModal: false });
  };

  // --- Render Helpers ---

  renderGridCard = (book) => {
    const isVideo = book.type === "video";
    const coverImage = book.coverUrl || NO_COVER_SVG;

    return (
      <div key={book.id} className="book-card">
        <div className="book-cover-wrapper" onClick={() => isVideo ? this.openVideoPlayer(book) : this.openReviewMode(book)} style={{ cursor: 'pointer' }}>
          <span className="book-category-badge">{book.category || "General"}</span>
          <img
            src={coverImage}
            alt={book.title}
            className="book-cover-img"
            onError={(e) => { e.target.onerror = null; e.target.src = NO_COVER_SVG; }}
          />
          {isVideo ? (
            <div className="video-play-overlay">
              <div className="play-circle-btn" style={{ width: '45px', height: '45px', fontSize: '20px' }}>
                <i className="la la-play" style={{ marginLeft: '2px' }}></i>
              </div>
            </div>
          ) : (
            <div className="book-quick-view-overlay">
                <div className="quick-view-btn" style={{ width: '45px', height: '45px', fontSize: '18px' }}>
                    <i className="la la-eye"></i>
                </div>
            </div>
          )}
        </div>

        <div className="book-info" style={{ textAlign: 'left' }}>
          <div className="book-title" title={book.title}>
            {book.title}
          </div>
          <div className="book-author">
            {isVideo ? "Instructor: " : "Author: "} {book.author}
          </div>
          <div className="book-reads" style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
            <i className="la la-eye"></i> {book.readsCount || 0} reads
          </div>
          {book.tags && book.tags.length > 0 && (
            <div className="book-tags" style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {book.tags.map((tag, idx) => (
                <span key={idx} style={{ backgroundColor: '#f0f0f0', color: '#555', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="book-actions mt-auto">
          <button 
              className="book-action-btn edit-btn"
              onClick={() => this.openEditModal(book)}
              title="Edit Resource"
          >
              <i className="la la-edit"></i>
          </button>
          
          {isVideo ? (
              <button 
                  className="book-action-btn view-btn"
                  onClick={() => this.openVideoPlayer(book)}
                  title="Play Video"
              >
                  <i className="la la-play"></i>
              </button>
          ) : book.pdfUrl && (
              <>
                  <button 
                      className="book-action-btn view-btn"
                      onClick={() => this.openReviewMode(book)}
                      title="Review PDF"
                  >
                      <i className="la la-file-pdf"></i>
                  </button>
                  <button 
                      className="book-action-btn download-btn"
                      onClick={() => this.downloadBook(book)}
                      title="Download PDF"
                  >
                      <i className="la la-download"></i>
                  </button>
              </>
          )}
          
          <button 
              className="book-action-btn delete-btn"
              onClick={() => this.deleteBook(book)}
              title="Delete Resource"
          >
              <i className="la la-trash"></i>
          </button>
        </div>
      </div>
    );
  };

  render() {
    const { books, filteredBooks, activeCategory, loading } = this.state;
    
    // Extract unique tags from all non-deleted books
    const allTags = new Set();
    (books || []).forEach(b => {
        if (!b.isDeleted && b.tags && Array.isArray(b.tags)) {
            b.tags.forEach(t => allTags.add(t));
        }
    });
    const categories = ["All", ...Array.from(allTags).sort()];

    if (loading) {
        return <div className="library-container text-center pt-5">Loading Library...</div>;
    }

    return (
      <div className="library-container">
        {/* 1. Header */}
        <div className="library-header">
          <div>
            <h2 className="lib-title">Digital Library</h2>
            <p className="lib-subtitle">Manage school books and video resources</p>
          </div>
          
          <button
            className="btn-apple-add"
            onClick={this.openAddModal}
          >
            <i className="la la-plus" /> Add Resource
          </button>
        </div>

        {/* 2. Filters & Controls */}
        <div className="library-controls">
            {/* Categories */}
            <div className="category-pills">
                {categories.map(cat => (
                    <button 
                        key={cat}
                        className={`cat-pill ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => this.handleCategoryChange(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="search-wrapper">
                <i className="la la-search search-icon"></i>
                <input
                    type="text"
                    className="apple-search"
                    placeholder="Search Title or Author..."
                    onChange={this.handleSearch}
                />
            </div>
        </div>

        {/* 3. The Grid Layout */}
        <div className="book-shelf">
            {filteredBooks.map((book) => this.renderGridCard(book))}
        </div>

        {/* Empty State */}
        {filteredBooks.length === 0 && (
            <div className="empty-state" style={{textAlign: 'center', padding: '4rem', color: '#999'}}>
                <i className="la la-book" style={{fontSize: '3rem', marginBottom: '1rem', display: 'block'}}></i>
                <p>No learning resources found for this category or search.</p>
            </div>
        )}

        {/* 4. The Modal (Rendered Once, controlled via Ref) */}
        <BookModal 
            ref={ref => this.modalRef = ref}
            onSave={this.handleSaveBook}
        />
        
        {/* 5. PDF Review Modal */}
        {this.state.showReviewModal && this.state.reviewBook && (
            <PDFReviewModal 
                book={this.state.reviewBook}
                onClose={this.closeReviewMode}
            />
        )}

        {/* 5.5. Plyr Custom Video Player Modal */}
        {this.state.showVideoModal && this.state.videoBook && (
            <VideoPlayerModal 
                book={this.state.videoBook}
                onClose={this.closeVideoPlayer}
            />
        )}

        {/* 6. Custom Delete Confirmation Modal */}
        {this.state.showDeleteModal && this.state.deleteBook && (
          <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered" role="document" style={{ maxWidth: '400px' }}>
              <div className="modal-content" style={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
                <div className="modal-body text-center p-5">
                  <div className="mb-4" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#fff5f5', color: '#ff4d4f' }}>
                    <i className="la la-exclamation-triangle" style={{ fontSize: '36px' }}></i>
                  </div>
                  <h4 style={{ fontWeight: '700', color: '#1f1f1f', marginBottom: '12px' }}>Delete Resource?</h4>
                  <p style={{ color: '#595959', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px 0' }}>
                    Are you sure you want to delete <strong>{this.state.deleteBook.title}</strong>?<br />
                    This will remove the item and its resources immediately.
                  </p>
                  <div className="d-flex justify-content-center" style={{ gap: '12px' }}>
                    <button 
                      type="button" 
                      className="btn btn-light" 
                      onClick={this.closeDeleteModal}
                      disabled={this.state.isDeleting}
                      style={{ borderRadius: '8px', padding: '10px 20px', fontWeight: '600', minWidth: '100px', backgroundColor: '#f0f0f0', border: 'none', color: '#595959', opacity: this.state.isDeleting ? 0.6 : 1 }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-danger d-flex align-items-center justify-content-center" 
                      onClick={this.confirmDeleteBook}
                      disabled={this.state.isDeleting}
                      style={{ borderRadius: '8px', padding: '10px 20px', fontWeight: '600', minWidth: '100px', backgroundColor: '#ff4d4f', border: 'none', color: '#ffffff', opacity: this.state.isDeleting ? 0.8 : 1 }}
                    >
                      {this.state.isDeleting ? (
                        <>
                          <i className="la la-spinner la-spin mr-2"></i> Deleting...
                        </>
                      ) : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default LibraryList;