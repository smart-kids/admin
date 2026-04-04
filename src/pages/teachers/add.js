import React from "react";
import ErrorMessage from "./components/error-toast";
const IErrorMessage = new ErrorMessage();

const $ = window.$;

const modalNumber = Math.random()
  .toString()
  .split(".")[1];

class Modal extends React.Component {
  state = {
    loading: false,
    name: "",
    school: "",
    national_id:"",
    tsc_number: "",
    phone: '',
    email: '',
    gender: ''
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
  componentWillReceiveProps(props) {
    this.setState({school: props.school });
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

          _this.state.loading = undefined;
          await _this.props.save(_this.state);
          _this.hide();
          _this.setState({
            loading: false,
            name: "",
            national_id: "",
            tsc_number: "",
            phone: '',
            email: '',
            gender: '',
            school: '',
          });
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
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content">
              <form
                id={modalNumber + "form"}
                className="kt-form kt-form--label-right"
              >
                <div className="modal-header">
                  <h5 className="modal-title">Create Teacher</h5>
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
                  <div className="kt-portlet__body">
                    <div className="form-group row">
                    <div className="col-lg-3">
                        <label>National ID:</label>
                        <input
                          type="text"
                          className="form-control"
                          id="national_id"
                          name="national_id"
                          minLength="2"
                          value={this.state.national_id}
                          onChange={(e) => this.setState({
                            national_id: e.target.value
                          })}
                          required
                        />
                      </div>
                      <div className="col-lg-3">
                        <label>TSC Number:</label>
                        <input
                          type="text"
                          className="form-control"
                          id="tsc"
                          name="tsc"
                          minLength="2"
                          value={this.state.tsc_number}
                          onChange={(e) => this.setState({
                            tsc_number: e.target.value
                          })}
                          required
                        />
                      </div>
                      <div className="col-lg-6">
                        <label>Full Name:</label>
                        <input
                          type="text"
                          className="form-control"
                          id="fullname"
                          name="fullname"
                          minLength="2"
                          value={this.state.name}
                          onChange={(e) => this.setState({
                            name: e.target.value
                          })}
                          required
                        />
                      </div>
                      <div className="col-lg-3">
                        <label>Phone Number:</label>
                        <input
                          type="text"
                          className="form-control"
                          id="phone"
                          name="phone"
                          minLength="10"
                          value={this.state.phone}
                          onChange={(e) => this.setState({
                            phone: e.target.value
                          })}
                          required
                        />
                      </div>
                      <div className="col-lg-3">
                        <label>Email:</label>
                        <input
                          type="text"
                          className="form-control"
                          id="email"
                          name="email"
                          minLength="2"
                          value={this.state.email}
                          onChange={(e) => this.setState({
                            email: e.target.value
                          })}
                          required
                        />
                      </div>
                      <div className="col-lg-3">
                        <label htmlFor="exampleSelect1">Gender:</label>
                        <select
                          name="gender"
                          className="form-control"
                          required
                          value={this.state.gender}
                          onChange={(e) => this.setState({
                            gender: e.target.value
                          })}
                        >
                          <option value="">Select gender</option>
                          {["MALE", "FEMALE"].map(gender => (
                            <option key={gender} value={gender}>{gender}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-outline-brand"
                    type="submit"
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
