import React from "react";

const $ = window.$;

const MODAL_ID = "qr_onboarding_modal_" + Math.random().toString(36).substr(2, 9);

class QRModal extends React.Component {
  componentDidMount() {
    $("#" + MODAL_ID).modal({
      show: true,
      backdrop: "static",
      keyboard: false
    });
  }

  componentWillUnmount() {
    $("#" + MODAL_ID).modal("hide");
  }

  handleClose = () => {
    $("#" + MODAL_ID).modal("hide");
    this.props.onClose();
  };

  render() {
    // We will generate a payload for onboarding.
    const schoolId = localStorage.getItem("school");
    const payload = JSON.stringify({
      action: "ONBOARD",
      schoolId: schoolId,
      timestamp: Date.now()
    });

    // Use a free QR Code API for rendering the QR code image
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(payload)}`;

    return (
      <div
        className="modal fade"
        id={MODAL_ID}
        tabIndex="-1"
        role="dialog"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content border-0 shadow-lg" style={{borderRadius: '16px'}}>
            <div className="modal-header bg-light border-bottom">
              <h5 className="modal-title font-weight-bold">
                Device Onboarding
              </h5>
              <button type="button" className="close" onClick={this.handleClose}>
                <span aria-hidden="true">&times;</span>
              </button>
            </div>

            <div className="modal-body p-4 text-center">
              <p className="mb-4">Scan this QR code with the ShulePlus app to enroll a new tablet.</p>
              
              <div className="qr-container bg-white p-3 d-inline-block border rounded shadow-sm">
                <img src={qrUrl} alt="Onboarding QR Code" />
              </div>
              
              <div className="mt-4 text-muted small">
                This QR code contains the secure school provisioning configuration.
              </div>
            </div>

            <div className="modal-footer bg-light border-top">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={this.handleClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default QRModal;
