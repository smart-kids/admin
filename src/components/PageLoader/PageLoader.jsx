import React from 'react';
import Navbar from '../navbar';
import Subheader from '../subheader';
import Footer from '../footer';
import ProfilePanel from '../profile-panel';
import './PageLoader.css';

const PageLoader = () => {
    return (
      <div className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--ver kt-page">
        <div
          className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor kt-wrapper"
          id="kt_wrapper"
        >
          <Navbar />
          <Subheader links={["Loading..."]} />

          <div
            className="kt-content  kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor"
            style={{ height: "100vh" }}
            id="kt_content"
          >
            <div className="kt-container  kt-grid__item kt-grid__item--fluid">
              <div className="row">
                <div className="col-12">
                   {/* Premium Skeleton Loader */}
                   <div className="skeleton-card">
                      <div className="skeleton-header">
                         <div className="skeleton-title"></div>
                         <div className="skeleton-actions">
                            <div className="skeleton-btn"></div>
                            <div className="skeleton-btn"></div>
                         </div>
                      </div>
                      <div className="skeleton-body">
                         <div className="skeleton-row"></div>
                         <div className="skeleton-row" style={{ width: '80%' }}></div>
                         <div className="skeleton-row" style={{ width: '90%' }}></div>
                         <div className="skeleton-row" style={{ width: '60%' }}></div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
        <ProfilePanel />
      </div>
    );
};

export default PageLoader;
