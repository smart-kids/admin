import React from "react";
import Data from "../../utils/data";
import { BASE_URL } from "../../utils/config";
import "./Library.css";

const $ = window.$;

const MODAL_ID = "game_modal_" + Math.random().toString(36).substr(2, 9);

class GameModal extends React.Component {
  
  initialState = {
    id: "",
    title: "",
    developer: "",
    category: "Action",
    description: "",
    
    coverUrl: "",
    gameUrl: "",
    
    coverFile: null,
    
    isUploading: false,
    isSaving: false,
    uploadProgress: 0,
    errors: {}
  };

  state = { ...this.initialState };

  show(gameToEdit = null) {
    if (gameToEdit) {
      this.setState({
        id: gameToEdit.id || "",
        title: gameToEdit.title || "",
        developer: gameToEdit.developer || "",
        category: gameToEdit.category || "Action",
        description: gameToEdit.description || "",
        coverUrl: gameToEdit.coverUrl || "",
        gameUrl: gameToEdit.gameUrl || "",
        coverFile: null,
        isUploading: false,
        isSaving: false,
        uploadProgress: 0,
        errors: {}
      });
    } else {
      this.setState(this.initialState);
    }

    $("#" + MODAL_ID).modal({
      show: true,
      backdrop: "static",
      keyboard: false
    });
  }

  hide() {
    $("#" + MODAL_ID).modal("hide");
  }

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value, errors: {} });
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

  removeCover = () => {
    this.setState({ coverFile: null, coverUrl: "" });
  };

  validate = () => {
    const errors = {};
    if (!this.state.title) errors.title = "Title is required";
    if (!this.state.developer) errors.developer = "Developer is required";
    if (!this.state.gameUrl) errors.gameUrl = "Game Embed URL is required";
    
    if (!this.state.coverUrl && !this.state.coverFile) errors.cover = "Cover image is required";

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
    return data.url;
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    if (!this.validate()) return;

    this.setState({ isUploading: true, uploadProgress: 10 });

    try {
      let finalCoverUrl = this.state.coverUrl;

      // Prioritize raw selected file first
      if (this.state.coverFile) {
        this.setState({ uploadProgress: 50 });
        finalCoverUrl = await this.uploadFile(this.state.coverFile);
      } else if (finalCoverUrl && finalCoverUrl.startsWith('blob:')) {
        this.setState({ uploadProgress: 30 });
        try {
          const blobResponse = await fetch(finalCoverUrl);
          const blob = await blobResponse.blob();
          const file = new File([blob], "cover_image.png", { type: blob.type || "image/png" });
          finalCoverUrl = await this.uploadFile(file);
        } catch (err) {
          console.error("Defensive blob cover upload failed:", err);
        }
      } else if (finalCoverUrl && finalCoverUrl.startsWith('data:')) {
        this.setState({ uploadProgress: 40 });
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

      this.setState({ uploadProgress: 100, isSaving: true });

      const gameData = {
        id: this.state.id,
        title: this.state.title,
        developer: this.state.developer,
        category: this.state.category,
        description: this.state.description,
        coverUrl: finalCoverUrl,
        gameUrl: this.state.gameUrl,
      };

      await this.props.onSave(gameData);
      
      this.setState({ isUploading: false, isSaving: false });
      this.hide();
    } catch (error) {
      console.error("Save/Upload error:", error);
      this.setState({ 
        isUploading: false, 
        isSaving: false,
        errors: { ...this.state.errors, submit: error.message || "Failed to save game. Please try again." } 
      });
    }
  };

  render() {
    const { errors, isUploading, isSaving, uploadProgress, coverUrl, id } = this.state;
    const isEdit = !!id;

    return (
      <div
        className="modal fade"
        id={MODAL_ID}
        tabIndex={-1}
        role="dialog"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
          <div className="modal-content border-0 shadow-lg" style={{borderRadius: '16px'}}>
            
            <div className="modal-header">
              <h5 className="modal-title font-weight-bold">
                {isEdit ? "Edit Game" : "Add New Game"}
              </h5>
              {!isUploading && (
                  <button type="button" className="close" onClick={() => this.hide()}>
                    <span aria-hidden="true">&times;</span>
                  </button>
              )}
            </div>

            <div className="modal-body p-4">
              <div className="modal-split-layout">
                
                <div className="modal-left-col">
                  <div className="form-group">
                    <label className="font-weight-bold">Game Title *</label>
                    <input
                      type="text"
                      className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                      name="title"
                      value={this.state.title}
                      onChange={this.handleChange}
                      placeholder="e.g. Math Quest"
                      disabled={isUploading}
                    />
                    {errors.title && <small className="text-danger">{errors.title}</small>}
                  </div>

                  <div className="row">
                    <div className="col-md-6 form-group">
                      <label className="font-weight-bold">Developer *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.developer ? 'is-invalid' : ''}`}
                        name="developer"
                        value={this.state.developer}
                        onChange={this.handleChange}
                        placeholder="Developer Name"
                        disabled={isUploading}
                      />
                      {errors.developer && <small className="text-danger">{errors.developer}</small>}
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
                        <option value="Action">Action</option>
                        <option value="Adventure">Adventure</option>
                        <option value="Puzzle">Puzzle</option>
                        <option value="Educational">Educational</option>
                        <option value="RPG">RPG</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="font-weight-bold">itch.io Embed URL *</label>
                    <input
                      type="text"
                      className={`form-control ${errors.gameUrl ? 'is-invalid' : ''}`}
                      name="gameUrl"
                      value={this.state.gameUrl}
                      onChange={this.handleChange}
                      placeholder="https://itch.io/embed-upload/..."
                      disabled={isUploading}
                    />
                    {errors.gameUrl && <small className="text-danger">{errors.gameUrl}</small>}
                  </div>

                  <div className="form-group">
                    <label className="font-weight-bold">Description</label>
                    <textarea
                      className="form-control"
                      name="description"
                      value={this.state.description}
                      onChange={this.handleChange}
                      rows="3"
                      placeholder="Short summary of the game..."
                      disabled={isUploading}
                    />
                  </div>
                </div>

                <div className="modal-right-col">
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
                </div>
              </div>
            </div>

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

export default GameModal;