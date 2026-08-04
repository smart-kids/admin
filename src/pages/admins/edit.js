import React from "react";
import Select from "react-select";
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
      // password: "",
      email: "",
      phone: "",
      password:"",
      role: "ADMIN"
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
          await _this.props.save(_this.state.edit);
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
          edit: {
            ...props.edit,
            schools: (props.edit.schools || []).map(s => s.id || s)
          }
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
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content">
              <form
                id={modalNumber + "form"}
                className="kt-form kt-form--label-right"
              >
                <div className="modal-header">
                  <h5 className="modal-title">Edit Admin</h5>
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
                    <div className="row mb-4">
                      <div className="col-lg-6 mb-3">
                        <label>Names:</label>
                        <input
                          type="text"
                          className="form-control"
                          id="fullname"
                          name="fullname"
                          minLength="2"
                          value={this.state.edit.names}
                          onChange={(e) => this.setState({
                            edit: Object.assign(this.state.edit, {
                              names: e.target.value
                            })
                          })}
                          required
                        />
                      </div>
                      <div className="col-lg-6 mb-3">
                        <label>Email:</label>
                        <input
                          type="email"
                          className="form-control"
                          id="email"
                          name="email"
                          minLength="2"
                          value={this.state.edit.email}
                          onChange={(e) => this.setState({
                            edit: Object.assign(this.state.edit, {
                              email: e.target.value
                            })
                          })}
                          required
                        />
                      </div>
                    </div>
                    <div className="row mb-4">
                      <div className="col-lg-6 mb-3">
                        <label>Phone Number:</label>
                        <input
                          type="text"
                          className="form-control"
                          id="phone"
                          name="phone"
                          minLength="10"
                          value={this.state.edit.phone}
                          onChange={(e) => this.setState({
                            edit: Object.assign(this.state.edit, {
                              phone: e.target.value
                            })
                          })}
                          required
                        />
                      </div>
                      <div className="col-lg-6 mb-3">
                        <label>Password:</label>
                        <input
                          type="text"
                          className="form-control"
                          id="password"
                          name="password"
                          minLength="2"
                          value={this.state.edit.password}
                          onChange={(e) => this.setState({
                            edit: Object.assign(this.state.edit, {
                              password: e.target.value
                            })
                          })}
                        />
                      </div>
                    </div>

                    {this.props.isSuperAdmin && (
                      <div className="row mb-4">
                        <div className="col-lg-6 mb-3">
                          <label>Role:</label>
                          <select
                            className="form-control"
                            value={this.state.edit.role || "ADMIN"}
                            onChange={(e) => this.setState({
                              edit: Object.assign(this.state.edit, {
                                role: e.target.value
                              })
                            })}
                          >
                            <option value="ADMIN">Admin</option>
                            <option value="SUPER_ADMIN">Super Admin</option>
                            <option value="CUSTOMER_SUCCESS_MANAGER">Customer Success Manager</option>
                            <option value="PRINCIPAL_ADMIN">Principal Admin</option>
                            <option value="ADMIN_OPERATIONS">Operations Admin</option>
                            <option value="ADMIN_ACADEMICS">Academics Admin</option>
                          </select>
                          {(() => {
                            const roleDescriptions = {
                              'ADMIN': 'Standard administrative access to school data.',
                              'SUPER_ADMIN': 'Full system access, including ShulePlus global settings, billing, and all schools.',
                              'CUSTOMER_SUCCESS_MANAGER': 'Access to school usage metrics, onboarding, and support tools.',
                              'PRINCIPAL_ADMIN': 'Full administrative access strictly scoped to their assigned school(s).',
                              'ADMIN_OPERATIONS': 'Access to transport, routing, scheduling, and logistics modules.',
                              'ADMIN_ACADEMICS': 'Access to grades, lesson plans, exams, and teacher management.'
                            };
                            const currentRole = this.state.edit.role || 'ADMIN';
                            return (
                              <div className="mt-2 text-muted" style={{ fontSize: '0.8rem', lineHeight: '1.2' }}>
                                <i className="flaticon-info text-primary mr-1" style={{ fontSize: '0.8rem' }}></i>
                                {roleDescriptions[currentRole]}
                              </div>
                            );
                          })()}
                        </div>
                        <div className="col-lg-6 mb-3">
                          <label>Schools:</label>
                          <Select
                            isMulti
                            name="schools"
                            value={(this.state.edit.schools || []).map(s => {
                              const id = s.id || s;
                              const schoolObj = (this.props.schools || []).find(sch => sch.id === id);
                              return { value: id, label: schoolObj ? schoolObj.name : id };
                            })}
                            options={(this.props.schools || []).map(school => ({ value: school.id, label: school.name }))}
                            onChange={(selectedOptions) => {
                              this.setState({
                                edit: Object.assign(this.state.edit, {
                                  schools: selectedOptions ? selectedOptions.map(opt => opt.value) : []
                                })
                              });
                            }}
                          />
                        </div>
                      </div>
                    )}
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
