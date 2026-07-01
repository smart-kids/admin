import React from "react";
import ErrorMessage from "./components/error-toast";
import AddTeacherModal from "../teachers/add"
import Select from 'react-select';
import Data from "../../utils/data";

const IErrorMessage = new ErrorMessage();

const addTeacherModal = new AddTeacherModal()
const $ = window.$;
const school = localStorage.getItem("school");

const modalNumber = Math.random()
  .toString()
  .split(".")[1];

class Modal extends React.Component {
  state = {
    loading: false,
    name: "",
    teacher: "",
    setTeacher: null,
    grade: "",
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
      // Ensure we have a valid array of grades
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
            name: _this.state.name,
            teacher: String(_this.state.teacher || ""),
            grade: String(_this.state.grade || "")
          };

          await _this.props.save(payload);
          _this.hide();
          _this.setState({
            loading: false,
            name: "",
            teacher: "",
            setTeacher: null,
            grade: ""
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
        <AddTeacherModal school={school} save={teacher => Data.teachers.create(teacher)} />
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
                  <h5 className="modal-title">Create Class</h5>
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
                    
                    <div className="row">
                      <div className="col-md-8 offset-md-2">
                        
                        <div className="form-group mb-4">
                          <label>Class Name:</label>
                          <input
                            type="text"
                            className="form-control"
                            id="fullname"
                            name="fullname"
                            minLength="2"
                            value={this.state.name || ''}
                            onChange={(e) => this.setState({ name: e.target.value })}
                            required
                          />
                        </div>

                        <div className="form-group mb-4">
                          <label>Grade Association:</label>
                          <select
                            name="grade"
                            className="form-control"
                            value={this.state.grade || ''}
                            onChange={(e) => this.setState({ grade: e.target.value })}
                            required
                          >
                            <option value="">Select Grade (Linking to Curriculum)</option>
                            {this.state.grades && this.state.grades.map(grade => {
                              const subjectCount = grade.subjects ? grade.subjects.length : 0;
                              return (
                                <option key={grade.id} value={grade.id}>
                                  {grade.name || `Unnamed Level (${grade.id?.substring(0, 5)})`} ({subjectCount} subjects)
                                </option>
                              );
                            })}
                          </select>
                          <small className="text-muted">This links the class to a specific level in the learning module to show the correct subjects/results.</small>
                        </div>

                        <div className="form-group mb-4">
                          <label>Class Teacher:</label>
                          <div className="d-flex gap-2" style={{ gap: '10px' }}>
                            <div style={{ flex: 1 }}>
                              <Select
                                name="teacher"
                                value={this.state.setTeacher}
                                options={this.props.teachers?.map(({ id: value, name: label }) => ({ value, label }))}
                                onChange={({ value, label }) => this.setState({
                                  teacher: value,
                                  setTeacher: { value, label }
                                })}
                              />
                            </div>
                            <button
                              className="btn btn-outline-brand"
                              type="button"
                              onClick={() => {
                                this.hide();
                                addTeacherModal.show();
                              }}
                            >
                              + Teacher
                            </button>
                          </div>
                        </div>

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
