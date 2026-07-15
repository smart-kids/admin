import React from 'react';
import './PageLoader.css';

const PageLoader = () => {
    return (
        <div className="page-loader-container">
            <div className="page-loader-brand-wrapper">
                <div className="page-loader-spinner">
                    <div className="spinner-circle spinner-circle-1"></div>
                    <div className="spinner-circle spinner-circle-2"></div>
                </div>
                <h3 className="page-loader-text">Loading ShulePlus</h3>
                <div className="page-loader-progress">
                    <div className="page-loader-progress-bar"></div>
                </div>
            </div>
        </div>
    );
};

export default PageLoader;
