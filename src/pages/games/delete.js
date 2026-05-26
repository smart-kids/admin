import React from "react";

const $ = window.$;

class DeleteModal extends React.Component {
  show() {
    $("#delete_book_modal").modal("show");
  }

  hide() {
    $("#delete_book_modal").modal("hide");
  }

  render() {
    const { remove, save } = this.props;
    return (
      <div
        className="modal fade"
        id="delete_book_modal"
        tabIndex="-1"
        role="dialog"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel">
                Delete Book
              </h5>
              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete <b>{remove && remove.title}</b>?
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-dismiss="modal"
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  save(remove);
                  this.hide();
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default DeleteModal;
