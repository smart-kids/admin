import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { LoginContainer } from "../../components/auth";
import './login-new.css';

// Keep toastr configuration for backward compatibility
const toastr = window.toastr;

if (toastr) {
    toastr.options = {
        closeButton: true,
        debug: false,
        newestOnTop: false,
        progressBar: true,
        positionClass: "toast-bottom-right",
        preventDuplicates: false,
        onclick: null,
        showDuration: "300",
        hideDuration: "1000",
        timeOut: "5000",
        extendedTimeOut: "1000",
        showEasing: "swing",
        hideEasing: "linear",
        showMethod: "fadeIn",
        hideMethod: "fadeOut"
    };
} else {
    console.warn("Toastr not found. Notifications will not be displayed.");
}

const LoginNew = () => {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [showLockAnimation, setShowLockAnimation] = useState(true);

    useEffect(() => {
        // Animate lock to unlock after page load
        const timer = setTimeout(() => {
            setIsUnlocked(true);
            setTimeout(() => {
                setShowLockAnimation(false);
            }, 600);
        }, 800);
        
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="login-new-page">
            {/* Background with subtle pattern */}
            <div className="login-background">
                <div className="background-pattern"></div>
                
                {/* Animated lock icon */}
                {showLockAnimation && (
                    <div className={`lock-icon ${isUnlocked ? 'unlocked' : 'locked'}`}>
                        <div className="lock-body">
                            <div className="lock-keyhole"></div>
                        </div>
                        <div className="lock-shackle"></div>
                    </div>
                )}
            </div>

            {/* Main login container */}
            <div className="login-main">
                {/* Login Container */}
                <div className="login-wrapper">
                    <LoginContainer />
                </div>

                {/* Footer */}
                <div className="login-footer">
                    <div className="footer-content">
                        <p>&copy; {new Date().getFullYear()} Shule Plus. All rights reserved.</p>
                        <div className="footer-links">
                            <Link to="/privacy" className="footer-link">Privacy</Link>
                            <span className="separator">•</span>
                            <Link to="/terms" className="footer-link">Terms</Link>
                            <span className="separator">•</span>
                            <Link to="/support" className="footer-link">Support</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginNew;
