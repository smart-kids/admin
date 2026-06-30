import React from "react";
import CreatableSelect from 'react-select/creatable';
import "./Library.css"; // Uses the CSS defined above

class BookModal extends React.Component {
  state = {
    id: "",
    title: "",
    author: "",
    tags: [],
    coverUrl: "",
    pdfUrl: "",
    description: "",
    errors: {}
  };

  componentDidMount() {
    // If a book prop is passed, we are in EDIT mode
    if (this.props.book) {
      const { id, title, author, tags, coverUrl, pdfUrl, description } = this.props.book;
      this.setState({
        id: id || "",
        title: title || "",
        author: author || "",
        tags: Array.isArray(tags) ? tags.map(t => ({label: t, value: t})) : [],
        coverUrl: coverUrl || "",
        pdfUrl: pdfUrl || "",
        description: description || ""
      });
    }
  }

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value, errors: {} });
  };

  handleTagsChange = (newValue) => {
    this.setState({ tags: newValue || [] });
  };

  validate = () => {
    const errors = {};
    if (!this.state.title) errors.title = "Title is required";
    if (!this.state.author) errors.author = "Author is required";
    if (!this.state.pdfUrl) errors.pdfUrl = "PDF URL is required";
    this.setState({ errors });
    return Object.keys(errors).length === 0;
  };

  handleSubmit = (e) => {
    e.preventDefault();
    if (!this.validate()) return;

    const bookData = {
      id: this.state.id, // Will be empty string if adding
      title: this.state.title,
      author: this.state.author,
      tags: this.state.tags.map(t => t.value),
      coverUrl: this.state.coverUrl,
      pdfUrl: this.state.pdfUrl,
      description: this.state.description
    };

    this.props.onSave(bookData);
  };

  render() {
    const { onClose, book } = this.props;
    const { errors } = this.state;
    const isEdit = !!book;

    return (
      <div className="custom-modal-overlay" onClick={onClose}>
        <div className="custom-modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h5 className="modal-title">{isEdit ? "Edit Book" : "Add New Book"}</h5>
            <button type="button" className="close" onClick={onClose}>
              <span>&times;</span>
            </button>
          </div>
          
          <div className="modal-body">
            <div className="row">
              <div className="col-md-6 form-group">
                <label>Title *</label>
                <input
                  type="text"
                  className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                  name="title"
                  value={this.state.title}
                  onChange={this.handleChange}
                  placeholder="e.g. Physics 101"
                />
              </div>
              <div className="col-md-6 form-group">
                <label>Author *</label>
                <input
                  type="text"
                  className={`form-control ${errors.author ? 'is-invalid' : ''}`}
                  name="author"
                  value={this.state.author}
                  onChange={this.handleChange}
                  placeholder="e.g. Isaac Newton"
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 form-group">
                <label>Tags</label>
                <CreatableSelect
                  isMulti
                  name="tags"
                  value={this.state.tags}
                  onChange={this.handleTagsChange}
                  placeholder="Select or create tags..."
                  classNamePrefix="select"
                  options={Array.from(new Set(
                    ((window.DataService && window.DataService.allData && window.DataService.allData.books) || [])
                      .flatMap(b => Array.isArray(b.tags) ? b.tags : [])
                      .map(t => typeof t === 'string' ? t.trim() : '')
                      .filter(Boolean)
                  )).map(t => ({label: t, value: t}))}
                />
              </div>
              <div className="col-md-6 form-group">
                <label>Cover Image URL</label>
                <input
                  type="text"
                  className="form-control"
                  name="coverUrl"
                  value={this.state.coverUrl}
                  onChange={this.handleChange}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="form-group">
              <label>PDF URL *</label>
              <input
                type="text"
                className={`form-control ${errors.pdfUrl ? 'is-invalid' : ''}`}
                name="pdfUrl"
                value={this.state.pdfUrl}
                onChange={this.handleChange}
                placeholder="https://..."
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                className="form-control"
                name="description"
                value={this.state.description}
                onChange={this.handleChange}
                rows="3"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={this.handleSubmit}>
              {isEdit ? "Save Changes" : "Add Book"}
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default BookModal;