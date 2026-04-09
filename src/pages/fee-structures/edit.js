import React from "react";
import Data from "../../utils/data";

const $ = window.$;

class EditModal extends React.Component {
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
    const { edit } = this.props;
    if (edit) {
      this.setState({
        feeType: edit.feeType || "",
        amount: edit.amount || "",
        description: edit.description || "",
        classId: edit.class?.id || "",
        termId: edit.term?.id || "",
        isRequired: edit.isRequired === true,
        isActive: edit.isActive === true,
      });
      $("#editFeeStructureModal").modal("show");
    }
  };

  hide = () => {
    $("#editFeeStructureModal").modal("hide");
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
    const { edit, save } = this.props;

    const feeStructureData = {
      id: edit.id,
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
      <div
        className="modal fade"
        id="editFeeStructureModal"
        tabIndex="-1"
        role="dialog"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel">
                Edit Fee Structure
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
                <div className="form-group">
                  <label htmlFor="feeType">Fee Type *</label>
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
                  <label htmlFor="amount">Amount (KES) *</label>
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
                  <label htmlFor="description">Description</label>
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
                  <label htmlFor="classId">Class *</label>
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
                  <label htmlFor="termId">Term *</label>
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

                <div className="form-group">
                  <div className="custom-control custom-checkbox">
                    <input
                      type="checkbox"
                      className="custom-control-input"
                      id="isRequired"
                      name="isRequired"
                      checked={this.state.isRequired}
                      onChange={this.handleChange}
                    />
                    <label
                      className="custom-control-label"
                      htmlFor="isRequired"
                    >
                      Required Fee
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <div className="custom-control custom-checkbox">
                    <input
                      type="checkbox"
                      className="custom-control-input"
                      id="isActive"
                      name="isActive"
                      checked={this.state.isActive}
                      onChange={this.handleChange}
                    />
                    <label
                      className="custom-control-label"
                      htmlFor="isActive"
                    >
                      Active
                    </label>
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
                  Update Fee Structure
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export default EditModal;
