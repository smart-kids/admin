import React from "react";
import QRCode from "qrcode";
import moment from "moment";
import Data from "../../utils/data";
import { BASE_URL } from "../../utils/config";

const $ = window.$;

const MODAL_ID = "qr_onboarding_modal_" + Math.random().toString(36).substr(2, 9);

class QRModal extends React.Component {
  WIFI_STORAGE_KEY = 'qrmodal_wifi_config';
  API_BASE = BASE_URL;

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
    toolVersion: "",
    toolUploadedAt: "",
    isFetchingTools: false,
    activeTab: 'qr', // 'qr' or 'usb'
    terminalDarkMode: false,
    adbVersion: null,
    serverDownloadStatus: null,
    serverDownloadProgress: 0,
    serverDownloadStats: null,
    serverApkVersion: null,
    tokenTestStatus: null
  };

  formatCpu = (cpuStr) => {
    if (!cpuStr || cpuStr === '-') return '-';
    // e.g. "55% TOTAL: ..." -> "55%"
    const match = cpuStr.match(/^(\d+(?:\.\d+)?%)/);
    if (match) return match[1];
    return cpuStr; // fallback if regex fails
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
        const devicesMap = await Data.localMdm.getDevices();
        if (!this.state.localServiceConnected) {
          this.setState({ localServiceConnected: true });
          this.authenticateLocalService();
          this.connectLocalLogs();
          this.fetchAdbVersion();
          this.fetchApkStatus();
        }
        this.setState({ localDevices: devicesMap || {} });
        this.autoOnboardDevices(Object.keys(devicesMap || {}));
      } catch (e) {
        if (e.message === "adb_not_found") {
          if (!this.state.setupLoading) {
            this.installPlatformTools();
          }
        } else if (this.state.localServiceConnected) {
          this.setState({ 
            localServiceConnected: false, 
            localServiceAuthenticated: false
          });
        }
      }
    }, 2000);
  };

  authenticateLocalService = async () => {
    if (this.state.localServiceAuthenticated) return;
    const schoolId = localStorage.getItem("school");
    const apiBase = BASE_URL;
    
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

  fetchAdbVersion = async () => {
    try {
      const res = await fetch("http://localhost:18205/api/adb-version");
      if (res.ok) {
        const data = await res.json();
        this.setState({ adbVersion: data.version });
      } else {
        this.setState({ adbVersion: null });
      }
    } catch (e) {
      this.setState({ adbVersion: null });
    }
  };

  fetchApkStatus = async () => {
    try {
      const status = await Data.localMdm.getApkStatus();
      if (status && status.exists) {
        this.setState({ serverApkVersion: status.version });
      } else {
        this.setState({ serverApkVersion: null });
      }
    } catch (e) {
      this.setState({ serverApkVersion: null });
    }
  };

  testEnrollmentToken = async () => {
    this.setState({ tokenTestStatus: 'loading' });
    try {
      await Data.localMdm.testToken();
      // The log connection will display the result, but we set it back to ready so button enables again.
      // We can reset to null after a delay or let the user click it again.
      setTimeout(() => this.setState({ tokenTestStatus: null }), 3000);
    } catch (e) {
      console.error(e);
      this.setState({ tokenTestStatus: 'failed' });
      setTimeout(() => this.setState({ tokenTestStatus: null }), 3000);
    }
  };

  connectLocalLogs = () => {
    if (this.eventSource) this.eventSource.close();
    this.setState({ localLogs: ["🔌 Connected to local MDM service logs stream."] });
    this.eventSource = Data.localMdm.connectLogs(
      (event) => {
        const msg = event.data;
        const match = msg.match(/^(?:\[?(\d{2}:\d{2}:\d{2})\]?\s+)?(?:\[([^\]]+)\]\s+)?(.*)/);
        let serial = null;
        let content = msg;
        if (match) {
           serial = match[2] || null;
           content = match[3] || msg;
        }

        const isDownloadProgress = content.includes("⬇️ Downloading MDM APK:");

        this.setState(prev => {
          let nextLocalLogs = prev.localLogs;
          if (!isDownloadProgress) {
             nextLocalLogs = [...prev.localLogs, msg];
          }

          const nextState = { localLogs: nextLocalLogs };
          
          if (serial === 'Server') {
             let newStatus = prev.serverDownloadStatus;
             let newProgress = prev.serverDownloadProgress;
             let newDownloadStats = prev.serverDownloadStats;
             
             if (content.includes("❌")) {
                newStatus = "failed";
                newDownloadStats = null;
             } else if (content.includes("✅ APK download complete")) {
                newStatus = "success";
                newProgress = 100;
                newDownloadStats = null;
                this.fetchApkStatus(); // Update the APK version in the UI
             } else if (isDownloadProgress) {
                newStatus = "progress";
                const progressRegex = /⬇️ Downloading MDM APK:\s+([\d\.]+)\s+MB(?:\s+\/\s+([\d\.]+)\s+MB\s+\((\d+)%\))?\s+@\s+([\d\.]+)\s+MB\/s/;
                const prMatch = content.match(progressRegex);
                if (prMatch) {
                   const downloadedMb = parseFloat(prMatch[1]);
                   const totalMb = prMatch[2] ? parseFloat(prMatch[2]) : null;
                   const percent = prMatch[3] ? parseInt(prMatch[3]) : null;
                   const speedMbs = parseFloat(prMatch[4]);
                   
                   let etaSeconds = null;
                   if (totalMb && downloadedMb && speedMbs > 0) {
                      etaSeconds = Math.max(0, Math.ceil((totalMb - downloadedMb) / speedMbs));
                   }
                   
                   newDownloadStats = {
                      downloadedMb,
                      totalMb,
                      speedMbs,
                      etaSeconds
                   };
                   
                   if (percent !== null) {
                      newProgress = percent;
                   }
                }
             }
             
             nextState.serverDownloadStatus = newStatus;
             nextState.serverDownloadProgress = newProgress;
             nextState.serverDownloadStats = newDownloadStats;
             
             return nextState;
          }

             if (serial) {
             const dState = prev.deviceStates[serial] || { status: 'progress', progress: 0, error: '' };
             let newStatus = dState.status;
             let newProgress = dState.progress;
             let newError = dState.error;
             let newDownloadStats = dState.downloadStats || null;
             let newStatusText = dState.statusText || null;
             
             if (content.includes("❌") || content.includes("⚠️ Failed to launch")) {
                newStatus = "failed";
                newError = content.replace(/[❌⚠️]\s*/, "");
                newDownloadStats = null;
             } else if (content.includes("🎉 Onboarding sequence completed")) {
                newStatus = "success";
                newProgress = 100;
                newDownloadStats = null;
                newStatusText = null;
             } else if (content.includes("✅ APK download complete")) {
                newProgress = 50;
                newDownloadStats = null;
             } else if (isDownloadProgress) {
                newStatus = "progress";
                const progressRegex = /⬇️ Downloading MDM APK:\s+([\d\.]+)\s+MB(?:\s+\/\s+([\d\.]+)\s+MB\s+\((\d+)%\))?\s+@\s+([\d\.]+)\s+MB\/s/;
                const prMatch = content.match(progressRegex);
                if (prMatch) {
                   const downloadedMb = parseFloat(prMatch[1]);
                   const totalMb = prMatch[2] ? parseFloat(prMatch[2]) : null;
                   const percent = prMatch[3] ? parseInt(prMatch[3]) : null;
                   const speedMbs = parseFloat(prMatch[4]);
                   
                   let etaSeconds = null;
                   if (totalMb && downloadedMb && speedMbs > 0) {
                      etaSeconds = Math.max(0, Math.ceil((totalMb - downloadedMb) / speedMbs));
                   }
                   
                   newDownloadStats = {
                      downloadedMb,
                      totalMb,
                      speedMbs,
                      etaSeconds
                   };
                   
                   if (percent !== null) {
                      newProgress = Math.round(20 + (percent * 0.3));
                   }
                }
             } else if (newStatus !== "failed") {
                newStatus = "progress";
                if (content.includes("Fetching MDM token") || content.includes("Downloading MDM APK")) {
                   newProgress = 20;
                   newStatusText = null;
                }
                else if (content.includes("Installing APK on device")) {
                   newProgress = 60;
                   const match = content.match(/\(([\d\.]+\s*(?:B|KB|MB|GB))\)/);
                   if (match) newStatusText = `Installing APK (${match[1]})...`;
                   else newStatusText = `Installing APK...`;
                }
                else if (content.includes("Installing APK... (Elapsed:")) {
                   newProgress = 60;
                   const match = content.match(/Elapsed:\s*(\d+)s/);
                   if (match) {
                      const prefix = newStatusText && newStatusText.includes(")") ? newStatusText.split("...")[0] : "Installing APK";
                      newStatusText = `${prefix}... (${match[1]}s elapsed)`;
                   }
                }
                else if (content.includes("Setting MDM App as Device Owner")) {
                   newProgress = 80;
                   newStatusText = null;
                }
                else if (content.includes("Injecting MDM configuration")) {
                   newProgress = 90;
                   newStatusText = null;
                }
             }

             nextState.deviceStates = { 
                ...prev.deviceStates, 
                [serial]: { 
                   status: newStatus, 
                   progress: newProgress, 
                   error: newError,
                   downloadStats: newDownloadStats,
                   statusText: newStatusText
                } 
             };
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

  renderLogLine = (log, i) => {
    const { terminalDarkMode } = this.state;
    const regex = /^(?:\[?(\d{2}:\d{2}:\d{2})\]?\s*)?(?:\[([^\]]+)\]\s*)?(.*)/;
    const match = log.match(regex);
    if (!match) {
      return (
        <div key={i} style={{ color: terminalDarkMode ? '#cccccc' : '#2b2d42', marginBottom: '4px', fontFamily: '"Fira Code", monospace' }}>
          <span style={{ color: terminalDarkMode ? '#666' : '#999', marginRight: '8px', userSelect: 'none' }}>$</span>{log}
        </div>
      );
    }

    const timestamp = match[1];
    const serial = match[2];
    const content = match[3] || "";

    // Determine content color
    let contentColor = terminalDarkMode ? '#e0e0e0' : '#2b2d42'; // default text color
    if (content.includes('❌') || content.toLowerCase().includes('failed') || content.toLowerCase().includes('error')) {
      contentColor = terminalDarkMode ? '#ff5252' : '#c62828'; // red
    } else if (content.includes('⚠️') || content.toLowerCase().includes('warning')) {
      contentColor = terminalDarkMode ? '#ffd740' : '#f57f17'; // orange/amber
    } else if (content.includes('✅') || content.includes('🎉') || content.toLowerCase().includes('success') || content.toLowerCase().includes('completed')) {
      contentColor = terminalDarkMode ? '#69f0ae' : '#2e7d32'; // green
    } else if (content.includes('⬇️') || content.includes('📱') || content.includes('⚙️')) {
      contentColor = terminalDarkMode ? '#b3e5fc' : '#0288d1'; // blue
    }

    return (
      <div key={i} style={{ wordBreak: 'break-all', marginBottom: '6px', lineHeight: '1.5', fontFamily: '"Fira Code", monospace', display: 'flex', alignItems: 'flex-start' }}>
        <span style={{ color: terminalDarkMode ? '#555' : '#888', marginRight: '8px', userSelect: 'none' }}>$</span>
        <div style={{ display: 'inline-block' }}>
          {timestamp && (
            <span style={{ color: terminalDarkMode ? '#00e5ff' : '#0288d1', marginRight: '8px', fontSize: '10.5px', opacity: 0.8 }}>
              [{timestamp}]
            </span>
          )}
          {serial && (
            <span style={{ color: terminalDarkMode ? '#e040fb' : '#8e24aa', marginRight: '8px', fontWeight: 'bold' }}>
              [{serial}]
            </span>
          )}
          <span style={{ color: contentColor }}>{content}</span>
        </div>
      </div>
    );
  };

  rebootDevice = async (serial) => {
    try {
      await fetch("http://localhost:18205/api/reboot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serial })
      });
    } catch (e) {
      console.error("Failed to reboot", serial);
    }
  };

  unlockDevice = async (serial) => {
    if (!window.confirm(`🔓 Unlock "${serial}"?\n\nThis will:\n• Force-stop the MDM kiosk app\n• Remove Device Owner (all MDM restrictions)\n• Reboot the tablet to normal Android\n\nThis cannot be undone remotely.`)) return;
    try {
      await fetch("http://localhost:18205/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serial })
      });
    } catch (e) {
      console.error("Failed to unlock", serial);
    }
  };

  retryOnboard = async (serial) => {
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
      await this.fetchAdbVersion();
    } catch (e) {
      console.error(e);
    }
    this.setState({ setupLoading: false });
  };

  restartAdb = async () => {
    this.setState({ adbRestarting: true });
    try {
      await fetch("http://localhost:18205/api/adb-restart", { method: "POST" });
    } catch (e) {
      console.error("Failed to restart ADB", e);
    }
    setTimeout(() => this.setState({ adbRestarting: false }), 1500);
  };

  downloadInternalApk = async () => {
    try {
      this.setState({ serverDownloadStatus: 'progress', serverDownloadProgress: 0, serverDownloadStats: null });
      await Data.localMdm.downloadApk();
    } catch (e) {
      console.error(e);
      this.setState({ serverDownloadStatus: 'failed' });
    }
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
      const data = await Data.mdm.getApkInfo(this.API_BASE);
      const newState = {};
      if (data.downloadUrl) newState.downloadUrl = data.downloadUrl;
      if (data.checksum) newState.signatureChecksum = data.checksum;
      if (Object.keys(newState).length > 0) {
        this.setState(newState);
      }
    } catch (e) {
      console.warn('Could not fetch APK info, using current state:', e.message);
    }
    
    try {
      const toolData = await Data.mdm.getToolInfo();
      if (toolData.urls) {
         this.setState(prevState => ({
           toolUrls: { ...prevState.toolUrls, ...toolData.urls },
           toolVersion: toolData.version || "",
           toolUploadedAt: toolData.uploadedAt || ""
         }));
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

  getOS = () => {
    const userAgent = window.navigator.userAgent;
    if (userAgent.indexOf("Mac") !== -1) return "mac";
    if (userAgent.indexOf("Win") !== -1) return "windows";
    if (userAgent.indexOf("Linux") !== -1) return "linux";
    return "windows";
  };

  render() {
    const { qrUrl, error, wifiSsid, wifiPassword, wifiSecurityType, wifiHidden, downloadUrl, signatureChecksum, enrollmentToken, showAdvancedConfig, enrolledDevices, toolUrls, toolVersion, toolUploadedAt, activeTab, localLogs } = this.state;
    const os = this.getOS();

    return (
      <div
        className="modal fade"
        id={MODAL_ID}
        tabIndex="-1"
        role="dialog"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered modal-xl" role="document">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
            
            {/* Header */}
            <div className="modal-header border-0 bg-light p-4 flex-column align-items-start">
              <div className="d-flex w-100 justify-content-between align-items-center">
                <h5 className="modal-title font-weight-bold text-dark d-flex align-items-center" style={{ fontSize: '1.25rem', gap: '8px' }}>
                  <i className="la la-laptop-medical text-primary" style={{ fontSize: '24px' }}></i>
                  Tablet Provisioning & MDM Onboarding
                </h5>
                <button type="button" className="close" onClick={this.handleClose} style={{ fontSize: '24px' }}>
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>

              <ul className="nav nav-pills mt-3 w-100" role="tablist">
                <li className="nav-item">
                  <a 
                    className={`nav-link font-weight-bold ${activeTab === 'qr' ? 'active' : ''}`} 
                    onClick={() => this.setState({ activeTab: 'qr' })}
                    style={{ cursor: 'pointer', borderRadius: '10px' }}
                  >
                    <i className="la la-qrcode mr-2"></i> QR Onboarding
                  </a>
                </li>
                <li className="nav-item ml-2">
                  <a 
                    className={`nav-link font-weight-bold ${activeTab === 'usb' ? 'active' : ''}`} 
                    onClick={() => this.setState({ activeTab: 'usb' })}
                    style={{ cursor: 'pointer', borderRadius: '10px' }}
                  >
                    <i className="la la-usb mr-2"></i> USB Mass Onboarding
                  </a>
                </li>
              </ul>
            </div>

            {/* Split Content Body */}
            <div className="modal-body p-0" style={{ backgroundColor: '#ffffff', overflowY: 'auto', maxHeight: '80vh' }}>
              
              {activeTab === 'qr' && (
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
                      <ul className="mb-0 mt-2 pl-3" style={{ fontSize: '11px', lineHeight: '1.4', textAlign: 'left' }}>
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

                  {/* Right Side: Features Guide */}
                  <div className="p-4 flex-grow-1 d-flex flex-column align-items-center justify-content-center" style={{ backgroundColor: '#ffffff' }}>
                    <div style={{ maxWidth: '400px' }}>
                      <div className="mb-5 text-center">
                        <i className="la la-qrcode text-primary mb-3" style={{ fontSize: '48px' }}></i>
                        <h5 className="font-weight-bold text-dark">Enroll via Camera</h5>
                        <p className="text-muted small mb-0">Tap the welcome screen 6 times on a factory-reset tablet to open the QR scanner, then scan the code to instantly enroll the device.</p>
                      </div>

                      <div className="security-benefits border-top pt-4">
                        <h6 className="font-weight-bold text-dark mb-4 text-center" style={{ fontSize: '1rem' }}>
                          <i className="la la-shield-alt text-primary mr-2" style={{ fontSize: '20px' }}></i>
                          Security Benefits
                        </h6>

                        <div className="security-benefits" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          <div className="benefit-item">
                            <div className="d-flex align-items-start" style={{ gap: '15px' }}>
                              <div className="bg-light p-2 rounded-circle">
                                <i className="la la-lock text-primary" style={{ fontSize: '20px' }}></i>
                              </div>
                              <div>
                                <h6 className="font-weight-bold text-dark mb-1" style={{ fontSize: '14px' }}>App Locking</h6>
                                <p className="text-muted m-0" style={{ fontSize: '13px', lineHeight: '1.4' }}>
                                  Locked to ShulePlus only. Kids cannot exit or open other apps.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="benefit-item">
                            <div className="d-flex align-items-start" style={{ gap: '15px' }}>
                              <div className="bg-light p-2 rounded-circle">
                                <i className="la fa-user-shield text-primary" style={{ fontSize: '20px' }}></i>
                              </div>
                              <div>
                                <h6 className="font-weight-bold text-dark mb-1" style={{ fontSize: '14px' }}>Burglar Protection</h6>
                                <p className="text-muted m-0" style={{ fontSize: '13px', lineHeight: '1.4' }}>
                                  Thieves cannot factory reset or bypass security via USB.
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="benefit-item">
                            <div className="d-flex align-items-start" style={{ gap: '15px' }}>
                              <div className="bg-light p-2 rounded-circle">
                                <i className="la fa-users text-primary" style={{ fontSize: '20px' }}></i>
                              </div>
                              <div>
                                <h6 className="font-weight-bold text-dark mb-1" style={{ fontSize: '14px' }}>Multi-Tablet Management</h6>
                                <p className="text-muted m-0" style={{ fontSize: '13px', lineHeight: '1.4' }}>
                                  Each device is enrolled with your school's unique token.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {activeTab === 'usb' && (
                <div className="d-flex flex-wrap flex-md-nowrap align-items-stretch" style={{ minHeight: '600px' }}>
                  
                  {/* Left Sidebar: Tool Download */}
                  <div className="p-4 bg-light border-right d-flex flex-column" style={{ flex: '0 0 340px' }}>
                    <h6 className="font-weight-bold text-dark mb-3">
                      <i className="la la-bolt text-warning mr-2"></i> Mass Onboarding Tool
                    </h6>
                    <p className="text-muted small mb-4" style={{ lineHeight: '1.5' }}>
                      Download the MDM Support Tool to enable zero-click USB onboarding. Once running on your computer, this screen will automatically connect to it.
                    </p>
                    
                    <div className="d-flex flex-column mb-4" style={{ gap: '8px' }}>
                      {os === 'windows' && (
                        <a href={toolUrls.windows || '#'} download={!!toolUrls.windows} className={`btn btn-primary btn-sm rounded-pill font-weight-bold shadow-sm ${!toolUrls.windows ? 'disabled' : ''}`}>
                          <i className="la la-windows mr-1"></i> Download for Windows
                        </a>
                      )}
                      {os === 'mac' && (
                        <a href={toolUrls.mac || '#'} download={!!toolUrls.mac} className={`btn btn-dark btn-sm rounded-pill font-weight-bold shadow-sm ${!toolUrls.mac ? 'disabled' : ''}`}>
                          <i className="la la-apple mr-1"></i> Download for Mac
                        </a>
                      )}
                      {os === 'linux' && (
                        <a href={toolUrls.linux || '#'} download={!!toolUrls.linux} className={`btn btn-info btn-sm rounded-pill font-weight-bold shadow-sm text-white ${!toolUrls.linux ? 'disabled' : ''}`}>
                          <i className="la la-linux mr-1"></i> Download for Linux
                        </a>
                      )}

                      {(toolVersion || toolUploadedAt) && (
                        <div className="text-center text-muted mt-1" style={{ fontSize: '11px' }}>
                          {toolVersion && <span className="font-weight-bold">v{toolVersion}</span>}
                          {toolVersion && toolUploadedAt && <span className="mx-1">•</span>}
                          {toolUploadedAt && <span>{moment(toolUploadedAt).fromNow()}</span>}
                        </div>
                      )}

                      <button className="btn btn-outline-secondary btn-sm rounded-pill font-weight-bold shadow-sm mt-2" onClick={this.fetchApkInfo} disabled={this.state.isFetchingTools}>
                        <i className={`la la-sync mr-1 ${this.state.isFetchingTools ? 'la-spin' : ''}`}></i> Refresh Links
                      </button>
                    </div>

                    <div className="bg-white p-3 rounded border text-left shadow-sm mb-4">
                      <h6 className="font-weight-bold text-dark mb-2" style={{ fontSize: '13px' }}>
                        <i className="la la-info-circle mr-1 text-primary"></i> Setup Instructions
                      </h6>
                      <ul className="text-muted small mb-0 pl-3" style={{ lineHeight: '1.5' }}>
                        <li className="mb-1"><strong>Windows:</strong> Double-click the downloaded <code>.exe</code> file.</li>
                        <li className="mb-1"><strong>Mac:</strong> Terminal: <code>xattr -d com.apple.quarantine &lt;file&gt;</code> then <code>chmod +x &lt;file&gt;</code>, and execute it.</li>
                        <li className="mb-1"><strong>Linux:</strong> Terminal: <code>chmod +x &lt;file&gt;</code> and execute it.</li>
                        <li><strong>To Exit:</strong> Press <code>q</code>, <code>Esc</code>, or <code>Ctrl+C</code> in the terminal to safely stop the tool.</li>
                      </ul>
                    </div>
                    
                    <div className="alert alert-warning m-0 p-3 shadow-sm" style={{ fontSize: '12px', borderLeft: '4px solid #ffb822' }}>
                      
                      <ol className="mb-0 pl-3">
                        <li>Settings &gt; About tablet</li>
                        <li>Tap Build number 7 times</li>
                        <li>System &gt; Developer options</li>
                        <li>Toggle USB Debugging ON</li>
                      </ol>
                    </div>
                  </div>

                  {/* Right Content: Fleet & Logs */}
                  <div className="p-4 flex-grow-1 d-flex flex-column" style={{ backgroundColor: '#ffffff' }}>
                    {this.state.localServiceConnected ? (
                      <>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="font-weight-bold text-success m-0 d-flex align-items-center">
                            <i className="la la-check-circle mr-2" style={{ fontSize: '24px' }}></i>
                            Local Service Connected
                          </h6>
                          <div className="d-flex align-items-center" style={{ gap: '8px' }}>
                            <button 
                              className="btn btn-outline-info btn-sm rounded-pill font-weight-bold shadow-sm"
                              onClick={this.downloadInternalApk}
                              disabled={this.state.serverDownloadStatus === 'progress' || this.state.setupLoading}
                            >
                              {this.state.serverDownloadStatus === 'progress' ? (
                                <i className="la la-spinner la-spin mr-1"></i>
                              ) : (
                                <i className="la la-download mr-1"></i>
                              )}
                              {this.state.serverApkVersion ? `Downloaded (v${this.state.serverApkVersion})` : "Download internal APK"}
                            </button>
                            <button 
                              className="btn btn-outline-secondary btn-sm rounded-pill font-weight-bold shadow-sm"
                              onClick={this.testEnrollmentToken}
                              disabled={this.state.tokenTestStatus === 'loading'}
                            >
                              {this.state.tokenTestStatus === 'loading' ? (
                                <i className="la la-spinner la-spin mr-1"></i>
                              ) : (
                                <i className="la la-key mr-1"></i>
                              )}
                              Test Token
                            </button>
                            <button 
                              className="btn btn-outline-warning btn-sm rounded-pill font-weight-bold shadow-sm"
                              onClick={this.restartAdb}
                              disabled={this.state.adbRestarting}
                            >
                              <i className={`la la-sync ${this.state.adbRestarting ? 'la-spin' : ''} mr-1`}></i>
                              Restart ADB
                            </button>
                            <button 
                              className="btn btn-outline-primary btn-sm rounded-pill font-weight-bold shadow-sm"
                              onClick={this.installPlatformTools}
                              disabled={this.state.setupLoading || !!this.state.adbVersion}
                            >
                              {this.state.setupLoading ? (
                                <i className="la la-spinner la-spin mr-1"></i>
                              ) : (
                                <i className="la la-tools mr-1"></i>
                              )}
                              {this.state.adbVersion ? `ADB: v${this.state.adbVersion}` : "Setup ADB Tools"}
                            </button>
                          </div>
                        </div>

                        {this.state.serverDownloadStatus && (
                          <div className="alert alert-secondary p-2 mb-3 shadow-sm" style={{ borderRadius: '8px' }}>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="font-weight-bold text-dark" style={{ fontSize: '12px' }}>
                                Server APK Download
                              </span>
                              <span className={`font-weight-bold ${this.state.serverDownloadStatus === 'failed' ? 'text-danger' : 'text-primary'}`} style={{ fontSize: '12px' }}>
                                {this.state.serverDownloadStatus === 'success' ? 'Complete' :
                                 this.state.serverDownloadStatus === 'failed' ? 'Failed' :
                                 `${this.state.serverDownloadProgress}%`}
                              </span>
                            </div>
                            <div className="progress" style={{ height: '6px', borderRadius: '3px', backgroundColor: '#e9ecef', overflow: 'hidden' }}>
                              <div 
                                className={`progress-bar progress-bar-striped progress-bar-animated ${this.state.serverDownloadStatus === 'success' ? 'bg-success' : this.state.serverDownloadStatus === 'failed' ? 'bg-danger' : 'bg-info'}`}
                                style={{ width: `${this.state.serverDownloadStatus === 'success' ? 100 : this.state.serverDownloadProgress}%`, height: '100%', transition: 'width 0.4s ease' }}
                              ></div>
                            </div>
                            {this.state.serverDownloadStats && (
                              <div className="d-flex justify-content-between mt-1 text-muted font-weight-bold" style={{ fontSize: '11px' }}>
                                <span>{this.state.serverDownloadStats.downloadedMb.toFixed(2)} / {this.state.serverDownloadStats.totalMb ? this.state.serverDownloadStats.totalMb.toFixed(2) : '?'} MB</span>
                                <span>{this.state.serverDownloadStats.speedMbs.toFixed(1)} MB/s {this.state.serverDownloadStats.etaSeconds !== null && `(${this.state.serverDownloadStats.etaSeconds}s left)`}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="card border-0 bg-light rounded-lg mb-3 shadow-sm d-flex flex-column" style={{ flex: '1 1 50%', minHeight: '200px' }}>
                          <div className="card-body p-3 d-flex flex-column h-100">
                            <h6 className="font-weight-bold text-dark mb-2" style={{ fontSize: '13px' }}>
                              <i className="la la-usb mr-2 text-primary"></i>
                              Connected Fleet Devices
                            </h6>
                            <div className="flex-grow-1" style={{ overflowY: 'auto' }}>
                              {Object.keys(this.state.localDevices).length === 0 ? (
                                <div className="text-muted small text-center py-4 d-flex flex-column align-items-center justify-content-center h-100">
                                  <i className="la la-plug mb-2 text-muted" style={{ fontSize: '32px', opacity: 0.5 }}></i>
                                  Waiting for devices... (Plug in via USB)
                                </div>
                              ) : (
                                <div className="table-responsive">
                                  <table className="table table-sm table-borderless align-middle mb-0" style={{ fontSize: '12px' }}>
                                    <thead className="text-muted border-bottom">
                                      <tr>
                                        <th>Device ID</th>
                                        <th>Battery</th>
                                        <th>Progress</th>
                                        <th>CPU / RAM</th>
                                        <th className="text-right">Action</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {Object.entries(this.state.localDevices).map(([serial, state]) => {
                                        const isBatteryLow = parseInt(state.battery) < 20;
                                        return (
                                          <tr key={serial} className="border-bottom">
                                            <td className="font-weight-bold py-2">{serial}</td>
                                            <td className={`font-weight-bold py-2 ${isBatteryLow ? 'text-danger' : 'text-success'}`}>
                                              <i className={`la la-battery-${isBatteryLow ? 'quarter' : 'full'} mr-1`}></i>
                                              {state.battery}
                                            </td>
                                            <td className="py-2 text-primary font-weight-bold" style={{ minWidth: '180px' }}>
                                              {(() => {
                                                const dState = this.state.deviceStates[serial];
                                                if (!dState) return <span className="text-muted">Not Started</span>;
                                                
                                                if (dState.status === 'success') {
                                                  return (
                                                    <span className="text-success font-weight-bold">
                                                      <i className="la la-check-circle mr-1"></i> Completed
                                                    </span>
                                                  );
                                                }
                                                
                                                if (dState.status === 'failed') {
                                                  return (
                                                    <span className="text-danger font-weight-bold" title={dState.error}>
                                                      <i className="la la-times-circle mr-1"></i> Failed
                                                    </span>
                                                  );
                                                }
                                                
                                                const { progress, downloadStats, statusText } = dState;
                                                
                                                return (
                                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                      <span className="text-dark font-weight-bold" style={{ fontSize: '12px' }}>
                                                        {statusText || (
                                                          progress < 20 ? 'Initializing...' :
                                                          progress < 50 ? 'Downloading APK...' :
                                                          progress < 60 ? 'Installing APK...' :
                                                          progress < 80 ? 'Setting device owner...' :
                                                          'Configuring...'
                                                        )}
                                                      </span>
                                                      <span className="text-primary font-weight-bold" style={{ fontSize: '12px' }}>
                                                        {progress}%
                                                      </span>
                                                    </div>
                                                    
                                                    <div className="progress" style={{ height: '8px', borderRadius: '4px', backgroundColor: '#e9ecef', overflow: 'hidden', margin: '2px 0' }}>
                                                      <div 
                                                        className="progress-bar progress-bar-striped progress-bar-animated bg-success" 
                                                        style={{ width: `${progress}%`, height: '100%', transition: 'width 0.4s ease' }}
                                                      ></div>
                                                    </div>
                                                    
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: 'bold' }} className="text-muted">
                                                      {downloadStats ? (
                                                        <>
                                                          <span>
                                                            {downloadStats.downloadedMb.toFixed(2)} / {downloadStats.totalMb ? downloadStats.totalMb.toFixed(2) : '?'} MB
                                                          </span>
                                                          <span>
                                                            {downloadStats.speedMbs.toFixed(1)} MB/s
                                                            {downloadStats.etaSeconds !== null && ` (${downloadStats.etaSeconds}s left)`}
                                                          </span>
                                                        </>
                                                      ) : (
                                                        <span style={{ fontSize: '10px', opacity: 0.7 }}>
                                                          MDM Service Active
                                                        </span>
                                                      )}
                                                    </div>
                                                  </div>
                                                );
                                              })()}
                                            </td>
                                            <td className="py-2 text-muted">
                                              {this.formatCpu(state.stats?.cpu)} / {state.stats?.memory || '-'}
                                            </td>
                                            <td className="py-2 text-right">
                                              <button 
                                                onClick={() => this.retryOnboard(serial)} 
                                                className="btn btn-xs btn-outline-primary py-0 px-2 font-weight-bold shadow-sm mr-1" 
                                                style={{ fontSize: '10px', borderRadius: '4px' }}
                                              >
                                                <i className="la la-play mr-1"></i> Onboard
                                              </button>
                                              <button 
                                                onClick={() => this.rebootDevice(serial)} 
                                                className="btn btn-xs btn-outline-danger py-0 px-2 font-weight-bold shadow-sm mr-1" 
                                                style={{ fontSize: '10px', borderRadius: '4px' }}
                                              >
                                                <i className="la la-redo mr-1"></i> Reboot
                                              </button>
                                              <button 
                                                onClick={() => this.unlockDevice(serial)} 
                                                className="btn btn-xs btn-outline-success py-0 px-2 font-weight-bold shadow-sm" 
                                                style={{ fontSize: '10px', borderRadius: '4px' }}
                                                title="Remove MDM Device Owner & reboot to normal Android"
                                              >
                                                <i className="la la-unlock mr-1"></i> Unlock
                                              </button>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div 
                          className={`card border-0 rounded-lg shadow-sm d-flex flex-column mt-2 ${this.state.terminalDarkMode ? 'bg-dark' : 'bg-white border'}`} 
                          style={{ flex: '1 1 50%', minHeight: '200px', backgroundColor: this.state.terminalDarkMode ? '#1e1e1e' : '#ffffff' }}
                        >
                           <div className={`card-header border-bottom p-2 d-flex justify-content-between align-items-center ${this.state.terminalDarkMode ? 'bg-dark border-secondary' : 'bg-light border-light'}`}>
                              <h6 className={`font-weight-bold m-0 ml-2 ${this.state.terminalDarkMode ? 'text-light' : 'text-dark'}`} style={{ fontSize: '12px', letterSpacing: '0.5px' }}>
                                <i className="la la-terminal mr-2"></i> Session Logs
                              </h6>
                              <div className="d-flex align-items-center" style={{ gap: '8px' }}>
                                <button 
                                  onClick={() => this.setState(prev => ({ terminalDarkMode: !prev.terminalDarkMode }))}
                                  className="btn btn-xs font-weight-bold px-2 py-0 d-flex align-items-center justify-content-center shadow-none"
                                  style={{ 
                                    fontSize: '10px', 
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    color: this.state.terminalDarkMode ? '#a6c5e3' : '#555555',
                                    cursor: 'pointer'
                                  }}
                                  title={this.state.terminalDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                                >
                                  <i className={`la la-${this.state.terminalDarkMode ? 'sun text-warning' : 'moon text-primary'} mr-1`} style={{ fontSize: '13px' }}></i>
                                  {this.state.terminalDarkMode ? "Light" : "Dark"}
                                </button>
                                <span className="badge badge-success badge-pill" style={{ fontSize: '9px' }}>Live</span>
                              </div>
                           </div>
                           <div 
                             className="card-body p-3" 
                             style={{ 
                               overflowY: 'auto', 
                               fontFamily: 'monospace', 
                               fontSize: '11px', 
                               color: this.state.terminalDarkMode ? '#cccccc' : '#2b2d42', 
                               backgroundColor: this.state.terminalDarkMode ? '#181818' : '#f5f6f8', 
                               border: this.state.terminalDarkMode ? '1px solid #333' : '1px solid #e2e8f0',
                               flexGrow: 1 
                             }}
                           >
                             {localLogs.length === 0 ? (
                               <div className="text-muted text-center pt-3">Waiting for local MDM logs...</div>
                             ) : (
                               localLogs.map((log, i) => this.renderLogLine(log, i))
                             )}
                             <div ref={(el) => { this.logsEnd = el; }}></div>
                           </div>
                        </div>
                      </>
                    ) : (
                       <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center text-muted">
                          <i className="la la-exclamation-circle mb-3" style={{ fontSize: '48px', opacity: 0.3 }}></i>
                          <h5>Local Service Not Connected</h5>
                          <p className="small mb-0 mt-2">Start the MDM Support Tool on your computer.</p>
                       </div>
                    )}
                  </div>

                </div>
              )}

            </div>

            {/* Footer */}
            <div className="modal-footer bg-light border-top p-3 pr-4 d-flex justify-content-end">
              <button 
                type="button" 
                className="btn btn-secondary font-weight-bold px-4"
                onClick={this.handleClose}
                style={{ borderRadius: '8px' }}
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
