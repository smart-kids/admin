import React from "react";
import CreatableSelect from 'react-select/creatable';
import "./Library.css"; // Ensure you have the CSS file from the previous step
import { query } from "../../utils/requests";
import Data from "../../utils/data";
import { BASE_URL } from "../../utils/config";

const $ = window.$;

// Generate a unique ID to ensure jQuery targets the correct element
const MODAL_ID = "book_modal_" + Math.random().toString(36).substr(2, 9);

class BookModal extends React.Component {
  
  // Define initial state for easy resetting
  initialState = {
    id: "",
    title: "",
    author: "",
    tags: [],
    description: "",
    type: "book", // "book" or "video"
    
    // Media Previews (URLs)
    coverUrl: "",
    pdfUrl: "",
    videoUrl: "",
    
    // File Objects (Actual files for upload)
    coverFile: null,
    pdfFile: null,
    videoFile: null,
    
    // UI State
    isUploading: false,
    isSaving: false,
    uploadProgress: 0,
    errors: {},
    analyticsEvents: [],
    analyticsLoading: false,
    allBooks: []
  };

  state = { ...this.initialState };

  componentDidMount() {
    this._subscription = Data.books.subscribe(({ books }) => {
      this.setState({ allBooks: books || [] });
    });
  }

  componentWillUnmount() {
    if (this._subscription) this._subscription();
  }

  // --- THE REQUESTED SHOW/HIDE IMPLEMENTATION ---

  async show(bookToEdit = null) {
    // 1. Logic to Populate or Reset State
    if (bookToEdit) {

      // Edit Mode: Populate state
      this.setState({
        id: bookToEdit.id || "",
        title: bookToEdit.title || "",
        author: bookToEdit.author || "",
        tags: Array.isArray(bookToEdit.tags) ? bookToEdit.tags.map(t => ({label: t, value: t})) : [],
        description: bookToEdit.description || "",
        type: bookToEdit.type || "book",
        coverUrl: bookToEdit.coverUrl || "",
        pdfUrl: bookToEdit.pdfUrl || "",
        videoUrl: bookToEdit.videoUrl || "",
        // Reset file inputs and UI state
        coverFile: null,
        pdfFile: null,
        videoFile: null,
        isUploading: false,
        isSaving: false,
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
    this.setState({ [e.target.name]: e.target.value });
  };

  handleTagsChange = (newValue) => {
    this.setState({ tags: newValue || [] });
  };

  handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      this.setState({
        coverFile: file,
        coverUrl: URL.createObjectURL(file),
        errors: { ...this.state.errors, cover: null }
      });
    }
  };

  handlePdfSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      this.setState({
        pdfFile: file,
        pdfUrl: URL.createObjectURL(file),
        errors: { ...this.state.errors, pdf: null }
      });
    }
  };

  handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      this.setState({
        videoFile: file,
        videoUrl: URL.createObjectURL(file),
        errors: { ...this.state.errors, video: null }
      });
    }
  };

  removeCover = () => {
    this.setState({ coverFile: null, coverUrl: "" });
  };

  removePdf = () => {
    this.setState({ pdfFile: null, pdfUrl: "" });
  };

  removeVideo = () => {
    this.setState({ videoFile: null, videoUrl: "" });
  };

  validate = () => {
    const errors = {};
    if (!this.state.title) errors.title = "Title is required";
    if (!this.state.author) errors.author = "Author/Creator is required";
    
    // Ensure we have either an existing URL or a new File
    if (!this.state.coverUrl && !this.state.coverFile) errors.cover = "Cover image is required";
    
    if (this.state.type === "book") {
      if (!this.state.pdfUrl && !this.state.pdfFile) errors.pdf = "PDF file is required";
    } else if (this.state.type === "video") {
      if (!this.state.videoUrl && !this.state.videoFile) errors.video = "Video file is required";
    }

    this.setState({ errors });
    return Object.keys(errors).length === 0;
  };

  uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    
    const UPLOAD_URL = `https://graph-ongyy.kinsta.app/upload`;

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
      let finalVideoUrl = this.state.videoUrl;

      // 1. Upload Cover Image (prioritize raw selected file first)
      if (this.state.coverFile) {
        this.setState({ uploadProgress: 30 });
        finalCoverUrl = await this.uploadFile(this.state.coverFile);
      } else if (finalCoverUrl && finalCoverUrl.startsWith('blob:')) {
        this.setState({ uploadProgress: 20 });
        try {
          const blobResponse = await fetch(finalCoverUrl);
          const blob = await blobResponse.blob();
          const file = new File([blob], "cover_image.png", { type: blob.type || "image/png" });
          finalCoverUrl = await this.uploadFile(file);
        } catch (err) {
          console.error("Defensive blob cover upload failed:", err);
        }
      } else if (finalCoverUrl && finalCoverUrl.startsWith('data:')) {
        this.setState({ uploadProgress: 25 });
        try {
          const arr = finalCoverUrl.split(',');
          const mime = arr[0].match(/:(.*?);/)[1];
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const file = new File([u8arr], "cover_image.png", { type: mime });
          finalCoverUrl = await this.uploadFile(file);
        } catch (err) {
          console.error("Defensive base64 cover upload failed:", err);
        }
      }

      // 2. Upload PDF Document (prioritize raw selected file first)
      if (this.state.type === "book") {
        if (this.state.pdfFile) {
          this.setState({ uploadProgress: 70 });
          finalPdfUrl = await this.uploadFile(this.state.pdfFile);
        } else if (finalPdfUrl && finalPdfUrl.startsWith('blob:')) {
          this.setState({ uploadProgress: 60 });
          try {
            const blobResponse = await fetch(finalPdfUrl);
            const blob = await blobResponse.blob();
            const file = new File([blob], "book_document.pdf", { type: blob.type || "application/pdf" });
            finalPdfUrl = await this.uploadFile(file);
          } catch (err) {
            console.error("Defensive blob PDF upload failed:", err);
          }
        } else if (finalPdfUrl && finalPdfUrl.startsWith('data:')) {
          this.setState({ uploadProgress: 65 });
          try {
            const arr = finalPdfUrl.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
              u8arr[n] = bstr.charCodeAt(n);
            }
            const file = new File([u8arr], "book_document.pdf", { type: mime });
            finalPdfUrl = await this.uploadFile(file);
          } catch (err) {
            console.error("Defensive base64 PDF upload failed:", err);
          }
        }
      }

      // 3. Upload Video Asset (prioritize raw selected file first)
      if (this.state.type === "video") {
        if (this.state.videoFile) {
          this.setState({ uploadProgress: 70 });
          finalVideoUrl = await this.uploadFile(this.state.videoFile);
        } else if (finalVideoUrl && finalVideoUrl.startsWith('blob:')) {
          this.setState({ uploadProgress: 60 });
          try {
            const blobResponse = await fetch(finalVideoUrl);
            const blob = await blobResponse.blob();
            const file = new File([blob], "video_asset.mp4", { type: blob.type || "video/mp4" });
            finalVideoUrl = await this.uploadFile(file);
          } catch (err) {
            console.error("Defensive blob Video upload failed:", err);
          }
        } else if (finalVideoUrl && finalVideoUrl.startsWith('data:')) {
          this.setState({ uploadProgress: 65 });
          try {
            const arr = finalVideoUrl.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
              u8arr[n] = bstr.charCodeAt(n);
            }
            const file = new File([u8arr], "video_asset.mp4", { type: mime });
            finalVideoUrl = await this.uploadFile(file);
          } catch (err) {
            console.error("Defensive base64 Video upload failed:", err);
          }
        }
      }

      this.setState({ uploadProgress: 100, isSaving: true });

      // --- Prepare Data ---
      const bookData = {
        id: this.state.id,
        title: this.state.title,
        author: this.state.author,
        tags: this.state.tags.map(t => t.value),
        description: this.state.description,
        type: this.state.type,
        coverUrl: finalCoverUrl,
        pdfUrl: this.state.type === "book" ? finalPdfUrl : "",
        videoUrl: this.state.type === "video" ? finalVideoUrl : "",
      };

      // Save and Await success
      await this.props.onSave(bookData);
      
      // Cleanup and close
      this.setState({ isUploading: false, isSaving: false });
      this.hide();
    } catch (error) {
      console.error("Save/Upload error:", error);
      this.setState({ 
        isUploading: false, 
        isSaving: false,
        errors: { ...this.state.errors, submit: error.message || "Failed to save book. Please check fields and try again." } 
      });
    }
  };

  render() {
    const { errors, isUploading, isSaving, uploadProgress, type, coverUrl, pdfUrl, pdfFile, videoUrl, videoFile, id } = this.state;
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
        <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
          <div className="modal-content border-0 shadow-lg" style={{borderRadius: '16px'}}>
            
            {/* Header */}
            <div className="modal-header">
              <h5 className="modal-title font-weight-bold" id="bookModalLabel">
                {isEdit ? (type === "video" ? "Edit Video" : "Edit Book") : (type === "video" ? "Add New Video" : "Add New Book")}
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
                  <div className="form-group mb-4">
                    <label className="font-weight-bold text-muted uppercase font-size-xs">Resource Type *</label>
                    <div className="d-flex" style={{ gap: '10px' }}>
                      <button
                        type="button"
                        className={`btn flex-fill font-weight-bold d-flex align-items-center justify-content-center py-2 ${type === 'book' ? 'btn-primary shadow-sm' : 'btn-outline-secondary'}`}
                        onClick={() => this.setState({ type: 'book', errors: {} })}
                        disabled={isUploading || isSaving}
                        style={{ borderRadius: '10px', fontSize: '13px' }}
                      >
                        <i className="la la-book mr-2" style={{ fontSize: '16px' }}></i> Book Document
                      </button>
                      <button
                        type="button"
                        className={`btn flex-fill font-weight-bold d-flex align-items-center justify-content-center py-2 ${type === 'video' ? 'btn-primary shadow-sm' : 'btn-outline-secondary'}`}
                        onClick={() => this.setState({ type: 'video', errors: {} })}
                        disabled={isUploading || isSaving}
                        style={{ borderRadius: '10px', fontSize: '13px' }}
                      >
                        <i className="la la-video-camera mr-2" style={{ fontSize: '16px' }}></i> Video Lesson
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="font-weight-bold">{type === 'video' ? 'Video Title *' : 'Book Title *'}</label>
                    <input
                      type="text"
                      className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                      name="title"
                      value={this.state.title}
                      onChange={this.handleChange}
                      placeholder={type === 'video' ? "e.g. Introduction to Calculus" : "e.g. Advanced Physics"}
                      disabled={isUploading}
                    />
                    {errors.title && <small className="text-danger">{errors.title}</small>}
                  </div>

                  <div className="row">
                    <div className="col-md-6 form-group">
                      <label className="font-weight-bold">{type === 'video' ? 'Creator / Instructor *' : 'Author *'}</label>
                      <input
                        type="text"
                        className={`form-control ${errors.author ? 'is-invalid' : ''}`}
                        name="author"
                        value={this.state.author}
                        onChange={this.handleChange}
                        placeholder={type === 'video' ? "Instructor Name" : "Author Name"}
                        disabled={isUploading}
                      />
                      {errors.author && <small className="text-danger">{errors.author}</small>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="font-weight-bold">Tags</label>
                    <CreatableSelect
                        isMulti
                        name="tags"
                        value={this.state.tags}
                        onChange={this.handleTagsChange}
                        placeholder="Select or type to create tags..."
                        className="basic-multi-select"
                        classNamePrefix="select"
                        isDisabled={isUploading}
                        options={Array.from(new Set(
                          (this.state.allBooks || [])
                            .flatMap(b => Array.isArray(b.tags) ? b.tags : [])
                            .map(t => typeof t === 'string' ? t.trim() : '')
                            .filter(Boolean)
                        )).map(t => ({label: t, value: t}))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="font-weight-bold">Description</label>
                    <textarea
                      className="form-control"
                      name="description"
                      value={this.state.description}
                      onChange={this.handleChange}
                      rows="4"
                      placeholder={type === 'video' ? "Short summary of the video lesson..." : "Short summary of the book..."}
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

                  {type === "book" ? (
                    /* PDF Zone */
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
                  ) : (
                    /* Video Zone */
                    <div className="media-section">
                      <label className="font-weight-bold">Lesson Video *</label>
                      {videoUrl ? (
                        <div className="pdf-preview-card" style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
                          <i className="la la-video-camera text-primary" style={{ fontSize: '24px', marginRight: '12px' }}></i>
                          <div className="pdf-info">
                            <div className="pdf-name">
                              {videoFile ? videoFile.name : (videoUrl.startsWith('http') ? "Existing Video" : videoUrl)}
                            </div>
                            <div className="pdf-size">
                              {videoFile ? (videoFile.size / 1024 / 1024).toFixed(2) + " MB" : "Linked File"}
                            </div>
                          </div>
                          {!isUploading && (
                            <button className="btn btn-sm btn-light text-danger" onClick={this.removeVideo}>
                              <i className="la la-times"></i>
                            </button>
                          )}
                        </div>
                      ) : (
                        <label className={`upload-zone ${errors.video ? 'is-error' : ''}`} style={{ minHeight: '120px' }}>
                          <input type="file" accept="video/*" hidden onChange={this.handleVideoSelect} />
                          <i className="la la-video-camera upload-icon"></i>
                          <span className="upload-text">Upload Video</span>
                          <span className="upload-subtext">MP4, WebM (Max 100MB)</span>
                        </label>
                      )}
                      {errors.video && <small className="text-danger">{errors.video}</small>}
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer bg-light flex-column align-items-stretch">
              {errors.submit && (
                <div className="alert alert-danger w-100 mb-3 py-2 px-3 font-size-sm d-flex align-items-center" role="alert" style={{borderRadius: '8px'}}>
                  <i className="la la-exclamation-circle mr-2" style={{fontSize: '18px'}}></i>
                  <span>{errors.submit}</span>
                </div>
              )}
              
              <div className="d-flex align-items-center justify-content-end w-100">
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
                ) : isSaving ? (
                  <button type="button" className="btn btn-primary font-weight-bold px-4 d-flex align-items-center justify-content-center" disabled>
                    <i className="la la-spinner la-spin mr-2"></i> Saving...
                  </button>
                ) : (
                  <>
                    <button type="button" className="btn btn-secondary font-weight-bold mr-2" onClick={() => this.hide()}>
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
      </div>
    );
  }
}

export default BookModal;