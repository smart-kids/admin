import React from "react";
import ErrorMessage from "./components/error-toast";
import Data from "../../utils/data";

const IErrorMessage = new ErrorMessage();
const $ = window.$;

// Generate a unique ID for this modal
const modalNumber = "bus_modal_" + Math.random().toString().split(".")[1];

class BusModal extends React.Component {
  state = {
    loading: false,
    // Form Data
    id: null,
    make: "",
    plate: "",
    size: 14, // Default capacity
    driverId: "", // Selected driver ID
    
    // Data Sources
    driversList: []
  };

  componentDidMount() {
    const _this = this;

    // 1. Initialize jQuery Validation
    this.validator = $("#" + modalNumber + "form").validate({
      errorClass: "invalid-feedback",
      errorElement: "div",
      highlight: (element) => $(element).addClass("is-invalid"),
      unhighlight: (element) => $(element).removeClass("is-invalid"),
      submitHandler: async (form, event) => {
        event.preventDefault();
        await _this.handleSubmit();
      }
    });

    // 2. Load Drivers Data
    this.setState({ driversList: Data.drivers.list() });

    // 3. Subscribe to Driver updates (in case a new driver is added while this is open)
    this.unsubscribe = Data.drivers.subscribe(({ drivers }) => {
      this.setState({ driversList: drivers });
    });
  }

  componentWillUnmount() {
    if (this.unsubscribe) this.unsubscribe();
  }

  // Handle switching between Add and Edit modes based on props
  static getDerivedStateFromProps(props, state) {
    // If we are opening in Edit mode
    if (props.edit && props.edit.id !== state.id) {
      return {
        id: props.edit.id,
        make: props.edit.make || "",
        plate: props.edit.plate || "",
        size: props.edit.size || 14,
        // Check if driver is an object (populated) or just an ID
        driverId: props.edit.driver ? (typeof props.edit.driver === 'object' ? props.edit.driver.id : props.edit.driver) : ""
      };
    }

    // If we are opening in Create mode (props.edit is null) but state still has an ID
    if (!props.edit && state.id !== null) {
      return {
        id: null,
        make: "",
        plate: "",
        size: 14,
        driverId: ""
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
  }

  handleSubmit = async () => {
    try {
      this.setState({ loading: true });

      const payload = {
        make: this.state.make,
        plate: this.state.plate,
        size: parseInt(this.state.size), // Ensure number
        driver: this.state.driverId || null // Send null if empty string
      };

      // If editing, add ID
      if (this.state.id) {
        payload.id = this.state.id;
      }

      await this.props.save(payload);

      this.hide();
      
      // Reset state if it was a create action
      if (!this.state.id) {
        this.setState({
            loading: false,
            make: "",
            plate: "",
            size: 14,
            driverId: ""
        });
      } else {
          this.setState({ loading: false });
      }

    } catch (error) {
      this.setState({ loading: false });
      const message = error ? error.message : undefined;
      IErrorMessage.show({ message });
    }
  };

  render() {
    return (
      <div>
        <div
          className="modal fade"
          id={modalNumber}
          tabIndex={-1}
          role="dialog"
          aria-labelledby="busModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <form id={modalNumber + "form"} className="kt-form kt-form--label-right">
                
                {/* Header */}
                <div className="modal-header">
                  <h5 className="modal-title">
                    {this.state.id ? "Edit Bus" : "Create New Bus"}
                  </h5>
                  <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">×</span>
                  </button>
                </div>

                {/* Body */}
                <div className="modal-body">
                  <div className="kt-portlet__body">
                    <div className="form-group row">
                      
                      {/* Make */}
                      <div className="col-lg-6">
                        <label>Bus Make / Model:</label>
                        <input
                          type="text"
                          className="form-control"
                          name="make"
                          placeholder="e.g. Toyota Coaster"
                          minLength="2"
                          required
                          value={this.state.make}
                          onChange={(e) => this.setState({ make: e.target.value })}
                        />
                      </div>

                      {/* Plate */}
                      <div className="col-lg-6">
                        <label>Plate Number:</label>
                        <input
                          type="text"
                          className="form-control"
                          name="plate"
                          placeholder="e.g. KAA 123B"
                          required
                          value={this.state.plate}
                          onChange={(e) => this.setState({ plate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group row">
                      {/* Capacity */}
                      <div className="col-lg-6">
                        <label>Capacity (Seats):</label>
                        <select
                            className="form-control"
                            name="size"
                            required
                            value={this.state.size}
                            onChange={(e) => this.setState({ size: e.target.value })}
                        >
                            <option value="14">14 Seater</option>
                            <option value="28">28 Seater</option>
                            <option value="33">33 Seater</option>
                            <option value="42">42 Seater</option>
                            <option value="51">51 Seater</option>
                            <option value="65">65 Seater</option>
                        </select>
                      </div>

                      {/* Driver Assignment */}
                      <div className="col-lg-6">
                        <label>Assign Driver:</label>
                        <select
                          className="form-control"
                          name="driver"
                          value={this.state.driverId}
                          onChange={(e) => this.setState({ driverId: e.target.value })}
                        >
                          <option value="">-- No Driver Assigned --</option>
                          {(this.state.driversList || []).map((driver) => (
                            <option key={driver.id} value={driver.id}>
                              {driver.names || driver.username} ({driver.phone})
                            </option>
                          ))}
                        </select>
                        <small className="form-text text-muted">
                            Select a driver from the list. 
                        </small>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={this.state.loading}
                  >
                    {this.state.loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true" />
                        Saving...
                      </>
                    ) : (
                      "Save Bus"
                    )}
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

export default BusModal;