import React from 'react';
// Removed unused imports: calculateTripDuration, calculateScheduleDuration, Stat

import EditSchoolModal from "./edit_school_details.js";
import DeleteSchoolModal from "./delete.js";
import Data from "../../../../utils/data";

// Instantiate modals outside the class or ensure they are handled correctly if needed elsewhere
// It's often better to manage modal visibility via state within the parent component,
// but we'll keep your instance approach for now.
const editSchoolModalInstance = new EditSchoolModal();
const deleteSchoolModalInstance = new DeleteSchoolModal();

var toastr = window.toastr;

// --- Inline Styles ---
const styles = {
  portletBody: {
    padding: '25px', // Standard portlet padding
  },
  // NEW: Container for logo, name, and theme color
  schoolHeaderSection: {
    display: 'flex',
    alignItems: 'center', // Align items vertically
    gap: '20px', // Space between logo and info
    marginBottom: '1.5rem', // Space below this header section
    paddingBottom: '1.5rem', // Space before the border
    borderBottom: '1px solid #ebedf2', // Subtle separator
  },
  logoContainer: {
    flexShrink: 0, // Prevent logo container from shrinking
  },
  logoImage: {
    width: '80px', // Fixed width for the logo
    height: '80px', // Fixed height for the logo
    objectFit: 'contain', // Ensures logo isn't stretched, maintains aspect ratio
    borderRadius: '8px', // Slightly rounded corners for the logo
    border: '1px solid #eee', // Light border around the logo
  },
  logoPlaceholder: {
    width: '80px',
    height: '80px',
    backgroundColor: '#f8f9fa', // Light gray background
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    color: '#adb5bd', // Muted text color
    border: '1px solid #dee2e6',
    textAlign: 'center',
  },
  schoolInfoMain: {
    flexGrow: 1, // Allow this section to take remaining space
  },
  schoolNameDisplay: {
    fontSize: '1.75rem', // Larger font size for school name
    fontWeight: '600', // Bold
    color: '#343a40', // Darker color for prominence
    marginBottom: '0.5rem',
    lineHeight: 1.3,
  },
  themeColorDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px', // Space between label, swatch, and value
    fontSize: '0.9rem', // Slightly smaller font for this detail
    color: '#595d6e',
  },
  themeColorSwatch: {
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    border: '1px solid #ced4da', // Border for the swatch
    display: 'inline-block',
  },
  themeColorLabel: {
    fontWeight: '600', // Bold label
  },
  detailsContainer: {
    marginBottom: '2rem', // Space below details before buttons
  },
  detailItem: {
    display: 'flex', // Align label and value
    marginBottom: '0.8rem', // Space between detail rows
    fontSize: '1rem', // Readable font size
  },
  label: {
    fontWeight: '600', // Make label bold
    color: '#595d6e', // Standard label color
    width: '140px', // Fixed width for alignment
    flexShrink: 0, // Prevent label from shrinking
    marginRight: '10px',
  },
  value: {
    color: '#212529', // Standard text color
    wordBreak: 'break-word', // Prevent long values from overflowing badly
  },
  buttonContainer: {
    display: 'flex', // Align buttons horizontally
    gap: '10px', // Space between buttons
    marginTop: '1.5rem', // Space above buttons
  },
  editButton: {
    // Using Bootstrap classes mostly, but can add overrides
  },
  archiveButton: {
    // Using Bootstrap classes mostly, but can add overrides
  }
};
// --- End Styles ---

export default class SchoolDetails extends React.Component {
  state = {
    school: null,
    isSuperAdmin: false,
  };

  _isMounted = false;

  componentDidMount() {
    this._isMounted = true;
    const userData = JSON.parse(localStorage.getItem("user")) || {};
    const isSuperAdmin = userData.userType === 'sAdmin';

    const school = Data.schools.getSelected();
    if (school) {
      this.setState({ school, isSuperAdmin });
    } else {
      this.setState({ isSuperAdmin });
    }

    Data.schools.subscribe(({ schools }) => {
      if (this._isMounted) {
        const currentSelected = Data.schools.getSelected();
        if (currentSelected?.id !== this.state.school?.id) {
            this.setState({ school: currentSelected });
        }
      }
    });
  }

  componentWillUnmount() {
    this._isMounted = false;
    // Data.schools.unsubscribe(this.handleSchoolUpdate); // Example if needed
  }

  async saveSchoolDetails(data) {
    console.log("Triggering save for school details. Data received:", data);
    const { id, name, phone, email, address, schoolSize, inviteSmsText, logo, themeColor } = data;

    if (id) {
      try {
        const schoolDataPayload = {
          id, name, phone, email, address, schoolSize, inviteSmsText, logo, themeColor
        };
        console.log("Updating school with payload:", schoolDataPayload);
        await Data.schools.update(schoolDataPayload);
        console.log(`School with ID ${id} updated successfully.`);
        // Optionally, update local state if Data.schools.update doesn't trigger subscription immediately
        // or if you want to reflect changes before subscription fires
        // if (this._isMounted) {
        //   this.setState({ school: { ...this.state.school, ...schoolDataPayload } });
        // }
      } catch (error) {
        console.error(`Error updating school with ID ${id}:`, error);
      }
    } else {
      console.warn("Cannot save school details: School ID is missing.");
    }
  }

  async archiveSchool() {
    console.log("Triggering archive");
    if (this.state.school && this.state.school.id) {
      Data.schools.archive(this.state.school.id); // Assuming archive might take an ID
    } else {
      Data.schools.archive(); // Fallback to archive selected if no ID passed
    }
  }

  render() {
    const { school, isSuperAdmin } = this.state;

    if (!school) {
      return (
        <div className="kt-portlet">
          <div className="kt-portlet__head">
            <div className="kt-portlet__head-label">
              <h3 className="kt-portlet__head-title">School Information</h3>
            </div>
          </div>
          <div className="kt-portlet__body" style={styles.portletBody}>
            Loading school details...
          </div>
        </div>
      );
    }

    return (
      <div className="kt-portlet kt-portlet--height-fluid">
        <DeleteSchoolModal save={this.archiveSchool} schoolToDelete={school} />
        <EditSchoolModal save={data => this.saveSchoolDetails(data)} edit={school} />

        <div className="kt-portlet__head">  
          <div className="kt-portlet__head-label">
            {/* Title of the portlet */}
            <h3 className="kt-portlet__head-title">School Details</h3>
          </div>
        </div>

        <div className="kt-portlet__body" style={styles.portletBody}>
          {/* School Header: Logo, Name, Theme Color */}
          <div style={styles.schoolHeaderSection}>
            <div style={styles.logoContainer}>
              {school.logo ? (
                <img src={school.logo} alt={`${school.name || 'School'} Logo`} style={styles.logoImage} />
              ) : (
                <div style={styles.logoPlaceholder}><span>No Logo</span></div>
              )}
            </div>
            <div style={styles.schoolInfoMain}>
              <h4 style={styles.schoolNameDisplay}>{school.name || 'N/A'}</h4>
              {school.themeColor && (
                <div style={styles.themeColorDisplay}>
                  <span style={styles.themeColorLabel}>Theme:</span>
                  <div style={{ ...styles.themeColorSwatch, backgroundColor: school.themeColor }} title={`Theme Color: ${school.themeColor}`} />
                  <span style={styles.value}>{school.themeColor}</span>
                </div>
              )}
            </div>
          </div>

          {/* Structured Details */}
          <div style={styles.detailsContainer}>
            {/* School Name is now in the header, so we can remove it from here if it was present */}
            <div style={styles.detailItem}>
              <span style={styles.label}>Phone:</span>
              <span style={styles.value}>{school.phone || 'N/A'}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.label}>Email:</span>
              <span style={styles.value}>{school.email || 'N/A'}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.label}>Address:</span>
              <span style={styles.value}>{school.address || 'N/A'}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.label}>School Size:</span>
              <span style={styles.value}>{school.schoolSize ? `${school.schoolSize} students` : 'N/A'}</span>
            </div>
            {school.inviteSmsText && ( // Conditionally render Invite SMS if present
             <div style={styles.detailItem}>
               <span style={styles.label}>Invite SMS:</span>
               <span style={styles.value}>{school.inviteSmsText}</span>
             </div>
            )}
            {isSuperAdmin && (
              <div style={styles.detailItem}>
                <span style={styles.label}>Rate / Student:</span>
                <span style={styles.value}>{school.ratePerStudent ? `KES ${school.ratePerStudent}` : 'Not set'}</span>
              </div>
            )}
          </div>

          {/* Login and Register URLs */}
          <div style={styles.detailsContainer}>
            <div style={styles.detailItem}>
              <span style={styles.label}>Login URL:</span>
              <span style={styles.value}>
                
                <button
                  type="button"
                  className="btn btn-outline-brand"
                  style={styles.copyButton}
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/?school=${school.id}#/`)
                      .then(() => toastr.success('Copied to clipboard'))
                      .catch(err => toastr.error(`Error copying to clipboard: ${err.message}`));
                  }}
                >
                  Copy
                </button>
                {/* <a
                  href={`${window.location.origin}/?school=${school.id}#/`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {`${window.location.origin}/?school=${school.id}#/`}
                </a> */}
              </span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.label}>Register URL:</span>
              <span style={styles.value}>
                
                <button
                  type="button"
                  className="btn btn-outline-brand"
                  style={styles.copyButton}
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/#/register?school=${school.id}`)
                      .then(() => toastr.success('Copied to clipboard'))
                      .catch(err => toastr.error(`Error copying to clipboard: ${err.message}`));
                  }}
                >
                  Copy
                </button>
                {/* <a
                  href={`${window.location.origin}/#/register?school=${school.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {`${window.location.origin}/#/register?school=${school.id}`}
                </a> */}
              </span>
            </div>
          </div>


          {/* Buttons Container */}
          <div style={styles.buttonContainer}>
            <button
              type="button"
              className="btn btn-outline-brand"
              style={styles.editButton}
              onClick={() => editSchoolModalInstance.show()}
            >
              Edit Details
            </button>
            <button
              type="button"
              className="btn btn-danger"
              style={styles.archiveButton}
              onClick={() => deleteSchoolModalInstance.show()}
            >
              Archive School
            </button>
          </div>
        </div>
      </div>
    );
  }
}