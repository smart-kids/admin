import React from "react";
import ErrorMessage from "../components/error-toast";
import Data from "../../../utils/data";
const IErrorMessage = new ErrorMessage();

const $ = window.$;

const modalNumber = Math.random()
  .toString()
  .split(".")[1];

class Modal extends React.Component {
  state = {
    loading: false,
    teachers: [],
    subject: {
      id: null,
      name: "",
      teacher: "",
    },
  };

  async componentDidMount() {
    const _this = this;
    
    // Load teachers list
    const teachers = Data.teachers.list();
    this.setState({ teachers });
    
    // Subscribe to teacher updates
    this._teacherSub = Data.teachers.subscribe(({ teachers }) => {
      this.setState({ teachers });
    });

    try {
      this.validator = $("#" + modalNumber + "form").validate({
        errorClass: "invalid-feedback",
        errorElement: "div",

        highlight: function (element) {
          $(element).addClass("is-invalid");
        },
        unhighlight: function (element) {
          $(element).removeClass("is-invalid");
        },

        rules: {
          gradename: {
            required: true,
            minlength: 2,
          },
        },
        messages: {
          gradename: {
            required: "Subject name is required.",
            minlength: "Subject name must be at least 2 characters long.",
          },
        },

        async submitHandler(form, event) {
          event.preventDefault();
          if (!_this.validator.form()) {
            return;
          }

          try {
            _this.setState({ loading: true });
            const data = {
              id: _this.state.subject.id,
              name: _this.state.subject.name,
              teacher: _this.state.subject.teacher || undefined,
            };
            await _this.props.edit(data);
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
    } catch (error) {
      console.error("Error setting up edit modal:", error);
      IErrorMessage.show({ message: "Could not initialise edit form." });
    }
  }

  componentWillUnmount() {
    if (this._teacherSub) this._teacherSub();
  }

  static getDerivedStateFromProps(props, state) {
    if (props.subject && props.subject.id !== state.subject.id) {
      return {
        subject: {
          ...props.subject,
          teacher: props.subject.teacher || "",
        },
      };
    }
    return null;
  }

  show() {
    $("#" + modalNumber).modal({
      show: true,
      backdrop: "static",
      keyboard: false
    });
  }

  hide() {
    $("#" + modalNumber).modal("hide");
    this.setState({
      loading: false,
      subject: { id: null, name: "", teacher: "" },
    });
  }

  handleInputChange = (event) => {
    const { name, value } = event.target;
    this.setState(prevState => ({
      subject: {
        ...prevState.subject,
        [name]: value,
      }
    }));
  };

  render() {
    const { subject, teachers } = this.state;
    const userRole = localStorage.getItem('userRole');
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const isTeacher = userRole === 'teacher' || userData?.userType === 'teacher' || userData?.role === 'teacher';

    return (
      <div>
        <div
          className="modal fade"
          id={modalNumber}
          tabIndex="-1"
          role="dialog"
          aria-labelledby="subjectEditModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <form
                id={modalNumber + "form"}
                className="kt-form kt-form--label-right"
              >
                <div className="modal-header">
                  <h5 className="modal-title" id="subjectEditModalLabel">Edit Subject</h5>
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
                        <label>Subject name:</label>
                        <input
                          type="text"
                          className="form-control"
                          id="gradename"
                          name="name"
                          value={subject.name}
                          onChange={this.handleInputChange}
                          required
                          disabled={isTeacher}
                        />
                      </div>
                      {!isTeacher && (
                        <div className="col-lg-6">
                          <label>Assigned Teacher: <span className="text-muted">(optional)</span></label>
                          <select
                            className="form-control"
                            name="teacher"
                            value={subject.teacher || ""}
                            onChange={this.handleInputChange}
                          >
                            <option value="">— No teacher assigned —</option>
                            {teachers.map(t => (
                              <option key={t.id} value={t.id}>
                                {t.name || t.names}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="submit"
                    className="btn btn-brand"
                    disabled={this.state.loading}
                  >
                    {this.state.loading ? (
                      <span
                        className="spinner-border spinner-border-sm mr-2"
                        role="status"
                        aria-hidden="true"
                      />
                    ) : (
                      "Save"
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-brand"
                    data-dismiss="modal"
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