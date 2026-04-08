import React from "react";
import ErrorMessage from "./components/error-toast";
const IErrorMessage = new ErrorMessage();

const $ = window.$;

const modalNumber = Math.random()
  .toString()
  .split(".")[1];

class Modal extends React.Component {
  state = {
    loading: false
  };
  show() {
    $("#" + modalNumber).modal({
      show: true,
      backdrop: "static",
      keyboard: false
    });
  }
  hide() {
    $("#" + modalNumber).modal("hide");
    if (this.props.onHide) {
      this.props.onHide();
    }
  }
  componentDidMount() {
    const _this = this;
    
    // Add event listener for modal hidden event
    $("#" + modalNumber).on('hidden.bs.modal', function () {
      if (_this.props.onHide) {
        _this.props.onHide();
      }
    });
  }

  async deleteRecord() {
    try {
      this.setState({ loading: true });
      await this.props.save(this.props.remove);
      this.setState({ loading: false });
      this.hide();
    } catch (error) {
      this.setState({ loading: false });

      if (error) {
        const { message } = error;
        return IErrorMessage.show({ message });
      }

      IErrorMessage.show();
    }
  }
  render() {
    return (
      <div>
        <div
          className="modal"
          id={modalNumber}
          tabIndex={-1}
          role="dialog"
          aria-labelledby="myLargeModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Delete Student</h5>
                <button
                  type="button"
                  className="close"
                  data-dismiss="modal"
                  aria-label="Close"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this record?</p>
              </div>
              <div className="modal-footer">
                {!this.state.loading ? (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => this.deleteRecord()}
                  >
                    Yes i'm sure
                  </button>
                ) : (
                  <button type="button" className="btn btn-danger">
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    />
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-outline-brand"
                  onClick={() => this.hide()}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Modal;
