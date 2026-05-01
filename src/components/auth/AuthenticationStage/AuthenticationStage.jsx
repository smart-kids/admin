import React, { useState, useEffect, useRef } from 'react';
import Data from '../../../utils/data';
import OTPBoxInput from '../SharedComponents/OTPBoxInput';
import './AuthenticationStage.css';

const AuthenticationStage = ({ 
    userIdentifier, 
    onAuthenticate, 
    onBack, 
    isLoading,
}) => {
    const [otpSent, setOtpSent] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const intervalRef = useRef(null);
    const isSubmittingRef = useRef(false);

    // Handle resend timer
    useEffect(() => {
        if (resendTimer > 0) {
            intervalRef.current = setInterval(() => {
                setResendTimer(prev => prev - 1);
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [resendTimer]);

    // Reset submitting lock if loading state finishes (e.g. error)
    useEffect(() => {
        if (!isLoading) {
            isSubmittingRef.current = false;
        }
    }, [isLoading]);

    // Auto-send OTP on mount
    useEffect(() => {
        if (userIdentifier && !otpSent) {
            handleSendOTP();
        }
    }, [userIdentifier]);

    const handleSendOTP = async () => {
        try {
            const result = await Data.communication.sms.sendOTP(userIdentifier);
            if (result.success) {
                setOtpSent(true);
                setResendTimer(30);
                console.log('OTP sent successfully to:', userIdentifier);
            } else {
                throw new Error(result.message || "Failed to send OTP code.");
            }
        } catch (error) {
            console.error('Failed to send OTP:', error);
        }
    };

    const handleResendOTP = () => {
        if (resendTimer === 0) {
            handleSendOTP();
        }
    };

    const handleOTPComplete = (otpCode) => {
        if (otpCode.length === 5) {
            if (isSubmittingRef.current || isLoading) return;
            isSubmittingRef.current = true;
            onAuthenticate('otp', { otp: otpCode });
        }
    };

    const getMaskedIdentifier = () => {
        const id = userIdentifier || '';
        if (/^\+?\d{7,}$/.test(id)) {
            return id.length > 4 ? id.substring(0, 3) + '***' + id.substring(id.length - 2) : id;
        } else if (id.includes('@')) {
            const [username, domain] = id.split('@');
            return username.substring(0, 2) + '***@' + domain;
        }
        return id.substring(0, 2) + '***';
    };

    return (
        <div className="authentication-stage">
            {/* Back Button */}
            <button 
                type="button" 
                onClick={onBack}
                className="back-button"
                disabled={isLoading}
            >
                ← Back
            </button>

            {/* User Identifier Display */}
            <div className="user-identifier">
                <span className="identifier-label">Signing in as:</span>
                <span className="identifier-value">{getMaskedIdentifier()}</span>
            </div>

            {/* OTP Form */}
            <form onSubmit={(e) => e.preventDefault()} className="authentication-form">
                <div className="otp-section">
                    {!otpSent ? (
                        <div className="otp-send-section">
                            <p className="auth-description">We'll send a 5-digit code to your phone</p>
                            <button
                                type="button"
                                onClick={handleSendOTP}
                                className="btn btn-primary"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="loading-spinner"></span>
                                        Sending...
                                    </>
                                ) : (
                                    'Send SMS Code'
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="otp-input-section">
                            <div className="otp-instructions">
                                Enter the 5-digit code sent to {getMaskedIdentifier()}
                            </div>
                            
                            <OTPBoxInput
                                length={5}
                                onComplete={handleOTPComplete}
                                disabled={isLoading}
                                autoFocus
                            />
                            
                            <div className="otp-actions">
                                <button
                                    type="button"
                                    onClick={handleResendOTP}
                                    className="btn-text"
                                    disabled={resendTimer > 0 || isLoading}
                                >
                                    {resendTimer > 0 
                                        ? `Resend in ${resendTimer}s` 
                                        : 'Resend Code'
                                    }
                                </button>
                                <button
                                    type="button"
                                    onClick={onBack}
                                    className="btn-text"
                                    disabled={isLoading}
                                >
                                    Change Number
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </form>

            {/* Security Notice */}
            <div className="security-notice">
                <div className="security-icon">🛡️</div>
                <div className="security-text">
                    <strong>Secure Connection</strong>
                    <p>Your login is encrypted and protected</p>
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
            
        </div>
    );
};

export default AuthenticationStage;
