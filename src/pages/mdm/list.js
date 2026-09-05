import React from "react";
import Data from "../../utils/data";
import QRModal from "./QRModal";
import "../games/Library.css";
import "./MDM.css";

class MDMList extends React.Component {
  state = {
    devices: [],
    filteredDevices: [],
    searchTerm: "",
    activeFilter: "All",
    loading: true,
    showQRModal: false,
    activeTab: "devices", // 'devices' | 'notifications' | 'deploy'
    deviceCommands: [],
    sending: false,
    newNotification: {
      title: "",
      body: "",
      targetDevice: "GLOBAL",
    },
    showEditModal: false,
    editingDevice: null,
    editFormData: {
      assignedStudent: "",
      school: "",
    },
    // Deploy tab state
    liveApkInfo: null,
    pendingApkInfo: null,
    loadingVersions: false,
    publishing: false,
    publishSecret: "",
    updateVersion: "",
    // Emergency rollback
    overrideVersion: "",
    overriding: false,
  };

  componentDidMount() {
    this._subscription = Data.devices.subscribe(({ devices }) => {
      this.setState({ devices: devices || [], loading: false }, this.filterDevices);
    });
    this._commandsSubscription = Data.device_commands.subscribe(({ device_commands }) => {
      // Sort commands by newest first
      const sorted = (device_commands || []).sort((a, b) => {
        return (b.id || "").localeCompare(a.id || "");
      });
      this.setState({ deviceCommands: sorted });
    });
    this.fetchVersionStatus();
  }

  componentWillUnmount() {
    if (this._subscription) this._subscription();
    if (this._commandsSubscription) this._commandsSubscription();
  }

  filterDevices = () => {
    const { devices, searchTerm, activeFilter } = this.state;
    let filtered = devices;

    if (activeFilter !== "All") {
      filtered = filtered.filter((d) => (d.status || "OFFLINE") === activeFilter);
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          (d.macAddress || "").toLowerCase().includes(lower) ||
          (d.assignedStudent || "").toLowerCase().includes(lower)
      );
    }

    this.setState({ filteredDevices: filtered });
  };

  handleSearch = (e) => {
    this.setState({ searchTerm: e.target.value }, this.filterDevices);
  };
  
  handleFilterChange = (filter) => {
    this.setState({ activeFilter: filter }, this.filterDevices);
  };

  openQRModal = () => {
    this.setState({ showQRModal: true });
  };

  closeQRModal = () => {
    this.setState({ showQRModal: false });
  };

  fetchVersionStatus = async () => {
    this.setState({ loadingVersions: true });
    const API_BASE = 'https://graph-ongyy.kinsta.app';
    try {
      const [liveRes, pendingRes] = await Promise.allSettled([
        Data.mdm.getApkInfo(API_BASE),
        Data.mdm.getPendingApkInfo(API_BASE),
      ]);
      this.setState({
        liveApkInfo: liveRes.status === 'fulfilled' ? liveRes.value : null,
        pendingApkInfo: pendingRes.status === 'fulfilled' ? pendingRes.value : null,
        loadingVersions: false,
      });
    } catch (e) {
      this.setState({ loadingVersions: false });
    }
  };

  publishMdmVersion = async () => {
    const API_BASE = 'https://graph-ongyy.kinsta.app';
    const { publishSecret } = this.state;
    if (!publishSecret.trim()) {
      window.toastr.warning('Enter the upload secret to authorize publishing.');
      return;
    }
    if (!window.confirm('This will notify all MDM tablets to update immediately. Are you sure?')) return;
    this.setState({ publishing: true });
    try {
      await Data.mdm.publishMdmVersion(API_BASE, publishSecret);
      window.toastr.success('MDM version published! Tablets will begin updating shortly.');
      await this.fetchVersionStatus();
    } catch (e) {
      window.toastr.error('Failed to publish: ' + e.message);
    } finally {
      this.setState({ publishing: false });
    }
  };

  overrideMdmVersion = async () => {
    const API_BASE = 'https://graph-ongyy.kinsta.app';
    const { publishSecret, overrideVersion } = this.state;
    if (!overrideVersion.trim()) {
      window.toastr.warning('Enter the target version to override (e.g. 204.524.632).');
      return;
    }
    if (!publishSecret.trim()) {
      window.toastr.warning('Enter the upload secret to authorize this override.');
      return;
    }
    if (!window.confirm(`⚠️ WARNING: This will immediately tell ALL MDM tablets that v${overrideVersion} is the latest version. Tablets already on a higher version will think they\'re up-to-date. Are you sure?`)) return;
    this.setState({ overriding: true });
    try {
      await Data.mdm.overrideMdmVersion(API_BASE, publishSecret, overrideVersion);
      window.toastr.success(`✅ Live MDM version overridden to v${overrideVersion}. Stuck tablets should clear within their next poll cycle.`);
      this.setState({ overrideVersion: '' });
      await this.fetchVersionStatus();
    } catch (e) {
      window.toastr.error('Override failed: ' + e.message);
    } finally {
      this.setState({ overriding: false });
    }
  };

  sendCommand = (device, commandType) => {
    const confirmMsg = `Are you sure you want to send a ${commandType} command to ${device.macAddress}?`;
    if (window.confirm(confirmMsg)) {
      Data.device_commands.create({
        device: device.macAddress || device.id,
        command: commandType,
        status: "PENDING",
      })
      .then(() => window.toastr.success(`Command ${commandType} queued`))
      .catch(err => {
        console.error(err);
        window.toastr.error("Failed to queue command");
      });
    }
  };

  sendNotification = (e) => {
    e.preventDefault();
    const { title, body, targetDevice } = this.state.newNotification;
    if (!title.trim() || !body.trim()) {
      window.toastr.warning("Please fill in both title and message body");
      return;
    }

    this.setState({ sending: true });
    
    Data.device_commands.create({
      device: targetDevice,
      command: "NOTIFICATION",
      status: "PENDING",
      payload: JSON.stringify({ title, body }),
    })
    .then(() => {
      window.toastr.success("Notification broadcast successfully!");
      this.setState({
        sending: false,
        newNotification: {
          title: "",
          body: "",
          targetDevice: "GLOBAL",
        }
      });
    })
    .catch(err => {
      console.error(err);
      window.toastr.error("Failed to broadcast notification");
      this.setState({ sending: false });
    });
  };

  handleFormChange = (field, value) => {
    this.setState(prevState => ({
      newNotification: {
        ...prevState.newNotification,
        [field]: value
      }
    }));
  };

  openEditModal = (device) => {
    this.setState({
      showEditModal: true,
      editingDevice: device,
      editFormData: {
        assignedStudent: device.assignedStudent || "",
        school: device.school || "",
      }
    });
  };

  closeEditModal = () => {
    this.setState({ showEditModal: false, editingDevice: null });
  };

  handleEditFormChange = (field, value) => {
    this.setState(prevState => ({
      editFormData: {
        ...prevState.editFormData,
        [field]: value
      }
    }));
  };

  saveDeviceEdit = (e) => {
    e.preventDefault();
    const { editingDevice, editFormData } = this.state;
    if (!editingDevice) return;

    Data.devices.update({
      id: editingDevice.id,
      assignedStudent: editFormData.assignedStudent,
      school: editFormData.school
    })
    .then(() => {
      window.toastr.success("Device updated successfully!");
      this.closeEditModal();
    })
    .catch(err => {
      console.error(err);
      window.toastr.error("Failed to update device");
    });
  };

  renderDeviceRow = (device) => {
    const batteryLevel = device.batteryLevel || 0;
    const isLowBattery = batteryLevel < 20;

    return (
      <div key={device.id} className="book-card mdm-card">
        <div className="device-header-premium">
          <div className="device-icon-wrapper">
            <i className="la la-tablet"></i>
          </div>
          <span className={`status-pill ${device.status === 'ONLINE' ? 'online' : 'offline'}`}>
            <span className="status-dot"></span> {device.status || 'OFFLINE'}
          </span>
        </div>

        <div className="device-info-premium">
            <h5 className="device-mac" title={device.macAddress}>{device.macAddress}</h5>
            <div className="device-assignee">
                <i className="la la-user"></i> {device.assignedStudent || 'Unassigned'}
                <button 
                  className="btn btn-sm btn-outline-primary" 
                  style={{ marginLeft: '10px', padding: '2px 8px', fontSize: '12px' }}
                  onClick={() => this.openEditModal(device)}
                >
                  <i className="la la-pencil"></i> Assign
                </button>
            </div>
            {device.school && (
                <div className="device-school" style={{ marginTop: '5px', color: '#666', fontSize: '13px' }}>
                    <i className="la la-building"></i> School ID: {device.school}
                </div>
            )}
        </div>

        <div className="device-metrics-premium">
          <div className="metric">
            <i className={`la la-battery-${isLowBattery ? 'empty low-battery' : 'full good-battery'}`}></i>
            <span>{batteryLevel}%</span>
          </div>
          <div className="metric">
            <i className="la la-android"></i>
            <span>{device.osVersion || 'N/A'}</span>
          </div>
        </div>

        <div className="book-actions device-actions-premium">
          <button 
              className="book-action-btn edit-btn mdm-action-btn"
              onClick={() => this.sendCommand(device, 'LOCK')}
              title="Lock Device"
          >
              <i className="la la-lock"></i>
          </button>
          
          <button 
              className="book-action-btn delete-btn mdm-action-btn"
              onClick={() => this.sendCommand(device, 'WIPE')}
              title="Wipe Data"
          >
              <i className="la la-eraser"></i>
          </button>

          <button 
              className="book-action-btn view-btn mdm-action-btn"
              onClick={() => this.sendCommand(device, 'UNENROLL')}
              title="Unenroll Device"
          >
              <i className="la la-unlink"></i>
          </button>

          <button 
              className="book-action-btn mdm-action-btn"
              style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff', border: 'none' }}
              onClick={() => this.sendCommand(device, 'UNLOCK')}
              title="Unlock Device (Remove MDM Restrictions)"
          >
              <i className="la la-unlock"></i>
          </button>
        </div>
      </div>
    );
  };

  render() {
    const { 
      filteredDevices, 
      devices,
      loading, 
      showQRModal, 
      activeFilter, 
      activeTab, 
      deviceCommands, 
      newNotification, 
      sending,
      showEditModal,
      editFormData,
      liveApkInfo,
      pendingApkInfo,
      loadingVersions,
      publishing,
      overrideVersion,
      overriding,
    } = this.state;
    
    const filters = ["All", "ONLINE", "OFFLINE"];

    if (loading) {
      return <div className="library-container text-center pt-5">Loading MDM Dashboard...</div>;
    }

    return (
      <div className="library-container">
        <div className="library-header">
          <div>
            <h2 className="lib-title">Mobile Device Management</h2>
            <p className="lib-subtitle">Monitor and manage enrolled student tablets</p>
          </div>
          
          <div className="mdm-header-actions">
            <button
              className="btn-apple-add"
              onClick={this.openQRModal}
            >
              <i className="la la-qrcode" /> Enroll Device
            </button>
          </div>
        </div>

        {/* Premium Tabbed Navigation */}
        <div className="mdm-tab-navigation">
          <button 
            className={`mdm-tab-btn ${activeTab === 'devices' ? 'active' : ''}`}
            onClick={() => this.setState({ activeTab: 'devices' })}
          >
            <i className="la la-tablet"></i> Devices Grid
          </button>
          <button 
            className={`mdm-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => this.setState({ activeTab: 'notifications' })}
          >
            <i className="la la-bullhorn"></i> Push & Kiosk Actions
          </button>
          <button 
            className={`mdm-tab-btn ${activeTab === 'deploy' ? 'active' : ''}`}
            onClick={() => { this.setState({ activeTab: 'deploy' }); this.fetchVersionStatus(); }}
          >
            <i className="la la-rocket"></i> Production Deploy
          </button>
        </div>

        {activeTab === 'devices' ? (
          <>
            <div className="library-controls">
                <div className="category-pills">
                    {filters.map(f => (
                        <button 
                            key={f}
                            className={`cat-pill ${activeFilter === f ? 'active' : ''}`}
                            onClick={() => this.handleFilterChange(f)}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                <div className="search-wrapper">
                    <i className="la la-search search-icon"></i>
                    <input
                        type="text"
                        className="apple-search"
                        placeholder="Search MAC or student..."
                        onChange={this.handleSearch}
                    />
                </div>
            </div>

            <div className="book-shelf">
              {filteredDevices.map(this.renderDeviceRow)}
            </div>

            {filteredDevices.length === 0 && (
              <div className="empty-state" style={{textAlign: 'center', padding: '4rem', color: '#999'}}>
                <i className="la la-tablet" style={{fontSize: '3rem', marginBottom: '1rem', display: 'block'}}></i>
                <p>No devices found for this criteria.</p>
              </div>
            )}
          </>
        ) : (
          <>
          <div className="mdm-notification-panel">
            {/* Left Column: Composer Form */}
            <div className="mdm-panel-section mdm-composer-card">
              <h3 className="section-subtitle"><i className="la la-paper-plane"></i> Dispatch Remote Command</h3>
              <form onSubmit={this.sendNotification} className="premium-composer-form">
                <div className="premium-form-group">
                  <label className="premium-form-label">Target Device / Channel</label>
                  <select 
                    className="premium-form-select"
                    value={newNotification.targetDevice}
                    onChange={(e) => this.handleFormChange('targetDevice', e.target.value)}
                  >
                    <option value="GLOBAL">Broadcast to All Connected Devices</option>
                    {devices.map(d => (
                      <option key={d.id} value={d.macAddress}>
                        {d.assignedStudent || "Unassigned"} ({d.macAddress})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="premium-form-group">
                  <label className="premium-form-label">Notification Title</label>
                  <input 
                    type="text"
                    className="premium-form-input"
                    placeholder="e.g. System Announcement"
                    value={newNotification.title}
                    onChange={(e) => this.handleFormChange('title', e.target.value)}
                    required
                  />
                </div>

                <div className="premium-form-group">
                  <label className="premium-form-label">Message Body</label>
                  <textarea 
                    className="premium-form-textarea"
                    placeholder="Write your push notification alert here..."
                    rows="4"
                    value={newNotification.body}
                    onChange={(e) => this.handleFormChange('body', e.target.value)}
                    required
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className="premium-send-btn"
                  disabled={sending}
                >
                  {sending ? (
                    <>
                      <i className="la la-spinner la-spin"></i> Broadcasting...
                    </>
                  ) : (
                    <>
                      <i className="la la-share-square"></i> Send Realtime Alert
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Left Column: Update App Composer Card */}
            <div className="mdm-panel-section mdm-composer-card" style={{ marginTop: '20px' }}>
              <h3 className="section-subtitle"><i className="la la-cloud-upload"></i> Deploy App Update</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                this.setState({ sending: true });
                const { newNotification } = this.state;
                // Reuse targetDevice from newNotification state or default to GLOBAL
                const target = newNotification.targetDevice || 'GLOBAL';
                
                Data.device_commands.create({
                  device: target,
                  command: 'UPDATE_APP',
                  status: 'PENDING',
                  payload: JSON.stringify({ 
                    targetVersion: this.state.updateVersion || '1.0.0'
                  }),
                }).then(() => {
                  this.setState({ 
                    sending: false,
                    updateVersion: ''
                  });
                  this.loadLogs();
                }).catch(err => {
                  console.error(err);
                  this.setState({ sending: false });
                });
              }} className="premium-composer-form">
                
                <div className="premium-form-group">
                  <label className="premium-form-label">Target Device / Channel</label>
                  <select 
                    className="premium-form-select"
                    value={this.state.newNotification?.targetDevice || 'GLOBAL'}
                    onChange={(e) => this.handleFormChange('targetDevice', e.target.value)}
                  >
                    <option value="GLOBAL">Broadcast to All Connected Devices</option>
                    {this.state.devices && this.state.devices.map(d => (
                      <option key={d.id} value={d.macAddress}>
                        {d.assignedStudent || "Unassigned"} ({d.macAddress})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="premium-form-group">
                  <label className="premium-form-label">Target Version</label>
                  <input 
                    type="text"
                    className="premium-form-input"
                    placeholder="e.g. 1.0.5 or 20"
                    value={this.state.updateVersion || ''}
                    onChange={(e) => this.setState({ updateVersion: e.target.value })}
                    required
                  />
                  <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                    Devices running an older version will automatically open the Play Store to update.
                  </small>
                </div>

                <button 
                  type="submit" 
                  className="premium-send-btn"
                  style={{ backgroundColor: '#28a745' }}
                  disabled={this.state.sending}
                >
                  {this.state.sending ? (
                    <><i className="la la-spinner la-spin"></i> Deploying...</>
                  ) : (
                    <><i className="la la-cloud-upload"></i> Deploy App Update</>
                  )}
                </button>
              </form>
            </div>
          </div>
          <div className="mdm-notification-panel" style={{ marginTop: '20px' }}>
            {/* Right Column equivalent: Sent Command Logs */}
            <div className="mdm-panel-section mdm-logs-card">
              <h3 className="section-subtitle"><i className="la la-history"></i> Realtime Command Logs</h3>
              <div className="mdm-logs-list">
                {deviceCommands.length === 0 ? (
                  <div className="empty-logs">
                    <i className="la la-history"></i>
                    <p>No commands have been dispatched yet.</p>
                  </div>
                ) : (
                  deviceCommands.map(cmd => {
                    let alertTitle = cmd.command;
                    let alertMsg = cmd.payload || "";
                    
                    if (cmd.command === 'NOTIFICATION' && cmd.payload) {
                      try {
                        const parsed = JSON.parse(cmd.payload);
                        alertTitle = parsed.title || "Notification";
                        alertMsg = parsed.body || parsed.message || cmd.payload;
                      } catch (e) {}
                    }

                    return (
                      <div key={cmd.id} className="mdm-log-card">
                        <div className="log-header">
                          <span className={`log-command-type ${cmd.command === 'NOTIFICATION' ? 'type-alert' : 'type-cmd'}`}>
                            {cmd.command}
                          </span>
                          <span className={`log-status-badge ${String(cmd.status || 'PENDING').toLowerCase()}`}>
                            {cmd.status === 'PENDING' && <i className="la la-spinner la-spin" />} {cmd.status}
                          </span>
                        </div>
                        <div className="log-body">
                          <strong>{alertTitle}</strong>
                          <p>{alertMsg}</p>
                        </div>
                        <div className="log-footer">
                          <span><i className="la la-mobile"></i> Target: {cmd.device === 'GLOBAL' || cmd.device === 'BROADCAST' ? 'Global Broadcast' : cmd.device}</span>
                          <span><i className="la la-clock-o"></i> {new Date(cmd.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          </>
        )}

        {activeTab === 'deploy' && (
          <div>
            {/* Version Status Cards */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {/* Live Version Card */}
              <div className="mdm-panel-section" style={{ flex: '1', minWidth: '260px', background: liveApkInfo ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' : '#f9fafb', border: '1px solid', borderColor: liveApkInfo ? '#86efac' : '#e5e7eb', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: liveApkInfo ? '#16a34a' : '#d1d5db', display: 'inline-block', boxShadow: liveApkInfo ? '0 0 0 3px #bbf7d0' : 'none' }}></span>
                  <strong style={{ fontSize: '13px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live MDM Version</strong>
                  <button onClick={this.fetchVersionStatus} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '14px' }} title="Refresh">
                    <i className={`la la-sync ${loadingVersions ? 'la-spin' : ''}`}></i>
                  </button>
                </div>
                {liveApkInfo ? (
                  <>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#15803d', letterSpacing: '-0.5px' }}>v{liveApkInfo.version}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
                      <i className="la la-clock-o"></i> Published {liveApkInfo.publishedAt ? new Date(liveApkInfo.publishedAt).toLocaleString() : new Date(liveApkInfo.uploadedAt).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px', wordBreak: 'break-all' }}>
                      <i className="la la-link"></i> {liveApkInfo.downloadUrl}
                    </div>
                  </>
                ) : (
                  <div style={{ color: '#9ca3af', fontSize: '13px' }}>{loadingVersions ? 'Loading...' : 'No live version found.'}</div>
                )}
              </div>

              {/* Pending Version Card */}
              <div className="mdm-panel-section" style={{ flex: '1', minWidth: '260px', background: pendingApkInfo ? 'linear-gradient(135deg, #fffbeb, #fef3c7)' : '#f9fafb', border: '1px solid', borderColor: pendingApkInfo ? '#fcd34d' : '#e5e7eb', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: pendingApkInfo ? '#f59e0b' : '#d1d5db', display: 'inline-block', boxShadow: pendingApkInfo ? '0 0 0 3px #fde68a' : 'none' }}></span>
                  <strong style={{ fontSize: '13px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Staged (Pending) Version</strong>
                </div>
                {pendingApkInfo ? (
                  <>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#d97706', letterSpacing: '-0.5px' }}>v{pendingApkInfo.version}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
                      <i className="la la-upload"></i> Uploaded {new Date(pendingApkInfo.uploadedAt).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '12px', color: pendingApkInfo.version === liveApkInfo?.version ? '#16a34a' : '#d97706', marginTop: '6px', fontWeight: '600' }}>
                      {pendingApkInfo.version === liveApkInfo?.version
                        ? <><i className="la la-check-circle"></i> In sync with live</>  
                        : <><i className="la la-exclamation-triangle"></i> Awaiting MDM publish</>}
                    </div>
                  </>
                ) : (
                  <div style={{ color: '#9ca3af', fontSize: '13px' }}>{loadingVersions ? 'Loading...' : 'No staged version. Run yarn release to stage a build.'}</div>
                )}
              </div>
            </div>

            {/* Emergency Rollback Panel */}
            <div className="mdm-panel-section" style={{ background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: '1px solid #fca5a5', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <i className="la la-exclamation-triangle" style={{ color: '#dc2626', fontSize: '18px' }}></i>
                <strong style={{ fontSize: '14px', color: '#991b1b' }}>Emergency Rollback / Override</strong>
                {liveApkInfo?.overrideNote && (
                  <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#b91c1c', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '4px', padding: '2px 8px' }}>
                    ⚠️ Currently overridden
                  </span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: '#7f1d1d', marginBottom: '14px', lineHeight: '1.6' }}>
                Use this to instantly set the <strong>live MDM version</strong> to any version number — without uploading a new APK.
                This is useful when a tablet is stuck trying to update: set the live version back to what the tablet is running, and it will
                see itself as up-to-date and cancel the stuck update automatically.
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: '1', minWidth: '160px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#991b1b', display: 'block', marginBottom: '6px' }}>Target Version</label>
                  <input
                    type="text"
                    className="premium-form-input"
                    placeholder={liveApkInfo ? `current: ${liveApkInfo.version}` : 'e.g. 204.524.632'}
                    value={overrideVersion}
                    onChange={(e) => this.setState({ overrideVersion: e.target.value })}
                    style={{ border: '1px solid #fca5a5', borderRadius: '8px', background: '#fff5f5' }}
                  />
                </div>
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#991b1b', display: 'block', marginBottom: '6px' }}>Upload Secret</label>
                  <input
                    type="password"
                    className="premium-form-input"
                    placeholder="x-upload-secret"
                    value={this.state.publishSecret}
                    onChange={(e) => this.setState({ publishSecret: e.target.value })}
                    style={{ border: '1px solid #fca5a5', borderRadius: '8px', background: '#fff5f5' }}
                  />
                </div>
                <button
                  className="premium-send-btn"
                  style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', whiteSpace: 'nowrap', opacity: overriding ? 0.7 : 1 }}
                  disabled={overriding}
                  onClick={this.overrideMdmVersion}
                >
                  {overriding
                    ? <><i className="la la-spinner la-spin"></i> Overriding...</>
                    : <><i className="la la-exclamation-triangle"></i> Force Override</>}
                </button>
              </div>
            </div>

            {/* Publish Control */}
            {pendingApkInfo && pendingApkInfo.version !== liveApkInfo?.version && (
              <div className="mdm-panel-section" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', borderRadius: '12px', padding: '24px', marginBottom: '24px', color: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1', minWidth: '240px' }}>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#f1f5f9' }}>
                      <i className="la la-rocket" style={{ color: '#f59e0b', marginRight: '8px' }}></i>
                      Publish v{pendingApkInfo.version} to MDM Devices
                    </h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>
                      Once you have confirmed v{pendingApkInfo.version} is live on the Play Store, click Publish to notify all MDM tablets to silently update in the background.
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '260px' }}>
                    <input
                      type="password"
                      className="premium-form-input"
                      style={{ background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9', borderRadius: '8px', padding: '8px 12px', fontSize: '13px' }}
                      placeholder="Upload secret (x-upload-secret)"
                      value={this.state.publishSecret}
                      onChange={(e) => this.setState({ publishSecret: e.target.value })}
                    />
                    <button
                      className="premium-send-btn"
                      style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', fontWeight: '700', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: publishing ? 'not-allowed' : 'pointer', opacity: publishing ? 0.7 : 1 }}
                      disabled={publishing}
                      onClick={this.publishMdmVersion}
                    >
                      {publishing
                        ? <><i className="la la-spinner la-spin"></i> Publishing...</>
                        : <><i className="la la-rocket"></i> Publish MDM Update</>}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Production Release Instructions */}
            <div className="mdm-panel-section" style={{ borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px', marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#1e293b' }}>
                <i className="la la-list-ol" style={{ color: '#6366f1', marginRight: '8px' }}></i>
                Production Release Checklist
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { step: 1, icon: 'la-code-branch', color: '#6366f1', title: 'Bump version & commit', desc: 'Run yarn prepare-release to auto-increment the version number and commit the changelog.' },
                  { step: 2, icon: 'la-play-circle', color: '#8b5cf6', title: 'yarn release', desc: 'Builds the signed AAB + APK, uploads the APK to S3 (staged, not live to MDM), and submits the AAB to the Play Store internal track.' },
                  { step: 3, icon: 'la-google-play', color: '#06b6d4', title: 'Promote on Play Console', desc: 'Go to Google Play Console → Production → Promote release. Wait for review to complete (~hours).' },
                  { step: 4, icon: 'la-check-double', color: '#16a34a', title: 'Verify Play Store is live', desc: 'Confirm the new version appears on the Play Store listing before touching MDM devices.' },
                  { step: 5, icon: 'la-rocket', color: '#f59e0b', title: 'Publish to MDM', desc: 'Come back here → enter upload secret → click "Publish MDM Update". All enrolled tablets will silently self-update within minutes.' },
                ].map(({ step, icon, color, title, desc }) => (
                  <div key={step} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`la ${icon}`} style={{ color: '#fff', fontSize: '14px' }}></i>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '13px', color: '#1e293b' }}><span style={{ color, marginRight: '6px' }}>Step {step}:</span>{title}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', lineHeight: '1.5' }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Manual Update Command */}
            <div className="mdm-panel-section mdm-composer-card" style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#1e293b' }}>
                <i className="la la-cloud-upload" style={{ color: '#3b82f6', marginRight: '8px' }}></i>
                Manual Update Command (Play Store)
              </h4>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>Sends a realtime command to tablets to open the Play Store to a specific version. Useful for non-MDM or manually-enrolled devices.</p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div className="premium-form-group" style={{ flex: '1', minWidth: '200px', marginBottom: 0 }}>
                  <label className="premium-form-label">Target Device / Channel</label>
                  <select 
                    className="premium-form-select"
                    value={this.state.newNotification?.targetDevice || 'GLOBAL'}
                    onChange={(e) => this.handleFormChange('targetDevice', e.target.value)}
                  >
                    <option value="GLOBAL">Broadcast to All Connected Devices</option>
                    {this.state.devices && this.state.devices.map(d => (
                      <option key={d.id} value={d.macAddress}>
                        {d.assignedStudent || "Unassigned"} ({d.macAddress})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="premium-form-group" style={{ flex: '1', minWidth: '160px', marginBottom: 0 }}>
                  <label className="premium-form-label">Target Version</label>
                  <input 
                    type="text"
                    className="premium-form-input"
                    placeholder={liveApkInfo?.version || 'e.g. 204.524.633'}
                    value={this.state.updateVersion || ''}
                    onChange={(e) => this.setState({ updateVersion: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button 
                    className="premium-send-btn"
                    style={{ backgroundColor: '#3b82f6', whiteSpace: 'nowrap' }}
                    disabled={this.state.sending}
                    onClick={() => {
                      this.setState({ sending: true });
                      const target = this.state.newNotification?.targetDevice || 'GLOBAL';
                      Data.device_commands.create({
                        device: target,
                        command: 'UPDATE_APP',
                        status: 'PENDING',
                        payload: JSON.stringify({ targetVersion: this.state.updateVersion || liveApkInfo?.version || '' }),
                      }).then(() => {
                        window.toastr.success('Update command dispatched!');
                        this.setState({ sending: false, updateVersion: '' });
                      }).catch(err => {
                        window.toastr.error('Failed to dispatch command');
                        this.setState({ sending: false });
                      });
                    }}
                  >
                    {this.state.sending ? <><i className="la la-spinner la-spin"></i> Sending...</> : <><i className="la la-cloud-upload"></i> Send Update Command</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showQRModal && (
          <QRModal onClose={this.closeQRModal} />
        )}

        {showEditModal && (
          <div className="qr-modal-overlay">
            <div className="qr-modal-content" style={{ maxWidth: '500px', width: '90%', padding: '30px' }}>
              <div className="qr-modal-header" style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Edit Device Details</h3>
                <button className="btn-qr-close" onClick={this.closeEditModal}>
                  <i className="la la-times" />
                </button>
              </div>
              <form onSubmit={this.saveDeviceEdit}>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Assigned Student (Name or ID)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                    value={editFormData.assignedStudent} 
                    onChange={(e) => this.handleEditFormChange('assignedStudent', e.target.value)} 
                    placeholder="e.g. John Doe or STU-123"
                  />
                </div>
                
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>School ID (For unassigned/orphaned devices)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                    value={editFormData.school} 
                    onChange={(e) => this.handleEditFormChange('school', e.target.value)} 
                    placeholder="e.g. 683eb0b3269670f07ed0901c"
                  />
                  <small style={{ color: '#888', display: 'block', marginTop: '5px' }}>Leave blank to keep current school. Usually this doesn't need to be changed manually.</small>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
                  <button type="button" className="btn btn-secondary" onClick={this.closeEditModal} style={{ padding: '8px 20px', borderRadius: '4px', border: 'none', background: '#e0e0e0', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 20px', borderRadius: '4px', border: 'none', background: '#5A67D8', color: 'white', cursor: 'pointer' }}>Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default MDMList;
