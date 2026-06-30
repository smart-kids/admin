import React from "react";
import "./Library.css";
import { query } from "../../utils/requests";

const $ = window.$;

// Generate a unique ID for the modal
const MODAL_ID = "pdf_review_modal_" + Math.random().toString(36).substr(2, 9);

class PDFReviewModal extends React.Component {
  
  state = {
    analyticsEvents: [],
    analyticsLoading: true
  };

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

  timeAgo = (timestamp) => {
    const time = Number(timestamp) || Date.now();
    const diff = Math.floor((Date.now() - time) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  renderAnalyticsCol() {
    const { book } = this.props;
    const analyticsEvents = book.readEvents || [];
    
    const totalReads = analyticsEvents.length;
    const totalTimeSpent = analyticsEvents.reduce((acc, ev) => {
      const props = typeof ev.properties === 'string' ? JSON.parse(ev.properties) : (ev.properties || {});
      return acc + (props.durationSeconds || 0);
    }, 0);
    const totalMins = Math.round(totalTimeSpent / 60);

    return (
      <div style={{ flex: '0 0 320px', borderLeft: '1px solid #eee', padding: '1.5rem', backgroundColor: '#fff', overflowY: 'auto' }}>
        <h6 className="font-weight-bold mb-3">Metrics & Access Log</h6>
        <div className="d-flex justify-content-between mb-4 bg-light p-3 rounded">
          <div className="text-center"><span className="font-weight-bold h3 text-primary">{totalReads}</span><br/><small className="text-muted font-weight-bold">Total Views</small></div>
          <div className="text-center"><span className="font-weight-bold h3 text-primary">{totalMins}m</span><br/><small className="text-muted font-weight-bold">Total Time</small></div>
        </div>
        <h6 className="font-size-sm font-weight-bold text-muted mb-3">STUDENT ACCESS</h6>
        <div>
          {analyticsEvents.length === 0 ? (
            <p className="text-muted small">No reads recorded yet.</p>
          ) : (
            analyticsEvents.map(ev => {
              let name = (ev.reader && ev.reader.name) ? ev.reader.name : (ev.userId || 'Anonymous');
              let role = (ev.reader && ev.reader.role) ? ev.reader.role : '';
              let children = (ev.reader && ev.reader.students && ev.reader.students.length > 0) 
                  ? ev.reader.students.map(s => s.names || s.name).join(', ') 
                  : null;

              const props = typeof ev.properties === 'string' ? JSON.parse(ev.properties) : (ev.properties || {});
              const maxPage = props.maxPageReached || 0;
              const totalPg = props.totalPages || 1;
              const percent = Math.min(100, Math.round((maxPage / totalPg) * 100));

              return (
                <div key={ev.id} className="mb-3 pb-3 border-bottom">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <div className="font-weight-bold font-size-sm" style={{flex: 1}}>
                      {name} <small className="text-muted">({role || 'Reader'})</small>
                      {children && <div className="text-muted small mt-1">Parent of: <span className="font-weight-bold">{children}</span></div>}
                    </div>
                    <div className="text-muted small" style={{whiteSpace: 'nowrap'}}>{this.timeAgo(ev.timestamp)}</div>
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <small className="text-muted"><i className="la la-clock"></i> {Math.round((props.durationSeconds || 0)/60)}m read time</small>
                    <small className="text-primary font-weight-bold">Pg {maxPage} / {totalPg}</small>
                  </div>
                  
                  <div className="progress" style={{ height: '6px', borderRadius: '3px' }}>
                    <div className="progress-bar bg-success" role="progressbar" style={{ width: `${percent}%` }} aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100"></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

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

            {/* Body - Split View */}
            <div className="modal-body p-0 d-flex" style={{height: 'calc(100% - 70px)', overflow: 'hidden'}}>
              {/* Left Side - PDF Viewer */}
              <div style={{ flex: 1, position: 'relative' }}>
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
                      borderRadius: '0 0 0 12px'
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
                      borderRadius: '0 0 0 12px'
                    }}
                    title="PDF Viewer"
                  />
                )}
              </div>
              
              {/* Right Side - Stats */}
              {this.renderAnalyticsCol()}
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
