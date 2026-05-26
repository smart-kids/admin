import React from "react";
import moment from "moment";
import DeleteModal from "./delete";
import Data from "../../utils/data";
import Stat from "../home/components/stat";
import { ModernKPICard } from "../../components/charts/ModernKPICard";

// Helper for Icons
const Icon = ({ name, color }) => <i className={`fas fa-${name}`} style={{ color }}></i>;

class TripDashboard extends React.Component {
  state = {
    trips: [],
    schedules: [],
    loading: true,
    remove: null,
    filter: 'all' // 'all', 'running', 'completed', 'cancelled'
  };

  componentDidMount() {
    this._isMounted = true;
    const originalSetState = this.setState.bind(this);
    this.setState = (state, callback) => {
        if (this._isMounted) {
            originalSetState(state, callback);
        }
    };
    this.initData();
  }

  componentWillUnmount() {
    this._isMounted = false;
    if (this.tripSub) this.tripSub();
  }

  initData = () => {
    // Initial Load
    this.processTrips(Data.trips.list());
    this.setState({ schedules: Data.schedules.list() });

    // Live Subscriptions
    this.tripSub = Data.trips.subscribe(({ trips }) => this.processTrips(trips));
  };

  processTrips = (rawTrips) => {
    const processed = rawTrips.map(trip => {
      const students = trip.schedule?.route?.students || [];
      const dropOffs = trip.events?.filter(e => e.type === 'CHECKEDOFF') || [];
      
      return {
        ...trip,
        routeName: trip.schedule?.route?.name || "Unassigned Route",
        driverName: trip.driver?.names || "No Driver",
        busPlate: trip.bus?.plate || "No Plate",
        busMake: trip.bus?.make || "",
        progress: students.length > 0 ? (dropOffs.length / students.length) * 100 : 0,
        droppedCount: dropOffs.length,
        totalStudents: students.length,
        status: this.getTripStatus(trip)
      };
    });

    // Sort: Running trips first, then by date descending
    processed.sort((a, b) => {
      if (a.status === 'Running' && b.status !== 'Running') return -1;
      if (a.status !== 'Running' && b.status === 'Running') return 1;
      return new Date(b.startedAt) - new Date(a.startedAt);
    });

    this.setState({ trips: processed, loading: false });
  };

  getTripStatus = (trip) => {
    if (trip.isCancelled) return 'Cancelled';
    if (trip.completedAt) return 'Completed';
    return 'Running';
  };

  // --- Navigation Handler ---
  goToTripDetails = (tripId) => {
    // Matches the route expected by your Router (e.g., HashRouter)
    window.location.hash = `#/trip/${tripId}`;
  };

  handleDelete = (e, trip) => {
    e.stopPropagation(); // Prevent navigating to details when clicking delete
    this.setState({ remove: trip });
  };

  render() {
    const { trips, loading } = this.state;
    
    // Segmentation
    const runningTrips = trips.filter(t => t.status === 'Running');
    const recentHistory = trips.filter(t => t.status !== 'Running'); // Show all history or filter based on state

    const stats = {
      total: trips.length,
      running: runningTrips.length,
      completed: trips.filter(t => t.status === 'Completed').length,
      cancelled: trips.filter(t => t.status === 'Cancelled').length
    };

    return (
      <div className="container-fluid p-4" style={{ backgroundColor: "#f4f6f9", minHeight: "100vh" }}>
        
        {/* --- 1. Top Statistics --- */}
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
        }}>
          <div style={{ minWidth: 0 }}>
            <ModernKPICard
              title="Total Trips"
              value={stats.total}
              subtext="Recorded trips"
              icon="flaticon2-map text-primary"
              color="#3699ff"
            />
          </div>
          <div style={{ minWidth: 0 }}>
            <ModernKPICard
              title="Active Now"
              value={stats.running}
              subtext="Trips in progress"
              icon="flaticon2-lorry text-success"
              color="#10b981"
            />
          </div>
          <div style={{ minWidth: 0 }}>
            <ModernKPICard
              title="Completed"
              value={stats.completed}
              subtext="Finished successfully"
              icon="flaticon2-correct text-info"
              color="#8b5cf6"
            />
          </div>
          <div style={{ minWidth: 0 }}>
            <ModernKPICard
              title="Cancelled"
              value={stats.cancelled}
              subtext="Trips aborted"
              icon="flaticon2-cross text-danger"
              color="#e74c3c"
            />
          </div>
        </div>

        {/* --- 2. Live Operations (Active Cards) --- */}
        {runningTrips.length > 0 && (
          <div className="mb-5">
            <h5 className="font-weight-bold mb-3 text-dark">
              <span className="mr-2 text-success">●</span> Live Operations
            </h5>
            <div className="row">
              {runningTrips.map(trip => (
                <div className="col-md-6 col-xl-4 mb-4" key={trip.id}>
                  <div 
                    className="card shadow-sm border-0 h-100 card-hover-effect" 
                    onClick={() => this.goToTripDetails(trip.id)}
                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                  >
                    <div className="card-body">
                      <div className="d-flex justify-content-between mb-3">
                        <span className="badge badge-light-success px-3 py-2">In Progress</span>
                        <small className="text-muted font-weight-bold">{moment(trip.startedAt).format('h:mm A')}</small>
                      </div>
                      
                      <h5 className="font-weight-bold text-dark mb-1">{trip.routeName}</h5>
                      <div className="text-muted mb-4 small">
                        <Icon name="bus" color="#5d78ff" /> {trip.busMake} ({trip.busPlate})
                      </div>

                      {/* Visual Progress of the Bus */}
                      <div className="d-flex justify-content-between align-items-end mb-1">
                        <span className="font-weight-bold h4 mb-0 text-primary">{Math.round(trip.progress)}%</span>
                        <span className="text-muted small">{trip.droppedCount} / {trip.totalStudents} Dropped</span>
                      </div>
                      <div className="progress" style={{ height: '6px' }}>
                        <div className="progress-bar bg-primary" style={{ width: `${trip.progress}%` }}></div>
                      </div>
                    </div>
                    
                    <div className="card-footer bg-white border-top-0 pt-0 pb-3">
                      <div className="d-flex align-items-center">
                        <div className="symbol symbol-30 mr-2 bg-light-info rounded-circle d-flex align-items-center justify-content-center" style={{width:30, height:30}}>
                          <span className="text-info font-weight-bold">{trip.driverName.charAt(0)}</span>
                        </div>
                        <span className="text-dark font-weight-bold small">{trip.driverName}</span>
                        <button className="btn btn-sm btn-light-primary ml-auto font-weight-bold">Track Map</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- 3. Recent History Table --- */}
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
            <h5 className="mb-0 font-weight-bold">Trip History</h5>
            <div className="input-group" style={{ width: '250px' }}>
                <div className="input-group-prepend">
                    <span className="input-group-text bg-light border-0"><Icon name="search" color="#ccc"/></span>
                </div>
                <input type="text" className="form-control bg-light border-0" placeholder="Search route or driver..." />
            </div>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light text-muted text-uppercase small">
                <tr>
                  <th className="pl-4">Route</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Timeline</th>
                  <th>Status</th>
                  <th className="text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentHistory.map(trip => (
                  <tr 
                    key={trip.id} 
                    onClick={() => this.goToTripDetails(trip.id)} 
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="pl-4 font-weight-bold text-dark">
                      {trip.routeName}
                    </td>
                    <td>
                      <span className="d-block text-dark font-weight-500">{trip.busPlate}</span>
                      <small className="text-muted">{trip.busMake}</small>
                    </td>
                    <td>
                      {trip.driverName}
                    </td>
                    <td>
                      <div className="d-flex flex-column small">
                         <span className="text-success"><Icon name="play" color="green"/> {moment(trip.startedAt).format('MMM Do, h:mm A')}</span>
                         {trip.completedAt && (
                           <span className="text-danger mt-1"><Icon name="stop" color="red"/> {moment(trip.completedAt).format('h:mm A')}</span>
                         )}
                      </div>
                    </td>
                    <td>
                      {trip.status === 'Completed' && <span className="badge badge-light-success">Completed</span>}
                      {trip.status === 'Cancelled' && <span className="badge badge-light-danger">Cancelled</span>}
                      {trip.status === 'Running' && <span className="badge badge-light-primary">Running</span>}
                    </td>
                    <td className="text-right pr-4">
                      <button 
                        className="btn btn-icon btn-light-secondary btn-sm rounded-circle mr-2"
                        title="View Details"
                      >
                        <Icon name="arrow-right" color="#6c757d" />
                      </button>
                      <button 
                        className="btn btn-icon btn-light-danger btn-sm rounded-circle"
                        onClick={(e) => this.handleDelete(e, trip)}
                        title="Delete Trip"
                      >
                        <Icon name="trash" color="#f64e60" />
                      </button>
                    </td>
                  </tr>
                ))}
                {recentHistory.length === 0 && (
                    <tr><td colSpan="6" className="text-center py-5 text-muted">No history found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <DeleteModal 
            remove={this.state.remove} 
            save={trip => Data.trips.delete(trip)} 
        />
      </div>
    );
  }
}

export default TripDashboard;