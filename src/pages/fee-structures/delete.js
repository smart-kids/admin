import React from "react";
import Data from "../../utils/data";

const $ = window.$;
const MODAL_ID = "fee-structure-delete-modal-" + Math.random().toString().split(".")[1];

class DeleteModal extends React.Component {
  show = () => {
    $("#" + MODAL_ID).modal({
      show: true,
      backdrop: "static",
      keyboard: false
    });
  };

  hide = () => {
    $("#" + MODAL_ID).modal("hide");
  };

  handleDelete = () => {
    const { remove, save } = this.props;
    if (remove) {
      save(remove);
      this.hide();
    }
  };

  render() {
    const { remove } = this.props;

    return (
      <>
        <style>{`
          .modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1050;
          }
          .modal .modal-dialog {
            max-width: 500px;
            width: 90%;
            margin: 0;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            animation: modalSlideIn 0.3s ease-out;
          }
          .modal .modal-content {
            border: none;
            border-radius: 8px;
            background: #ffffff;
          }
          .modal .modal-header {
            border-bottom: 1px solid #e5e7eb;
            padding: 1.5rem 2rem;
            background: #ffffff;
            color: #374151;
            border-radius: 8px 8px 0 0;
          }
          .modal .modal-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin: 0;
            color: #374151;
          }
          .modal .close {
            color: #6b7280;
            opacity: 0.8;
            font-size: 1.5rem;
            transition: opacity 0.2s;
          }
          .modal .close:hover {
            opacity: 1;
            color: #374151;
          }
          .modern-modal .modal-body {
            padding: 2rem;
          }
          .modern-modal .delete-content {
            text-align: center;
            padding: 1rem 0;
          }
          .modern-modal .delete-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 1.5rem;
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5rem;
            color: #ef4444;
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          .modern-modal .delete-message {
            font-size: 1.125rem;
            color: #374151;
            margin-bottom: 2rem;
            font-weight: 500;
          }
          .modern-modal .details-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin-bottom: 2rem;
            background: #f9fafb;
            padding: 1.5rem;
            border-radius: 12px;
            border: 2px solid #e5e7eb;
          }
          .modern-modal .detail-item {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }
          .modern-modal .detail-label {
            font-size: 0.75rem;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.025em;
          }
          .modern-modal .detail-value {
            font-size: 0.875rem;
            font-weight: 500;
            color: #111827;
          }
          .modern-modal .warning-box {
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
            border: 2px solid #fca5a5;
            border-radius: 12px;
            padding: 1.25rem;
            margin-bottom: 1.5rem;
          }
          .modern-modal .warning-title {
            font-weight: 600;
            color: #dc2626;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .modern-modal .warning-text {
            color: #991b1b;
            font-size: 0.875rem;
            line-height: 1.5;
          }
          .modern-modal .modal-footer {
            border-top: 1px solid #e5e7eb;
            padding: 1.5rem 2rem;
            background: #f9fafb;
            border-radius: 0 0 16px 16px;
            display: flex;
            justify-content: center;
            gap: 1rem;
          }
          .modern-modal .btn {
            padding: 0.75rem 2rem;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.875rem;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
            text-transform: uppercase;
            letter-spacing: 0.025em;
            min-width: 140px;
          }
          .modern-modal .btn-secondary {
            background: #6b7280;
            color: white;
          }
          .modern-modal .btn-secondary:hover {
            background: #4b5563;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
          }
          .modern-modal .btn-danger {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
          }
          .modern-modal .btn-danger:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
          }
          .modern-modal .badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
          }
          .modern-modal .badge-success {
            background: #d1fae5;
            color: #065f46;
          }
          .modern-modal .badge-warning {
            background: #fef3c7;
            color: #92400e;
          }
          @keyframes modalSlideIn {
            from {
              opacity: 0;
              transform: translateY(-50px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          @media (max-width: 768px) {
            .modern-modal .details-grid {
              grid-template-columns: 1fr;
              gap: 0.75rem;
            }
            .modern-modal .modal-dialog {
              width: 95%;
              margin: 1rem;
            }
            .modern-modal .modal-header,
            .modern-modal .modal-body,
            .modern-modal .modal-footer {
              padding: 1.5rem;
            }
            .modern-modal .btn {
              min-width: 120px;
              padding: 0.75rem 1.5rem;
            }
          }
        `}</style>
        
        <div
          className="modal fade"
          id={MODAL_ID}
          tabIndex="-1"
          role="dialog"
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="exampleModalLabel">
                  <span className="icon">!</span>
                  Delete Fee Structure
                </h5>
                <button
                  type="button"
                  className="close"
                  data-dismiss="modal"
                  aria-label="Close"
                  onClick={this.hide}
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                {remove && (
                  <div className="delete-content">
                    <div className="delete-icon">
                      <i className="la la-trash"></i>
                    </div>
                    <p className="delete-message">
                      Are you sure you want to delete this fee structure?
                    </p>
                    
                    <div className="details-grid">
                      <div className="detail-item">
                        <span className="detail-label">Fee Type</span>
                        <span className="detail-value">{remove.feeType}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Amount</span>
                        <span className="detail-value">KES {Number(remove.amount).toLocaleString()}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Class</span>
                        <span className="detail-value">{remove.class?.name || "N/A"}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Term</span>
                        <span className="detail-value">{remove.term?.name || "N/A"}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Required</span>
                        <span className="detail-value">
                          <span className={`badge ${remove.isRequired ? 'badge-warning' : 'badge-success'}`}>
                            {remove.isRequired ? 'Yes' : 'No'}
                          </span>
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Active</span>
                        <span className="detail-value">
                          <span className={`badge ${remove.isActive ? 'badge-success' : 'badge-warning'}`}>
                            {remove.isActive ? 'Yes' : 'No'}
                          </span>
                        </span>
                      </div>
                    </div>
                    
                    {remove.description && (
                      <div className="detail-item" style={{marginBottom: '1.5rem'}}>
                        <span className="detail-label">Description</span>
                        <span className="detail-value">{remove.description}</span>
                      </div>
                    )}
                    
                    <div className="warning-box">
                      <div className="warning-title">
                        <i className="la la-exclamation-triangle"></i>
                        Warning: Irreversible Action
                      </div>
                      <div className="warning-text">
                        This action cannot be undone. Deleting this fee structure will permanently remove it from the system and may affect existing payment records.
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={this.hide}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={this.handleDelete}
                >
                  Delete Fee Structure
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default React.forwardRef((props, ref) => {
  const modalRef = React.useRef();
  React.useImperativeHandle(ref, () => ({
    show: () => modalRef.current?.show(),
    hide: () => modalRef.current?.hide()
  }));
  
  return <DeleteModal {...props} ref={modalRef} />;
});
