import React from "react";
import QRCode from "qrcode";

const $ = window.$;

const MODAL_ID = "qr_onboarding_modal_" + Math.random().toString(36).substr(2, 9);

class QRModal extends React.Component {
  state = {
    qrUrl: "",
    error: null
  };

  componentDidMount() {
    $("#" + MODAL_ID).modal({
      show: true,
      backdrop: "static",
      keyboard: false
    });

    this.generateQR();
  }

  componentWillUnmount() {
    $("#" + MODAL_ID).modal("hide");
  }

  generateQR = () => {
    const schoolId = localStorage.getItem("school");
    const payload = JSON.stringify({
      "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "com.shule.plusapp/.AdminReceiver",
      "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
        "schoolId": schoolId
      }
    });

    QRCode.toDataURL(payload, {
      width: 250,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF"
      }
    })
      .then(url => {
        this.setState({ qrUrl: url });
      })
      .catch(err => {
        console.error("Failed to generate onboarding QR code", err);
        this.setState({ error: "Failed to generate QR Code locally." });
      });
  };

  handleClose = () => {
    $("#" + MODAL_ID).modal("hide");
    this.props.onClose();
  };

  render() {
    const { qrUrl, error } = this.state;

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
              <p className="mb-4 font-weight-bold text-dark-75">Scan this QR code with the ShulePlus app to enroll a new tablet.</p>
              
              <div className="qr-container bg-white p-3 d-inline-block border rounded shadow-sm" style={{ minHeight: '250px', minWidth: '250px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {error ? (
                  <div className="text-danger small">{error}</div>
                ) : qrUrl ? (
                  <img src={qrUrl} alt="Onboarding QR Code" style={{ width: '250px', height: '250px' }} />
                ) : (
                  <div className="kt-spinner kt-spinner--brand kt-spinner--sm"></div>
                )}
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
