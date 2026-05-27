import React from "react";
import ErrorMessage from "./components/error-toast";
import Data from "../../utils/data";

const IErrorMessage = new ErrorMessage();
const $ = window.$;

class RouteModal extends React.Component {
  constructor(props) {
    super(props);
    // FIX 1: Generate a unique ID per instance, not globally.
    // This prevents ID collisions if the component remounts.
    this.modalId = "route_modal_" + Math.random().toString(36).substr(2, 9);
    
    this.state = {
      loading: false,
      id: null, 
      name: "",
      description: "",
      
      allStudents: [],      
      selectedStudentIds: [], 
      searchTerm: "",       
    };
  }

  componentDidMount() {
    const _this = this;
    
    // Initialize jQuery Validation
    this.validator = $("#" + this.modalId + "form").validate({
      errorClass: "invalid-feedback",
      errorElement: "div",
      highlight: (element) => $(element).addClass("is-invalid"),
      unhighlight: (element) => $(element).removeClass("is-invalid"),
      submitHandler: async (form, event) => {
        // FIX 2: Ensure default is prevented and return false to stop propagation
        if (event) event.preventDefault();
        await _this.handleSubmit();
        return false;
      }
    });

    // Load Initial Data
    const initialStudents = Data.students.list();
    this.setState({ allStudents: initialStudents });

    // Subscribe to Data
    this.unsubscribe = Data.students.subscribe(({ students }) => {
      const studentList = students || [];
      this.setState((prevState) => {
        let updatedSelection = prevState.selectedStudentIds;

        // Auto-select students if we are editing and data just arrived
        if (prevState.id && prevState.selectedStudentIds.length === 0) {
           const studentsInThisRoute = studentList
             .filter(s => s && s.route && String(s.route.id) === String(prevState.id))
             .map(s => s.id);
           
           if (studentsInThisRoute.length > 0) {
             updatedSelection = studentsInThisRoute;
           }
        }

        return { 
          allStudents: studentList,
          selectedStudentIds: updatedSelection
        };
      });
    });
  }

  componentWillUnmount() {
    if (this.unsubscribe) this.unsubscribe();
    // Optional: Destroy validator if needed, though usually not strictly required with jQuery validation
    const $form = $("#" + this.modalId + "form");
    if ($form.length && $form.data('validator')) {
        $form.data('validator').destroy();
    }
  }

  static getDerivedStateFromProps(props, state) {
    if (props.edit && props.edit.id !== state.id) {
      const routeId = props.edit.id;
      let existingStudentIds = [];

      if (state.allStudents && state.allStudents.length > 0) {
        existingStudentIds = state.allStudents
          .filter(student => student.route && String(student.route.id) === String(routeId))
          .map(student => student.id);
      }

      return {
        id: routeId,
        name: props.edit.name || "",
        description: props.edit.description || "",
        selectedStudentIds: existingStudentIds, 
        searchTerm: "" 
      };
    }
    
    if (!props.edit && state.id !== null) {
      return {
        id: null,
        name: "",
        description: "",
        selectedStudentIds: [],
        searchTerm: ""
      };
    }

    return null;
  }

  show() {
    $("#" + this.modalId).modal({
      show: true,
      backdrop: "static",
      keyboard: false
    });
  }

  hide() {
    $("#" + this.modalId).modal("hide");
  }

  handleSubmit = async () => {
    // FIX 3: Guard clause - if already loading, do absolutely nothing.
    // This stops double-clicks or double-event triggers (Submit + Click)
    if (this.state.loading) return;

    try {
      this.setState({ loading: true });

      const payload = {
        name: this.state.name,
        description: this.state.description,
        students: this.state.selectedStudentIds
      };

      if (this.state.id) {
        payload.id = this.state.id;
      }

      await this.props.save(payload);
      
      this.hide();
      this.setState({ 
        loading: false, 
        name: "", 
        description: "", 
        selectedStudentIds: [],
        id: null 
      });
      
    } catch (error) {
      this.setState({ loading: false });
      const message = error ? error.message : undefined;
      IErrorMessage.show({ message });
    }
  };

  toggleStudent = (studentId) => {
    this.setState((prevState) => {
      const isSelected = prevState.selectedStudentIds.includes(studentId);
      if (isSelected) {
        return { selectedStudentIds: prevState.selectedStudentIds.filter(id => id !== studentId) };
      } else {
        return { selectedStudentIds: [...prevState.selectedStudentIds, studentId] };
      }
    });
  };

  render() {
    const allStudents = this.state.allStudents || [];
    const term = (this.state.searchTerm || "").toLowerCase();
    const filteredStudents = allStudents.filter(student => {
      if (!student) return false;
      const name = (student.names || "").toLowerCase();
      const reg = (student.registration || "").toLowerCase();
      return name.includes(term) || reg.includes(term);
    });

    return (
      <div>
        <div
          className="modal fade"
          id={this.modalId}
          tabIndex={-1}
          role="dialog"
          aria-labelledby="routeModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content">
              {/* Use unique ID for form */}
              <form id={this.modalId + "form"} className="kt-form kt-form--label-right">
                
                <div className="modal-header">
                  <h5 className="modal-title">
                    {this.state.id ? "Edit Route" : "Create New Route"}
                  </h5>
                  <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">×</span>
                  </button>
                </div>

                <div className="modal-body">
                  <div className="kt-portlet__body">
                    <div className="row">
                      
                      <div className="col-lg-5">
                        <div className="form-group">
                          <label>Route Name:</label>
                          <input
                            type="text"
                            className="form-control"
                            name="name"
                            minLength="2"
                            required
                            value={this.state.name}
                            onChange={(e) => this.setState({ name: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Description:</label>
                          <textarea
                            className="form-control"
                            name="description"
                            rows="6"
                            value={this.state.description}
                            onChange={(e) => this.setState({ description: e.target.value })}
                          />
                        </div>
                        
                        <div className="alert alert-secondary mt-3">
                            <strong>Selected Students:</strong> {this.state.selectedStudentIds.length}
                        </div>
                      </div>

                      <div className="col-lg-7">
                        <label>Assign Students:</label>
                        
                        <div className="input-group mb-3">
                            <div className="input-group-prepend">
                                <span className="input-group-text"><i className="fa fa-search"></i></span>
                            </div>
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Search student..." 
                                value={this.state.searchTerm}
                                onChange={(e) => this.setState({ searchTerm: e.target.value })}
                            />
                        </div>

                        <div 
                            className="border rounded p-2" 
                            style={{ 
                                maxHeight: "400px", 
                                overflowY: "auto", 
                                backgroundColor: "#f9f9f9" 
                            }}
                        >
                            {filteredStudents.length === 0 && (
                                <div className="text-center p-3 text-muted">No students found.</div>
                            )}

                            <ul className="list-group list-group-flush">
                                {filteredStudents.map((student) => {
                                    const isChecked = this.state.selectedStudentIds.includes(student.id);
                                    const assignedToOther = !isChecked && student.route && String(student.route.id) !== String(this.state.id);

                                    return (
                                        <li 
                                            key={student.id} 
                                            className={`list-group-item d-flex justify-content-between align-items-center ${isChecked ? 'bg-light' : ''}`}
                                            onClick={() => this.toggleStudent(student.id)}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <div style={{flex: 1}}>
                                                <span className="font-weight-bold">{student.names}</span>
                                                <br/>
                                                <small className="text-muted">
                                                    {student.registration ? `Reg: ${student.registration}` : ''} 
                                                    {student.class_name ? ` | Class: ${student.class_name}` : ''}
                                                    {assignedToOther ? 
                                                        <span className="text-danger ml-1">(In {student.route.name})</span> : ''}
                                                </small>
                                            </div>
                                            
                                            <label className="kt-checkbox kt-checkbox--brand mb-0">
                                                <input 
                                                    type="checkbox" 
                                                    checked={isChecked} 
                                                    readOnly 
                                                /> 
                                                <span></span>
                                            </label>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                        <small className="form-text text-muted">
                            Click on a row to assign/unassign the student.
                        </small>
                      </div>

                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={this.state.loading}
                  >
                    {this.state.loading ? "Saving..." : "Save Route"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
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

export default RouteModal;