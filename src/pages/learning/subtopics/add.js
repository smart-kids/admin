import React from "react";
import ErrorMessage from "../components/error-toast";

const IErrorMessage = new ErrorMessage();

const $ = window.$;

let selectedGrade = null;
let selectedSubject = null;
let selectedTopic = null;

const modalNumber = Math.random()
  .toString()
  .split(".")[1];

class Modal extends React.Component {
  state = {
    loading: false,
    name: "",
    topic: "",
    grade: "",
    subject: "",
    subjects: [],
    topics: [],
    isTimed: false,
    startDate: "",
    startTime: "",
    endTime: "",
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
  setSubjects(id) {
    const grade = this.props.grades.filter(grade => {
      return grade.id == id;
    });
    if (grade.length) {
      this.setState({
        subject: "",
        subjects: grade[0].subjects,
        topics: []
      });
      this.setState({ topic: "" });
    }
  }
  setTopics(id) {
    const subject = this.state.subjects.filter(subject => {
      return subject.id == id;
    });
    if (subject.length) {
      this.setState({
        topics: subject[0].topics
      });
      this.setState({ topic: "" });
    }
  }
  componentDidUpdate() {
    const _this = this;
    if (_this.props.grade != selectedGrade) {
      selectedGrade = _this.props.grade;
      _this.setState({ grade: _this.props.grade });
      let subjects = [];
      _this.props.grades.forEach(grade => {
        if (grade.id == selectedGrade) {
          _this.setState({ subjects: grade.subjects });
        }
      });
    }
    if (_this.props.subject != selectedSubject) {
      selectedSubject = _this.props.subject;
      _this.setState({ subject: _this.props.subject });
      let topics = [];
      _this.state.subjects.forEach(subject => {
        if (subject.id == selectedSubject) {
          _this.setState({ topics: subject.topics });
        }
      });
    }
    if (_this.props.topic != selectedTopic) {
      selectedTopic = _this.props.topic;
      _this.setState({ topic: _this.props.topic });
    }
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
            name: _this.state.name,
            topic: _this.props.topic,
            isTimed: _this.state.isTimed,
            startDate: _this.state.startDate,
            startTime: _this.state.startTime,
            endTime: _this.state.endTime,
          });
          await _this.props.save(data);
          _this.hide();
          _this.setState({
            loading: false,
            grade: "",
            subject: "",
            topic: "",
          });
          selectedGrade = null;
          selectedSubject = null;
          selectedTopic = null;
          _this.setState({ name: "" });
          _this.setState({ topic: "" });
          _this.setState({ isTimed: false, startDate: "", startTime: "", endTime: "" });
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
                  <h5 className="modal-title">Create new subtopic</h5>
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
                      <div className="col-lg-12">
                        <label>Subtopic name:</label>
                        <input
                          type="text"
                          className="form-control"
                          id="name"
                          name="name"
                          minLength="2"
                          value={this.state.name}
                          onChange={(e) => this.setState({
                            name: e.target.value
                          })}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-group row mt-4">
                      <div className="col-lg-12">
                        <label className="kt-checkbox kt-checkbox--brand">
                          <input
                            type="checkbox"
                            checked={this.state.isTimed}
                            onChange={(e) => this.setState({ isTimed: e.target.checked })}
                          /> Is Timed Exam?
                          <span></span>
                        </label>
                      </div>
                    </div>
                    {this.state.isTimed && (
                      <div className="form-group row mt-2">
                        <div className="col-lg-4">
                          <label>Start Date:</label>
                          <input
                            type="date"
                            className="form-control"
                            value={this.state.startDate}
                            onChange={(e) => this.setState({ startDate: e.target.value })}
                            required={this.state.isTimed}
                          />
                        </div>
                        <div className="col-lg-4">
                          <label>Start Time:</label>
                          <input
                            type="time"
                            className="form-control"
                            value={this.state.startTime}
                            onChange={(e) => this.setState({ startTime: e.target.value })}
                            required={this.state.isTimed}
                          />
                        </div>
                        <div className="col-lg-4">
                          <label>End Time:</label>
                          <input
                            type="time"
                            className="form-control"
                            value={this.state.endTime}
                            onChange={(e) => this.setState({ endTime: e.target.value })}
                            required={this.state.isTimed}
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
