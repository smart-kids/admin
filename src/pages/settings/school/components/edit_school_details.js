import React from "react";
import ErrorMessage from "../components/error-toast"; // Assuming this is a valid path
const IErrorMessage = new ErrorMessage();

const $ = window.$; // Assuming jQuery is globally available

// Original modal ID generation
const modalNumber = Math.random()
  .toString()
  .split(".")[1];

class Modal extends React.Component {
  logoInputRef = React.createRef();
  formRef = React.createRef(); // Ref for the form element

  // Updated initial state to include new fields and better defaults
  state = {
    loading: false,
    edit: {
      id: null, // Important for getDerivedStateFromProps
      name: "",
      phone: "",
      email: "",
      address: "",
      schoolSize: "", // Number of students
      schoolType: "",
      schoolLevel: "",
      numberOfStudents: "",
      inviteSmsText: "Hello {{username}}, you've been invited to join {{team_name}}. Your temporary password is {{password}}.", // Default
      logo: null, // For base64 string or URL
      themeColor: "#4e73df", // Default theme color (e.g., a nice blue)
      mpesaPaybill: "", // M-Pesa Paybill for automatic transfers
    },
    logoPreview: null, // For immediate preview from file input
  };

  // Original show method
  show() {
    $("#" + modalNumber).modal({
      show: true,
      backdrop: "static",
      keyboard: false,
    });
  }

  // Original hide method
  hide() {
    $("#" + modalNumber).modal("hide");
    // if (this.logoInputRef.current) {
    //     this.logoInputRef.current.value = ""; // Clear file input on hide
    // }
  }

  componentDidMount() {
    const _this = this; // Keep _this for submitHandler context
    if (!this.formRef.current) return;

    this.validator = $(this.formRef.current).validate({ // Use ref for form selector
      errorClass: "invalid-feedback",
      errorElement: "div",
      highlight: function (element) {
        $(element).addClass("is-invalid").removeClass("is-valid");
      },
      unhighlight: function (element) {
        $(element).removeClass("is-invalid").addClass("is-valid");
      },
      errorPlacement: function (error, element) {
        if (element.parent('.input-group').length || element.prop('type') === 'checkbox' || element.prop('type') === 'radio') {
            error.insertAfter(element.parent());
        } else if (element.hasClass('custom-file-input')) {
            error.insertAfter(element.closest('.custom-file'));
        } else if (element.prop('type') === 'color') { // Special placement for color input
            error.insertAfter(element.closest('.input-group'));
        }
        else {
            error.insertAfter(element);
        }
      },
      submitHandler: async (form, event) => { // Original submitHandler structure
        event.preventDefault();
        if (_this.state.loading) return;

        _this.setState({ loading: true });
        try {
          await _this.props.save(_this.state.edit);
          IErrorMessage.show({ message: "Details saved successfully!", type: "success" });
          _this.hide();
        } catch (error) {
          console.error("Save error:", error);
          const message = error?.response?.data?.message || error?.message || "An unexpected error occurred.";
          IErrorMessage.show({ message, type: "error" });
        } finally {
          _this.setState({ loading: false });
        }
      },
    });
  }

  static getDerivedStateFromProps(props, state) {
    // Default state structure including themeColor
    const defaultEditState = {
        id: null, name: "", phone: "", email: "", address: "", schoolSize: "",
        schoolType: "", schoolLevel: "", numberOfStudents: "",
        inviteSmsText: "Hello {{username}}, you've been invited to join {{team_name}}. Your temporary password is {{password}}.",
        logo: null,
        themeColor: "#4e73df", // Ensure default is here
        mpesaPaybill: "",
    };

    if (props.edit) {
      if (props.edit.id !== state.edit.id) {
        return {
          edit: { ...defaultEditState, ...props.edit },
          logoPreview: props.edit.logo || null,
        };
      }
    } else if (state.edit.id !== null && !props.edit) {
        return {
            edit: defaultEditState,
            logoPreview: null,
        }
    }
    return null; // No state update needed
  }

  componentDidUpdate(prevProps, prevState) {
    // Reset validator if ID changes
    if ((this.props.edit && prevProps.edit && this.props.edit.id !== prevProps.edit.id) ||
        (!this.props.edit && prevProps.edit && prevProps.edit.id !== null)) {
      if (this.validator) {
        this.validator.resetForm();
        $(this.formRef.current).find('.is-invalid, .is-valid').removeClass('is-invalid is-valid');
      }
    }

    // Update custom file input label
    const logoInput = this.logoInputRef.current;
    if (logoInput) {
        const fileName = logoInput.files && logoInput.files.length > 0 ? logoInput.files[0].name : "Choose file...";
        const label = $(logoInput).next('.custom-file-label');
        if (label.html() !== fileName) {
            label.html(fileName);
        }
    }
  }

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState((prevState) => ({
      edit: {
        ...prevState.edit,
        [name]: value,
      },
    }));
  };

  handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // Max 2MB
        IErrorMessage.show({ message: "Logo file size should not exceed 2MB.", type: "warning" });
        if(this.logoInputRef.current) this.logoInputRef.current.value = "";
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        IErrorMessage.show({ message: "Invalid file type. Please upload a JPG, PNG, GIF or WEBP.", type: "warning" });
        if(this.logoInputRef.current) this.logoInputRef.current.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        this.setState((prevState) => ({
          edit: {
            ...prevState.edit,
            logo: reader.result,
          },
          logoPreview: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    } else {
        this.setState(prevState => ({
            logoPreview: prevState.edit.logo
        }));
    }
  };

  handleRemoveLogo = () => {
    this.setState((prevState) => ({
      edit: {
        ...prevState.edit,
        logo: null,
      },
      logoPreview: null,
    }));
    if (this.logoInputRef.current) {
      this.logoInputRef.current.value = "";
    }
  };

  render() {
    const { name, phone, email, address, schoolSize, schoolType, schoolLevel, numberOfStudents, inviteSmsText, themeColor, mpesaPaybill } = this.state.edit; // Added new fields
    const { loading, logoPreview } = this.state;
    const currentModalId = modalNumber;
    const currentFormId = modalNumber + "form";
    const modalTitle = this.state.edit.id ? "Edit School's Details" : "Add New School";

    return (
      <div>
        <div
          className="modal fade"
          id={currentModalId}
          tabIndex={-1}
          role="dialog"
          aria-labelledby={`${currentModalId}_Label`}
          aria-hidden="true"
        >
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <form
                id={currentFormId}
                ref={this.formRef}
                className="needs-validation"
                noValidate
              >
                <div className="modal-header">
                  <h5 className="modal-title" id={`${currentModalId}_Label`}>{modalTitle}</h5>
                  <button
                    type="button"
                    className="close"
                    onClick={this.hide}
                    aria-label="Close"
                    disabled={loading}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <div className="modal-body">
                  {/* Basic Info Section */}
                  <h6 className="mb-3 text-muted">Basic Information</h6>
                  <div className="form-row">
                    <div className="form-group col-md-6">
                      <label htmlFor={`${currentFormId}_name`}>Name: <span className="text-danger">*</span></label>
                      <input
                        type="text" className="form-control" id={`${currentFormId}_name`} name="name"
                        placeholder="Enter school name" minLength="2" required value={name}
                        onChange={this.handleChange} disabled={loading}
                      />
                    </div>
                    <div className="form-group col-md-6">
                      <label htmlFor={`${currentFormId}_phone`}>Phone: <span className="text-danger">*</span></label>
                      <input
                        type="tel" className="form-control" id={`${currentFormId}_phone`} name="phone"
                        placeholder="Enter phone number" minLength="10" required value={phone}
                        onChange={this.handleChange} disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group col-md-6">
                      <label htmlFor={`${currentFormId}_email`}>Email: <span className="text-danger">*</span></label>
                      <input
                        type="email" className="form-control" id={`${currentFormId}_email`} name="email"
                        placeholder="Enter email address" required value={email}
                        onChange={this.handleChange} disabled={loading}
                      />
                    </div>
                    <div className="form-group col-md-4">
                      <label htmlFor={`${currentFormId}_schoolSize`}>School Size:</label>
                      <select
                        className="form-control" id={`${currentFormId}_schoolSize`} name="schoolSize"
                        value={schoolSize || ""} onChange={this.handleChange} disabled={loading}
                      >
                        <option value="">Select Size</option>
                        <option value="small">Small (1-50 students)</option>
                        <option value="medium">Medium (51-200 students)</option>
                        <option value="large">Large (201-500 students)</option>
                        <option value="xlarge">Extra Large (500+ students)</option>
                      </select>
                    </div>
                    <div className="form-group col-md-4">
                      <label htmlFor={`${currentFormId}_schoolType`}>School Type:</label>
                      <select
                        className="form-control" id={`${currentFormId}_schoolType`} name="schoolType"
                        value={schoolType || ""} onChange={this.handleChange} disabled={loading}
                      >
                        <option value="">Select Type</option>
                        <option value="public">Public School</option>
                        <option value="private">Private School</option>
                        <option value="charter">Charter School</option>
                        <option value="international">International School</option>
                      </select>
                    </div>
                    <div className="form-group col-md-4">
                      <label htmlFor={`${currentFormId}_schoolLevel`}>School Level:</label>
                      <select
                        className="form-control" id={`${currentFormId}_schoolLevel`} name="schoolLevel"
                        value={schoolLevel || ""} onChange={this.handleChange} disabled={loading}
                      >
                        <option value="">Select Level</option>
                        <option value="primary">Primary School</option>
                        <option value="secondary">Secondary School</option>
                        <option value="both">Primary & Secondary</option>
                        <option value="kindergarten">Kindergarten</option>
                        <option value="college">College/University</option>
                      </select>
                    </div>
                    <div className="form-group col-md-12">
                      <label htmlFor={`${currentFormId}_numberOfStudents`}>Approximate Number of Students:</label>
                      <input
                        type="number" className="form-control" id={`${currentFormId}_numberOfStudents`} name="numberOfStudents"
                        placeholder="e.g. 250" value={numberOfStudents || ""}
                        onChange={this.handleChange} disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group col-md-12">
                      <label htmlFor={`${currentFormId}_address`}>Address:</label>
                      <input
                        type="text" className="form-control" id={`${currentFormId}_address`} name="address"
                        placeholder="Enter physical address" value={address}
                        onChange={this.handleChange} disabled={loading}
                      />
                    </div>
                  </div>

                  <hr />

                  {/* Branding Section */}
                  <h6 className="mb-3 text-muted">Branding</h6>
                  <div className="form-row">
                    <div className="form-group col-md-7">
                        <label htmlFor={`${currentFormId}_logo`}>School Logo</label>
                        {logoPreview && (
                            <div className="mb-3 text-center">
                                <img
                                    src={logoPreview} alt="Logo Preview"
                                    style={{ maxWidth: "120px", maxHeight: "120px", border: "1px solid #ddd", padding: "5px", borderRadius: "4px", objectFit: "contain" }}
                                />
                                <button
                                    type="button" className="btn btn-sm btn-outline-danger d-block mx-auto mt-2"
                                    onClick={this.handleRemoveLogo} disabled={loading}
                                >
                                    <i className="la la-trash mr-1"></i> Remove Logo
                                </button>
                            </div>
                        )}
                        <div className="custom-file">
                            <input
                                type="file" className="custom-file-input" id={`${currentFormId}_logo`} name="logoFile"
                                accept="image/png, image/jpeg, image/gif, image/webp" onChange={this.handleLogoChange}
                                ref={this.logoInputRef} disabled={loading}
                            />
                            <label className="custom-file-label" htmlFor={`${currentFormId}_logo`}>Choose file...</label>
                        </div>
                        <small className="form-text text-muted">Max 2MB. PNG, JPG, GIF, WEBP.</small>
                    </div>
                    <div className="form-group col-md-5">
                        <label htmlFor={`${currentFormId}_themeColor`}>Theme Color:</label>
                        <div className="input-group">
                            <input
                                type="color"
                                className="form-control form-control-color" // Bootstrap 5 class for color inputs
                                id={`${currentFormId}_themeColor`}
                                name="themeColor"
                                value={themeColor}
                                onChange={this.handleChange}
                                disabled={loading}
                                title="Choose your theme color"
                                style={{height: 'calc(1.5em + .75rem + 2px)'}} // Match height of other inputs
                            />
                            <div className="input-group-append">
                                <span className="input-group-text" style={{ padding: '0.375rem 0.75rem' }}>
                                    {themeColor?.toUpperCase()}
                                </span>
                            </div>
                        </div>
                        <small className="form-text text-muted">Select the primary theme color.</small>
                        {/* Optional: Swatch Preview if form-control-color doesn't show it well */}
                        {/* <div style={{ width: '30px', height: '30px', backgroundColor: themeColor, border: '1px solid #ccc', marginTop: '5px' }}></div> */}

                    </div>
                  </div>


                  <hr />

                  {/* Invitation Message Section */}
                  <h6 className="mb-3 text-muted">Communication</h6>
                  <div className="form-group">
                    <label htmlFor={`${currentFormId}_inviteSmsText`}>Invite message: <span className="text-danger">*</span></label>
                    <textarea
                      className="form-control" id={`${currentFormId}_inviteSmsText`} name="inviteSmsText"
                      minLength="2" rows="5" required value={inviteSmsText}
                      onChange={this.handleChange} disabled={loading}
                      placeholder="Enter the SMS message for new user invitations"
                    />
                     <small className="form-text text-muted">
                        Placeholders: <code>{`{{username}}`}</code>, <code>{`{{team_name}}`}</code>, <code>{`{{phone_number}}`}</code>, <code>{`{{password}}`}</code>
                     </small>
                  </div>

                  <hr />

                  {/* Payment Configuration Section */}
                  <h6 className="mb-3 text-muted">Payment Configuration</h6>
                  <div className="form-group">
                    <label htmlFor={`${currentFormId}_mpesaPaybill`}>M-Pesa Paybill Number:</label>
                    <input
                      type="text"
                      className="form-control"
                      id={`${currentFormId}_mpesaPaybill`}
                      name="mpesaPaybill"
                      placeholder="e.g. 123456"
                      value={mpesaPaybill || ""}
                      onChange={this.handleChange}
                      disabled={loading}
                      pattern="[0-9]{5,7}"
                      title="Enter a valid M-Pesa paybill number (5-7 digits)"
                    />
                    <small className="form-text text-muted">
                      Configure the school's M-Pesa paybill to receive automatic transfers from parent payments. 
                      A platform fee will be deducted before transfer.
                    </small>
                  </div>
                </div>
                <div className="modal-footer">
                   <button
                    type="button" className="btn btn-secondary"
                    onClick={this.hide} disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit" className="btn btn-primary"
                    disabled={this.state.loading}
                  >
                    {this.state.loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm mr-1" role="status" aria-hidden="true" />
                        Saving...
                      </>
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

export default Modal;