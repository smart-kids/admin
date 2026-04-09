import React from "react";
import Data from "../../utils/data";

const $ = window.$;

class DeleteModal extends React.Component {
  show = () => {
    $("#deleteFeeStructureModal").modal("show");
  };

  hide = () => {
    $("#deleteFeeStructureModal").modal("hide");
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
      <div
        className="modal fade"
        id="deleteFeeStructureModal"
        tabIndex="-1"
        role="dialog"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel">
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
                <div>
                  <p>
                    Are you sure you want to delete the following fee structure?
                  </p>
                  <div className="alert alert-warning">
                    <h6>Fee Structure Details:</h6>
                    <ul>
                      <li>
                        <strong>Fee Type:</strong> {remove.feeType}
                      </li>
                      <li>
                        <strong>Amount:</strong> KES{" "}
                        {Number(remove.amount).toLocaleString()}
                      </li>
                      <li>
                        <strong>Description:</strong> {remove.description || "N/A"}
                      </li>
                      <li>
                        <strong>Class:</strong>{" "}
                        {remove.class?.name || "N/A"}
                      </li>
                      <li>
                        <strong>Term:</strong> {remove.term?.name || "N/A"}
                      </li>
                      <li>
                        <strong>Required:</strong> {remove.isRequired ? "Yes" : "No"}
                      </li>
                      <li>
                        <strong>Active:</strong> {remove.isActive ? "Yes" : "No"}
                      </li>
                    </ul>
                  </div>
                  <div className="alert alert-danger">
                    <strong>Warning:</strong> This action cannot be undone. Deleting
                    this fee structure will permanently remove it from the
                    system.
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
    );
  }
}

export default DeleteModal;
