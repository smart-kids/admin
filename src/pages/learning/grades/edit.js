import React from "react";
import ErrorMessage from "../components/error-toast";
import SuccessMessage from "../components/success-toast";

const IErrorMessage = new ErrorMessage();
const ISuccessMessage = new SuccessMessage();

const $ = window.$;

const modalNumber = Math.random()
  .toString()
  .split(".")[1];

class Modal extends React.Component {
  state = {
    loading: false,
    grade: {
      name: "",
    }
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
  }
  componentDidMount() {
    const _this = this;
    this.validator = $("#" + modalNumber + "form").validate({
      errorClass: "invalid-feedback",
      errorElement: "div",

      highlight: function (element) {
        $(element).addClass("is-invalid");
      },
      unhighlight: function (element) {
        $(element).removeClass("is-invalid");
      },

      async submitHandler(form, event) {
        event.preventDefault();
        try {
          _this.setState({ loading: true });
          const data = _this.state.grade;
          // delete data.subjects;
          await _this.props.edit(data);
          _this.hide();
          _this.setState({ loading: false });
          ISuccessMessage.show();
        } catch (error) {
          _this.setState({ loading: false });
          if (error) {
            const { message } = error;
            return IErrorMessage.show({ message });
          }
          IErrorMessage.show();
        }
      }
    });
  }
  static getDerivedStateFromProps(props, state) {
    if (props.grade)
      if (props.grade.id !== state.grade.id) {
        return {
          grade: props.grade
        };
      }
    return null;
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
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form
                id={modalNumber + "form"}
                className="kt-form kt-form--label-right"
              >
                <div className="modal-header">
                  <h5 className="modal-title">Edit grade</h5>
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
                  <div className="form-group row">
                    <div className="col-lg-12">
                      <label>Grade name:</label>
                      <input
                        type="text"
                        className="form-control"
                        id="gradename"
                        name="gradename"
                        minLength="2"
                        required
                        value={this.state.grade.name}
                        onChange={(e) => this.setState(Object.assign(this.state.grade, {
                          name: e.target.value
                        }))}
                      />
                    </div>
                  </div>
                  <div className="form-group row">
                      <div className="col-lg-12">
                        <label className="kt-checkbox kt-checkbox--brand">
                          <input
                            type="checkbox"
                            checked={this.state.grade.isvisible !== false}
                            onChange={(e) => this.setState(Object.assign(this.state.grade, {
                              isvisible: e.target.checked
                            }))}
                          /> Visible to users
                          <span></span>
                        </label>
                      </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="submit"
                    className="btn btn-outline-brand"
                    disabled={this.state.loading}
                  >
                    {this.state.loading ? (
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      />
                    ) : (
                        "Save"
                      )}
                  </button>
                  <button
                    data-dismiss="modal"
                    type="button"
                    className="btn btn-outline-brand"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Modal;
