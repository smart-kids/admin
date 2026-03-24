import React from "react";
import Data from "../../utils/data";
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
      teacher: "",
      feeAmount: 0,
      grade: ""
    },
    grades: []
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
    this.unsub = Data.grades.subscribe(({ grades }) => {
        this.setState({ grades: Array.isArray(grades) ? grades : [] });
    });
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
          
          const payload = {
            id: _this.state.edit.id,
            name: _this.state.edit.name,
            teacher: (_this.state.edit.teacher && typeof _this.state.edit.teacher === 'object') ? _this.state.edit.teacher.id : String(_this.state.edit.teacher || ""),
            feeAmount: Number(_this.state.edit.feeAmount || 0),
            grade: String(_this.state.edit.grade || "")
          };

          await _this.props.save(payload);
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
    if (props.edit && props.edit.id !== state.edit.id) {
      // Ensure teacher and grade are strings (IDs) even if they come as objects
      const sanitizedEdit = {
        ...props.edit,
        teacher: (props.edit.teacher && typeof props.edit.teacher === 'object') ? props.edit.teacher.id : props.edit.teacher,
        grade: (props.edit.grade && typeof props.edit.grade === 'object') ? props.edit.grade.id : props.edit.grade
      };
      return {
        edit: sanitizedEdit
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
                  <h5 className="modal-title">Edit Class</h5>
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
                      <div className="col-lg-6">
                        <label>Class Name:</label>
                        <input
                          type="text"
                          className="form-control"
                          id="fullname"
                          name="fullname"
                          minLength="2"
                          value={this.state.edit.name}
                          onChange={(e) => this.setState(Object.assign(this.state.edit, {
                            name: e.target.value
                          }))}
                          required
                        />
                      </div>
                      <div className="col-lg-6">
                        <label>Fee Amount:</label>
                        <input
                          type="number"
                          className="form-control"
                          name="feeAmount"
                          value={this.state.edit.feeAmount}
                          onChange={(e) => {
                            const val = e.target.value;
                            this.setState(prevState => ({
                              edit: { ...prevState.edit, feeAmount: val }
                            }));
                          }}
                          required
                        />
                      </div>
                      <div className="col-lg-6 mt-3">
                        <label htmlFor="exampleSelect1">Teacher:</label>
                        <select
                          name="teacher"
                          className="form-control"
                          id="exampleSelect1"
                          required
                          value={this.state.edit.teacher}
                          onChange={(e) => {
                            const val = e.target.value;
                            this.setState(prevState => ({
                              edit: { ...prevState.edit, teacher: val }
                            }));
                          }}
                        >
                          <option value="">Select teacher</option>
                          {this.props.teachers.map(teacher => {
                            return <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                          })}
                        </select>
                      </div>
                      <div className="col-lg-6 mt-3">
                        <label>Grade Association:</label>
                        <select
                          name="grade"
                          className="form-control"
                          value={this.state.edit.grade}
                          onChange={(e) => this.setState({
                            edit: { ...this.state.edit, grade: e.target.value }
                          })}
                          required
                        >
                           <option value="">Select Grade (Linking to Curriculum)</option>
                           {this.state.grades && this.state.grades.map(grade => (
                             <option key={grade.id} value={grade.id}>{grade.name || `Unnamed Level (${grade.id?.substring(0, 5)})`}</option>
                           ))}
                        </select>
                        <p className="text-muted small mt-1">This links the class to a specific level in the learning module to show the correct subjects/results.</p>
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
