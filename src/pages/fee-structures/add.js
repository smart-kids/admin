import React from "react";
import Data from "../../utils/data";

const $ = window.$;
const MODAL_ID = "fee-structure-add-modal-" + Math.random().toString().split(".")[1];

class AddModal extends React.Component {
  state = {
    feeType: "",
    amount: "",
    description: "",
    classId: "",
    termId: "",
    isRequired: true,
    isActive: true,
  };

  show = () => {
    $("#" + MODAL_ID).modal({
      show: true,
      backdrop: "static",
      keyboard: false
    });
  };

  hide = () => {
    $("#" + MODAL_ID).modal("hide");
    this.setState({
      feeType: "",
      amount: "",
      description: "",
      classId: "",
      termId: "",
      isRequired: true,
      isActive: true,
    });
  };

  handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    this.setState({
      [name]: type === "checkbox" ? checked : value,
    });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    const { save } = this.props;

    const feeStructureData = {
      feeType: this.state.feeType,
      amount: parseFloat(this.state.amount),
      description: this.state.description,
      class: this.state.classId,
      term: this.state.termId,
      isRequired: this.state.isRequired,
      isActive: this.state.isActive,
    };

    save(feeStructureData);
    this.hide();
  };

  render() {
    const { classes, terms } = this.props;

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
            max-width: 600px;
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
          .modal .modal-body {
            padding: 2rem;
            max-height: 70vh;
            overflow-y: auto;
          }
          .modal .form-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
            margin-bottom: 1.5rem;
          }
          .modal .form-group {
            margin-bottom: 0;
          }
          .modal .form-group.full-width {
            grid-column: span 2;
          }
          .modal .form-label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: #374151;
            font-size: 0.875rem;
          }
          .modal .form-control {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 0.875rem;
            transition: all 0.2s;
            background: #ffffff;
          }
          .modal .form-control:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
          .modal .form-control::placeholder {
            color: #9ca3af;
          }
          .modal .checkbox-group {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem;
            background: #f9fafb;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
            transition: all 0.2s;
          }
          .modal .checkbox-group:hover {
            border-color: #3b82f6;
            background: #f3f4f6;
          }
          .modal .checkbox-input {
            width: 1.25rem;
            height: 1.25rem;
            border: 2px solid #d1d5db;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
          }
          .modal .checkbox-input:checked {
            background-color: #3b82f6;
            border-color: #3b82f6;
          }
          .modal .checkbox-label {
            font-weight: 500;
            color: #374151;
            cursor: pointer;
            user-select: none;
          }
          .modal .modal-footer {
            border-top: 1px solid #e5e7eb;
            padding: 1.5rem 2rem;
            background: #ffffff;
            border-radius: 0 0 8px 8px;
          }
          .modal .btn {
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            font-weight: 500;
            font-size: 0.875rem;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
          }
          .modal .btn-secondary {
            background: #f3f4f6;
            color: #374151;
            border: 1px solid #d1d5db;
          }
          .modal .btn-secondary:hover {
            background: #e5e7eb;
            color: #111827;
          }
          .modal .btn-primary {
            background: #3b82f6;
            color: white;
          }
          .modal .btn-primary:hover {
            background: #2563eb;
          }
          .modal.fade:not(.show) {
            display: none !important;
          }
          .modal.fade:not(.show) .modal-backdrop {
            display: none !important;
          }
          .modal-backdrop {
            z-index: 1040;
          }
          .modal {
            z-index: 1050;
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
            .modern-modal .form-grid {
              grid-template-columns: 1fr;
              gap: 1rem;
            }
            .modern-modal .form-group.full-width {
              grid-column: span 1;
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
                  Add New Fee Structure
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
              <form onSubmit={this.handleSubmit}>
                <div className="modal-body">
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="feeType" className="form-label">Fee Type *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="feeType"
                        name="feeType"
                        value={this.state.feeType}
                        onChange={this.handleChange}
                        required
                        placeholder="e.g., Tuition, Transport, ICT"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="amount" className="form-label">Amount (KES) *</label>
                      <input
                        type="number"
                        className="form-control"
                        id="amount"
                        name="amount"
                        value={this.state.amount}
                        onChange={this.handleChange}
                        required
                        min="0"
                        step="0.01"
                        placeholder="e.g., 5000"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="classId" className="form-label">Class *</label>
                      <select
                        className="form-control"
                        id="classId"
                        name="classId"
                        value={this.state.classId}
                        onChange={this.handleChange}
                        required
                      >
                        <option value="">Select Class</option>
                        {classes &&
                          classes.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                              {cls.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="termId" className="form-label">Term *</label>
                      <select
                        className="form-control"
                        id="termId"
                        name="termId"
                        value={this.state.termId}
                        onChange={this.handleChange}
                        required
                      >
                        <option value="">Select Term</option>
                        {terms &&
                          terms.map((term) => (
                            <option key={term.id} value={term.id}>
                              {term.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="form-group full-width">
                      <label htmlFor="description" className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        id="description"
                        name="description"
                        value={this.state.description}
                        onChange={this.handleChange}
                        rows="3"
                        placeholder="Enter fee description..."
                      />
                    </div>

                    <div className="form-group">
                      <div className="checkbox-group">
                        <input
                          type="checkbox"
                          className="checkbox-input"
                          id="isRequired"
                          name="isRequired"
                          checked={this.state.isRequired}
                          onChange={this.handleChange}
                        />
                        <label htmlFor="isRequired" className="checkbox-label">
                          Required Fee
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <div className="checkbox-group">
                        <input
                          type="checkbox"
                          className="checkbox-input"
                          id="isActive"
                          name="isActive"
                          checked={this.state.isActive}
                          onChange={this.handleChange}
                        />
                        <label htmlFor="isActive" className="checkbox-label">
                          Active
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={this.hide}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Add Fee Structure
                  </button>
                </div>
              </form>
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
  
  return <AddModal {...props} ref={modalRef} />;
});
