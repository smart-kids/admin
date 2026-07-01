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
    initialDeviceIds: new Set(),
    // Local MDM Service state
    localServiceConnected: false,
    localServiceAuthenticated: false,
    localDevices: [],
    onboardingDevices: [],
    deviceStates: {},
    localLogs: ["🔌 Waiting for local MDM service..."],
    setupLoading: false,
    toolUrls: {
      mac: "",
      windows: "",
      linux: ""
    },
    isFetchingTools: false
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
    this.startLocalServicePolling();
  }

  componentWillUnmount() {
    $("#" + MODAL_ID).modal("hide");
    if (this.unsubscribeDevices) {
      this.unsubscribeDevices();
    }
    if (this.localPollInterval) clearInterval(this.localPollInterval);
    if (this.eventSource) this.eventSource.close();
  }

  startLocalServicePolling = () => {
    this.localPollInterval = setInterval(async () => {
      try {
        const devices = await Data.localMdm.getDevices();
        if (!this.state.localServiceConnected) {
          this.setState({ localServiceConnected: true });
          this.authenticateLocalService();
          this.connectLocalLogs();
        }
        this.setState({ localDevices: devices || [] });
        this.autoOnboardDevices(devices || []);
      } catch (e) {
        if (this.state.localServiceConnected) {
          this.setState({ 
            localServiceConnected: false, 
            localServiceAuthenticated: false,
            localLogs: [...this.state.localLogs, "❌ Local service disconnected."]
          });
          if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
          }
        }
      }
    }, 2000);
  };

  authenticateLocalService = async () => {
    if (this.state.localServiceAuthenticated) return;
    const schoolId = localStorage.getItem("school");
    const isLocalClient = window.location.href.includes('localhost') || window.location.href.includes('127.0.0.1');
    const apiBase = isLocalClient ? "http://localhost:4001/api" : "https://cloud.shuleplus.co.ke/api";
    
    const tokenData = this.state.enrollmentToken ? { token: this.state.enrollmentToken } : await this.generateEnrollmentToken(schoolId);
    
    try {
      await Data.localMdm.auth({
        token: tokenData.token,
        school_id: schoolId,
        wifi_ssid: this.state.wifiSsid,
        wifi_password: this.state.wifiPassword,
        api_base: apiBase
      });
      this.setState({ localServiceAuthenticated: true });
    } catch (e) {
      console.error("Local auth failed", e);
    }
  };

  connectLocalLogs = () => {
    if (this.eventSource) this.eventSource.close();
    this.eventSource = Data.localMdm.connectLogs(
      (event) => {
        const msg = event.data;
        const match = msg.match(/^\[\d{2}:\d{2}:\d{2}\]\s(?:\[([^\]]+)\]\s)?(.*)/);
        let serial = null;
        let content = msg;
        if (match && match[1]) {
           serial = match[1];
           content = match[2];
        }

        this.setState(prev => {
          const nextState = { localLogs: [...prev.localLogs, msg] };
          if (serial) {
             const dState = prev.deviceStates[serial] || { status: 'progress', progress: 0, error: '' };
             let newStatus = dState.status;
             let newProgress = dState.progress;
             let newError = dState.error;
             
             if (content.includes("❌") || content.includes("⚠️ Failed to launch")) {
                newStatus = "failed";
                newError = content.replace(/[❌⚠️]\s*/, "");
             } else if (content.includes("🎉 Onboarding sequence completed")) {
                newStatus = "success";
                newProgress = 100;
             } else if (newStatus !== "failed") {
                newStatus = "progress";
                if (content.includes("Fetching MDM token")) newProgress = 20;
                else if (content.includes("Downloading MDM APK")) newProgress = 40;
                else if (content.includes("Installing APK on device")) newProgress = 60;
                else if (content.includes("Setting MDM App as Device Owner")) newProgress = 80;
                else if (content.includes("Injecting MDM configuration")) newProgress = 90;
             }
             nextState.deviceStates = { ...prev.deviceStates, [serial]: { status: newStatus, progress: newProgress, error: newError } };
          }
          return nextState;
        }, () => {
          if (this.logsEnd) this.logsEnd.scrollIntoView({ behavior: "smooth" });
        });
      },
      () => {
        // error handling handled by poll failure
      }
    );
  };

  retryOnboard = async (serial) => {
    this.setState(prev => ({
      deviceStates: { ...prev.deviceStates, [serial]: { status: 'progress', progress: 0, error: '' } }
    }));
    try {
      await Data.localMdm.onboard(serial);
    } catch (e) {
      console.error("Failed to retry onboard", serial);
    }
  };

  autoOnboardDevices = async (devices) => {
    const { onboardingDevices } = this.state;
    for (const serial of devices) {
      if (!onboardingDevices.includes(serial)) {
        this.setState(prev => ({ onboardingDevices: [...prev.onboardingDevices, serial] }));
        try {
          await Data.localMdm.onboard(serial);
        } catch (e) {
          console.error("Failed to auto-onboard", serial);
        }
      }
    }
  };

  installPlatformTools = async () => {
    this.setState({ setupLoading: true });
    try {
      await Data.localMdm.setup();
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => this.setState({ setupLoading: false }), 2000);
  };

  generateQR = async () => {
    const schoolId = localStorage.getItem("school");
    const { wifiSsid, wifiPassword, wifiSecurityType, wifiHidden, downloadUrl, signatureChecksum, enrollmentToken } = this.state;

    // Generate enrollment token if not provided
    const tokenData = enrollmentToken ? { token: enrollmentToken, qrCode: null } : await this.generateEnrollmentToken(schoolId);

    // If Google AMAPI returned a QR code, use it directly
    if (tokenData.qrCode) {
      try {
        const url = await QRCode.toDataURL(tokenData.qrCode, {
          width: 250,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF"
          }
        });
        this.setState({ qrUrl: url, enrollmentToken: tokenData.token });
        return;
      } catch (err) {
        console.error("Failed to generate Google AMAPI QR code, falling back to DPC", err);
      }
    }

    // Fallback to local DPC QR code generation
    const token = tokenData.token;

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
   * Fetches the latest APK info from the server and pre-populates downloadUrl and checksum.
   * Falls back to generating the QR with whatever state is already set.
   */
  fetchApkInfo = async () => {
    this.setState({ isFetchingTools: true });
    try {
      const res = await fetch(`${this.API_BASE}/apk-info`);
      if (res.ok) {
        const data = await res.json();
        const newState = {};
        if (data.downloadUrl) newState.downloadUrl = data.downloadUrl;
        if (data.checksum) newState.signatureChecksum = data.checksum;
        if (Object.keys(newState).length > 0) {
          this.setState(newState);
        }
      }
    } catch (e) {
      console.warn('Could not fetch APK info, using current state:', e.message);
    }
    
    try {
      const toolRes = await fetch("https://graph-ongyy.kinsta.app/tool-info");
      if (toolRes.ok) {
        const toolData = await toolRes.json();
        if (toolData.urls) {
           this.setState(prevState => ({
             toolUrls: { ...prevState.toolUrls, ...toolData.urls }
           }));
        }
      }
    } catch (e) {
      console.warn('Could not fetch tool info:', e.message);
    }

    this.setState({ isFetchingTools: false });
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
        return { token: `${schoolId}_${timestamp}_${random}`.toUpperCase(), qrCode: null };
      }
      
      const data = await res.json();
      console.log('✅ Generated Google AMAPI enrollment token:', data.token);
      return { token: data.token, qrCode: data.qrCode };
    } catch (error) {
      console.error('Error generating enrollment token:', error);
      // Fallback to local generation on error
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 8);
      return { token: `${schoolId}_${timestamp}_${random}`.toUpperCase(), qrCode: null };
    }
  };

  render() {
    const { qrUrl, error, wifiSsid, wifiPassword, wifiSecurityType, wifiHidden, downloadUrl, signatureChecksum, enrollmentToken, showAdvancedConfig, enrolledDevices, toolUrls } = this.state;

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

                {/* Right Side: MDM Dashboard or Guide */}
                <div className="p-4 flex-grow-1" style={{ backgroundColor: '#ffffff', overflowY: 'auto', maxHeight: '80vh' }}>
                  
                  {this.state.localServiceConnected ? (
                    <div className="h-100 d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="font-weight-bold text-success m-0 d-flex align-items-center">
                          <i className="la la-check-circle mr-2" style={{ fontSize: '24px' }}></i>
                          Local Service Connected
                        </h6>
                        <button 
                          className="btn btn-outline-primary btn-sm rounded-pill font-weight-bold shadow-sm"
                          onClick={this.installPlatformTools}
                          disabled={this.state.setupLoading}
                        >
                          {this.state.setupLoading ? <i className="la la-spinner la-spin mr-1"></i> : <i className="la la-tools mr-1"></i>}
                          Setup ADB Tools
                        </button>
                      </div>

                      <div className="card border-0 bg-light rounded-lg mb-3 shadow-sm">
                        <div className="card-body p-3">
                          <h6 className="font-weight-bold text-dark mb-2" style={{ fontSize: '13px' }}>
                            <i className="la la-usb mr-2 text-primary"></i>
                            Connected USB Devices
                          </h6>
                          <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                            {this.state.localDevices.length === 0 ? (
                              <div className="text-muted small text-center py-2">
                                Waiting for devices... (Plug in via USB)
                              </div>
                            ) : (
                                <ul className="list-unstyled mb-0">
                                  {this.state.localDevices.map(serial => {
                                    const dState = this.state.deviceStates[serial];
                                    const isOnboarding = this.state.onboardingDevices.includes(serial);
                                    
                                    return (
                                      <li key={serial} className="p-2 bg-white rounded border mb-2 shadow-sm">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                          <span className="small font-weight-bold text-dark">{serial}</span>
                                          {dState ? (
                                            dState.status === 'failed' ? (
                                              <button onClick={() => this.retryOnboard(serial)} className="btn btn-xs btn-danger font-weight-bold py-0 px-2" style={{ fontSize: '10px' }}>
                                                <i className="la la-redo mr-1"></i> Retry
                                              </button>
                                            ) : dState.status === 'success' ? (
                                              <span className="badge badge-success"><i className="la la-check mr-1"></i> Ready</span>
                                            ) : (
                                              <span className="badge badge-warning text-dark"><i className="la la-spinner la-spin mr-1"></i> Onboarding...</span>
                                            )
                                          ) : isOnboarding ? (
                                            <span className="badge badge-warning text-dark"><i className="la la-spinner la-spin mr-1"></i> Onboarding...</span>
                                          ) : (
                                            <span className="badge badge-light text-muted">Waiting...</span>
                                          )}
                                        </div>
                                        
                                        {dState && dState.status === 'progress' && (
                                          <div className="progress mt-1" style={{ height: '4px' }}>
                                            <div className="progress-bar progress-bar-striped progress-bar-animated bg-primary" role="progressbar" style={{ width: `${dState.progress}%` }}></div>
                                          </div>
                                        )}
                                        
                                        {dState && dState.status === 'failed' && (
                                          <div className="text-danger mt-1" style={{ fontSize: '11px', lineHeight: '1.2' }}>
                                            <i className="la la-exclamation-triangle mr-1"></i>
                                            {dState.error}
                                          </div>
                                        )}
                                      </li>
                                    );
                                  })}
                                </ul>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex-grow-1 d-flex flex-column">
                        <h6 className="font-weight-bold text-dark mb-2" style={{ fontSize: '13px' }}>
                          <i className="la la-terminal mr-2 text-primary"></i>
                          Live Automation Logs
                        </h6>
                        <div 
                          className="bg-dark rounded-lg p-3 text-success w-100 flex-grow-1"
                          style={{ fontFamily: 'monospace', fontSize: '12px', minHeight: '200px', maxHeight: '300px', overflowY: 'auto', boxShadow: 'inset 0 4px 6px rgba(0,0,0,0.3)' }}
                        >
                          {this.state.localLogs.map((log, i) => (
                            <div key={i} className="mb-1">❯ {log}</div>
                          ))}
                          <div ref={(el) => { this.logsEnd = el; }}></div>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div>
                      {/* Security Benefits Section (Reduced Text) */}
                      <div className="mb-4">
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
                                  Locked to ShulePlus only. Kids cannot exit or open other apps.
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
                                  Thieves cannot factory reset or bypass security via USB.
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
                                  Each device is enrolled with your school's unique token.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mass Onboarding Section */}
                      <div className="card shadow-sm border-0 mb-4 rounded-lg" style={{ background: "linear-gradient(145deg, #f0f4f8, #e2e8f0)" }}>
                        <div className="card-header bg-transparent border-bottom-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
                          <h6 className="font-weight-bold text-dark mb-0">
                            <i className="la la-bolt text-warning mr-2"></i> Zero-Click Mass Onboarding
                          </h6>
                          <button 
                            className="btn btn-sm btn-outline-secondary rounded-pill font-weight-bold shadow-sm" 
                            onClick={this.fetchApkInfo}
                            disabled={this.state.isFetchingTools}
                          >
                            <i className={`la la-sync mr-1 ${this.state.isFetchingTools ? 'la-spin' : ''}`}></i> Refresh
                          </button>
                        </div>
                        <div className="card-body">
                          <p className="text-muted small mb-3">
                            Download the MDM Support Tool to enable zero-click USB onboarding. Once running on your computer, this screen will automatically connect to it and display live onboarding logs and USB device status right here.
                          </p>
                          <div className="d-flex flex-wrap mb-3 justify-content-center" style={{ gap: '8px' }}>
                            <a href={toolUrls.windows || '#'} download={!!toolUrls.windows} className={`btn btn-primary btn-sm rounded-pill font-weight-bold shadow-sm flex-fill ${!toolUrls.windows ? 'disabled' : ''}`}>
                              <i className="la la-windows mr-1"></i> Windows
                            </a>
                            <a href={toolUrls.mac || '#'} download={!!toolUrls.mac} className={`btn btn-dark btn-sm rounded-pill font-weight-bold shadow-sm flex-fill ${!toolUrls.mac ? 'disabled' : ''}`}>
                              <i className="la la-apple mr-1"></i> Mac
                            </a>
                            <a href={toolUrls.linux || '#'} download={!!toolUrls.linux} className={`btn btn-info btn-sm rounded-pill font-weight-bold shadow-sm flex-fill text-white ${!toolUrls.linux ? 'disabled' : ''}`}>
                              <i className="la la-linux mr-1"></i> Linux
                            </a>
                          </div>
                          
                          <div className="bg-white p-3 rounded border text-left shadow-sm">
                            <h6 className="font-weight-bold text-dark mb-2" style={{ fontSize: '13px' }}>
                              <i className="la la-info-circle mr-1 text-primary"></i> Setup Instructions
                            </h6>
                            <ul className="text-muted small mb-3 pl-3" style={{ lineHeight: '1.5' }}>
                              <li><strong>Windows:</strong> Double-click the downloaded <code>.exe</code> file to run it.</li>
                              <li><strong>Mac:</strong> Open Terminal, run <code>xattr -d com.apple.quarantine &lt;file&gt;</code> then <code>chmod +x &lt;file&gt;</code>, and execute it.</li>
                              <li><strong>Linux:</strong> Open Terminal, run <code>chmod +x &lt;file&gt;</code> and execute it.</li>
                            </ul>
                            
                            <div className="alert alert-warning m-0 p-3" style={{ fontSize: '12px' }}>
                              <div className="d-flex align-items-center mb-2">
                                <i className="la la-exclamation-triangle mr-2 text-warning" style={{ fontSize: '20px' }}></i>
                                <strong>Important: Turn on USB Debugging first!</strong>
                              </div>
                              <ol className="mb-0 pl-3">
                                <li>Open <b>Settings</b> &gt; <b>About tablet</b></li>
                                <li>Tap <b>Build number</b> 7 times rapidly to unlock developer mode</li>
                                <li>Go back to <b>System</b> &gt; <b>Developer options</b></li>
                                <li>Toggle <b>USB Debugging</b> ON</li>
                              </ol>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

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
