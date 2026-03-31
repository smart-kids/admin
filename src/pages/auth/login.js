import React from "react";
import './login.css'; // Assuming this contains necessary base styles
import { Link } from "react-router-dom";
import axios from "axios";
import { API } from "../../utils/requests"; // Ensure API points to your base URL
import Data from "../../utils/data";

// Assuming toastr is globally available as window.toastr
const toastr = window.toastr;

// Keep toastr options as they are
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

const PHONE_REGEX = /^\+?\d{7,}$/;

// --- Helper Functions for Color Manipulation ---
const hexToRgb = (hex) => {
    if (!hex) return null;
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

const getContrastColor = (hexColor) => {
    if (!hexColor) return '#ffffff'; // Default to white
    const rgb = hexToRgb(hexColor);
    if (!rgb) return '#ffffff';
    // Standard luminance calculation
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff'; // Return black for light backgrounds, white for dark
};

const darkenColor = (hex, percent) => {
    if (!hex) return null;
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
  
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
  
    r = Math.max(0, Math.floor(r * (1 - percent / 100)));
    g = Math.max(0, Math.floor(g * (1 - percent / 100)));
    b = Math.max(0, Math.floor(b * (1 - percent / 100)));
  
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};
// --- End Helper Functions ---


class Login extends React.Component {
    state = {
        user: "",
        password: "",
        otpCode: "",
        showOtpInput: false,
        isOtpSent: false,
        userInputLooksLikePhone: false,
        isLoading: false, // For login/OTP actions
        error: "",
        schoolId: null,
        schoolMeta: null, // { name, logoUrl, themeColor }
        isFetchingSchoolMeta: false,
        schoolMetaError: null,
    };

    validator = null;
    _isMounted = false;

    async componentDidMount() {
        console.log("Login component mounted");
        this._isMounted = true;
        if (localStorage.getItem("authorization")) {
            console.log("User is logged in, redirecting to /trips/all");
            return this.props.history.push({ pathname: '/trips/all' });
        }

        const queryParams = new URLSearchParams(window.location.search);
        const schoolId = queryParams.get('school');

        if (schoolId) {
            console.log(`Found schoolId query parameter: ${schoolId}`);
            this.setState({ schoolId, isFetchingSchoolMeta: true });
            await this.fetchSchoolMetaData(schoolId);
        } else {
             console.log("No schoolId query parameter found, using default title");
             document.title = "Login - Shule Plus"; // Default title
        }

        if (window.$ && window.$.fn.validate) {
            console.log("Setting up jQuery Validate");
            this.setupValidator();
        } else {
            console.error("jQuery or jQuery Validate not found.");
        }
    }

    componentWillUnmount() {
        this._isMounted = false;
        if (this.validator) {
            this.validator.destroy();
        }
    }

    fetchSchoolMetaData = async (schoolId) => {
        if (!this._isMounted) return;
        this.setState({ isFetchingSchoolMeta: true, schoolMetaError: null });
        try {
            const response = await axios.get(`${API}/auth/meta?schoolId=${schoolId}`);
            if (this._isMounted) {
                this.setState({ schoolMeta: response.data, isFetchingSchoolMeta: false });
                if (response.data && response.data.name) {
                    document.title = `Login - ${response.data.name}`;
                } else {
                    document.title = "Login - Shule Plus";
                }
            }
        } catch (error) {
            console.error("Failed to fetch school metadata:", error);
            if (this._isMounted) {
                this.setState({
                    schoolMetaError: "Could not load school specific details.",
                    isFetchingSchoolMeta: false,
                    schoolMeta: { name: "Shule Plus" } // Fallback to default name
                });
                document.title = "Login - Shule Plus";
                 toastr && toastr.warning("Branding Error", "Could not load custom school details. Using default appearance.");
            }
        }
    };

    setupValidator = () => {
        // const _this = this; // Not strictly needed if not using it inside functions that rebind `this`
        setTimeout(() => {
            if (!window.$("#loginForm").length) {
                console.warn("Login form not found for validation setup.");
                return;
            }
            this.validator = window.$("#loginForm").validate({
                errorClass: "is-invalid",
                validClass: "is-valid",
                errorElement: "div",
                errorPlacement: function(error, element) {
                    error.addClass("invalid-feedback");
                    if (element.parent(".input-group").length) {
                         error.insertAfter(element.parent(".input-group"));
                    } else if (element.prop("type") === "checkbox") {
                         error.insertAfter(element.next("label"));
                    }
                    else {
                         error.insertAfter(element);
                    }
                },
                highlight: function (element) {
                    window.$(element).addClass("is-invalid").removeClass("is-valid");
                },
                unhighlight: function (element) {
                    window.$(element).removeClass("is-invalid").addClass("is-valid");
                },
                submitHandler: (form, event) => {
                    event.preventDefault();
                    if (this.state.isLoading) return;
                    if (this.state.showOtpInput) {
                        this.handleVerifyOtp();
                    } else {
                        this.handlePasswordLogin();
                    }
                },
                rules: {
                    username: { required: true },
                    password: { required: () => !this.state.showOtpInput },
                    otpCode: {
                        required: () => this.state.showOtpInput,
                        digits: true,
                        minlength: 5,
                        maxlength: 5
                    }
                },
                messages: {
                    username: "Please enter your username, email, or phone number",
                    password: { required: "Please enter your password" },
                    otpCode: {
                        required: "Please enter the OTP code",
                        digits: "OTP must be digits",
                        minlength: "OTP must be {0} digits",
                        maxlength: "OTP must be {0} digits"
                    }
                }
            });
        }, 100);
    }

    handleUserInputChange = (e) => {
        const value = e.target.value;
        const looksLikePhone = PHONE_REGEX.test(value);
        this.setState({ user: value, userInputLooksLikePhone: looksLikePhone, error: "" });
    };

    handlePasswordChange = (e) => {
        this.setState({ password: e.target.value, error: "" });
    };

    handleOtpCodeChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        if (value.length <= 5) {
             this.setState({ otpCode: value, error: "" });
        }
    };

    handlePasswordLogin = async () => {
        const { user, password } = this.state;
        if (!user || !password) {
            this.setState({ error: "Username/Email and Password are required." });
            return;
        }
        this.setState({ isLoading: true, error: "" });
        try {
            const res = await axios.post(`${API}/auth/login`, { user, password });
            const { token, data: userData } = res.data;
            if (!token || !userData) throw new Error("Invalid response from server.");
            this.handleLoginSuccess(token, userData);
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || "Login failed. Check credentials.";
            if (this._isMounted) this.setState({ error: errorMsg, isLoading: false });
            toastr && toastr.error("Login Failed", errorMsg);
        }
    };

    handleSendOtp = async () => {
        const { user } = this.state;
        if (!user || !PHONE_REGEX.test(user)) {
            this.setState({ error: "Please enter a valid phone number for OTP." });
            toastr && toastr.warning("Invalid Input", "Please enter a valid phone number.");
            return;
        }
        this.setState({ isLoading: true, error: "" });
        try {
            const res = await axios.post(`${API}/auth/otp/send`, { user });
            if (res.data && (res.data.success || res.status < 300)) {
                toastr && toastr.success("OTP Sent", "Verification code sent to your phone.");
                if (this._isMounted) this.setState({ showOtpInput: true, isOtpSent: true, isLoading: false, password: "", otpCode: "" });
                setTimeout(() => {
                    const otpInput = document.getElementById("otpCodeInput");
                    if (otpInput) otpInput.focus();
                }, 100);
            } else {
                throw new Error(res.data?.message || "Failed to send OTP code.");
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || "Could not send OTP.";
            if (this._isMounted) this.setState({ error: errorMsg, isLoading: false, isOtpSent: false, showOtpInput: false });
            toastr && toastr.error("OTP Send Failed", errorMsg);
        }
    };

    handleVerifyOtp = async () => {
        const { user, otpCode } = this.state;
        if (!user || !otpCode || otpCode.length !== 5) {
            this.setState({ error: "Please enter the 5-digit OTP code." });
            toastr && toastr.warning("Invalid OTP", "Please enter the 5-digit OTP code.");
            return;
        }
        this.setState({ isLoading: true, error: "" });
        try {
            const res = await axios.post(`${API}/auth/verify/sms`, { user, password: otpCode });
            const { token, user: userData } = res.data; // Assuming API returns 'user' instead of 'data' for user object on OTP verify
            if (!token || !userData) throw new Error("Invalid response from server.");
            toastr && toastr.success("Verification Successful!", "You are now logged in.");
            setTimeout(() => this.handleLoginSuccess(token, userData), 1000);
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || "OTP verification failed.";
            if (this._isMounted) this.setState({ error: errorMsg, isLoading: false });
            toastr && toastr.error("OTP Verification Failed", errorMsg);
        }
    };

    handleLoginSuccess = (token, userData) => {
        console.log("Login success - userData:", userData);
        console.log("Login success - userType:", userData.userType);
        localStorage.setItem("authorization", token);
        localStorage.setItem("user", JSON.stringify(userData));
        Data.init(); // Assuming this initializes some app-wide data
        this.props.history.push({ pathname: '/trips/all' });
        // No need to reset state here as component will unmount or redirect
    };

    resetToPasswordMode = () => {
        this.setState({ showOtpInput: false, isOtpSent: false, otpCode: "", error: "" });
    }

    CustomStyles = () => {
        const { schoolMeta } = this.state;
        const defaultBrandColor = "rgb(238, 158, 61)";
        const defaultBrandColorDarker = "rgb(218, 138, 41)";
        const defaultInfoTextColor = "#ffffff";

        const themeColor = schoolMeta?.themeColor || defaultBrandColor;
        const brandColor = themeColor;
        const brandColorDarker = darkenColor(themeColor, 15) || defaultBrandColorDarker;
        const infoTextColor = getContrastColor(themeColor); // Text on info panel bg
        const infoPanelLinkColor = infoTextColor === '#000000' ? darkenColor(themeColor, 20) || brandColorDarker : '#ffffff';


        return (
        <style>{`
            :root {
                --brand-color: ${brandColor};
                --brand-color-darker: ${brandColorDarker};
                --info-text-color: ${infoTextColor};
                --info-panel-link-color: ${infoPanelLinkColor};
                --info-text-opacity: 0.9;
            }
            body {
                background-color: #eef1f5;
                font-family: 'Roboto', 'Segoe UI', sans-serif;
                line-height: 1.6;
            }
            .login-page-container {
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 1.5rem;
            }
            .login-card {
                background-color: #fff;
                border-radius: 12px;
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
                overflow: hidden;
                display: flex;
                flex-direction: column-reverse; /* Info panel on top on mobile */
                width: 100%;
                max-width: 900px;
            }
            .login-form-panel {
                padding: 2rem; 
            }
            .login-info-panel {
                background: var(--brand-color); /* Use theme color for bg */
                color: var(--info-text-color);
                padding: 2.5rem;
                display: flex;
                flex-direction: column;
                justify-content: center;
                min-height: 300px;
            }
            .login-page-loader {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                min-height: 400px;
                width: 100%;
            }
            .login-page-loader .spinner-border {
                width: 3rem;
                height: 3rem;
                color: var(--brand-color); /* Use brand color for spinner */
            }
            .login-page-loader p {
                margin-top: 1rem;
                color: #555;
            }

            .text-logo { /* Used in form panel */
                font-family: 'Poppins', 'Segoe UI', sans-serif;
                font-size: 2.2rem;
                font-weight: 700;
                color: var(--brand-color);
                margin-bottom: 0;
            }
            .login-logo-image { /* For logo in form panel */
                max-height: 60px;
                width: auto;
                display: block;
                margin-left: auto;
                margin-right: auto;
                object-fit: contain;
            }
             .login-info-panel .login-logo-image { /* For logo in info panel */
                max-height: 70px;
                filter: ${infoTextColor === '#000000' ? 'none' : 'brightness(0) invert(1)'}; /* Invert if bg is dark, text is white */
                /* If you have color and white versions of logo, conditionally render one based on infoTextColor */
             }

            .login-info-panel .text-logo { /* Used in info panel */
                 color: var(--info-text-color);
                 margin-bottom: 1.5rem;
                 text-align: left;
            }
            .login-info-panel h1:not(.text-logo) { /* Main heading in info panel */
                font-size: 2rem;
                font-weight: 600;
                margin-bottom: 1rem;
                line-height: 1.3;
                color: var(--info-text-color);
            }
            .login-info-panel p {
                font-size: 1rem;
                line-height: 1.7;
                opacity: var(--info-text-opacity);
                color: var(--info-text-color);
            }
            .login-form-title {
                color: #333; /* Darker for better contrast on white */
                font-weight: 600;
                font-size: 1.8rem;
                padding-bottom: 0.5rem;
                margin-bottom: 1.5rem;
            }
            .btn-brand {
                background-color: var(--brand-color);
                border-color: var(--brand-color);
                color: ${getContrastColor(brandColor)}; /* Ensure button text is readable */
                font-weight: 500;
                padding: 0.65rem 1.25rem;
                transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;
            }
            .btn-brand:hover, .btn-brand:focus {
                background-color: var(--brand-color-darker);
                border-color: var(--brand-color-darker);
                color: ${getContrastColor(brandColorDarker)};
            }
            .kt-link {
                color: var(--brand-color);
                font-weight: 500;
            }
            .kt-link:hover {
                color: var(--brand-color-darker);
                text-decoration: underline;
            }
            .form-control:focus {
                border-color: var(--brand-color);
                box-shadow: 0 0 0 0.2rem ${hexToRgb(brandColor) ? `rgba(${hexToRgb(brandColor).r}, ${hexToRgb(brandColor).g}, ${hexToRgb(brandColor).b}, 0.25)` : 'rgba(238, 158, 61, 0.25)'};
            }
            .login-info-footer {
                margin-top: auto;
                padding-top: 1.5rem; 
                font-size: 0.85rem; 
                opacity: 0.8;
                text-align: center;
            }
            .login-info-footer a {
                color: var(--info-panel-link-color);
                font-weight: bold;
                text-decoration: none;
            }
             .login-info-footer a:hover {
                text-decoration: underline;
            }
            .btn-otp-send {
                border-left: none;
                border-color: #ced4da;
                background-color: #e9ecef;
                color: #495057;
                font-size: 0.875rem;
            }
            .btn-otp-send:hover {
                background-color: #dde2e6;
            }
            .input-group > .form-control:not(:last-child) {
                 border-top-right-radius: 0;
                 border-bottom-right-radius: 0;
            }
            .input-group > .input-group-append > .btn {
                 border-top-left-radius: 0;
                 border-bottom-left-radius: 0;
            }

            @media (max-width: 991.98px) { /* Mobile specific adjustments */
                .login-info-panel { padding: 2rem 1.5rem; text-align: center; }
                .login-info-panel .text-logo, .login-info-panel .login-logo-image { text-align: center; margin-left: auto; margin-right: auto; }
                .login-info-panel .text-logo { font-size: 2rem; }
                .login-info-panel h1:not(.text-logo) { font-size: 1.8rem; }
                .login-form-panel { padding: 1.5rem; }
                .login-form-title { font-size: 1.6rem; }
                 .login-card { flex-direction: column; }
            }
            @media (min-width: 992px) { /* lg and up */
                .login-card { flex-direction: row; }
                .login-info-panel .text-logo, .login-info-panel .login-logo-image { text-align: left; margin-left: 0; margin-right: 0; }
            }
        `}</style>
        );
    }


    render() {
        const {
            user, password, otpCode, showOtpInput, userInputLooksLikePhone,
            isLoading, error,
            schoolId, schoolMeta, isFetchingSchoolMeta, schoolMetaError
        } = this.state;

        const currentSchoolName = (schoolMeta && schoolMeta.name) ? schoolMeta.name : "Shule Plus";
        const currentSchoolLogo = (schoolMeta && schoolMeta.logoUrl) ? schoolMeta.logoUrl : null;
        // Disable form inputs if login action is in progress OR if schoolId is present and meta is being fetched
        const formDisabled = isLoading || (!!schoolId && isFetchingSchoolMeta);


        // Show loading screen if schoolId is provided and meta is being fetched for the first time
        if (!!schoolId && isFetchingSchoolMeta && !schoolMeta) {
            return (
                <>
                    <this.CustomStyles /> {/* Render styles for background and potential spinner color */}
                    <div className="login-page-container">
                        <div className="login-card">
                            <div className="login-page-loader">
                                <div className="spinner-border" role="status">
                                    <span className="sr-only">Loading...</span>
                                </div>
                                <p>Loading school details...</p>
                            </div>
                        </div>
                    </div>
                </>
            );
        }

        return (
            <>
                <this.CustomStyles />
                <div className="login-page-container">
                    <div className="login-card">
                        <div className="col-lg-7 login-form-panel order-lg-2">
                            <div className="text-center mb-4">
                                {currentSchoolLogo && (
                                    <img 
                                        src={currentSchoolLogo} 
                                        alt={`${currentSchoolName} Logo`} 
                                        className="login-logo-image mb-2"
                                    />
                                )}
                                <Link to={schoolId ? `/?schoolId=${schoolId}` : "/"} className="text-decoration-none">
                                    <h1 className="text-logo">{currentSchoolName}</h1>
                                </Link>
                            </div>
                            <h3 className="login-form-title text-center">Sign In To Your Account</h3>
                            
                            {schoolMetaError && (
                                <div className="alert alert-warning text-center" role="alert">
                                    {schoolMetaError}
                                </div>
                            )}
                            <form id="loginForm" onSubmit={(e) => e.preventDefault()} autoComplete="off">
                                {error && (
                                    <div className="alert alert-danger text-center" role="alert">
                                        {error}
                                    </div>
                                )}

                                <div className="form-group">
                                    <label htmlFor="username">Username, Email, or Phone</label>
                                    <div className="input-group">
                                        <input
                                            value={user}
                                            onChange={this.handleUserInputChange}
                                            className="form-control"
                                            type="text"
                                            id="username"
                                            placeholder="Enter here"
                                            name="username"
                                            autoComplete="username"
                                            required
                                            disabled={formDisabled}
                                        />
                                        {userInputLooksLikePhone && !showOtpInput && (
                                            <div className="input-group-append">
                                                <button
                                                    type="button"
                                                    onClick={this.handleSendOtp}
                                                    className="btn btn-otp-send"
                                                    disabled={formDisabled || !user}
                                                >
                                                    {isLoading && this.state.user === user ? 'Sending...' : 'Send OTP'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {!showOtpInput ? (
                                    <div className="form-group">
                                        <label htmlFor="password">Password</label>
                                        <input
                                            value={password}
                                            onChange={this.handlePasswordChange}
                                            className="form-control"
                                            type="password"
                                            id="password"
                                            placeholder="Enter your password"
                                            name="password"
                                            autoComplete="current-password"
                                            required={!showOtpInput}
                                            disabled={formDisabled}
                                        />
                                    </div>
                                ) : (
                                    <div className="form-group">
                                        <label htmlFor="otpCodeInput">Enter 5-Digit OTP Code</label>
                                        <input
                                            id="otpCodeInput"
                                            value={otpCode}
                                            onChange={this.handleOtpCodeChange}
                                            className="form-control"
                                            type="text"
                                            placeholder="XXXXX"
                                            name="otpCode"
                                            autoComplete="one-time-code"
                                            required={showOtpInput}
                                            disabled={formDisabled}
                                            maxLength={5}
                                            pattern="\d{5}"
                                            inputMode="numeric"
                                        />
                                    </div>
                                )}

                                <div className="d-flex justify-content-between align-items-center mt-3 mb-4">
                                    {!showOtpInput ? (
                                        <Link to="/recover" className="kt-link">Forgot Password?</Link>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={this.resetToPasswordMode}
                                            className="btn btn-link kt-link p-0"
                                            disabled={formDisabled}
                                        >
                                            Use Password Instead?
                                        </button>
                                    )}
                                </div>
                                
                                <button
                                    type="submit"
                                    className="btn btn-brand btn-block btn-lg"
                                    disabled={formDisabled}
                                >
                                    {isLoading ? (
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    ) : (showOtpInput ? 'Verify OTP' : 'Sign In')}
                                </button>
                                 <div className="mt-4 text-center">
                                    Don't have an account? <Link to="/register" className="kt-link">Register Here</Link>
                                </div>
                            </form>
                        </div>

                        <div className="col-lg-5 login-info-panel order-lg-1">
                            <div>
                                {currentSchoolLogo && (
                                    <img 
                                        src={currentSchoolLogo} 
                                        alt="" // Alt is decorative here or handled by the text logo
                                        className="login-logo-image mb-3"
                                        aria-hidden="true"
                                    />
                                )}
                                <h1 className="text-logo">{currentSchoolName}</h1>
                                <h1 /* This is the "Welcome Back!" type heading */ >
                                    {schoolMeta?.welcomeTitle || "Welcome Back!"}
                                </h1>
                                <p className="mb-4">
                                    {schoolMeta?.welcomeMessage || "Access your school's dashboard to manage learning, transportation, and communication seamlessly."}
                                </p>
                                <p>
                                    {schoolMeta?.tagline || `${currentSchoolName} empowers educators and administrators with the tools they need for a smarter, more efficient school environment.`}
                                 </p>
                                 <div className="login-info-footer">
                                    © {new Date().getFullYear()} {currentSchoolName}. All Rights Reserved.
                                    <br/>
                                    Need help? <a href={schoolMeta?.supportEmail ? `mailto:${schoolMeta.supportEmail}` : "mailto:shuleplusadmin@gmail.com"}>Contact Support</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }
}

export default Login;