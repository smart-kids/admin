import React, { useState, useEffect, useRef } from 'react';
import OTPBoxInput from '../SharedComponents/OTPBoxInput';
import './AuthenticationStage.css';

const AuthenticationStage = ({ 
    userIdentifier, 
    preferredMethod, 
    onAuthenticate, 
    onBack, 
    onMethodChange, 
    isLoading,
    sessionData 
}) => {
    const [selectedMethod, setSelectedMethod] = useState(preferredMethod || 'otp');
    const [credentials, setCredentials] = useState({});
    const [otpSent, setOtpSent] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    
    const passwordRef = useRef(null);
    const intervalRef = useRef(null);

    // Auto-focus password input when password method is selected
    useEffect(() => {
        if (selectedMethod === 'password' && passwordRef.current) {
            setTimeout(() => passwordRef.current.focus(), 100);
        }
    }, [selectedMethod]);

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

    // Auto-send OTP if phone number and OTP is preferred method
    useEffect(() => {
        if (selectedMethod === 'otp' && !otpSent && userIdentifier) {
            handleSendOTP();
        }
    }, [selectedMethod, userIdentifier]);

    const handleMethodSelect = (method) => {
        setSelectedMethod(method);
        onMethodChange(method);
        setCredentials({});
        setOtpSent(false);
        setResendTimer(0);
    };

    const handleSendOTP = async () => {
        try {
            // In real implementation, this would call your OTP sending API
            // For now, we'll simulate it
            setOtpSent(true);
            startResendTimer();
            setCredentials({ ...credentials, otpSent: true });
        } catch (error) {
            console.error('Failed to send OTP:', error);
        }
    };

    const startResendTimer = () => {
        setResendTimer(30); // 30 seconds
    };

    const handleOTPComplete = (otpCode) => {
        setCredentials({ ...credentials, otp: otpCode });
        
        // Auto-submit when OTP is complete
        if (otpCode.length === 5) {
            handleAuthenticate('otp', { otp: otpCode });
        }
    };

    const handlePasswordChange = (password) => {
        setPasswordInput(password);
        setCredentials({ ...credentials, password });
    };

    const handleAuthenticate = (method, creds) => {
        onAuthenticate(method, creds);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (selectedMethod === 'password') {
            if (passwordInput.trim()) {
                handleAuthenticate('password', { password: passwordInput });
            }
        } else if (selectedMethod === 'otp') {
            if (credentials.otp && credentials.otp.length === 5) {
                handleAuthenticate('otp', { otp: credentials.otp });
            }
        }
    };

    const handleResendOTP = () => {
        if (resendTimer === 0) {
            handleSendOTP();
        }
    };

    const getMethodDescription = () => {
        switch (selectedMethod) {
            case 'otp':
                return 'We\'ll send a 5-digit code to your phone';
            case 'password':
                return 'Enter your account password';
            default:
                return 'Choose your preferred authentication method';
        }
    };

    const isPhoneIdentifier = () => {
        return /^\+?\d{7,}$/.test(userIdentifier);
    };

    const getMaskedIdentifier = () => {
        if (isPhoneIdentifier()) {
            const phone = userIdentifier;
            if (phone.length > 4) {
                return phone.substring(0, 3) + '***' + phone.substring(phone.length - 2);
            }
            return phone;
        } else if (userIdentifier.includes('@')) {
            const [username, domain] = userIdentifier.split('@');
            return username.substring(0, 2) + '***@' + domain;
        }
        return userIdentifier.substring(0, 2) + '***';
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

            {/* Method Selection */}
            <div className="method-selection">
                <h3 className="method-title">Choose authentication method</h3>
                
                {isPhoneIdentifier() && (
                    <div 
                        className={`method-option ${selectedMethod === 'otp' ? 'selected' : ''}`}
                        onClick={() => handleMethodSelect('otp')}
                    >
                        <input
                            type="radio"
                            name="auth-method"
                            value="otp"
                            checked={selectedMethod === 'otp'}
                            onChange={() => handleMethodSelect('otp')}
                            disabled={isLoading}
                        />
                        <div className="method-info">
                            <div className="method-name">
                                📱 SMS Code (Recommended)
                            </div>
                            <div className="method-description">
                                Fast and secure - we'll text you a code
                            </div>
                        </div>
                    </div>
                )}

                <div 
                    className={`method-option ${selectedMethod === 'password' ? 'selected' : ''}`}
                    onClick={() => handleMethodSelect('password')}
                >
                    <input
                        type="radio"
                        name="auth-method"
                        value="password"
                        checked={selectedMethod === 'password'}
                        onChange={() => handleMethodSelect('password')}
                        disabled={isLoading}
                    />
                    <div className="method-info">
                        <div className="method-name">
                            🔐 Password
                        </div>
                        <div className="method-description">
                            Use your account password
                        </div>
                    </div>
                </div>
            </div>

            {/* Authentication Form */}
            <form onSubmit={handleSubmit} className="authentication-form">
                <div className="auth-description">
                    {getMethodDescription()}
                </div>

                {selectedMethod === 'otp' && (
                    <div className="otp-section">
                        {!otpSent ? (
                            <div className="otp-send-section">
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
                                    <button
                                        type="button"
                                        onClick={() => handleMethodSelect('password')}
                                        className="btn-text"
                                        disabled={isLoading}
                                    >
                                        Use Password Instead
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {selectedMethod === 'password' && (
                    <div className="password-section">
                        <div className="password-input-wrapper">
                            <input
                                ref={passwordRef}
                                type={showPassword ? 'text' : 'password'}
                                value={passwordInput}
                                onChange={(e) => handlePasswordChange(e.target.value)}
                                placeholder="Enter your password"
                                className="form-input password-input"
                                autoComplete="current-password"
                                disabled={isLoading}
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="password-toggle"
                                disabled={isLoading}
                            >
                                {showPassword ? '👁️‍🗨️' : '👁️'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Submit Button for Password */}
                {selectedMethod === 'password' && (
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={!passwordInput.trim() || isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className="loading-spinner"></span>
                                Signing In...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                )}
            </form>

            {/* Security Notice */}
            <div className="security-notice">
                <div className="security-icon">🛡️</div>
                <div className="security-text">
                    <strong>Secure Connection</strong>
                    <p>Your login is encrypted and protected</p>
                </div>
            </div>
        </div>
    );
};

export default AuthenticationStage;
