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
      id: "",
      names: "",
      registration: "",
      gender: "",
      class: null,
      route: null,
      parent: null,
      parent2: null,
      paidFees: 0,
      balanceBroughtForward: 0
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
    // Clean up backdrop and modal remnants
    $(".modal-backdrop").remove();
    $("body").removeClass("modal-open");
  }

  componentDidMount() {
    
    this.validator = $("#" + modalNumber + "form").validate({
      errorClass: "invalid-feedback",
      errorElement: "div",

      highlight: function (element) {
        $(element).addClass("is-invalid");
      },
      unhighlight: function (element) {
        $(element).removeClass("is-invalid");
      },

      submitHandler: async (form, event) => {
        event.preventDefault();
        try {
          this.setState({ loading: true });

          const payload = {
            id: this.state.edit.id,
            names: this.state.edit.names,
            registration: this.state.edit.registration,
            gender: this.state.edit.gender,
            
            class: this.state.edit.class?.id || "",
            route: this.state.edit.route?.id || "",
            parent: this.state.edit.parent?.id || "",
            parent2: this.state.edit.parent2?.id || "",
            paidFees: parseFloat(this.state.edit.paidFees) || 0,
            balanceBroughtForward: parseFloat(this.state.edit.balanceBroughtForward) || 0
          };

          await this.props.save(payload);
          
          this.hide();
          this.setState({ loading: false });
        } catch (error) {
          this.setState({ loading: false });
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
    if (props.edit && props.edit.id !== state.edit.id) {
      return {
        edit: {
          ...props.edit,
          class: props.edit.class || null,
          route: props.edit.route || null,
          parent: props.edit.parent || null,
          parent2: props.edit.parent2 || null,
          gender: props.edit.gender || "",
          paidFees: props.edit.paidFees || 0,
          balanceBroughtForward: props.edit.balanceBroughtForward || 0
        }
      };
    }
    return null;
  }

  render() {
    const { edit } = this.state;
    
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
                  <h5 className="modal-title">Edit Student</h5>
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
                      
                      {/* FULL NAME */}
                      <div className="col-lg-4">
                        <label>Full Name:</label>
                        <input
                          type="text"
                          className="form-control"
                          name="names"
                          minLength="2"
                          required
                          value={edit.names || ""}
                          // FIX: Capture value outside setState
                          onChange={(e) => {
                            const val = e.target.value;
                            this.setState(prevState => ({ 
                              edit: { ...prevState.edit, names: val } 
                            }));
                          }}
                        />
                      </div>

                      {/* REGISTRATION */}
                      <div className="col-lg-4">
                        <label>Registration Number:</label>
                        <input
                          type="text"
                          className="form-control"
                          name="registration"
                          minLength="2"
                          required
                          value={edit.registration || ""}
                          // FIX: Capture value outside setState
                          onChange={(e) => {
                            const val = e.target.value;
                            this.setState(prevState => ({ 
                              edit: { ...prevState.edit, registration: val } 
                            }));
                          }}
                        />
                      </div>

                      {/* CLASS DROPDOWN */}
                      <div className="col-lg-4">
                        <label>Class:</label>
                        <select
                          className="form-control"
                          name="class"
                          required
                          value={edit.class?.id || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const selectedObj = this.props.classes.find(c => String(c.id) === String(val));
                            this.setState(prevState => ({ 
                                edit: { ...prevState.edit, class: selectedObj || null } 
                            }));
                          }}
                        >
                          <option value="">Select class</option>
                          {this.props.classes.map(Iclass => (
                            <option key={Iclass.id} value={Iclass.id}>{Iclass.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* ROUTE DROPDOWN */}
                      <div className="col-lg-6">
                        <label>Route:</label>
                        <select
                          name="route"
                          className="form-control"
                          required
                          value={edit.route?.id || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const selectedObj = this.props.routes.find(r => String(r.id) === String(val));
                            this.setState(prevState => ({ 
                                edit: { ...prevState.edit, route: selectedObj || null } 
                            }));
                          }}
                        >
                          <option value="">Select route</option>
                          {this.props.routes.map(route => (
                            <option key={route.id} value={route.id}>{route.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* GENDER DROPDOWN */}
                      <div className="col-lg-6">
                        <label>Gender:</label>
                        <select
                          name="gender"
                          className="form-control"
                          required
                          value={edit.gender || ""}
                          // FIX: Capture value outside setState
                          onChange={(e) => {
                            const val = e.target.value;
                            this.setState(prevState => ({ 
                              edit: { ...prevState.edit, gender: val } 
                            }));
                          }}
                        >
                          <option value="">Select gender</option>
                          {["MALE", "FEMALE"].map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>

                      {/* PARENT 1 DROPDOWN */}
                      <div className="col-lg-6">
                        <label>Parent:</label>
                        <select
                          name="parent"
                          className="form-control"
                          required
                          value={edit.parent?.id || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const selectedObj = this.props.parents.find(p => String(p.id) === String(val));
                            this.setState(prevState => ({ 
                                edit: { ...prevState.edit, parent: selectedObj || null } 
                            }));
                          }}
                        >
                          <option value="">Select parent</option>
                          {this.props.parents.map(parent => (
                            <option key={parent.id} value={parent.id}>
                              {parent.name} ({parent.phone || 'No Phone'})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* PARENT 2 DROPDOWN */}
                      <div className="col-lg-6">
                        <label>Alternative Parent:</label>
                        <select
                          name="parent2"
                          className="form-control"
                          value={edit.parent2?.id || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const selectedObj = this.props.parents.find(p => String(p.id) === String(val));
                            this.setState(prevState => ({ 
                                edit: { ...prevState.edit, parent2: selectedObj || null } 
                            }));
                          }}
                        >
                          <option value="">Select parent (Optional)</option>
                          {this.props.parents.map(parent => (
                            <option key={parent.id} value={parent.id}>
                              {parent.name} ({parent.phone || 'No Phone'})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Paid Fees */}
                      <div className="col-lg-6">
                        <label>Paid Fees:</label>
                        <input
                          type="number"
                          className="form-control"
                          name="paidFees"
                          value={edit.paidFees || 0}
                          onChange={(e) => {
                            const val = e.target.value;
                            this.setState(prevState => ({ 
                                edit: { ...prevState.edit, paidFees: val } 
                            }));
                          }}
                        />
                      </div>

                      {/* Balance Brought Forward */}
                      <div className="col-lg-6">
                        <label>Balance Brought Forward:</label>
                        <input
                          type="number"
                          className="form-control"
                          name="balanceBroughtForward"
                          value={edit.balanceBroughtForward || 0}
                          onChange={(e) => {
                            const val = e.target.value;
                            this.setState(prevState => ({ 
                                edit: { ...prevState.edit, balanceBroughtForward: val } 
                            }));
                          }}
                        />
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