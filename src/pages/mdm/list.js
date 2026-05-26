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
  };

  componentDidMount() {
    this._subscription = Data.devices.subscribe(({ devices }) => {
      this.setState({ devices: devices || [], loading: false }, this.filterDevices);
    });
  }

  componentWillUnmount() {
    if (this._subscription) this._subscription();
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
        device: device.id,
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
            </div>
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
        </div>
      </div>
    );
  };

  render() {
    const { filteredDevices, loading, showQRModal, activeFilter } = this.state;
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
          
          <button
            className="btn-apple-add"
            onClick={this.openQRModal}
          >
            <i className="la la-qrcode" /> Enroll Device
          </button>
        </div>

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

        {showQRModal && (
          <QRModal onClose={this.closeQRModal} />
        )}
      </div>
    );
  }
}

export default MDMList;
