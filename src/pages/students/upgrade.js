import React from "react";
import ErrorMessage from "./components/error-toast";

const IErrorMessage = new ErrorMessage();

const $ = window.$;

const modalNumber = Math.random()
  .toString()
  .split(".")[1];

class UpgradeModal extends React.Component {
  state = {
    loading: false,
    upgradeData: {
      grade: '',
      route: '',
      class: '',
      parent2: '',
      notes: ''
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

          _this.state.loading = undefined;
          await _this.props.save(_this.state.upgradeData);
          
          _this.hide();
          _this.props.onUpgradeSuccess();
        } catch (error) {
          _this.setState({ loading: false });
          IErrorMessage.show("Failed to upgrade student: " + error.message);
        }
      }
    });
  }

  handleChange = (field, value) => {
    this.setState({
      upgradeData: {
        ...this.state.upgradeData,
        [field]: value
      }
    });
  }

  render() {
    const { student } = this.props;
    const { upgradeData } = this.state;

    return (
      <div className="modal fade" id={`upgradeModal${modalNumber}`} tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="la la-arrow-up"></i> Upgrade Student: {student?.names}
              </h5>
              <button type="button" className="close" onClick={() => this.hide()}>
                <span>&times;</span>
              </button>
            </div>
            <form id={`upgradeForm${modalNumber}`}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-control-label">Current Grade</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={student?.class?.name || ''}
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-control-label">New Grade</label>
                      <select 
                        className="form-control"
                        value={upgradeData.grade}
                        onChange={(e) => this.handleChange('grade', e.target.value)}
                        required
                      >
                        <option value="">Select Grade</option>
                        <option value="Grade 1">Grade 1</option>
                        <option value="Grade 2">Grade 2</option>
                        <option value="Grade 3">Grade 3</option>
                        <option value="Grade 4">Grade 4</option>
                        <option value="Grade 5">Grade 5</option>
                        <option value="Grade 6">Grade 6</option>
                        <option value="Grade 7">Grade 7</option>
                        <option value="Grade 8">Grade 8</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-control-label">Current Route</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={student?.route?.name || ''}
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-control-label">New Route</label>
                      <select 
                        className="form-control"
                        value={upgradeData.route}
                        onChange={(e) => this.handleChange('route', e.target.value)}
                        required
                      >
                        <option value="">Select Route</option>
                        <option value="Route A">Route A</option>
                        <option value="Route B">Route B</option>
                        <option value="Route C">Route C</option>
                        <option value="Route D">Route D</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-control-label">Current Class</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={student?.class?.name || ''}
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-control-label">New Class</label>
                      <select 
                        className="form-control"
                        value={upgradeData.class}
                        onChange={(e) => this.handleChange('class', e.target.value)}
                        required
                      >
                        <option value="">Select Class</option>
                        <option value="Class 1A">Class 1A</option>
                        <option value="Class 1B">Class 1B</option>
                        <option value="Class 2A">Class 2A</option>
                        <option value="Class 2B">Class 2B</option>
                        <option value="Class 3A">Class 3A</option>
                        <option value="Class 3B">Class 3B</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-control-label">Parent 2</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={student?.parent2?.name || ''}
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-control-label">New Parent 2</label>
                      <select 
                        className="form-control"
                        value={upgradeData.parent2}
                        onChange={(e) => this.handleChange('parent2', e.target.value)}
                      >
                        <option value="">Select Parent 2</option>
                        <option value="Parent 2A">Parent 2A</option>
                        <option value="Parent 2B">Parent 2B</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-12">
                    <div className="form-group">
                      <label className="form-control-label">Upgrade Notes</label>
                      <textarea 
                        className="form-control"
                        rows="3"
                        value={upgradeData.notes}
                        onChange={(e) => this.handleChange('notes', e.target.value)}
                        placeholder="Enter any notes about this upgrade..."
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => this.hide()}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={this.state.loading}
                >
                  {this.state.loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </span>
                      Upgrading...
                    </>
                  ) : (
                    <>
                      <i className="la la-arrow-up"></i> Upgrade Student
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export default UpgradeModal;
