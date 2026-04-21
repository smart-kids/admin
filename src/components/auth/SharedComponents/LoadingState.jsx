import React from 'react';
import './LoadingState.css';

const LoadingState = ({ message = 'Loading...', showLogo = false }) => {
    return (
        <div className="loading-overlay">
            <div className="loading-content">
                <div className="loading-spinner-large"></div>
                
                <div className="loading-text-container">
                    <h2 className="loading-title">{message}</h2>
                    <p className="loading-subtitle">Please wait while we prepare your experience</p>
                </div>
                
                <div className="loading-progress">
                    <div className="progress-bar">
                        <div className="progress-fill"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoadingState;
