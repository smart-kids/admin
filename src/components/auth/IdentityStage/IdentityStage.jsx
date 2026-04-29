import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './IdentityStage.css';

const IdentityStage = ({ onSubmit, isLoading, recognizedUser, sessionData }) => {
    const [identifier, setIdentifier] = useState('');
    const [inputType, setInputType] = useState('text');
    const [isValid, setIsValid] = useState(false);
    const inputRef = useRef(null);

    // Detection patterns
    const PHONE_REGEX = /^\+?\d{7,}$/;
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Auto-focus on mount
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // Detect input type and validate
    useEffect(() => {
        if (!identifier) {
            setInputType('text');
            setIsValid(false);
            return;
        }

        if (PHONE_REGEX.test(identifier)) {
            setInputType('phone');
            setIsValid(true);
        } else if (EMAIL_REGEX.test(identifier)) {
            setInputType('email');
            setIsValid(true);
        } else if (identifier.length >= 3) {
            setInputType('username');
            setIsValid(true);
        } else {
            setInputType('text');
            setIsValid(false);
        }
    }, [identifier]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isValid && !isLoading) {
            onSubmit(identifier);
        }
    };

    const getPlaceholder = () => {
        switch (inputType) {
            case 'phone':
                return '+254700000000';
            case 'email':
                return 'email@example.com';
            case 'username':
                return 'Enter username';
            default:
                return 'Enter phone, email, or username';
        }
    };

    const getInputIcon = () => {
        switch (inputType) {
            case 'phone':
                return '📱';
            case 'email':
                return '✉️';
            case 'username':
                return '👤';
            default:
                return '🔑';
        }
    };

    const getInputLabel = () => {
        switch (inputType) {
            case 'phone':
                return 'Phone Number';
            case 'email':
                return 'Email Address';
            case 'username':
                return 'Username';
            default:
                return 'Phone, Email, or Username';
        }
    };

    const getHelperText = () => {
        if (!identifier) return 'Enter your phone number, email, or username to continue';
        
        switch (inputType) {
            case 'phone':
                return 'We\'ll send a verification code to this number';
            case 'email':
                return 'Enter your password or request a magic link';
            case 'username':
                return 'Enter your password to continue';
            default:
                return 'Continue typing to detect your account type';
        }
    };

    const getQuickAccessOptions = () => {
        if (!sessionData) return [];
        
        const options = [];
        if (sessionData.userEmail) {
            options.push({
                type: 'email',
                value: sessionData.userEmail,
                label: sessionData.userEmail
            });
        }
        
        return options;
    };

    return (
        <div className="identity-stage">
            <form onSubmit={handleSubmit} className="identity-form">
                <div className="form-group">
                    <label className="form-label">
                        {getInputLabel()}
                    </label>
                    
                    <div className="input-wrapper">
                        <span className="input-icon">{getInputIcon()}</span>
                        <input
                            ref={inputRef}
                            type={inputType === 'email' ? 'email' : 'text'}
                            inputMode={inputType === 'phone' ? 'tel' : 'text'}
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value.trim())}
                            placeholder={getPlaceholder()}
                            className={`form-input ${inputType}`}
                            autoComplete={inputType === 'email' ? 'email' : 'username'}
                            disabled={isLoading}
                            autoFocus
                        />
                        
                        {isValid && (
                            <span className="input-validation-icon">✓</span>
                        )}
                    </div>
                    
                    <p className="helper-text">
                        {getHelperText()}
                    </p>
                </div>

                {/* Quick Access Options */}
                {getQuickAccessOptions().length > 0 && !identifier && (
                    <div className="quick-access">
                        <p className="quick-access-label">Quick access:</p>
                        <div className="quick-access-options">
                            {getQuickAccessOptions().map((option, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => setIdentifier(option.value)}
                                    className="quick-access-btn"
                                    disabled={isLoading}
                                >
                                    <span className="quick-access-icon">
                                        {option.type === 'email' ? '✉️' : '👤'}
                                    </span>
                                    <span className="quick-access-text">{option.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!isValid || isLoading}
                >
                    {isLoading ? (
                        <>
                            <span className="loading-spinner"></span>
                            Verifying...
                        </>
                    ) : (
                        'Continue'
                    )}
                </button>

                

                {/* Security Notice */}
                <div className="security-notice">
                    <div className="security-icon">🔒</div>
                    <div className="security-text">
                        <strong>Secure Login</strong>
                        <p>Your information is encrypted and protected</p>
                    </div>
                </div>

                {/* Registration Options */}
                <div className="registration-options">
                    <div className="registration-divider">
                        <span>New to Shule Plus?</span>
                    </div>
                    <div className="registration-links">
                        <div className="registration-link-item">
                            <i className="fas fa-school"></i>
                            <div>
                                <strong>School Administrators</strong>
                                <p><a href="#/register" className="text-primary">Register your school</a> and create your admin account</p>
                            </div>
                        </div>
                        <div className="registration-link-item">
                            <i className="fas fa-chalkboard-teacher"></i>
                            <div>
                                <strong>Teachers & Staff</strong>
                                <p>Contact your school administrator to request an invitation</p>
                            </div>
                        </div>
                        <div className="registration-link-item">
                            <i className="fas fa-users"></i>
                            <div>
                                <strong>Parents</strong>
                                <p>Ask your administrator for a registration link or <a href="#/" className="text-primary">sign in here</a></p>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default IdentityStage;
