import React from "react";
import RouteModal from "./add"; // The fixed modal from previous step
import DeleteModal from "./delete";    // Your existing delete modal
import Data from "../../utils/data";

class RouteListV2 extends React.Component {
  state = {
    routes: [],
    students: [],
    searchTerm: "",
    routeToDelete: null,
    loading: true
  };

  componentDidMount() {
    this.initData();
  }

  componentWillUnmount() {
    if (this.routeSub) this.routeSub();
    if (this.studentSub) this.studentSub();
  }

  initData = () => {
    // 1. Load Initial Data
    this.setState({
      routes: Data.routes.list(),
      students: Data.students.list(),
      loading: false
    });

    // 2. Subscribe to Routes
    this.routeSub = Data.routes.subscribe(({ routes }) => {
      this.setState({ routes });
    });

    // 3. Subscribe to Students (to update counts/avatars dynamically)
    this.studentSub = Data.students.subscribe(({ students }) => {
      this.setState({ students });
    });
  };

  // --- Actions ---

  openCreateModal = () => {
    // Show modal in Create mode (null edit prop)
    this.modalRef.setState({ id: null }); // Ensure internal state reset if needed
    // OR simpler if your modal handles it via ref:
    this.modalRef.show(); 
  };

  openEditModal = (route) => {
    // Pass the route object to the modal
    this.modalRef.show(); 
    // We need to trigger the edit prop logic. 
    // Since the modal is a class component with getDerivedStateFromProps, 
    // we can pass the data via a method on the ref (if we added one) 
    // OR render the modal with the 'edit' prop in state.
    
    // BETTER APPROACH based on your Modal Code:
    // Update the parent state to pass 'edit' prop, then show.
    this.setState({ selectedRoute: route }, () => {
      this.modalRef.show();
    });
  };

  handleDelete = (route) => {
    this.setState({ routeToDelete: route }, () => {
       // Assuming DeleteModal has a show method or is controlled by props
       // adapting to your existing DeleteModal pattern:
       this.deleteModalRef.show(); 
    });
  };

  // --- Helpers ---

  getStudentsForRoute = (routeId) => {
    return this.state.students.filter(s => s.route && s.route.id === routeId);
  };

  handleSearch = (e) => {
    this.setState({ searchTerm: e.target.value });
  };

  render() {
    const { routes, searchTerm, selectedRoute, routeToDelete, loading } = this.state;

    // Filter Routes
    const filteredRoutes = routes?.filter(r => 
      r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="container-fluid p-4" style={{ backgroundColor: "#f4f6f9", minHeight: "100vh" }}>
        
        {/* --- Header Section --- */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="font-weight-bold text-dark mb-0">Route Management</h3>
            <p className="text-muted mb-0">Manage bus routes and student assignments</p>
          </div>
          <button 
            className="btn btn-primary font-weight-bold shadow-sm px-4"
            onClick={() => this.setState({ selectedRoute: null }, this.openCreateModal)}
          >
            <i className="fa fa-plus mr-2"></i> Create New Route
          </button>
        </div>

        {/* --- Search Bar --- */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-3">
            <div className="input-group">
              <div className="input-group-prepend">
                <span className="input-group-text bg-white border-0"><i className="fa fa-search text-muted"></i></span>
              </div>
              <input 
                type="text" 
                className="form-control border-0" 
                placeholder="Search routes..." 
                value={searchTerm}
                onChange={this.handleSearch}
              />
            </div>
          </div>
        </div>

        {/* --- Route Grid --- */}
        {loading ? (
            <div className="text-center p-5"><span className="spinner-border text-primary"></span></div>
        ) : (
            <div className="row">
            {(filteredRoutes || []).map(route => {
                const assignedStudents = this.getStudentsForRoute(route.id);
                
                return (
                <div className="col-md-6 col-xl-4 mb-4" key={route.id}>
                    <div className="card shadow-sm border-0 h-100">
                    <div className="card-body d-flex flex-column">
                        
                        {/* Title & Actions */}
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <h5 className="font-weight-bold text-dark mb-0">{route.name}</h5>
                            <div className="dropdown">
                                <button className="btn btn-sm btn-icon btn-light" data-toggle="dropdown">
                                    <i className="fa fa-ellipsis-h text-muted"></i>
                                </button>
                                <div className="dropdown-menu dropdown-menu-right">
                                    <button className="dropdown-item" onClick={() => this.openEditModal(route)}>
                                        <i className="fa fa-edit mr-2 text-primary"></i> Edit Details
                                    </button>
                                    <button className="dropdown-item text-danger" onClick={() => this.handleDelete(route)}>
                                        <i className="fa fa-trash mr-2"></i> Delete Route
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <p className="text-muted small mb-4 flex-grow-1">
                            {route.description || "No description provided."}
                        </p>

                        {/* Student Avatars / Count */}
                        <div className="d-flex align-items-center justify-content-between mt-3 pt-3 border-top">
                            <div className="d-flex align-items-center">
                                {/* Stacked Avatars (Show max 3) */}
                                <div className="d-flex position-relative" style={{height: '35px'}}>
                                    {assignedStudents.slice(0, 3).map((s, i) => (
                                        <div 
                                            key={s.id} 
                                            className="rounded-circle bg-light-primary text-primary d-flex align-items-center justify-content-center border border-white"
                                            style={{
                                                width: '35px', 
                                                height: '35px', 
                                                fontSize: '12px', 
                                                fontWeight: 'bold',
                                                marginLeft: i > 0 ? '-10px' : '0',
                                                zIndex: 3 - i
                                            }}
                                            title={s.names}
                                        >
                                            {s.names.charAt(0)}
                                        </div>
                                    ))}
                                    {assignedStudents.length > 3 && (
                                        <div 
                                            className="rounded-circle bg-light text-muted d-flex align-items-center justify-content-center border border-white"
                                            style={{width: '35px', height: '35px', fontSize: '10px', marginLeft: '-10px', zIndex: 0}}
                                        >
                                            +{assignedStudents.length - 3}
                                        </div>
                                    )}
                                </div>
                                
                                {assignedStudents.length === 0 && (
                                    <span className="text-muted small font-italic">No students assigned</span>
                                )}
                            </div>
                            
                            <button 
                                className="btn btn-sm btn-light-primary font-weight-bold"
                                onClick={() => this.openEditModal(route)}
                            >
                                Manage Students
                            </button>
                        </div>

                    </div>
                    </div>
                </div>
                );
            })}
            
            {filteredRoutes.length === 0 && (
                <div className="col-12 text-center p-5 text-muted">
                    <i className="fa fa-route fa-3x mb-3"></i>
                    <p>No routes found matching your search.</p>
                </div>
            )}
            </div>
        )}

        {/* --- Modals --- */}
        
        {/* Create/Edit Modal */}
        {/* We use the key to force re-render if selectedRoute changes, or rely on ref methods */}
        <RouteModal 
            ref={ref => this.modalRef = ref}
            edit={selectedRoute}
            save={async (data) => {
                if(data.id) {
                    await Data.routes.update(data);
                } else {
                    await Data.routes.create(data);
                }
                // Clear selection after save
                this.setState({ selectedRoute: null });
            }}
        />

        {/* Delete Modal */}
        <DeleteModal 
            ref={ref => this.deleteModalRef = ref} // Adjust based on your DeleteModal implementation
            remove={routeToDelete}
            save={async (route) => {
                await Data.routes.delete(route);
                this.setState({ routeToDelete: null });
            }}
        />

      </div>
    );
  }
}

export default RouteListV2;