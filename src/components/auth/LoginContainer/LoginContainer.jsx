import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { API } from '../../../utils/requests';
import Data from '../../../utils/data';
import { useTheme } from '../../../contexts/ThemeContext';
import './LoginContainer.css';

// Import stage components
import IdentityStage from '../IdentityStage/IdentityStage';
import AuthenticationStage from '../AuthenticationStage/AuthenticationStage';
import LoadingState from '../SharedComponents/LoadingState';
import ErrorDisplay from '../SharedComponents/ErrorDisplay';

const LoginContainer = () => {
    const history = useHistory();
    const isMountedRef = useRef(true);
    const { isDarkMode, toggleDarkMode } = useTheme();
    
    // Authentication state
    const [loginStage, setLoginStage] = useState('identity');
    const [userIdentifier, setUserIdentifier] = useState('');
    const [recognizedUser, setRecognizedUser] = useState(null);
    const [preferredMethod, setPreferredMethod] = useState(null);
    const [schoolMeta, setSchoolMeta] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isNetworkRequest, setIsNetworkRequest] = useState(false);
    
    // Session data
    const [sessionData, setSessionData] = useState(null);
    const [syncingMessage, setSyncingMessage] = useState('');

    // Input detection patterns
    const PHONE_REGEX = /^\+?\d{7,}$/;
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Load session data and school meta on mount
    useEffect(() => {
        loadSessionData();
        loadSchoolMeta();
        const cleanupInactivity = setupInactivityDetection();
        
        // Check for locked session and show welcome message
        const urlParams = new URLSearchParams(window.location.search);
        const wasLocked = urlParams.get('locked');
        if (wasLocked === 'true') {
            setSyncingMessage('Welcome back! Your session was secured for your protection.');
            setTimeout(() => {
                if (isMountedRef.current) {
                    setSyncingMessage('');
                }
            }, 3000);
        }
        
        // Check if already logged in
        if (localStorage.getItem("authorization")) {
            history.push('/trips/all');
        }
        
        return cleanupInactivity;
    }, [history]);

    const loadSessionData = () => {
        try {
            const lastSession = localStorage.getItem('lastLoginSession');
            if (lastSession) {
                const data = JSON.parse(lastSession);
                setSessionData(data);
                setRecognizedUser({
                    name: data.userName,
                    email: data.userEmail,
                    lastLogin: data.lastLogin,
                    preferredMethod: data.preferredMethod
                });
            }
        } catch (error) {
            console.warn('Failed to load session data:', error);
        }
    };

    const loadSchoolMeta = async () => {
        const queryParams = new URLSearchParams(window.location.search);
        const schoolId = queryParams.get('school');
        
        if (schoolId) {
            try {
                const response = await axios.get(`${API}/auth/meta?schoolId=${schoolId}`);
                const schoolData = response.data;
                setSchoolMeta(schoolData);
                storeSchoolBranding(schoolData);
                document.title = `Login - ${schoolData.name || 'Shule Plus'}`;
            } catch (error) {
                console.error('Failed to load school metadata:', error);
            }
        } else {
            // Load stored branding if no school parameter
            loadStoredBranding();
        }
    };

    const storeSchoolBranding = (schoolData) => {
        const brandingData = {
            name: schoolData.name,
            logoUrl: schoolData.logoUrl,
            supportEmail: schoolData.supportEmail,
            primaryColor: schoolData.primaryColor,
            secondaryColor: schoolData.secondaryColor,
            schoolId: schoolData.id || schoolData.schoolId
        };
        localStorage.setItem('schoolBranding', JSON.stringify(brandingData));
        applyBrandingColors(brandingData);
        console.log('💾 Stored school branding:', brandingData);
    };

    const loadStoredBranding = () => {
        try {
            const storedBranding = localStorage.getItem('schoolBranding');
            if (storedBranding) {
                const brandingData = JSON.parse(storedBranding);
                setSchoolMeta(brandingData);
                document.title = `Login - ${brandingData.name || 'Shule Plus'}`;
                applyBrandingColors(brandingData);
                console.log('📥 Loaded stored school branding:', brandingData);
            }
        } catch (error) {
            console.warn('Failed to load stored branding:', error);
        }
    };

    const applyBrandingColors = (brandingData) => {
        if (brandingData.primaryColor || brandingData.secondaryColor) {
            const root = document.documentElement;
            if (brandingData.primaryColor) {
                root.style.setProperty('--school-primary-color', brandingData.primaryColor);
            }
            if (brandingData.secondaryColor) {
                root.style.setProperty('--school-secondary-color', brandingData.secondaryColor);
            }
            console.log('🎨 Applied school branding colors');
        }
    };

    const detectInputType = useCallback((value) => {
        if (PHONE_REGEX.test(value)) return 'phone';
        if (EMAIL_REGEX.test(value)) return 'email';
        return 'username';
    }, [PHONE_REGEX, EMAIL_REGEX]);

    const handleIdentitySubmit = async (identifier) => {
        setIsLoading(true);
        setIsNetworkRequest(true);
        setError(null);
        
        try {
            // Simulate identity verification - in real app, this would call your API
            const inputType = detectInputType(identifier);
            
            // Determine preferred method based on input type and history
            let suggestedMethod = 'otp';
            if (inputType === 'email' || inputType === 'username') {
                suggestedMethod = 'password';
            }
            
            // Override with user preference if available
            if (sessionData?.preferredMethod) {
                suggestedMethod = sessionData.preferredMethod;
            }
            
            setUserIdentifier(identifier);
            setPreferredMethod(suggestedMethod);
            setLoginStage('authentication');
            
        } catch (err) {
            setError(err.response?.data?.message || 'Identity verification failed');
        } finally {
            setIsLoading(false);
            setIsNetworkRequest(false);
        }
    };

    const handleAuthentication = async (method, credentials) => {
        if (isLoading || isNetworkRequest) {
            console.log('?? Authentication already in progress, blocking duplicate request.');
            return;
        }
        setIsLoading(true);
        setIsNetworkRequest(true);
        setError(null);
        
        try {
            console.log('?? Starting authentication with method:', method);
            let response;
            
            if (method === 'otp') {
                console.log('?? Sending OTP request to:', `${API}/auth/verify/sms`);
                response = await axios.post(`${API}/auth/verify/sms`, {
                    user: userIdentifier,
                    password: credentials.otp
                });
            } else if (method === 'password') {
                console.log('?? Sending password request to:', `${API}/auth/login`);
                response = await axios.post(`${API}/auth/login`, {
                    user: userIdentifier,
                    password: credentials.password
                });
            }
            
            console.log('?? Server response:', response);
            console.log('?? Response data:', response.data);
            
            const { token, data, user } = response.data;
            const userData = data || user;
            
            console.log('?? Extracted token:', token);
            console.log('?? Extracted user data:', userData);
            
            if (!token || !userData) {
                console.error('?? Missing token or user data in response');
                throw new Error('Invalid response from server');
            }
            
            console.log('?? Saving session...');
            // Save session
            await saveSession(userData, method);
            
            console.log('?? Handling login success...');
            // Handle login success
            await handleLoginSuccess(token, userData);
            
        } catch (err) {
            console.error('?? Authentication error:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Authentication failed';
            setError(errorMsg);
            setIsLoading(false);
            setIsNetworkRequest(false);
        }
    };

    const saveSession = async (userData, method) => {
        const sessionInfo = {
            userName: userData.name || userData.firstName + ' ' + userData.lastName,
            userEmail: userData.email,
            lastLogin: new Date().toISOString(),
            preferredMethod: method,
            userId: userData.id,
            schoolId: userData.school
        };
        
        localStorage.setItem('lastLoginSession', JSON.stringify(sessionInfo));
        setSessionData(sessionInfo);
        
        // Store current school branding for persistence
        if (schoolMeta) {
            storeSchoolBranding(schoolMeta);
        }
    };

    const handleLoginSuccess = async (token, userData) => {
        console.log('🚀 Starting login success handling...');
        setSyncingMessage('Preparing your session...');
        
        try {
            console.log('💾 Storing authorization token...');
            localStorage.setItem("authorization", token);
            localStorage.setItem("user", JSON.stringify(userData));
            
            console.log('🔄 Initializing app data...');
            // Initialize app data
            Data.init();
            
            console.log('🎯 Setting redirect message...');
            setSyncingMessage('Redirecting to dashboard...');
            
            // Navigate based on user type
            const userType = userData.userType?.toLowerCase();
            console.log('👤 User type:', userType);
            let redirectPath = '/trips/all';
            
            if (userType === 'admin') {
                redirectPath = '/dashboard';
            } else if (userType === 'teacher') {
                redirectPath = '/classes';
            } else if (userType === 'parent') {
                redirectPath = '/children';
            }
            
            console.log('🔄 Redirecting to:', redirectPath);
            setTimeout(() => {
                console.log('🚀 Executing navigation to:', redirectPath);
                history.push(redirectPath);
            }, 1000);
            
        } catch (error) {
            console.error('❌ Login success handling failed:', error);
            setError('Failed to complete login process');
            setIsLoading(false);
        }
    };

    const handleBackToIdentity = () => {
        setLoginStage('identity');
        setUserIdentifier('');
        setPreferredMethod(null);
        setError(null);
    };

    const handleMethodChange = (newMethod) => {
        setPreferredMethod(newMethod);
        setError(null);
    };

    const clearAuthData = () => {
        // Clear only authentication-related data, preserve branding
        localStorage.removeItem('authorization');
        localStorage.removeItem('user');
        localStorage.removeItem('lastLoginSession');
        console.log('🧹 Cleared authentication data, preserved school branding');
    };

    const setupInactivityDetection = () => {
        let inactivityTimer;
        let lastActivity = Date.now();
        
        const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
        
        const resetTimer = () => {
            if (!isMountedRef.current) return;
            lastActivity = Date.now();
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(handleInactivity, INACTIVITY_TIMEOUT);
        };
        
        const handleInactivity = () => {
            if (!isMountedRef.current) return;
            console.log('🔒 User inactive for 30 minutes, locking session');
            lockSession();
        };
        
        const lockSession = () => {
            if (!isMountedRef.current) return;
            const hasToken = localStorage.getItem('authorization');
            if (hasToken) {
                clearAuthData();
                localStorage.setItem('sessionLocked', 'true');
                localStorage.setItem('lockTime', new Date().toISOString());
                console.log('🔐 Session locked due to inactivity');
                
                // Redirect to login page with welcome message
                window.location.href = '/login?locked=true';
            }
        };
        
        // Activity events to track
        const activityEvents = [
            'mousedown', 'mousemove', 'keypress', 'scroll', 
            'touchstart', 'click', 'keydown'
        ];
        
        activityEvents.forEach(event => {
            document.addEventListener(event, resetTimer, true);
        });
        
        // Initial timer setup
        resetTimer();
        
        // Check for existing lock on mount
        const isLocked = localStorage.getItem('sessionLocked');
        if (isLocked === 'true') {
            console.log('🔐 Detected locked session, preparing welcome screen');
            // Clear lock flag but keep branding
            localStorage.removeItem('sessionLocked');
            localStorage.removeItem('lockTime');
        }
        
        // Cleanup on unmount
        return () => {
            clearTimeout(inactivityTimer);
            activityEvents.forEach(event => {
                document.removeEventListener(event, resetTimer, true);
            });
        };
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    if (isLoading && syncingMessage) {
        return <LoadingState message={syncingMessage} />;
    }

    return (
        <div className="login-container">
            <div className="login-card">
                {/* Dark Mode Switcher */}
                <button 
                    className="dark-mode-switcher"
                    onClick={toggleDarkMode}
                    aria-label="Toggle dark mode"
                >
                    <div className="icon">
                        {isDarkMode ? (
                            <div className="moon-icon">
                                <div className="moon-circle"></div>
                                <div className="moon-crescent"></div>
                            </div>
                        ) : (
                            <div className="sun-icon">
                                <div className="sun-center"></div>
                                <div className="sun-rays"></div>
                            </div>
                        )}
                    </div>
                </button>
                
                {/* Left side - Name and Instructions */}
                <div className="login-info-panel">
                    <div>
                        <h1 className="text-logo">{schoolMeta?.name || 'Shule Plus'}</h1>
                        <h1>Sign In To Your Account</h1>
                        <p>Enter your credentials to access your dashboard</p>
                        <p>Manage your school's learning, transportation, and communication seamlessly with our comprehensive platform.</p>
                        
                        {/* Header with school branding */}
                        {schoolMeta?.logoUrl && (
                            <img 
                                src={schoolMeta.logoUrl} 
                                alt={schoolMeta.name} 
                                className="login-logo-image mb-3"
                            />
                        )}
                        
                        <div className="login-info-footer">
                            &copy; {new Date().getFullYear()} {schoolMeta?.name || 'Shule Plus'}. All Rights Reserved.
                            <br/>
                            Need help? <a href={schoolMeta?.supportEmail ? `mailto:${schoolMeta.supportEmail}` : "mailto:shuleplusadmin@gmail.com"}>Contact Support</a>
                        </div>
                    </div>
                </div>

                {/* Right side - Login flow */}
                <div className="login-form-panel">
                    {/* Padlock Icon */}
                    <div className={`padlock-container ${isNetworkRequest ? 'animating' : ''}`}>
                        <div className="padlock-icon">
                            <div className="padlock-body">
                                <div className="padlock-shackle"></div>
                                <div className="padlock-keyhole"></div>
                            </div>
                        </div>
                        <div className="padlock-text">
                            {isNetworkRequest ? 'Securing connection...' : 'Secure Login'}
                        </div>
                    </div>
                    
                    {/* Error Display */}
                    {error && (
                        <ErrorDisplay 
                            error={error} 
                            onDismiss={() => setError(null)}
                        />
                    )}
                    
                    {/* Stage content */}
                    {loginStage === 'identity' && (
                        <IdentityStage
                            onSubmit={handleIdentitySubmit}
                            isLoading={isLoading}
                            recognizedUser={recognizedUser}
                            sessionData={sessionData}
                        />
                    )}

                    {loginStage === 'authentication' && (
                        <AuthenticationStage
                            userIdentifier={userIdentifier}
                            preferredMethod={preferredMethod}
                            onAuthenticate={handleAuthentication}
                            onBack={handleBackToIdentity}
                            onMethodChange={handleMethodChange}
                            isLoading={isLoading}
                            sessionData={sessionData}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginContainer;
