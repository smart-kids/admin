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
        <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
            
            {/* Header */}
            <div className="modal-header border-0 bg-light p-4 align-items-center">
              <h5 className="modal-title font-weight-bold text-dark d-flex align-items-center" style={{ fontSize: '1.25rem', gap: '8px' }}>
                <i className="la la-laptop-medical text-primary" style={{ fontSize: '24px' }}></i>
                Tablet Provisioning & MDM Onboarding
              </h5>
              <button type="button" className="close" onClick={this.handleClose} style={{ fontSize: '24px' }}>
                <span aria-hidden="true">&times;</span>
              </button>
            </div>

            {/* Split Content Body */}
            <div className="modal-body p-0">
              <div className="d-flex flex-wrap flex-md-nowrap align-items-stretch">
                
                {/* Left Side: QR Code Panel */}
                <div className="p-4 bg-light border-right text-center d-flex flex-column align-items-center justify-content-center" style={{ flex: '1 0 320px', minWidth: '320px' }}>
                  <div className="mb-3">
                    <span className="badge badge-primary px-3 py-2 font-weight-bold" style={{ borderRadius: '20px', letterSpacing: '0.5px' }}>
                      ONBOARDING CONFIG
                    </span>
                  </div>
                  
                  <div className="qr-wrapper bg-white p-3 border rounded shadow-sm d-flex align-items-center justify-content-center" style={{ height: '230px', width: '230px', borderRadius: '16px' }}>
                    {error ? (
                      <div className="text-danger small">{error}</div>
                    ) : qrUrl ? (
                      <img src={qrUrl} alt="Onboarding QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <div className="kt-spinner kt-spinner--brand kt-spinner--sm"></div>
                    )}
                  </div>
                  
                  <div className="mt-4 text-muted small px-3">
                    <i className="la la-shield-alt mr-1 text-primary"></i>
                    This QR code contains the secure school provisioning parameters used by Android Enterprise.
                  </div>
                </div>

                {/* Right Side: Step-by-Step Secure Lockdown Guide */}
                <div className="p-4 flex-grow-1" style={{ backgroundColor: '#ffffff' }}>
                  <h6 className="font-weight-bold text-dark mb-3 d-flex align-items-center" style={{ fontSize: '1rem' }}>
                    <i className="la la-info-circle text-primary mr-2" style={{ fontSize: '20px' }}></i>
                    Ultimate Lockdown Instructions
                  </h6>
                  <p className="text-muted mb-4" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                    Follow this exact workflow to register a school tablet as a fully managed Device Owner, automatically enforcing air-tight child locking and making it burglar/ADB-proof.
                  </p>

                  <div className="steps-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    <div className="step-item d-flex" style={{ gap: '15px' }}>
                      <div className="step-number d-flex align-items-center justify-content-center font-weight-bold" style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#E8F0FE', color: '#1A73E8', fontSize: '13px', flexShrink: 0 }}>
                        1
                      </div>
                      <div>
                        <h6 className="font-weight-bold text-dark mb-1" style={{ fontSize: '14px' }}>Factory Reset Tablet</h6>
                        <p className="text-muted m-0" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                          Start with a completely new or factory-reset tablet. If it is already set up, perform a full Factory Reset first.
                        </p>
                      </div>
                    </div>

                    <div className="step-item d-flex" style={{ gap: '15px' }}>
                      <div className="step-number d-flex align-items-center justify-content-center font-weight-bold" style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#E8F0FE', color: '#1A73E8', fontSize: '13px', flexShrink: 0 }}>
                        2
                      </div>
                      <div>
                        <h6 className="font-weight-bold text-dark mb-1" style={{ fontSize: '14px' }}>Activate Hidden Scan Wizard</h6>
                        <p className="text-muted m-0" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                          On the initial Android <strong>"Welcome"</strong> screen (setup wizard), tap the empty background space <strong>6 times rapidly</strong>. This will launch Android's hidden QR provisioning camera.
                        </p>
                      </div>
                    </div>

                    <div className="step-item d-flex" style={{ gap: '15px' }}>
                      <div className="step-number d-flex align-items-center justify-content-center font-weight-bold" style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#E8F0FE', color: '#1A73E8', fontSize: '13px', flexShrink: 0 }}>
                        3
                      </div>
                      <div>
                        <h6 className="font-weight-bold text-dark mb-1" style={{ fontSize: '14px' }}>Connect WiFi & Scan QR</h6>
                        <p className="text-muted m-0" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                          Connect the tablet to WiFi when prompted by the wizard, then align the tablet camera with the onboarding QR code on this screen.
                        </p>
                      </div>
                    </div>

                    <div className="step-item d-flex" style={{ gap: '15px' }}>
                      <div className="step-number d-flex align-items-center justify-content-center font-weight-bold" style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#E8F0FE', color: '#1A73E8', fontSize: '13px', flexShrink: 0 }}>
                        4
                      </div>
                      <div>
                        <h6 className="font-weight-bold text-dark mb-1" style={{ fontSize: '14px' }}>Automatic MDM Enrollment</h6>
                        <p className="text-muted m-0" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                          Android will enroll the tablet, download <strong>ShulePlus</strong>, set it as the secure Device Owner, and automatically block ADB Debugging, Factory Reset, and USB File Transfers.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer bg-light border-0 p-3 pr-4 d-flex justify-content-end">
              <button 
                type="button" 
                className="btn btn-secondary font-weight-bold px-4"
                onClick={this.handleClose}
                style={{ borderRadius: '8px' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default QRModal;
