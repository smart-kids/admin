import React from "react";
import ErrorMessage from "./components/error-toast";
import AddParentModal from "../parents/add";
import AddClassModal from "../classes/add"
import AddRouteModal from "../routes/add"

import Select from 'react-select';

import Data from "../../utils/data"
const IErrorMessage = new ErrorMessage();

const $ = window.$;
const addParentModal = new AddParentModal();
const addClassModal = new AddClassModal();
const addRouteModal = new AddRouteModal();

const MODAL_ID = "student-modal-" + Math.random().toString().split(".")[1];

// --- NEW: Define the initial state as a constant ---
// This makes resetting the state much cleaner and less error-prone.
const initialState = {
  loading: false,
  names: "",
  route: "",
  gender: "",
  registration: "",
  yearOfEntry: "",
  class: "",
  parent: "",
  parent2: "",
  paidFees: 0,
  balanceBroughtForward: 0,
  profileImageFile: null,
  profileImageUrl: null,
  isUploading: false,
  uploadProgress: 0,

  // State for react-select value objects
  setClass: null,
  setRoute: null,
  setParent: null,
  setParent2: null,

  // Data lists (these don't need to be reset)
  parents: [],
  classes: [],
  routes: []
};


class Modal extends React.Component {
  // Use the new constant for the initial state
  state = { ...initialState };

  show() {
    // Optional: You can also reset the state every time the modal is shown
    // this.resetState(); 
    $("#" + MODAL_ID).modal({
      show: true,
      backdrop: "static",
      keyboard: false
    });
  }
  
  hide() {
    $("#" + MODAL_ID).modal("hide");
  }

  // --- NEW: A dedicated method to reset the form's state ---
  resetState = () => {
    // We only want to reset the form fields, not the data lists (parents, classes, etc.)
    this.setState({
      loading: false,
      names: "",
      route: "",
      gender: "",
      registration: "",
      yearOfEntry: "",
      class: "",
      parent: "",
      parent2: "",
      paidFees: 0,
      balanceBroughtForward: 0,
      profileImageFile: null,
      profileImageUrl: null,
      isUploading: false,
      uploadProgress: 0,
      setClass: null,
      setRoute: null,
      setParent: null,
      setParent2: null,
    });
    // Also reset the jQuery validator to clear any previous error messages
    if (this.validator) {
      this.validator.resetForm();
    }
  }

  // --- Image Upload Handlers ---
  handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      this.setState({
        profileImageFile: file,
        profileImageUrl: URL.createObjectURL(file)
      });
    }
  };

  handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      this.setState({
        profileImageFile: file,
        profileImageUrl: URL.createObjectURL(file)
      });
    }
  };

  handleDragOver = (e) => {
    e.preventDefault();
  };

  removeImage = () => {
    this.setState({ profileImageFile: null, profileImageUrl: null });
  };

  uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file); // Must match upload.single("file") in server.js
    
    const UPLOAD_URL = 'https://graph-ongyy.kinsta.app/upload';

    try {
      const response = await fetch(UPLOAD_URL, {
        method: "POST",
        body: formData 
        // Note: NEVER set 'Content-Type' manually when sending FormData. 
        // The browser automatically sets it to 'multipart/form-data' with the correct boundary.
      });
      
      if (!response.ok) {
        // Attempt to extract the error message from the backend
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.details || `Upload failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Server returns: { message: "Upload successful", url: proxyUrl, key: req.file.key }
      return data.url; 
      
    } catch (error) {
      console.error("Upload Error:", error);
      throw error; // Let the handleSubmit catch block update the UI errors
    }
  };

  async componentDidMount() {
    const classes = Data.classes.list();
    this.setState({ classes });
    Data.classes.subscribe(({ classes }) => this.setState({ classes }));

    const routes = Data.routes.list();
    this.setState({ routes });
    Data.routes.subscribe(({ routes }) => this.setState({ routes }));

    const parents = Data.parents.list();
    this.setState({ parents });
    Data.parents.subscribe(({ parents }) => this.setState({ parents }));

    const _this = this;
    this.validator = $("#" + MODAL_ID + "form").validate({
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

          const { names, route, gender, registration, yearOfEntry, class: className, parent, parent2, paidFees, balanceBroughtForward, profileImageFile } = _this.state;
          
          let profileImageUrl = null;
          if (profileImageFile) {
            _this.setState({ isUploading: true, uploadProgress: 50 });
            profileImageUrl = await _this.uploadFile(profileImageFile);
            _this.setState({ uploadProgress: 100 });
          }

          const payload = { 
            names, 
            route, 
            gender, 
            registration, 
            yearOfEntry,
            class: className,
            parent, 
            parent2,
            profileImage: profileImageUrl,
            paidFees: parseFloat(paidFees) || 0,
            balanceBroughtForward: parseFloat(balanceBroughtForward) || 0
          };

          await _this.props.save(payload);
          _this.hide();
          
          // --- CHANGED: Call the resetState method on success ---
          _this.resetState();

        } catch (error) {
          console.error("Submission failed:", error);
          if (error && error.message) {
            IErrorMessage.show({ message: error.message });
          } else {
            IErrorMessage.show();
          }
        } finally {
           _this.setState({ loading: false });
        }
      }
    });
  }

  render() {
    return (
      <div>
        {/* Modals for adding related data */}
        <AddParentModal save={parent => Data.parents.create(parent)} />
        {/* You probably need to pass teachers to this component if it uses them */}
        <AddClassModal save={classData => Data.classes.create(classData)} teachers={[]} />
        {/* And students to this one */}
        <AddRouteModal students={[]} save={route => Data.routes.create(route)} />
        
        <div
          className="modal"
          id={MODAL_ID}
          tabIndex={-1}
          role="dialog"
          aria-labelledby="myLargeModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content">
              {/* --- FORM --- */}
              <form
                id={MODAL_ID + "form"}
                className="kt-form kt-form--label-right"
              >
                <div className="modal-header">
                  <h5 className="modal-title">Create Student</h5>
                  <button type="button" className="close" data-dismiss="modal" aria-label="Close" >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <div className="modal-body">
                  {/* ... The rest of your form JSX is unchanged ... */}
                  {/* ... Example input ... */}
                   <div className="kt-portlet__body">
                    {/* Top Row: Image + Personal Details */}
                    <div className="row mb-4">
                      {/* Image Upload Zone (Left Column) */}
                      <div className="col-lg-3 d-flex flex-column align-items-center justify-content-center mb-4 mb-lg-0">
                        {this.state.profileImageUrl ? (
                          <div className="cover-preview-wrapper" style={{ position: 'relative', width: '150px', height: '150px' }}>
                            <img src={this.state.profileImageUrl} alt="Preview" style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '75px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            {!this.state.isUploading && (
                              <button 
                                type="button" 
                                onClick={this.removeImage} 
                                style={{ position: 'absolute', top: 0, right: 0, background: '#ff3b30', color: 'white', borderRadius: '50%', width: '28px', height: '28px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
                              >
                                &times;
                              </button>
                            )}
                          </div>
                        ) : (
                          <label 
                            className="upload-zone" 
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '160px', height: '160px', padding: '15px', border: '2px dashed #a7abc3', borderRadius: '80px', cursor: 'pointer', background: '#f8f9fa', transition: 'all 0.2s' }}
                            onDragOver={this.handleDragOver}
                            onDrop={this.handleDrop}
                          >
                            <input type="file" accept="image/*" hidden onChange={this.handleImageSelect} />
                            <i className="la la-camera" style={{ fontSize: '32px', color: '#a7abc3', marginBottom: '8px' }}></i>
                            <span style={{ color: '#595d6e', fontWeight: 500, textAlign: 'center', fontSize: '12px' }}>Upload Photo</span>
                          </label>
                        )}
                      </div>
                      
                      {/* Personal Details (Right Column) */}
                      <div className="col-lg-9">
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label>Full Name:</label>
                            <input type="text" className="form-control" name="names" minLength="2" required value={this.state.names} onChange={(e) => this.setState({ names: e.target.value })} />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label>Registration Number:</label>
                            <input type="text" className="form-control" name="registration" minLength="2" required value={this.state.registration} onChange={(e) => this.setState({ registration: e.target.value })} />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label>Year of Entry:</label>
                            <input type="text" className="form-control" name="yearOfEntry" value={this.state.yearOfEntry} onChange={(e) => this.setState({ yearOfEntry: e.target.value })} />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label htmlFor="gender">Gender:</label>
                            <select name="gender" className="form-control" id="gender" required value={this.state.gender} onChange={(e) => this.setState({ gender: e.target.value })}>
                              <option value="">Select gender</option>
                              {["MALE", "FEMALE"].map(gender => (<option key={gender} value={gender}>{gender}</option>))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* School & Transport Row */}
                    <div className="row mb-4">
                      <div className="col-lg-6 mb-3 mb-lg-0">
                        <label>Class:</label>
                        <div className="d-flex gap-2" style={{ gap: '10px' }}>
                          <div style={{ flex: 1 }}>
                            <Select
                              name="class" 
                              value={this.state.setClass}
                              options={this.state.classes?.map(({ id: value, name: label }) => ({ value, label }))}
                              onChange={({ value, label }) => this.setState({ class: value, setClass: { value, label } })}
                            />
                          </div>
                          <button className="btn btn-outline-brand" type="button" onClick={() => { this.hide(); addClassModal.show(); }}>
                            + Class
                          </button>
                        </div>
                      </div>
                      <div className="col-lg-6 mb-3 mb-lg-0">
                        <label>Route:</label>
                        <div className="d-flex gap-2" style={{ gap: '10px' }}>
                          <div style={{ flex: 1 }}>
                            <Select
                              name="route"
                              value={this.state.setRoute}
                              options={this.state.routes?.map(({ id: value, name: label }) => ({ value, label }))}
                              onChange={({ value, label }) => this.setState({ route: value, setRoute: { value, label } })}
                            />
                          </div>
                          <button className="btn btn-outline-brand" type="button" onClick={() => { this.hide(); addRouteModal.show(); }}>
                            + Route
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Parents Row */}
                    <div className="row mb-4">
                      <div className="col-lg-6 mb-3 mb-lg-0">
                        <label>Parent:</label>
                        <div className="d-flex gap-2" style={{ gap: '10px' }}>
                          <div style={{ flex: 1 }}>
                            <Select
                              name="parent"
                              value={this.state.setParent}
                              options={this.state.parents?.map(({ id: value, name, phone }) => ({ value, label: `${name} (${phone || 'No Phone'})` }))}
                              onChange={({ value, label }) => this.setState({ parent: value, setParent: { value, label } })}
                            />
                          </div>
                          <button className="btn btn-outline-brand" type="button" onClick={() => { this.hide(); addParentModal.show(); }}>
                            + Parent
                          </button>
                        </div>
                      </div>
                      <div className="col-lg-6 mb-3 mb-lg-0">
                        <label>Second Parent (Optional):</label>
                        <Select
                          name="parent2"
                          isClearable
                          value={this.state.setParent2}
                          options={this.state.parents?.map(({ id: value, name, phone }) => ({ value, label: `${name} (${phone || 'No Phone'})` }))}
                          onChange={(selected) => this.setState({ parent2: selected ? selected.value : "", setParent2: selected })}
                        />
                      </div>
                    </div>

                    {/* Fees Row */}
                    <div className="row">
                      <div className="col-lg-6 mb-3 mb-lg-0">
                        <label>Paid Fees:</label>
                        <input type="number" className="form-control" name="paidFees" value={this.state.paidFees} onChange={(e) => this.setState({ paidFees: e.target.value })} />
                      </div>
                      <div className="col-lg-6 mb-3 mb-lg-0">
                        <label>Balance Brought Forward:</label>
                        <input type="number" className="form-control" name="balanceBroughtForward" value={this.state.balanceBroughtForward} onChange={(e) => this.setState({ balanceBroughtForward: e.target.value })} />
                      </div>
                    </div>

                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-outline-brand" type="submit" disabled={this.state.loading || this.state.isUploading}>
                    {this.state.loading || this.state.isUploading ? (<span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />) : ("Save")}
                  </button>
                  <button data-dismiss="modal" type="button" className="btn btn-outline-brand">
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