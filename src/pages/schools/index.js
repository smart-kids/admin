import React from "react";
import { BrowserRouter as Router, Route, Switch, Link } from "react-router-dom";
import Navbar from "../../components/navbar";
import Subheader from "../../components/subheader";
import List from "./list";
import EnhancedDashboard from "./enhanced-dashboard";
import Footer from "../../components/footer";


class App extends React.Component {
  state = {
    currentView: 'enhanced',
    isSuperAdmin: false,
    loading: true
  };

  componentDidMount() {
    this.checkUserRole();
  }

  checkUserRole = () => {
    const userData = JSON.parse(localStorage.getItem("user")) || {};
    const enhancedUserData = JSON.parse(localStorage.getItem("enhancedUser")) || userData;
    
    // Check if user is super admin
    const isSuperAdmin = userData.userType === 'sAdmin' || 
                         enhancedUserData.userType === 'sAdmin';
    
    this.setState({ 
      isSuperAdmin, 
      loading: false 
    });

    // If not super admin and trying to access enhanced dashboard, redirect to list
    if (!isSuperAdmin && this.state.currentView === 'enhanced') {
      this.setState({ currentView: 'list' });
    }
  };

  handleViewChange = (view) => {
    // Only allow enhanced dashboard view for super admins
    if (view === 'enhanced' && !this.state.isSuperAdmin) {
      return; // Prevent access to enhanced dashboard
    }
    this.setState({ currentView: view });
  };

  render() {
    const { currentView, isSuperAdmin, loading } = this.state;
    
    if (loading) {
      return (
        <div className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--ver kt-page">
          <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
            <div className="spinner spinner-primary mr-3"></div>
            <span>Loading...</span>
          </div>
        </div>
      );
    }
    
    // Show access denied message if not super admin
    if (!isSuperAdmin) {
      return (
        <div className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--ver kt-page">
          <div
            className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor kt-wrapper"
            id="kt_wrapper"
          >
            <Navbar />
            <div
              className="kt-content  kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor"
              id="kt_content"
            >
              <div className="kt-container  kt-grid__item kt-grid__item--fluid">
                <div className="card card-custom">
                  <div className="card-body text-center py-20">
                    <div className="symbol symbol-100 symbol-light-primary mb-6">
                      <span className="symbol-label">
                        <i className="la la-lock text-primary" style={{ fontSize: '3rem' }}></i>
                      </span>
                    </div>
                    <h3 className="font-weight-bolder text-dark mb-2">Access Restricted</h3>
                    <p className="text-muted mb-6">You need super admin privileges to access the Schools Dashboard.</p>
                    <Link to="/home" className="btn btn-primary">
                      <i className="la la-arrow-left mr-2"></i>
                      Back to Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <Footer />
          </div>
        </div>
      );
    }
    
    return (
      <div className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--ver kt-page">
        <div
          className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor kt-wrapper"
          id="kt_wrapper"
        >
          <Navbar />
        

          <div
            className="kt-content  kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor"
            id="kt_content"
          >
            <div className="kt-container  kt-grid__item kt-grid__item--fluid">
              {currentView === 'enhanced' ? <EnhancedDashboard /> : <List />}
            </div>
          </div>
          <Footer />
        </div>
      </div>
    );
  }
}

export default App;
