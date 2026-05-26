import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { API } from '../../../utils/requests';
import Data from '../../../utils/data';
import './RegisterContainer.css';

// Import stage components
import IdentityStage from '../IdentityStage/IdentityStage';
import AuthenticationStage from '../AuthenticationStage/AuthenticationStage';
import LoadingState from '../SharedComponents/LoadingState';
import ErrorDisplay from '../SharedComponents/ErrorDisplay';

const RegisterContainer = () => {
    const history = useHistory();
    
    // Registration state
    const [registerStage, setRegisterStage] = useState('identity');
    const [userIdentifier, setUserIdentifier] = useState('');
    const [registrationData, setRegistrationData] = useState(null);
    const [schoolMeta, setSchoolMeta] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [syncingMessage, setSyncingMessage] = useState('');
    
    // Input detection patterns
    const PHONE_REGEX = /^\+?\d{7,}$/;
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Load school meta on mount
    useEffect(() => {
        loadSchoolMeta();
    }, []);

    const loadSchoolMeta = async () => {
        const queryParams = new URLSearchParams(window.location.search);
        const schoolId = queryParams.get('school');
        
        if (schoolId) {
            try {
                const response = await axios.get(`${API}/auth/meta?schoolId=${schoolId}`);
                setSchoolMeta(response.data);
                document.title = `Register - ${response.data.name || 'Shule Plus'}`;
            } catch (error) {
                console.error('Failed to load school metadata:', error);
            }
        }
    };

    const detectInputType = useCallback((value) => {
        if (PHONE_REGEX.test(value)) return 'phone';
        if (EMAIL_REGEX.test(value)) return 'email';
        return 'username';
    }, [PHONE_REGEX, EMAIL_REGEX]);

    const handleIdentitySubmit = async (identifier) => {
        setIsLoading(true);
        setError(null);
        
        try {
            const inputType = detectInputType(identifier);
            setUserIdentifier(identifier);
            
            // For registration, we'll collect more details in the next stage
            setRegistrationData({
                identifier,
                inputType,
                timestamp: new Date().toISOString()
            });
            
            setRegisterStage('registration');
            
        } catch (err) {
            setError(err.response?.data?.message || 'Identity verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegistrationSubmit = async (formData) => {
        setIsLoading(true);
        setError(null);
        
        try {
            let response;
            
            // Determine registration type based on input
            if (registrationData.inputType === 'phone') {
                response = await axios.post(`${API}/auth/register/student`, {
                    school: schoolMeta?.id,
                    parent: {
                        name: formData.parentName,
                        phone: registrationData.identifier,
                        email: formData.parentEmail
                    },
                    student: {
                        name: formData.studentName,
                        class: formData.studentClass,
                        route: formData.studentRoute
                    }
                });
            } else {
                response = await axios.post(`${API}/auth/register`, {
                    name: formData.schoolName,
                    email: registrationData.identifier,
                    phone: formData.phone,
                    address: formData.address,
                    password: formData.password
                });
            }
            
            const { token, user: userData } = response.data;
            
            if (!token || !userData) {
                throw new Error('Invalid response from server');
            }
            
            // Handle registration success
            await handleRegistrationSuccess(token, userData);
            
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Registration failed';
            setError(errorMsg);
            setIsLoading(false);
        }
    };

    const handleRegistrationSuccess = async (token, userData) => {
        setSyncingMessage('Creating your account...');
        
        try {
            localStorage.setItem("authorization", token);
            localStorage.setItem("user", JSON.stringify(userData));
            
            // Initialize app data
            Data.init();
            
            setSyncingMessage('Setting up your dashboard...');
            
            // Navigate based on user type
            const userType = userData.userType?.toLowerCase();
            let redirectPath = '/results';
            
            if (userType === 'admin') {
                redirectPath = '/dashboard';
            } else if (userType === 'teacher') {
                redirectPath = '/classes';
            } else if (userType === 'parent') {
                redirectPath = '/children';
            }
            
            setTimeout(() => {
                history.push(redirectPath);
            }, 1000);
            
        } catch (error) {
            console.error('Registration success handling failed:', error);
            setError('Failed to complete registration process');
            setIsLoading(false);
        }
    };

    const handleBackToIdentity = () => {
        setRegisterStage('identity');
        setUserIdentifier('');
        setRegistrationData(null);
        setError(null);
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
        <div className="register-container">
            <div className="register-card">
                {/* Left side - Name and Instructions */}
                <div className="register-info-panel">
                    <div>
                        <h1 className="text-logo">{schoolMeta?.name || 'Shule Plus'}</h1>
                        <h1>Create Your Account</h1>
                        <p>Join the platform to access your school's dashboard</p>
                        <p>Manage your school's learning, transportation, and communication seamlessly with our comprehensive platform.</p>
                        
                        {/* Header with school branding */}
                        {schoolMeta?.logoUrl && (
                            <img 
                                src={schoolMeta.logoUrl} 
                                alt={schoolMeta.name} 
                                className="register-logo-image mb-3"
                            />
                        )}
                        
                        <div className="register-info-footer">
                            &copy; {new Date().getFullYear()} {schoolMeta?.name || 'Shule Plus'}. All Rights Reserved.
                            <br/>
                            Need help? <a href={schoolMeta?.supportEmail ? `mailto:${schoolMeta.supportEmail}` : "mailto:shuleplusadmin@gmail.com"}>Contact Support</a>
                        </div>
                    </div>
                </div>

                {/* Right side - Registration flow */}
                <div className="register-form-panel">
                    {/* Stage content */}
                    {registerStage === 'identity' && (
                        <IdentityStage
                            onSubmit={handleIdentitySubmit}
                            isLoading={isLoading}
                            isRegistration={true}
                        />
                    )}

                    {registerStage === 'registration' && (
                        <RegistrationStage
                            registrationData={registrationData}
                            schoolMeta={schoolMeta}
                            onSubmit={handleRegistrationSubmit}
                            onBack={handleBackToIdentity}
                            isLoading={isLoading}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

// Registration Stage Component
const RegistrationStage = ({ registrationData, schoolMeta, onSubmit, onBack, isLoading }) => {
    const [formData, setFormData] = useState({
        // School admin fields
        schoolName: '',
        address: '',
        phone: '',
        
        // Student/parent fields
        parentName: '',
        parentEmail: '',
        studentName: '',
        studentClass: '',
        studentRoute: ''
    });
    
    const [isStudentRegistration, setIsStudentRegistration] = useState(registrationData?.inputType === 'phone');

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (isStudentRegistration) {
            if (!formData.parentName || !formData.studentName || !formData.studentClass) {
                setError('Parent name, student name, and class are required');
                return;
            }
        } else {
            if (!formData.schoolName || !formData.phone) {
                setError('School name and phone are required');
                return;
            }
        }
        
        onSubmit(formData);
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const setError = (message) => {
        // This would be handled by parent component
        console.error('Registration error:', message);
    };

    return (
        <div className="registration-stage">
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
                <span className="identifier-label">Registering as:</span>
                <span className="identifier-value">{registrationData.identifier}</span>
            </div>

            <form onSubmit={handleSubmit} className="registration-form">
                {isStudentRegistration ? (
                    // Student Registration Form
                    <div className="student-registration">
                        <h3>Student & Parent Registration</h3>
                        
                        <div className="form-section">
                            <h4>Parent/Guardian Details</h4>
                            <input
                                type="text"
                                placeholder="Parent/Guardian Name"
                                value={formData.parentName}
                                onChange={(e) => handleChange('parentName', e.target.value)}
                                className="form-input"
                                required
                            />
                            <input
                                type="email"
                                placeholder="Parent Email (Optional)"
                                value={formData.parentEmail}
                                onChange={(e) => handleChange('parentEmail', e.target.value)}
                                className="form-input"
                            />
                        </div>

                        <div className="form-section">
                            <h4>Student Details</h4>
                            <input
                                type="text"
                                placeholder="Student Name"
                                value={formData.studentName}
                                onChange={(e) => handleChange('studentName', e.target.value)}
                                className="form-input"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Student Class"
                                value={formData.studentClass}
                                onChange={(e) => handleChange('studentClass', e.target.value)}
                                className="form-input"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Student Route (Optional)"
                                value={formData.studentRoute}
                                onChange={(e) => handleChange('studentRoute', e.target.value)}
                                className="form-input"
                            />
                        </div>
                    </div>
                ) : (
                    // School Admin Registration Form
                    <div className="school-registration">
                        <h3>School Registration</h3>
                        
                        <div className="form-section">
                            <h4>School Details</h4>
                            <input
                                type="text"
                                placeholder="School Name"
                                value={formData.schoolName}
                                onChange={(e) => handleChange('schoolName', e.target.value)}
                                className="form-input"
                                required
                            />
                            <input
                                type="text"
                                placeholder="School Address"
                                value={formData.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-section">
                            <h4>Admin Account Details</h4>
                            <input
                                type="tel"
                                placeholder="Phone Number"
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                className="form-input"
                                required
                            />
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <span className="loading-spinner"></span>
                            Creating Account...
                        </>
                    ) : (
                        'Create Account'
                    )}
                </button>
            </form>

            {/* Security Notice */}
            <div className="security-notice">
                <div className="security-icon">🛡️</div>
                <div className="security-text">
                    <strong>Secure Registration</strong>
                    <p>Your information is encrypted and protected</p>
                </div>
            </div>
        </div>
    );
};

export default RegisterContainer;
