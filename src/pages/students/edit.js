import React from "react";
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
      id: "",
      names: "",
      registration: "",
      gender: "",
      class: null,
      route: null,
      parent: null,
      parent2: null,
      paidFees: 0,
      balanceBroughtForward: 0,
      yearOfEntry: "",
      profileImage: null
    },
    profileImageFile: null,
    profileImageUrl: null,
    isUploading: false,
    uploadProgress: 0
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
    // Clean up backdrop and modal remnants
    $(".modal-backdrop").remove();
    $("body").removeClass("modal-open");
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
    this.setState({ profileImageFile: null, profileImageUrl: null, edit: { ...this.state.edit, profileImage: null } });
  };

  uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    
    const UPLOAD_URL = window.location.href.includes('localhost')
      ? 'http://localhost:4001/api/upload'
      : 'https://graph-ongyy.kinsta.app/api/upload';

    const response = await fetch(UPLOAD_URL, {
      method: "POST",
      body: formData
    });
    
    if (!response.ok) {
      throw new Error("Upload failed");
    }
    
    const data = await response.json();
    return data.url;
  };

  componentDidMount() {
    
    this.validator = $("#" + modalNumber + "form").validate({
      errorClass: "invalid-feedback",
      errorElement: "div",

      highlight: function (element) {
        $(element).addClass("is-invalid");
      },
      unhighlight: function (element) {
        $(element).removeClass("is-invalid");
      },

      submitHandler: async (form, event) => {
        event.preventDefault();
        try {
          this.setState({ loading: true });

          let profileImage = this.state.edit.profileImage;
          if (this.state.profileImageFile) {
            this.setState({ isUploading: true, uploadProgress: 50 });
            profileImage = await this.uploadFile(this.state.profileImageFile);
            this.setState({ uploadProgress: 100 });
          } else if (this.state.profileImageUrl === null) {
            // User removed image
            profileImage = null;
          }

          const payload = {
            id: this.state.edit.id,
            names: this.state.edit.names,
            registration: this.state.edit.registration,
            gender: this.state.edit.gender,
            yearOfEntry: this.state.edit.yearOfEntry,
            class: this.state.edit.class?.id || "",
            route: this.state.edit.route?.id || "",
            parent: this.state.edit.parent?.id || "",
            parent2: this.state.edit.parent2?.id || "",
            profileImage,
            paidFees: parseFloat(this.state.edit.paidFees) || 0,
            balanceBroughtForward: parseFloat(this.state.edit.balanceBroughtForward) || 0
          };

          await this.props.save(payload);
          
          this.hide();
          this.setState({ loading: false });
        } catch (error) {
          this.setState({ loading: false });
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
      return {
        edit: {
          ...props.edit,
          class: props.edit.class || null,
          route: props.edit.route || null,
          parent: props.edit.parent || null,
          parent2: props.edit.parent2 || null,
          gender: props.edit.gender || "",
          yearOfEntry: props.edit.yearOfEntry || "",
          profileImage: props.edit.profileImage || null,
          paidFees: props.edit.paidFees || 0,
          balanceBroughtForward: props.edit.balanceBroughtForward || 0
        },
        profileImageUrl: props.edit.profileImage || null,
        profileImageFile: null
      };
    }
    return null;
  }

  render() {
    const { edit } = this.state;
    
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
                  <h5 className="modal-title">Edit Student</h5>
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
                            <input
                              type="text"
                              className="form-control"
                              name="names"
                              minLength="2"
                              required
                              value={edit.names || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                this.setState(prevState => ({ 
                                  edit: { ...prevState.edit, names: val } 
                                }));
                              }}
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label>Registration Number:</label>
                            <input
                              type="text"
                              className="form-control"
                              name="registration"
                              minLength="2"
                              required
                              value={edit.registration || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                this.setState(prevState => ({ 
                                  edit: { ...prevState.edit, registration: val } 
                                }));
                              }}
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label>Year of Entry:</label>
                            <input
                              type="text"
                              className="form-control"
                              name="yearOfEntry"
                              value={edit.yearOfEntry || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                this.setState(prevState => ({ 
                                  edit: { ...prevState.edit, yearOfEntry: val } 
                                }));
                              }}
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label>Gender:</label>
                            <select
                              name="gender"
                              className="form-control"
                              required
                              value={edit.gender || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                this.setState(prevState => ({ 
                                  edit: { ...prevState.edit, gender: val } 
                                }));
                              }}
                            >
                              <option value="">Select gender</option>
                              {["MALE", "FEMALE"].map(g => (
                                <option key={g} value={g}>{g}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* School & Transport Row */}
                    <div className="row mb-4">
                      <div className="col-lg-6 mb-3 mb-lg-0">
                        <label>Class:</label>
                        <select
                          className="form-control"
                          name="class"
                          required
                          value={edit.class?.id || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const selectedObj = this.props.classes.find(c => String(c.id) === String(val));
                            this.setState(prevState => ({ 
                                edit: { ...prevState.edit, class: selectedObj || null } 
                            }));
                          }}
                        >
                          <option value="">Select class</option>
                          {this.props.classes.map(Iclass => (
                            <option key={Iclass.id} value={Iclass.id}>{Iclass.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-lg-6 mb-3 mb-lg-0">
                        <label>Route:</label>
                        <select
                          name="route"
                          className="form-control"
                          required
                          value={edit.route?.id || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const selectedObj = this.props.routes.find(r => String(r.id) === String(val));
                            this.setState(prevState => ({ 
                                edit: { ...prevState.edit, route: selectedObj || null } 
                            }));
                          }}
                        >
                          <option value="">Select route</option>
                          {this.props.routes.map(route => (
                            <option key={route.id} value={route.id}>{route.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Parents Row */}
                    <div className="row mb-4">
                      <div className="col-lg-6 mb-3 mb-lg-0">
                        <label>Parent:</label>
                        <select
                          name="parent"
                          className="form-control"
                          required
                          value={edit.parent?.id || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const selectedObj = this.props.parents.find(p => String(p.id) === String(val));
                            this.setState(prevState => ({ 
                                edit: { ...prevState.edit, parent: selectedObj || null } 
                            }));
                          }}
                        >
                          <option value="">Select parent</option>
                          {this.props.parents.map(parent => (
                            <option key={parent.id} value={parent.id}>
                              {parent.name} ({parent.phone || 'No Phone'})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-lg-6 mb-3 mb-lg-0">
                        <label>Alternative Parent:</label>
                        <select
                          name="parent2"
                          className="form-control"
                          value={edit.parent2?.id || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const selectedObj = this.props.parents.find(p => String(p.id) === String(val));
                            this.setState(prevState => ({ 
                                edit: { ...prevState.edit, parent2: selectedObj || null } 
                            }));
                          }}
                        >
                          <option value="">Select parent (Optional)</option>
                          {this.props.parents.map(parent => (
                            <option key={parent.id} value={parent.id}>
                              {parent.name} ({parent.phone || 'No Phone'})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Fees Row */}
                    <div className="row">
                      <div className="col-lg-6 mb-3 mb-lg-0">
                        <label>Paid Fees:</label>
                        <input
                          type="number"
                          className="form-control"
                          name="paidFees"
                          value={edit.paidFees || 0}
                          onChange={(e) => {
                            const val = e.target.value;
                            this.setState(prevState => ({ 
                                edit: { ...prevState.edit, paidFees: val } 
                            }));
                          }}
                        />
                      </div>
                      <div className="col-lg-6 mb-3 mb-lg-0">
                        <label>Balance Brought Forward:</label>
                        <input
                          type="number"
                          className="form-control"
                          name="balanceBroughtForward"
                          value={edit.balanceBroughtForward || 0}
                          onChange={(e) => {
                            const val = e.target.value;
                            this.setState(prevState => ({ 
                                edit: { ...prevState.edit, balanceBroughtForward: val } 
                            }));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-outline-brand"
                    type="submit"
                    disabled={this.state.loading || this.state.isUploading}
                  >
                    {this.state.loading || this.state.isUploading ? (
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