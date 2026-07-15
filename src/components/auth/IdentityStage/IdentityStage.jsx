import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './IdentityStage.css';

const IdentityStage = ({ onSubmit, isLoading, recognizedUser, sessionData }) => {
    const [identifier, setIdentifier] = useState('');
    const [isValid, setIsValid] = useState(false);
    const inputRef = useRef(null);

    // Detection patterns
    const PHONE_REGEX = /^\+?\d{7,}$/;

    // Auto-focus on mount
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // Detect input type and validate
    useEffect(() => {
        if (!identifier) {
            setIsValid(false);
            return;
        }

        if (PHONE_REGEX.test(identifier)) {
            setIsValid(true);
        } else {
            setIsValid(false);
        }
    }, [identifier]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isValid && !isLoading) {
            onSubmit(identifier);
        }
    };

    return (
        <div className="identity-stage">
            <form onSubmit={handleSubmit} className="identity-form">
                <div className="form-group">
                    <label className="form-label">
                        Phone Number
                    </label>
                    
                    <div className="input-wrapper">
                        <span className="input-icon">📱</span>
                        <input
                            ref={inputRef}
                            type="tel"
                            inputMode="tel"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value.trim())}
                            placeholder="e.g. 0700000000"
                            className="form-input phone"
                            autoComplete="tel"
                            disabled={isLoading}
                            autoFocus
                        />
                        
                        {isValid && (
                            <span className="input-validation-icon">✓</span>
                        )}
                    </div>
                    
                    <p className="helper-text">
                        {!identifier ? 'Enter your phone number to continue' : 'We\'ll send a verification code to this number'}
                    </p>
                </div>

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
