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
    edit: {
      names: "",
      national_id:"",
      tsc_number: "",
      route: {
        name: ""
      },
      gender: "",
      teacher: {
        name: ""
      }
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
          const data = {}
          Object.assign(data, _this.state.edit, {
            classes: undefined
          })
          await _this.props.save(data);
          _this.hide();
          _this.setState({ loading: false });
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
    if (props.edit)
      if (props.edit.id !== state.edit.id) {
        return {
          edit: props.edit
        };
      }
    return null;
  }
  render() {
    const {
      edit: { names, route = {}, parent = {}, gender } = {}
    } = this.state;
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
                  <h5 className="modal-title">Edit Teacher</h5>
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
                          value={this.state.edit.national_id}
                          onChange={(e) => this.setState({
                            edit: { ...this.state.edit, national_id: e.target.value }
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
                          value={this.state.edit.tsc_number}
                          onChange={(e) => this.setState({
                            edit: { ...this.state.edit, tsc_number: e.target.value }
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
                          value={this.state.edit.name}
                          onChange={(e) => this.setState({
                            edit: { ...this.state.edit, name: e.target.value }
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
                          value={this.state.edit.phone}
                          onChange={(e) => this.setState({
                            edit: { ...this.state.edit, phone: e.target.value }
                          })}
                          required
                        />
                      </div>
                      <div className="col-lg-3">
                        <label>Email:</label>
                        <input
                          type="text"
                          className="form-control"
                          id="eail"
                          name="email"
                          minLength="2"
                          value={this.state.edit.email}
                          onChange={(e) => this.setState({
                            edit: { ...this.state.edit, email: e.target.value }
                          })}
                          required
                        />
                      </div>
                      <div className="col-lg-3">
                        <label htmlFor="exampleSelect1">Gender:</label>
                        <select
                          name="route"
                          className="form-control"
                          required
                          value={this.state.edit.gender}
                          onChange={(e) => this.setState({
                            edit: { ...this.state.edit, gender: e.target.value }
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
