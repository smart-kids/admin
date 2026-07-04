import React from "react";
import ErrorMessage from "../components/error-toast"; // Ensure this path is correct

const IErrorMessage = new ErrorMessage();
const $ = window.$; // Assuming jQuery is available globally via a script tag or similar

// Generate a unique modal ID once per component instance, not on every render
const modalIdPrefix = "editSubtopicModal_";

class EditSubtopicModal extends React.Component {
  modalId = modalIdPrefix + Math.random().toString(36).substr(2, 9);

  constructor(props) {
    super(props);
    this.state = this.getInitialState(props);
  }

  getInitialState = (props={}) => {
    const { subtopic, topic, subject, grade } = props;
    return {
      loading: false,
      id: subtopic?.id || null,
      name: subtopic?.name || "",
      selectedTopicId: subtopic?.topic || topic || "",
      selectedSubjectId: subject || "",
      selectedGradeId: grade || "",
      availableSubjects: [],
      availableTopics: [],
      isTimed: subtopic?.isTimed || false,
      startDate: subtopic?.startDate || "",
      startTime: subtopic?.startTime || "",
      endTime: subtopic?.endTime || "",
    };
  };

  initializeAndShow = () => {
    const { subtopic, grades } = this.props;

    let gradeForSubtopic = subtopic?.grade || "";
    let subjectForSubtopic = subtopic?.subject || "";
    let topicForSubtopic = subtopic?.topic || "";

    let availableTopics = [];

    // if (subtopic && subtopic.topic) {
    //     for (const g of grades || []) {
    //         for (const s of g.subjects || []) {
    //             const t = (s.topics || []).find(top => top.id === subtopic.topic);
    //             if (t) {
    //                 topicForSubtopic = t.id;
    //                 subjectForSubtopic = s.id;
    //                 gradeForSubtopic = g.id;
    //                 availableSubjects = g.subjects || []; // Pre-populate subjects for this grade
    //                 availableTopics = s.topics || []; // Pre-populate topics for this subject
    //                 break;
    //             }
    //         }
    //         if (gradeForSubtopic && subjectForSubtopic && topicForSubtopic) break; // Found all, no need to continue outer loops
    //     }
    // } else { // If no subtopic.topic, rely on current selections from props
    //     if (gradeForSubtopic) {
    //         const selectedGradeObj = (grades || []).find(g => g.id === gradeForSubtopic);
    //         availableSubjects = selectedGradeObj?.subjects || [];
    //     }
    //     if (subjectForSubtopic) {
    //         const selectedSubjectObj = availableSubjects.find(s => s.id === subjectForSubtopic);
    //         availableTopics = selectedSubjectObj?.topics || [];
    //     }
    // }
    
    this.setState({
      loading: false,
      id: subtopic?.id || null,
      name: subtopic?.name || "",
      selectedTopicId: topicForSubtopic || "",
      selectedSubjectId: subjectForSubtopic || "",
      selectedGradeId: gradeForSubtopic || "",
      // availableSubjects: availableSubjects,
      availableTopics: availableTopics,
      isTimed: subtopic?.isTimed || false,
      startDate: subtopic?.startDate || "",
      startTime: subtopic?.startTime || "",
      endTime: subtopic?.endTime || "",
    }, () => {
      $("#" + this.modalId).modal({
        show: true,
        backdrop: "static",
        keyboard: false
      });
    });
  }
  
  show = () => {
    this.initializeAndShow();
  }

  hide = () => {
    $("#" + this.modalId).modal("hide");
    this.setState(this.getInitialState({}));
  };

  handleInputChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  };

  handleGradeChange = (event) => {
    const gradeId = event.target.value;
    const { grades } = this.props;
    const selectedGradeObj = (grades || []).find(g => g.id === gradeId);
    this.setState({
      selectedGradeId: gradeId,
      availableSubjects: selectedGradeObj?.subjects || [],
      selectedSubjectId: "", 
      availableTopics: [],     
      selectedTopicId: "",   
    });
  };

  handleSubjectChange = (event) => {
    const subjectId = event.target.value;
    const selectedSubjectObj = this.state.availableSubjects.find(s => s.id === subjectId);
    this.setState({
      selectedSubjectId: subjectId,
      availableTopics: selectedSubjectObj?.topics || [],
      selectedTopicId: "", 
    });
  };
  
  handleTopicChange = (event) => {
    this.setState({ selectedTopicId: event.target.value });
  };

  componentDidMount() {
    const _this = this;
    this.validator = $("#" + this.modalId + "_form").validate({
      errorClass: "invalid-feedback",
      errorElement: "div",
      highlight: function (element) {
        $(element).addClass("is-invalid");
      },
      unhighlight: function (element) {
        $(element).removeClass("is-invalid");
      },
      rules: {
        name: { required: true, minlength: 2 },
        selectedTopicId: { required: true } 
      },
      messages: {
        name: "Please enter a subtopic name (min. 2 characters).",
        selectedTopicId: "Please select a topic."
      },
      async submitHandler(form, event) {
        event.preventDefault();
        // if (!_this.state.selectedTopicId) {
        //     IErrorMessage.show({ message: "A topic must be selected for the subtopic." });
        //     return;
        // }
        _this.setState({ loading: true });
        try {
          // Construct the data payload with only id, name, and topic
          const dataToSave = {
            id: _this.state.id,         // ID of the subtopic being edited
            name: _this.state.name,     // New name for the subtopic
            // topic: _this.state.selectedTopicId, // ID of the parent topic
            isTimed: _this.state.isTimed,
            startDate: _this.state.startDate,
            startTime: _this.state.startTime,
            endTime: _this.state.endTime,
          };

          // console.log("Submitting subtopic data (id, name, topic only):", dataToSave);
          await _this.props.edit(dataToSave); 
          _this.hide(); 
        } catch (error) {
          _this.setState({ loading: false });
          const message = error?.response?.data?.message || error?.message || "Error updating subtopic.";
          IErrorMessage.show({ message });
        }
      }
    });
  }

  render() {
    const { grades } = this.props;
    const { loading, name, selectedTopicId, availableTopics, isTimed, startDate, startTime, endTime } = this.state;

    return (
      <div>
        <div
          className="modal fade"
          id={this.modalId}
          tabIndex={-1}
          role="dialog"
          aria-labelledby={`${this.modalId}Label`}
          aria-hidden="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form id={`${this.modalId}_form`} className="kt-form">
                <div className="modal-header">
                  <h5 className="modal-title" id={`${this.modalId}Label`}>Edit Subtopic</h5>
                  <button
                    type="button"
                    className="close"
                    onClick={this.hide}
                    aria-label="Close"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <div className="modal-body">
                  {/* <div className="form-group">
                    <label htmlFor={`${this.modalId}_gradeSelect`}>Grade:</label>
                    <select
                      id={`${this.modalId}_gradeSelect`}
                      name="selectedGradeId"
                      className="form-control"
                      value={selectedGradeId}
                      onChange={this.handleGradeChange}
                      disabled={loading}
                    >
                      <option value="">Select Grade</option>
                      {(grades || []).map(grade => (
                        <option key={grade.id} value={grade.id}>{grade.name}</option>
                      ))}
                    </select>
                  </div> */}

                  {/* <div className="form-group">
                    <label htmlFor={`${this.modalId}_subjectSelect`}>Subject:</label>
                    <select
                      id={`${this.modalId}_subjectSelect`}
                      name="selectedSubjectId"
                      className="form-control"
                      value={selectedSubjectId}
                      onChange={this.handleSubjectChange}
                      disabled={loading || !selectedGradeId || (availableSubjects || []).length === 0}
                    >
                      <option value="">Select Subject</option>
                      {(availableSubjects || []).map(subject => (
                        <option key={subject.id} value={subject.id}>{subject.name}</option>
                      ))}
                    </select>
                  </div> */}
                  
                  {/* <div className="form-group">
                    <label htmlFor={`${this.modalId}_topicSelect`}>Topic: <span className="text-danger">*</span></label>
                    <select
                      id={`${this.modalId}_topicSelect`}
                      name="selectedTopicId"
                      className="form-control"
                      value={selectedTopicId}
                      onChange={this.handleTopicChange}
                      disabled={loading || !selectedSubjectId || (availableTopics || []).length === 0}
                      required
                    >
                      <option value="">Select Topic</option>
                      {(availableTopics || []).map(topic => (
                        <option key={topic.id} value={topic.id}>{topic.name}</option>
                      ))}
                    </select>
                  </div> */}

                  <div className="form-group">
                    <label htmlFor={`${this.modalId}_name`}>Subtopic Name: <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      id={`${this.modalId}_name`}
                      name="name"
                      minLength="2"
                      value={name}
                      onChange={this.handleInputChange}
                      required
                      disabled={loading}
                    />
                    </div>
                    
                    <div className="form-group row mt-4">
                      <div className="col-lg-12">
                        <label className="kt-checkbox kt-checkbox--brand">
                          <input
                            type="checkbox"
                            checked={isTimed}
                            onChange={(e) => this.setState({ isTimed: e.target.checked })}
                            disabled={loading}
                          /> Is Timed Exam?
                          <span></span>
                        </label>
                      </div>
                    </div>
                    {isTimed && (
                      <div className="form-group row mt-2">
                        <div className="col-lg-4">
                          <label>Start Date:</label>
                          <input
                            type="date"
                            className="form-control"
                            value={startDate}
                            onChange={(e) => this.setState({ startDate: e.target.value })}
                            required={isTimed}
                            disabled={loading}
                          />
                        </div>
                        <div className="col-lg-4">
                          <label>Start Time:</label>
                          <input
                            type="time"
                            className="form-control"
                            value={startTime}
                            onChange={(e) => this.setState({ startTime: e.target.value })}
                            required={isTimed}
                            disabled={loading}
                          />
                        </div>
                        <div className="col-lg-4">
                          <label>End Time:</label>
                          <input
                            type="time"
                            className="form-control"
                            value={endTime}
                            onChange={(e) => this.setState({ endTime: e.target.value })}
                            required={isTimed}
                            disabled={loading}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-brand"
                    onClick={this.hide}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      />
                    ) : (
                        "Save Changes"
                      )}
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

export default EditSubtopicModal;