import React from "react";
import "./Library.css";

const $ = window.$;

// Generate a unique ID for the modal
const MODAL_ID = "pdf_review_modal_" + Math.random().toString(36).substr(2, 9);

class PDFReviewModal extends React.Component {
  
  componentDidMount() {
    // Show modal when component mounts
    $("#" + MODAL_ID).modal({
      show: true,
      backdrop: "static",
      keyboard: false
    });
  }

  componentWillUnmount() {
    // Ensure modal is hidden when component unmounts
    $("#" + MODAL_ID).modal("hide");
  }

  handleClose = () => {
    $("#" + MODAL_ID).modal("hide");
    this.props.onClose();
  };

  getPDFUrl = () => {
    const { book } = this.props;
    
    if (!book.pdfUrl) return null;
    
    // If it's already a base64 data URL, return as is
    if (book.pdfUrl.startsWith('data:application/pdf;base64,')) {
      return book.pdfUrl;
    }
    
    // If it's a regular URL, return as is
    return book.pdfUrl;
  };

  render() {
    const { book } = this.props;
    const pdfUrl = this.getPDFUrl();

    if (!book || !pdfUrl) {
      return (
        <div className="modal fade" id={MODAL_ID} tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">PDF Review</h5>
                <button type="button" className="close" onClick={this.handleClose}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body text-center">
                <p>No PDF available for this book.</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className="modal fade"
        id={MODAL_ID}
        tabIndex="-1"
        role="dialog"
        aria-labelledby="pdfReviewModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-xl modal-dialog-centered" role="document">
          <div className="modal-content border-0 shadow-lg" style={{borderRadius: '12px', height: '90vh'}}>
            
            {/* Header */}
            <div className="modal-header bg-light border-bottom">
              <div className="d-flex align-items-center flex-grow-1">
                <i className="la la-file-pdf text-danger mr-2" style={{fontSize: '1.5rem'}}></i>
                <div>
                  <h5 className="modal-title mb-0" id="pdfReviewModalLabel">
                    {book.title}
                  </h5>
                  <small className="text-muted">by {book.author}</small>
                </div>
              </div>
              <button type="button" className="close" onClick={this.handleClose}>
                <span aria-hidden="true">&times;</span>
              </button>
            </div>

            {/* Body - PDF Viewer */}
            <div className="modal-body p-0" style={{height: 'calc(100% - 70px)', overflow: 'hidden'}}>
              {pdfUrl.startsWith('data:application/pdf;base64,') ? (
                // For base64 PDFs, create blob URL
                <iframe
                  src={URL.createObjectURL(
                    new Blob(
                      [Uint8Array.from(atob(pdfUrl.split(',')[1]), c => c.charCodeAt(0))],
                      { type: 'application/pdf' }
                    )
                  )}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    borderRadius: '0 0 12px 12px'
                  }}
                  title="PDF Viewer"
                />
              ) : (
                // For regular URLs
                <iframe
                  src={pdfUrl}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    borderRadius: '0 0 12px 12px'
                  }}
                  title="PDF Viewer"
                />
              )}
            </div>

            {/* Footer - Action Buttons */}
            <div className="modal-footer bg-light border-top">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={this.handleClose}
              >
                <i className="la la-times mr-1"></i>
                Close
              </button>
              
              <a
                href={pdfUrl}
                download={`${book.title.replace(/[^a-z0-9]/gi, '_')}.pdf`}
                className="btn btn-primary"
                style={{textDecoration: 'none'}}
              >
                <i className="la la-download mr-1"></i>
                Download
              </a>
            </div>

          </div>
        </div>
      </div>
    );
  }
}

export default PDFReviewModal;
