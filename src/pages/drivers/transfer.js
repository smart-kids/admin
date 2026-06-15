import React from "react";
import ErrorMessage from "./components/error-toast";
import SuccessMessage from "./components/success-toast";

const IErrorMessage = new ErrorMessage();
const ISuccessMessage = new SuccessMessage();

const $ = window.$;

const modalNumber = Math.random()
  .toString()
  .split(".")[1];

class Modal extends React.Component {
  state = {
    loading: false,
    school: '',
    driver: {},
    schools: [],
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
    this.setState({schools: props.schools, driver: props.driver });
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
          const data = {};
          Object.assign(data, {
            school: _this.state.school,
            driver: _this.state.driver.id,
          });

          await _this.props.transfer(data);
          ISuccessMessage.show({message: "Driver has been transfered successfuly!", header: "Driver Transfer"});
          _this.hide();
          _this.setState({
            loading: false,
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
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form
                id={modalNumber + "form"}
                className="kt-form kt-form--label-right"
              >
                <div className="modal-header">
                  <h5 className="modal-title">Transfer Driver</h5>
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
                        <div className="col-lg-12 mb-4">
                            <h6>Driver details:</h6>
                            <p>Name: {this.state.driver.names}</p>
                            <p>Phone: {this.state.driver.phone}</p>
                        </div>
                        <div className="col-lg-12">
                            <label htmlFor="exampleSelect1">Target school:</label>
                            <select
                            name="school"
                            className="form-control"
                            required
                            value={this.state.school}
                            onChange={(e) => this.setState({
                              school: e.target.value
                            })}
                            >
                            <option value="">Select school</option>
                            {(this.state.schools || []).map(school => (
                                <option key={school.id} value={school.id}>{school.name}</option>
                            ))}
                            </select>
                        </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
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
