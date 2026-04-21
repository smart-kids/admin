import React from 'react';
import './ErrorDisplay.css';

const ErrorDisplay = ({ error, onDismiss, variant = 'error' }) => {
    if (!error) return null;

    const getIcon = () => {
        switch (variant) {
            case 'error':
                return '⚠️';
            case 'warning':
                return '⚡';
            case 'info':
                return 'ℹ️';
            case 'success':
                return '✅';
            default:
                return '⚠️';
        }
    };

    const getClassName = () => {
        const baseClass = 'error-display';
        return `${baseClass} ${variant}`;
    };

    return (
        <div className={getClassName()}>
            <div className="error-icon">
                {getIcon()}
            </div>
            
            <div className="error-content">
                <div className="error-message">
                    {typeof error === 'string' ? error : error.message || 'An error occurred'}
                </div>
                
                {error.suggestion && (
                    <div className="error-suggestion">
                        <strong>Suggestion:</strong> {error.suggestion}
                    </div>
                )}
                
                {error.code && (
                    <div className="error-code">
                        Error Code: {error.code}
                    </div>
                )}
            </div>
            
            {onDismiss && (
                <button
                    onClick={onDismiss}
                    className="error-dismiss"
                    aria-label="Dismiss error"
                >
                    ×
                </button>
            )}
        </div>
    );
};

export default ErrorDisplay;
