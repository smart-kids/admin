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
    activeTab: "devices", // 'devices' or 'notifications'
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
      editFormData
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
