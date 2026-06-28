import React from "react";
import QRCode from "qrcode";
import Data from "../../utils/data";

const $ = window.$;

const MODAL_ID = "qr_onboarding_modal_" + Math.random().toString(36).substr(2, 9);

class QRModal extends React.Component {
  WIFI_STORAGE_KEY = 'qrmodal_wifi_config';
  API_BASE = 'https://cloud.shuleplus.co.ke/api';

  state = {
    qrUrl: "",
    error: null,
    wifiSsid: "",
    wifiPassword: "",
    wifiSecurityType: "WPA",
    wifiHidden: false,
    downloadUrl: "",
    signatureChecksum: "FB:14:AD:27:3C:DC:F3:33:CF:94:F9:01:9F:F1:63:70:1B:84:D2:23:1D:0B:0E:CF:4A:C2:BC:B7:66:C7:AB:76",
    enrollmentToken: "",
    showAdvancedConfig: false,
    enrolledDevices: [],
    initialDeviceIds: new Set()
  };

  componentDidMount() {
    $("#" + MODAL_ID).modal({
      show: true,
      backdrop: "static",
      keyboard: false
    });

    // Capture currently known devices so we only show newly enrolled ones in the live feed
    const currentDevices = Data.devices?.list() || [];
    this.setState({ initialDeviceIds: new Set(currentDevices.map(d => d.id)) });

    // Subscribe to real-time device updates
    this.unsubscribeDevices = Data.devices?.subscribe(({ devices }) => {
      if (!devices) return;
      const { initialDeviceIds } = this.state;
      // Reverse array to show newest first
      const newDevices = devices.filter(d => !initialDeviceIds.has(d.id)).reverse();
      this.setState({ enrolledDevices: newDevices });
    });

    // Restore persisted WiFi settings first, then fetch the latest APK info
    this.loadWifiFromStorage();
    this.fetchApkInfo();
  }

  componentWillUnmount() {
    $("#" + MODAL_ID).modal("hide");
    if (this.unsubscribeDevices) {
      this.unsubscribeDevices();
    }
  }

  generateQR = async () => {
    const schoolId = localStorage.getItem("school");
    const { wifiSsid, wifiPassword, wifiSecurityType, wifiHidden, downloadUrl, signatureChecksum, enrollmentToken } = this.state;

    // Generate enrollment token if not provided
    const token = enrollmentToken || await this.generateEnrollmentToken(schoolId);

    const payloadObj = {
      "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "com.shule.plusapp/.AdminReceiver",
      "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": downloadUrl,
      "android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM": signatureChecksum,
      "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_NAME": "com.shule.plusapp",
      "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
        "com.google.android.apps.work.clouddpc.EXTRA_ENROLLMENT_TOKEN": token,
        "schoolId": schoolId
      }
    };

    if (wifiSsid.trim()) {
      payloadObj["android.app.extra.PROVISIONING_WIFI_SSID"] = wifiSsid.trim();
      payloadObj["android.app.extra.PROVISIONING_WIFI_SECURITY_TYPE"] = wifiSecurityType;
      
      if (wifiSecurityType !== "NONE" && wifiPassword) {
        payloadObj["android.app.extra.PROVISIONING_WIFI_PASSWORD"] = wifiPassword;
      }
      
      if (wifiHidden) {
        payloadObj["android.app.extra.PROVISIONING_WIFI_HIDDEN"] = true;
      }
    }

    // Store the generated token
    if (!enrollmentToken) {
      this.setState({ enrollmentToken: token });
    }

    const payload = JSON.stringify(payloadObj);

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

  /**
   * Fetches the latest APK info from the server and pre-populates downloadUrl.
   * Falls back to generating the QR with whatever state is already set.
   */
  fetchApkInfo = async () => {
    try {
      const res = await fetch(`${this.API_BASE}/apk-info`);
      if (res.ok) {
        const data = await res.json();
        if (data.downloadUrl) {
          this.setState({ downloadUrl: data.downloadUrl }, this.generateQR);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not fetch APK info, using current state:', e.message);
    }
    this.generateQR();
  };

  /** Persists current WiFi fields to localStorage so they survive modal close/reopen. */
  saveWifiToStorage = () => {
    try {
      const { wifiSsid, wifiPassword, wifiSecurityType, wifiHidden } = this.state;
      localStorage.setItem(
        this.WIFI_STORAGE_KEY,
        JSON.stringify({ wifiSsid, wifiPassword, wifiSecurityType, wifiHidden })
      );
    } catch (e) { /* ignore quota errors */ }
  };

  /** Restores WiFi fields from localStorage on mount. */
  loadWifiFromStorage = () => {
    try {
      const saved = localStorage.getItem(this.WIFI_STORAGE_KEY);
      if (saved) {
        const config = JSON.parse(saved);
        this.setState({
          wifiSsid: config.wifiSsid || '',
          wifiPassword: config.wifiPassword || '',
          wifiSecurityType: config.wifiSecurityType || 'WPA',
          wifiHidden: config.wifiHidden || false,
        });
      }
    } catch (e) { /* ignore parse errors */ }
  };

  /**
   * Central handler for all WiFi field changes.
   * Updates state, persists to localStorage, and regenerates the QR code.
   */
  handleWifiChange = (field, value) => {
    this.setState({ [field]: value }, () => {
      this.saveWifiToStorage();
      this.generateQR();
    });
  };

  generateEnrollmentToken = async (schoolId) => {
    try {
      const res = await fetch(`${this.API_BASE}/mdm/enrollment-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId })
      });
      
      if (!res.ok) {
        console.error('Failed to generate Google AMAPI token, falling back to local generation');
        // Fallback to local generation if Google API fails
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `${schoolId}_${timestamp}_${random}`.toUpperCase();
      }
      
      const data = await res.json();
      console.log('✅ Generated Google AMAPI enrollment token:', data.token);
      return data.token;
    } catch (error) {
      console.error('Error generating enrollment token:', error);
      // Fallback to local generation on error
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 8);
      return `${schoolId}_${timestamp}_${random}`.toUpperCase();
    }
  };

  render() {
    const { qrUrl, error, wifiSsid, wifiPassword, wifiSecurityType, wifiHidden, downloadUrl, signatureChecksum, enrollmentToken, showAdvancedConfig, enrolledDevices } = this.state;

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
                <div className="p-4 bg-light border-right text-center d-flex flex-column align-items-center" style={{ flex: '1 0 320px', minWidth: '320px' }}>
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
                  
                  <div className="mt-3 text-muted small px-3">
                    <i className="la la-shield-alt mr-1 text-primary"></i>
                    This QR code contains:
                    <ul className="mb-0 mt-2 pl-3" style={{ fontSize: '11px', lineHeight: '1.4' }}>
                      <li>APK download URL (auto-fetched from server)</li>
                      <li>App signature checksum for security verification</li>
                      <li>School enrollment token for device registration</li>
                      <li>Optional WiFi credentials for auto-connection</li>
                    </ul>
                  </div>

                  {/* Collapsible Advanced Config */}
                  <div className="mt-4 w-100">
                    <button
                      className="btn btn-sm btn-outline-secondary w-100 d-flex align-items-center justify-content-center"
                      onClick={() => this.setState({ showAdvancedConfig: !showAdvancedConfig })}
                      style={{ borderRadius: '8px', fontSize: '12px' }}
                    >
                      <i className={`la la-${showAdvancedConfig ? 'chevron-up' : 'chevron-down'} mr-2`}></i>
                      {showAdvancedConfig ? 'Hide' : 'Show'} Advanced Configuration
                    </button>

                    {showAdvancedConfig && (
                      <div className="dpc-config-section mt-3 text-left border-top pt-3 px-2">
                        <h6 className="font-weight-bold text-dark mb-3 d-flex align-items-center" style={{ fontSize: '0.9rem', gap: '6px' }}>
                          <i className="la fa-cog text-primary" style={{ fontSize: '16px' }}></i> DPC Configuration
                        </h6>

                        <div className="form-group mb-3">
                          <label className="small font-weight-bold text-muted mb-1" style={{ fontSize: '11px' }}>APK Download URL</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="https://your-server.com/api/uploads/app.apk"
                            value={downloadUrl}
                            onChange={(e) => this.setState({ downloadUrl: e.target.value }, this.generateQR)}
                            style={{ borderRadius: '6px' }}
                          />
                        </div>

                        <div className="form-group mb-3">
                          <label className="small font-weight-bold text-muted mb-1" style={{ fontSize: '11px' }}>Signature Checksum (SHA-256)</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="FB:14:AD:27:..."
                            value={signatureChecksum}
                            onChange={(e) => this.setState({ signatureChecksum: e.target.value }, this.generateQR)}
                            style={{ borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.75rem' }}
                          />
                        </div>

                        <div className="form-group mb-0">
                          <label className="small font-weight-bold text-muted mb-1" style={{ fontSize: '11px' }}>Enrollment Token</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Auto-generated or custom token"
                            value={enrollmentToken}
                            onChange={(e) => this.setState({ enrollmentToken: e.target.value }, this.generateQR)}
                            style={{ borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.75rem' }}
                          />
                          <small className="text-muted" style={{ fontSize: '10px' }}>Leave empty to auto-generate</small>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Optional Wi-Fi Pre-Configuration Form */}
                  <div className="wifi-config-section mt-4 w-100 text-left border-top pt-4 px-2">
                    <h6 className="font-weight-bold text-dark mb-3 d-flex align-items-center" style={{ fontSize: '0.9rem', gap: '6px' }}>
                      <i className="la la-wifi text-primary" style={{ fontSize: '16px' }}></i> Pre-Configure Wi-Fi (Optional)
                    </h6>
                    
                    <div className="form-group mb-2">
                      <label className="small font-weight-bold text-muted mb-1" style={{ fontSize: '11px' }}>Wi-Fi SSID</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        placeholder="e.g. School_Staff_WiFi"
                        value={wifiSsid}
                        onChange={(e) => this.handleWifiChange('wifiSsid', e.target.value)}
                        style={{ borderRadius: '6px' }}
                      />
                    </div>

                    <div className="row mb-2">
                      <div className="col-6 pr-1">
                        <div className="form-group mb-0">
                          <label className="small font-weight-bold text-muted mb-1" style={{ fontSize: '11px' }}>Security</label>
                          <select 
                            className="form-control form-control-sm"
                            value={wifiSecurityType}
                            onChange={(e) => this.handleWifiChange('wifiSecurityType', e.target.value)}
                            style={{ borderRadius: '6px' }}
                          >
                            <option value="WPA">WPA/WPA2</option>
                            <option value="WEP">WEP</option>
                            <option value="NONE">None (Open)</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="col-6 pl-1">
                        <div className="form-group mb-0">
                          <label className="small font-weight-bold text-muted mb-1" style={{ fontSize: '11px' }}>Network Visibility</label>
                          <div className="custom-control custom-checkbox mt-1">
                            <input 
                              type="checkbox" 
                              className="custom-control-input" 
                              id="wifiHiddenCheckbox"
                              checked={wifiHidden}
                              onChange={(e) => this.handleWifiChange('wifiHidden', e.target.checked)}
                            />
                            <label className="custom-control-label small text-muted font-weight-bold mt-1" htmlFor="wifiHiddenCheckbox" style={{ cursor: 'pointer' }}>Hidden</label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {wifiSecurityType !== "NONE" && (
                      <div className="form-group mb-0">
                        <label className="small font-weight-bold text-muted mb-1" style={{ fontSize: '11px' }}>Wi-Fi Password</label>
                        <input 
                          type="password" 
                          className="form-control form-control-sm" 
                          placeholder="Enter Wi-Fi password"
                          value={wifiPassword}
                           onChange={(e) => this.handleWifiChange('wifiPassword', e.target.value)}
                          style={{ borderRadius: '6px' }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Step-by-Step Secure Lockdown Guide & Live Feed */}
                <div className="p-4 flex-grow-1" style={{ backgroundColor: '#ffffff', overflowY: 'auto', maxHeight: '80vh' }}>
                  
                  {/* Mass Onboarding Live Feed */}
                  <div className="mb-4">
                    <h6 className="font-weight-bold text-dark mb-3 d-flex align-items-center" style={{ fontSize: '1rem' }}>
                      <i className="la la-broadcast-tower text-success mr-2" style={{ fontSize: '20px' }}></i>
                      Mass Onboarding Live Feed
                    </h6>
                    <p className="text-muted mb-3" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                      Scan this QR code on multiple tablets in a row. As each device successfully enrolls, it will appear here instantly. Users can simply pick them up to login.
                    </p>
                    
                    <div className="enrolled-devices-list border rounded bg-light p-3" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                      {enrolledDevices.length === 0 ? (
                        <div className="text-center text-muted py-4 small">
                          <i className="la la-spinner la-spin mr-2" style={{ fontSize: '16px' }}></i>
                          Waiting for devices to be scanned...
                        </div>
                      ) : (
                        <ul className="list-unstyled mb-0">
                          {enrolledDevices.map((device, idx) => (
                            <li key={device.id} className="d-flex justify-content-between align-items-center bg-white p-2 border rounded mb-2 shadow-sm">
                              <div className="d-flex align-items-center">
                                <i className="la la-tablet text-primary mr-2" style={{ fontSize: '20px' }}></i>
                                <div>
                                  <div className="font-weight-bold small text-dark">Tablet #{enrolledDevices.length - idx}</div>
                                  <div className="text-muted" style={{ fontSize: '11px' }}>MAC: {device.macAddress || 'Unknown'}</div>
                                </div>
                              </div>
                              <span className="badge badge-success px-2 py-1" style={{ fontSize: '10px' }}>
                                <i className="la la-check mr-1"></i> Ready
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <h6 className="font-weight-bold text-dark mb-3 d-flex align-items-center pt-2 border-top" style={{ fontSize: '1rem', marginTop: '20px' }}>
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
                          Scan the onboarding QR code on this screen. If you pre-configured Wi-Fi on the left, the tablet will connect automatically. Otherwise, connect to Wi-Fi manually when prompted.
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

                  {/* Security Benefits Section */}
                  <div className="mt-5 pt-4 border-top">
                    <h6 className="font-weight-bold text-dark mb-3 d-flex align-items-center" style={{ fontSize: '1rem' }}>
                      <i className="la la-shield-alt text-primary mr-2" style={{ fontSize: '20px' }}></i>
                      Security Benefits
                    </h6>

                    <div className="security-benefits" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="benefit-item">
                        <div className="d-flex align-items-start" style={{ gap: '10px' }}>
                          <i className="la la-lock text-primary mt-1" style={{ fontSize: '16px' }}></i>
                          <div>
                            <h6 className="font-weight-bold text-dark mb-1" style={{ fontSize: '13px' }}>App Locking</h6>
                            <p className="text-muted m-0" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                              The device is locked to ShulePlus only. Kids cannot exit the app, open other apps, or access the home screen. The app becomes the only thing they can use.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="benefit-item">
                        <div className="d-flex align-items-start" style={{ gap: '10px' }}>
                          <i className="la fa-user-shield text-primary mt-1" style={{ fontSize: '16px' }}></i>
                          <div>
                            <h6 className="font-weight-bold text-dark mb-1" style={{ fontSize: '13px' }}>Burglar Protection</h6>
                            <p className="text-muted m-0" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                              If a tablet is stolen, thieves cannot factory reset it, cannot bypass security via USB debugging, and cannot access any data. The device remains locked to your school.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="benefit-item">
                        <div className="d-flex align-items-start" style={{ gap: '10px' }}>
                          <i className="la fa-ban text-primary mt-1" style={{ fontSize: '16px' }}></i>
                          <div>
                            <h6 className="font-weight-bold text-dark mb-1" style={{ fontSize: '13px' }}>No Unauthorized Access</h6>
                            <p className="text-muted m-0" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                              USB file transfer is blocked, external drives cannot be mounted, and safe boot is disabled. This prevents anyone from bypassing security or installing unauthorized software.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="benefit-item">
                        <div className="d-flex align-items-start" style={{ gap: '10px' }}>
                          <i className="la fa-users text-primary mt-1" style={{ fontSize: '16px' }}></i>
                          <div>
                            <h6 className="font-weight-bold text-dark mb-1" style={{ fontSize: '13px' }}>Multi-Tablet Management</h6>
                            <p className="text-muted m-0" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                              Perfect for schools with many tablets. Each device is enrolled with your school's unique token, preventing misuse and ensuring all tablets remain under your control.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="benefit-item">
                        <div className="d-flex align-items-start" style={{ gap: '10px' }}>
                          <i className="la fa-child text-primary mt-1" style={{ fontSize: '16px' }}></i>
                          <div>
                            <h6 className="font-weight-bold text-dark mb-1" style={{ fontSize: '13px' }}>Child-Safe Environment</h6>
                            <p className="text-muted m-0" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                              Kids can only access educational content in ShulePlus. No social media, games, or inappropriate content. The status bar is hidden, preventing access to notifications and system settings.
                            </p>
                          </div>
                        </div>
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
