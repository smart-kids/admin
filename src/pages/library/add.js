import React from "react";
import "./Library.css"; // Ensure you have the CSS file from the previous step

const $ = window.$;

// Generate a unique ID to ensure jQuery targets the correct element
const MODAL_ID = "book_modal_" + Math.random().toString(36).substr(2, 9);

class BookModal extends React.Component {
  
  // Define initial state for easy resetting
  initialState = {
    id: "",
    title: "",
    author: "",
    category: "Science",
    description: "",
    
    // Media Previews (URLs)
    coverUrl: "",
    pdfUrl: "",
    
    // File Objects (Actual files for upload)
    coverFile: null,
    pdfFile: null,
    
    // UI State
    isUploading: false,
    uploadProgress: 0,
    errors: {}
  };

  state = { ...this.initialState };

  componentDidMount() {
    // Initialize jQuery validation or specific modal events if needed here
    // But for this setup, the logic is largely in show()
  }

  // --- THE REQUESTED SHOW/HIDE IMPLEMENTATION ---

  show(bookToEdit = null) {
    // 1. Logic to Populate or Reset State
    if (bookToEdit) {
      // Edit Mode: Populate state
      this.setState({
        id: bookToEdit.id || "",
        title: bookToEdit.title || "",
        author: bookToEdit.author || "",
        category: bookToEdit.category || "Science",
        description: bookToEdit.description || "",
        coverUrl: bookToEdit.coverUrl || "",
        pdfUrl: bookToEdit.pdfUrl || "",
        // Reset file inputs and UI state
        coverFile: null,
        pdfFile: null,
        isUploading: false,
        uploadProgress: 0,
        errors: {}
      });
    } else {
      // Add Mode: Reset to clean state
      this.setState(this.initialState);
    }

    // 2. jQuery / Bootstrap Modal Trigger
    $("#" + MODAL_ID).modal({
      show: true,
      backdrop: "static",
      keyboard: false
    });
  }

  hide() {
    $("#" + MODAL_ID).modal("hide");
  }

  // --- Form Handling & Logic ---

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value, errors: {} });
  };

  handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Convert image to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target.result;
        this.setState({
          coverFile: file,
          coverUrl: base64String,
          errors: { ...this.state.errors, cover: null }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  handlePdfSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Convert PDF to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target.result;
        this.setState({
          pdfFile: file,
          pdfUrl: base64String,
          errors: { ...this.state.errors, pdf: null }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  removeCover = () => {
    this.setState({ coverFile: null, coverUrl: "" });
  };

  removePdf = () => {
    this.setState({ pdfFile: null, pdfUrl: "" });
  };

  validate = () => {
    const errors = {};
    if (!this.state.title) errors.title = "Title is required";
    if (!this.state.author) errors.author = "Author is required";
    
    // Ensure we have either an existing URL or a new File
    if (!this.state.coverUrl && !this.state.coverFile) errors.cover = "Cover image is required";
    if (!this.state.pdfUrl && !this.state.pdfFile) errors.pdf = "PDF file is required";

    this.setState({ errors });
    return Object.keys(errors).length === 0;
  };

  uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    
    const UPLOAD_URL = window.location.href.includes('localhost')
      ? 'http://localhost:4001/api/upload'
      : 'https://graph-ongyy.kinsta.app/api/upload';

    const response = await fetch(UPLOAD_URL, {
      method: "POST",
      body: formData
    });
    
    if (!response.ok) {
      throw new Error("Upload failed");
    }
    
    const data = await response.json();
    return data.url; // Returns Sevalla public URL
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    if (!this.validate()) return;

    this.setState({ isUploading: true, uploadProgress: 10 });

    try {
      let finalCoverUrl = this.state.coverUrl;
      let finalPdfUrl = this.state.pdfUrl;

      // Upload Cover if it's a new file
      if (this.state.coverFile) {
        this.setState({ uploadProgress: 30 });
        finalCoverUrl = await this.uploadFile(this.state.coverFile);
      }

      // Upload PDF if it's a new file
      if (this.state.pdfFile) {
        this.setState({ uploadProgress: 70 });
        finalPdfUrl = await this.uploadFile(this.state.pdfFile);
      }

      this.setState({ uploadProgress: 100 });

      // --- Prepare Data ---
      const bookData = {
        id: this.state.id,
        title: this.state.title,
        author: this.state.author,
        category: this.state.category,
        description: this.state.description,
        coverUrl: finalCoverUrl,
        pdfUrl: finalPdfUrl,
      };

      // Save
      this.props.onSave(bookData);
      
      // Cleanup
      this.setState({ isUploading: false });
      this.hide();
    } catch (error) {
      console.error("Upload error:", error);
      this.setState({ 
        isUploading: false, 
        errors: { ...this.state.errors, submit: "Failed to upload files. Please try again." } 
      });
    }
  };

  render() {
    const { errors, isUploading, uploadProgress, coverUrl, pdfUrl, pdfFile, id } = this.state;
    const isEdit = !!id;

    return (
      <div
        className="modal fade"
        id={MODAL_ID}
        tabIndex={-1}
        role="dialog"
        aria-labelledby="bookModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
          <div className="modal-content border-0 shadow-lg" style={{borderRadius: '16px'}}>
            
            {/* Header */}
            <div className="modal-header">
              <h5 className="modal-title font-weight-bold" id="bookModalLabel">
                {isEdit ? "Edit Book" : "Add New Book"}
              </h5>
              {!isUploading && (
                  <button type="button" className="close" onClick={() => this.hide()}>
                    <span aria-hidden="true">&times;</span>
                  </button>
              )}
            </div>

            {/* Body */}
            <div className="modal-body p-4">
              <div className="modal-split-layout">
                
                {/* --- LEFT: Metadata --- */}
                <div className="modal-left-col">
                  <div className="form-group">
                    <label className="font-weight-bold">Book Title *</label>
                    <input
                      type="text"
                      className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                      name="title"
                      value={this.state.title}
                      onChange={this.handleChange}
                      placeholder="e.g. Advanced Physics"
                      disabled={isUploading}
                    />
                    {errors.title && <small className="text-danger">{errors.title}</small>}
                  </div>

                  <div className="row">
                    <div className="col-md-6 form-group">
                      <label className="font-weight-bold">Author *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.author ? 'is-invalid' : ''}`}
                        name="author"
                        value={this.state.author}
                        onChange={this.handleChange}
                        placeholder="Author Name"
                        disabled={isUploading}
                      />
                    </div>
                    <div className="col-md-6 form-group">
                      <label className="font-weight-bold">Category</label>
                      <select
                        className="form-control"
                        name="category"
                        value={this.state.category}
                        onChange={this.handleChange}
                        disabled={isUploading}
                      >
                        <option value="Science">Science</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="History">History</option>
                        <option value="Storybooks">Storybooks</option>
                        <option value="Geography">Geography</option>
                        <option value="Languages">Languages</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="font-weight-bold">Description</label>
                    <textarea
                      className="form-control"
                      name="description"
                      value={this.state.description}
                      onChange={this.handleChange}
                      rows="4"
                      placeholder="Short summary of the book..."
                      disabled={isUploading}
                    />
                  </div>
                </div>

                {/* --- RIGHT: Media Uploads --- */}
                <div className="modal-right-col">
                  
                  {/* Cover Image Zone */}
                  <div className="media-section">
                    <label className="font-weight-bold">Cover Image *</label>
                    {coverUrl ? (
                      <div className="cover-preview-wrapper">
                        <img src={coverUrl} alt="Preview" className="cover-preview-img" />
                        {!isUploading && (
                          <button className="remove-btn-overlay" onClick={this.removeCover}>
                            <i className="la la-trash"></i>
                          </button>
                        )}
                      </div>
                    ) : (
                      <label className={`upload-zone ${errors.cover ? 'is-error' : ''}`}>
                        <input type="file" accept="image/*" hidden onChange={this.handleImageSelect} />
                        <i className="la la-image upload-icon"></i>
                        <span className="upload-text">Upload Cover</span>
                        <span className="upload-subtext">JPG, PNG (Max 5MB)</span>
                      </label>
                    )}
                    {errors.cover && <small className="text-danger">{errors.cover}</small>}
                  </div>

                  {/* PDF Zone */}
                  <div className="media-section">
                    <label className="font-weight-bold">Book PDF *</label>
                    {pdfUrl ? (
                      <div className="pdf-preview-card">
                        <i className="la la-file-pdf pdf-icon"></i>
                        <div className="pdf-info">
                          <div className="pdf-name">
                            {pdfFile ? pdfFile.name : (pdfUrl.startsWith('http') ? "Existing PDF" : pdfUrl)}
                          </div>
                          <div className="pdf-size">
                            {pdfFile ? (pdfFile.size / 1024 / 1024).toFixed(2) + " MB" : "Linked File"}
                          </div>
                        </div>
                        {!isUploading && (
                          <button className="btn btn-sm btn-light text-danger" onClick={this.removePdf}>
                            <i className="la la-times"></i>
                          </button>
                        )}
                      </div>
                    ) : (
                      <label className={`upload-zone ${errors.pdf ? 'is-error' : ''}`} style={{ minHeight: '120px' }}>
                        <input type="file" accept="application/pdf" hidden onChange={this.handlePdfSelect} />
                        <i className="la la-file-pdf upload-icon"></i>
                        <span className="upload-text">Upload PDF</span>
                      </label>
                    )}
                    {errors.pdf && <small className="text-danger">{errors.pdf}</small>}
                  </div>

                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer bg-light">
              {isUploading ? (
                <div className="w-100 d-flex align-items-center">
                  <div className="progress w-100 mr-3" style={{height: '10px', borderRadius: '5px'}}>
                    <div 
                        className="progress-bar bg-primary progress-bar-striped progress-bar-animated" 
                        style={{width: `${uploadProgress}%`}}
                    ></div>
                  </div>
                  <small className="text-muted font-weight-bold">Uploading...</small>
                </div>
              ) : (
                <>
                  <button type="button" className="btn btn-secondary font-weight-bold" onClick={() => this.hide()}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-primary font-weight-bold px-4" onClick={this.handleSubmit}>
                    {isEdit ? "Save Changes" : "Save & Publish"}
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  }
}

export default BookModal;