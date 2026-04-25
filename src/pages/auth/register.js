import React, { useState, useEffect } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import axios from "axios";
import { API } from "../../utils/requests"; // Ensure this path is correct
import Data from "../../utils/data"; // Ensure this path is correct

// --- Helper Functions for Color Manipulation (from Login component) ---
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
    if (!hexColor) return '#ffffff';
    const rgb = hexToRgb(hexColor);
    if (!rgb) return '#ffffff';
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
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


// --- Staff Form & Table (for Admin Registration Flow - Unchanged) ---
const StaffForm = ({ type, onAddStaff, tempStaff, setTempStaff, error, schoolId }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setTempStaff(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onAddStaff(type, schoolId);
    };

    return (
        <form onSubmit={handleSubmit} className="mb-3 p-3 border rounded bg-light shadow-sm">
            <h5 className="mb-3 text-secondary">Add New {type}</h5>
            {error && <div className="alert alert-danger py-1 px-2" style={{fontSize: '0.9em'}}>{error}</div>}
            <div className="form-row align-items-end">
                <div className="form-group col-sm-12 col-md-4 mb-2">
                    <label htmlFor={`staffName-${type}`} className="sr-only">Full Name</label>
                    <input type="text" name="name" id={`staffName-${type}`} className="form-control form-control-sm" placeholder="Full Name" value={tempStaff.name} onChange={handleChange} required />
                </div>
                <div className="form-group col-sm-6 col-md-3 mb-2">
                    <label htmlFor={`staffPhone-${type}`} className="sr-only">Phone</label>
                    <input type="tel" name="phone" id={`staffPhone-${type}`} className="form-control form-control-sm" placeholder="Phone (07...)" value={tempStaff.phone} onChange={handleChange} required pattern="[0-9]{10,15}" title="Phone number should be 10-15 digits"/>
                </div>
                <div className="form-group col-sm-6 col-md-4 mb-2">
                     <label htmlFor={`staffEmail-${type}`} className="sr-only">Email</label>
                    <input type="email" name="email" id={`staffEmail-${type}`} className="form-control form-control-sm" placeholder="Email (Optional)" value={tempStaff.email} onChange={handleChange} />
                </div>
                <div className="form-group col-sm-12 col-md-1 mb-2">
                    <button type="submit" className="btn btn-sm btn-block text-white" style={{ backgroundColor: 'var(--brand-color-darker)' }}>Add</button>
                </div>
            </div>
        </form>
    );
};

const StaffTable = ({ type, staffList, onRemoveStaff }) => (
    <div className="table-responsive mb-4" style={{maxHeight: '200px', overflowY: 'auto'}}>
        <table className="table table-sm table-striped table-hover">
            <thead className="thead-light sticky-top bg-white">
                <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                {staffList.length === 0 ? (
                    <tr><td colSpan="4" className="text-center p-3 text-muted">No {type}s added yet.</td></tr>
                ) : (
                    staffList.map((staff, index) => (
                        <tr key={`${type}-${index}`}>
                            <td>{staff.names || staff.name}</td>
                            <td>{staff.phone}</td>
                            <td>{staff.email || '-'}</td>
                            <td><button className="btn btn-outline-danger btn-sm py-0 px-1" onClick={() => onRemoveStaff(type, index)}>Remove</button></td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);
// --- End Staff Components ---


const Register = () => {
    const history = useHistory();
    const location = useLocation();

    // --- State Management ---
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // --- School/Admin Registration State ---
    const [currentStep, setCurrentStep] = useState(1);
    const [schoolName, setSchoolName] = useState("");
    const [schoolAddress, setSchoolAddress] = useState("");
    const [adminName, setAdminName] = useState("");
    const [adminEmail, setAdminEmail] = useState("");
    const [adminPhone, setAdminPhone] = useState("");
    const [activeStaffTab, setActiveStaffTab] = useState('drivers');
    const [tempStaffMember, setTempStaffMember] = useState({ name: '', phone: '', email: '' });
    const [staffFormError, setStaffFormError] = useState('');
    const [driversToInvite, setDriversToInvite] = useState([]);
    const [teachersToInvite, setTeachersToInvite] = useState([]);
    const [adminsToInvite, setAdminsToInvite] = useState([]);
    const [createdSchoolId, setCreatedSchoolId] = useState(null);
    const [registrationData, setRegistrationData] = useState(null);

    // --- Student Self-Registration State ---
    const [schoolIdFromUrl, setSchoolIdFromUrl] = useState(null);
    const [schoolMeta, setSchoolMeta] = useState(null);
    const [isFetchingSchoolMeta, setIsFetchingSchoolMeta] = useState(true);
    const [schoolMetaError, setSchoolMetaError] = useState(null);
    const [classes, setClasses] = useState([]);
    const [isFetchingClasses, setIsFetchingClasses] = useState(false);
    const [classesError, setClassesError] = useState(null);
    
    const [studentRegStatus, setStudentRegStatus] = useState('loading');
    const [registeredPhone, setRegisteredPhone] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    const [parentName, setParentName] = useState("");
    const [parentPhone, setParentPhone] = useState("");
    const [parentEmail, setParentEmail] = useState("");
    const [studentName, setStudentName] = useState("");
    const [studentClassId, setStudentClassId] = useState("");
    const [studentRoute, setStudentRoute] = useState("");

    // --- Effects ---
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const schoolIdQuery = queryParams.get('school');

        if (schoolIdQuery) {
            setSchoolIdFromUrl(schoolIdQuery);
            document.title = "Student Registration - Loading...";
            
            const successfulRegPhone = localStorage.getItem(`shuleplus_registration_success_${schoolIdQuery}`);
            
            fetchSchoolMetaData(schoolIdQuery);

            if (successfulRegPhone) {
                setRegisteredPhone(successfulRegPhone);
                setStudentRegStatus('already_registered');
            } else {
                setStudentRegStatus('form');
                fetchClassesForSchool(schoolIdQuery);
            }
        } else {
            document.title = "Register - Shule Plus";
            setSchoolIdFromUrl(null);
            setSchoolMeta(null);
            setClasses([]);
            setStudentRegStatus('loading');
            setIsFetchingSchoolMeta(false);
        }
    }, [location.search]);

    // --- API Fetching ---
    const fetchSchoolMetaData = async (id) => {
        setIsFetchingSchoolMeta(true);
        setSchoolMetaError(null);
        try {
            const response = await axios.get(`${API}/auth/meta`, { params: { schoolId: id } });
            setSchoolMeta(response.data);
            if (response.data && response.data.name) {
                document.title = `Student Registration - ${response.data.name}`;
            }
        } catch (err) {
            setSchoolMetaError(err.response?.data?.error || "Could not load school details.");
            document.title = "Student Registration - Error";
        } finally {
            setIsFetchingSchoolMeta(false);
        }
    };

    const fetchClassesForSchool = async (id) => {
        setIsFetchingClasses(true);
        setClassesError(null);
        try {
            const response = await axios.get(`${API}/auth/classes`, { params: { school: id } });
            setClasses(response.data || []);
        } catch (err) {
            setClassesError(err.response?.data?.error || "Could not load class information.");
        } finally {
            setIsFetchingClasses(false);
        }
    };
    
    // --- Dynamic Styles ---
    const CustomStyles = () => {
        const defaultBrandColor = "rgb(238, 158, 61)";
        let themeColor = defaultBrandColor;
        if (schoolIdFromUrl && schoolMeta && schoolMeta.themeColor) {
            themeColor = schoolMeta.themeColor;
        }
        const brandColorDarker = darkenColor(themeColor, 15) || "rgb(218, 138, 41)";
        const brandColorLighter = darkenColor(themeColor, -15) || "rgb(242, 178, 81)";
        const infoPanelTextColor = schoolIdFromUrl && schoolMeta ? getContrastColor(themeColor) : "#fff";
        const infoPanelLinkColor = infoPanelTextColor === '#000000' ? darkenColor(themeColor, 20) || brandColorDarker : '#ffffff';

        return (
        <style>{`
            :root {
                --brand-color: ${themeColor};
                --brand-color-darker: ${brandColorDarker};
                --brand-color-lighter: ${brandColorLighter};
                --info-text-color: ${infoPanelTextColor};
                --info-panel-link-color: ${infoPanelLinkColor};
                --info-text-opacity: 0.9;
            }
            body { background-color: #eef1f5; font-family: 'Roboto', 'Segoe UI', sans-serif; line-height: 1.6; }
            .register-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
            .register-card { background-color: #fff; border-radius: 12px; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08); overflow: hidden; display: flex; flex-direction: column-reverse; width: 100%; max-width: 1100px; }
            .form-panel { padding: 2rem; overflow-y: auto; max-height: 90vh; }
            .info-panel { background: var(--brand-color); color: var(--info-text-color); padding: 2.5rem; display: flex; flex-direction: column; justify-content: center; }
            .text-logo { font-family: 'Poppins', 'Segoe UI', sans-serif; font-size: 2.2rem; font-weight: 700; color: var(--brand-color); margin-bottom: 0; }
            .info-panel .text-logo { color: var(--info-text-color); margin-bottom: 1.5rem; text-align: left; }
            .school-logo-image { max-height: 60px; margin-bottom: 1rem; display: block; }
            .info-panel .school-logo-image { filter: ${infoPanelTextColor === '#000000' ? 'none' : 'brightness(0) invert(1)'}; }
            .info-panel h1:not(.text-logo) { font-size: 2.2rem; font-weight: 600; margin-bottom: 1rem; line-height: 1.3; color: var(--info-text-color); }
            .info-panel p, .info-panel li { font-size: 1rem; line-height: 1.7; opacity: var(--info-text-opacity); color: var(--info-text-color); }
            .info-panel ul { list-style-type: none; padding-left: 0; }
            .info-panel ul li::before { content: '✓'; margin-right: 10px; font-weight: bold; color: var(--brand-color-lighter); }
            .form-title { color: var(--brand-color); font-weight: 600; font-size: 1.8rem; border-bottom: 2px solid var(--brand-color); padding-bottom: 0.5rem; margin-bottom: 1.5rem; }
            .form-section-title { color: #333; font-size: 1.15rem; font-weight: 500; margin-top: 1.5rem; margin-bottom: 1rem; }
            .btn-brand { background-color: var(--brand-color); border-color: var(--brand-color); color: ${getContrastColor(themeColor)}; font-weight: 500; padding: 0.65rem 1.25rem; transition: background-color 0.2s ease-in-out; }
            .btn-brand:hover, .btn-brand:focus { background-color: var(--brand-color-darker); border-color: var(--brand-color-darker); color: ${getContrastColor(brandColorDarker)}; }
            .kt-link { color: var(--brand-color); font-weight: 500; }
            .kt-link:hover { color: var(--brand-color-darker); text-decoration: underline; }
            .form-control:focus { border-color: var(--brand-color); box-shadow: 0 0 0 0.2rem ${hexToRgb(themeColor) ? `rgba(${hexToRgb(themeColor).r}, ${hexToRgb(themeColor).g}, ${hexToRgb(themeColor).b}, 0.25)` : 'rgba(238, 158, 61, 0.25)'}; }
            .page-loader { display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 300px; }
            .page-loader .spinner-border { width: 3rem; height: 3rem; color: var(--brand-color); }
            @media (max-width: 991.98px) { .register-card { flex-direction: column; } .form-panel { padding: 1.5rem; max-height: none; } }
            @media (min-width: 992px) { .register-card { flex-direction: row; } }
        `}</style>
        );
    };

    // --- School/Admin Registration Logic (Unchanged) ---
    const handleSchoolRegistration = async (event) => {
        event.preventDefault(); setLoading(true);
        try {
            const payload = { name: schoolName, phone: adminPhone, email: adminEmail, address: schoolAddress };
            const res = await axios.post(`${API}/auth/register`, payload);
            
            const token = res.data.token;
            const user = res.data.data.admin.user;
            const schoolId = res.data.data.admin.school;
            
            localStorage.setItem("authorization", token);
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem("school", schoolId);
            
            await Data.init();
            
            // Send SMS notification to admins about new school registration
            try {
                await Data.communication.sms.create({
                    phone: '0724736012',
                    message: `New school registered: ${schoolName} by ${adminName} (${adminPhone}). Email: ${adminEmail}. Address: ${schoolAddress}`
                });
                await Data.communication.sms.create({
                    phone: '0701173735',
                    message: `New school registered: ${schoolName} by ${adminName} (${adminPhone}). Email: ${adminEmail}. Address: ${schoolAddress}`
                });
            } catch (smsError) {
                console.error('Failed to send admin SMS notification:', smsError);
            }
            
            if (window.toastr) window.toastr.success(`Registration successful! Welcome to ${schoolName}.`);
            history.push('/home');
            
        } catch (err) { 
            setError(err.response?.data?.message || "An error occurred.");
        } finally { 
            setLoading(false); 
        }
    };
    const proceedToDashboard = async (inviteStaff = false) => {
        setLoading(true);
        try {
            localStorage.setItem("authorization", registrationData.token);
            localStorage.setItem("user", JSON.stringify(registrationData.user));
            localStorage.setItem("school", registrationData.schoolId);
            
            // Re-initialize data with the new school ID and token
            await Data.init();
            
            if (inviteStaff) {
                const invitations = [];
                driversToInvite.forEach(d => {
                    invitations.push(Data.drivers.invite({ names: d.name, phone: d.phone, email: d.email, school: registrationData.schoolId }));
                });
                teachersToInvite.forEach(t => {
                    invitations.push(Data.teachers.invite({ name: t.name, phone: t.phone, email: t.email, school: registrationData.schoolId }));
                });
                adminsToInvite.forEach(a => {
                    invitations.push(Data.admins.invite({ names: a.name, phone: a.phone, email: a.email, school: registrationData.schoolId }));
                });

                if (invitations.length > 0) {
                    await Promise.all(invitations);
                    if (window.toastr) window.toastr.success(`Sent ${invitations.length} invitations!`);
                }
            }
            
            history.push('/home'); // Redirect to home/reports after registration
        } catch (err) {
            setError(err.message || "An error occurred while finishing setup.");
            if (window.toastr) window.toastr.error("Setup Error", err.message);
        } finally {
            setLoading(false);
        }
    };
    // ... other admin helpers ...

    // --- Student Self-Registration Logic ---
    const handleStudentRegistrationSubmit = async (event) => {
        event.preventDefault();
        setError("");
        if (!parentName || !parentPhone || !studentName || !studentClassId) {
            setError("Parent name, phone, student name, and class are required.");
            return;
        }
        setLoading(true);
        try {
            const payload = {
                school: schoolIdFromUrl,
                parent: { name: parentName, phone: parentPhone, email: parentEmail },
                student: { name: studentName, class: studentClassId, route: studentRoute }
            };
            await axios.post(`${API}/auth/register/student`, payload);
            
            // Send SMS notification to admins about new student registration
            try {
                await Data.communication.sms.create({
                    phone: '0724736012',
                    message: `New student registered: ${studentName} - Parent: ${parentName} (${parentPhone}). School: ${schoolMeta?.name || 'Unknown'}. Class: ${studentClassId}. Email: ${parentEmail || 'Not provided'}`
                });
                await Data.communication.sms.create({
                    phone: '0701173735',
                    message: `New student registered: ${studentName} - Parent: ${parentName} (${parentPhone}). School: ${schoolMeta?.name || 'Unknown'}. Class: ${studentClassId}. Email: ${parentEmail || 'Not provided'}`
                });
            } catch (smsError) {
                console.error('Failed to send admin SMS notification:', smsError);
            }
            
            setStudentRegStatus('success');
            setRegisteredPhone(parentPhone);
            localStorage.setItem(`shuleplus_registration_success_${schoolIdFromUrl}`, parentPhone);
        } catch (err) {
            setError(err.response?.data?.error || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };
    
    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(registeredPhone).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2500);
        });
    };
    // --- End Student Self-Registration Logic ---

    // --- RENDER METHODS ---
    const currentSchoolDisplayName = (schoolIdFromUrl && schoolMeta?.name) ? schoolMeta.name : "Shule Plus";
    const currentSchoolLogo = (schoolIdFromUrl && schoolMeta?.logo) ? schoolMeta.logo : null;

    const renderSchoolAdminRegistrationStep1 = () => (
        <>
            <div className="text-center mb-4">
                <h1 className="text-logo">Shule Plus</h1>
            </div>
            <h3 className="form-title">School Registration</h3>
            <p className="text-muted mb-4">Create a new school profile and admin account to get started.</p>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSchoolRegistration}>
                <h5 className="form-section-title">School Details</h5>
                <div className="form-group">
                    <input type="text" className="form-control" placeholder="School Name" value={schoolName} onChange={e => setSchoolName(e.target.value)} required />
                </div>
                <div className="form-group">
                    <input type="text" className="form-control" placeholder="School Address/Location" value={schoolAddress} onChange={e => setSchoolAddress(e.target.value)} required />
                </div>

                <h5 className="form-section-title">Admin Account Details</h5>
                <div className="form-group">
                    <input type="text" className="form-control" placeholder="Full Name" value={adminName} onChange={e => setAdminName(e.target.value)} required />
                </div>
                <div className="form-row">
                    <div className="form-group col-md-6">
                        <input type="tel" className="form-control" placeholder="Phone Number" value={adminPhone} onChange={e => setAdminPhone(e.target.value)} required pattern="[0-9]{10,15}" />
                    </div>
                    <div className="form-group col-md-6">
                        <input type="email" className="form-control" placeholder="Email Address" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required />
                    </div>
                </div>
                
                <button type="submit" className="btn btn-brand btn-block btn-lg mt-4" disabled={loading}>
                    {loading ? "Registering..." : "Create School & Admin"}
                </button>
                <div className="mt-4 text-center">
                    Already have an account? <Link to="/" className="kt-link">Sign In</Link>
                </div>
            </form>
        </>
    );

    const renderSchoolAdminRegistrationStep2 = () => (
        <>
            <div className="text-center mb-4">
                <h1 className="text-logo">Registration Successful!</h1>
            </div>
            <h3 className="form-title">Let's Get Started</h3>
            <p className="text-muted mb-4">Your school <strong>{schoolName}</strong> has been created. Now you can invite your team or dive straight into your dashboard.</p>

             <div className="mb-4">
                <ul className="nav nav-tabs nav-tabs-line nav-tabs-bold nav-tabs-line-brand" role="tablist">
                    <li className="nav-item">
                        <a className={`nav-link ${activeStaffTab === 'drivers' ? 'active' : ''}`} onClick={() => setActiveStaffTab('drivers')} href="javascript:;">Drivers</a>
                    </li>
                    <li className="nav-item">
                        <a className={`nav-link ${activeStaffTab === 'teachers' ? 'active' : ''}`} onClick={() => setActiveStaffTab('teachers')} href="javascript:;">Teachers</a>
                    </li>
                    <li className="nav-item">
                        <a className={`nav-link ${activeStaffTab === 'admins' ? 'active' : ''}`} onClick={() => setActiveStaffTab('admins')} href="javascript:;">Admins</a>
                    </li>
                </ul>
                <div className="tab-content pt-3">
                    <StaffForm 
                        type={activeStaffTab.slice(0, -1)} 
                        onAddStaff={(type) => {
                            if (!tempStaffMember.name || !tempStaffMember.phone) return setStaffFormError('Name and Phone are required');
                            const list = activeStaffTab === 'drivers' ? driversToInvite : activeStaffTab === 'teachers' ? teachersToInvite : adminsToInvite;
                            const setter = activeStaffTab === 'drivers' ? setDriversToInvite : activeStaffTab === 'teachers' ? setTeachersToInvite : setAdminsToInvite;
                            setter([...list, { ...tempStaffMember }]);
                            setTempStaffMember({ name: '', phone: '', email: '' });
                            setStaffFormError('');
                        }}
                        tempStaff={tempStaffMember}
                        setTempStaff={setTempStaffMember}
                        error={staffFormError}
                    />
                    <StaffTable 
                        type={activeStaffTab.slice(0, -1)} 
                        staffList={activeStaffTab === 'drivers' ? driversToInvite : activeStaffTab === 'teachers' ? teachersToInvite : adminsToInvite}
                        onRemoveStaff={(type, index) => {
                            const list = activeStaffTab === 'drivers' ? driversToInvite : activeStaffTab === 'teachers' ? teachersToInvite : adminsToInvite;
                            const setter = activeStaffTab === 'drivers' ? setDriversToInvite : activeStaffTab === 'teachers' ? setTeachersToInvite : setAdminsToInvite;
                            const newList = [...list];
                            newList.splice(index, 1);
                            setter(newList);
                        }}
                    />
                </div>
            </div>

            <div className="row">
                <div className="col-md-6">
                    <button className="btn btn-outline-secondary btn-block btn-lg mb-3" onClick={() => proceedToDashboard(false)} disabled={loading}>
                        Skip & Go to Dashboard
                    </button>
                </div>
                <div className="col-md-6">
                    <button className="btn btn-brand btn-block btn-lg mb-3" onClick={() => proceedToDashboard(true)} disabled={loading || (driversToInvite.length === 0 && teachersToInvite.length === 0 && adminsToInvite.length === 0)}>
                        Invite & Go to Dashboard
                    </button>
                </div>
            </div>
        </>
    );

    const renderStudentRegistrationForm = () => (
        <>
            {/* NEW & UPDATED: Logo added above the school name */}
            <div className="text-center mb-4">
                {currentSchoolLogo && <img src={currentSchoolLogo} alt={`${currentSchoolDisplayName} Logo`} className="school-logo-image"/>}
                <h1 className="text-logo">{currentSchoolDisplayName}</h1>
            </div>
            <h3 className="form-title">Student & Parent Registration</h3>
            <p className="text-muted mb-4">Register as a new parent/student for {currentSchoolDisplayName}.</p>

            {schoolMetaError && <div className="alert alert-danger">{schoolMetaError}</div>}
            {classesError && <div className="alert alert-warning">{classesError}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleStudentRegistrationSubmit}>
                <h5 className="form-section-title">Parent/Guardian Details</h5>
                <div className="form-group"><input type="text" className="form-control" placeholder="Parent/Guardian Full Name" value={parentName} onChange={e => setParentName(e.target.value)} required /></div>
                <div className="form-row">
                    <div className="form-group col-md-6"><input type="tel" className="form-control" placeholder="Parent Phone (for login)" value={parentPhone} onChange={e => setParentPhone(e.target.value)} required pattern="[0-9]{10,15}" title="A valid 10-15 digit phone number is required."/></div>
                    <div className="form-group col-md-6"><input type="email" className="form-control" placeholder="Parent Email (Optional)" value={parentEmail} onChange={e => setParentEmail(e.target.value)} /></div>
                </div>

                <h5 className="form-section-title">Student Details</h5>
                <div className="form-group"><input type="text" className="form-control" placeholder="Student Full Name" value={studentName} onChange={e => setStudentName(e.target.value)} required /></div>
                <div className="form-row">
                    <div className="form-group col-md-6">
                        <select className="form-control" value={studentClassId} onChange={e => setStudentClassId(e.target.value)} required disabled={isFetchingClasses || classes.length === 0}>
                            <option value="">Select Class</option>
                            {isFetchingClasses && <option disabled>Loading classes...</option>}
                            {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                        </select>
                         {classes.length === 0 && !isFetchingClasses && !classesError && <small className="form-text text-muted">No classes available.</small>}
                    </div>
                    <div className="form-group col-md-6"><input type="text" className="form-control" placeholder="Student Route/Location (Optional)" value={studentRoute} onChange={e => setStudentRoute(e.target.value)} /></div>
                </div>

                <button type="submit" className="btn btn-brand btn-block btn-lg mt-4" disabled={loading || isFetchingSchoolMeta || isFetchingClasses || !!schoolMetaError}>
                    {loading ? "Submitting..." : "Complete Registration"}
                </button>
            </form>
        </>
    );
    
    const renderSuccessView = ({ isAlreadyRegistered }) => (
        <>
            {/* NEW & UPDATED: Logo added above the school name */}
            <div className="text-center mb-4">
                {currentSchoolLogo && <img src={currentSchoolLogo} alt={`${currentSchoolDisplayName} Logo`} className="school-logo-image"/>}
                <h1 className="text-logo">{currentSchoolDisplayName}</h1>
            </div>
            <div className="text-center p-4" style={{border: `1px solid var(--brand-color)`, borderRadius: '8px', backgroundColor: '#f8f9fa'}}>
                <h3 className="form-title" style={{border: 'none'}}>
                    {isAlreadyRegistered ? "You Are Already Registered!" : "Registration Successful!"}
                </h3>
                <p className="text-muted mb-4">
                    {isAlreadyRegistered 
                        ? `You can now log in to the Shule Plus app using the phone number below.`
                        : `Your registration is complete. You will receive an SMS with a verification code. Use it to log in to the Shule Plus app with the phone number below.`
                    }
                </p>
                
                <h5 className="form-section-title">Your Login Phone Number:</h5>
                <div className="d-flex justify-content-center align-items-center mb-4">
                    <input 
                        type="text" 
                        value={registeredPhone} 
                        readOnly 
                        className="form-control form-control-lg text-center" 
                        style={{maxWidth: '250px', marginRight: '10px'}}
                    />
                    <button className="btn btn-outline-secondary" onClick={handleCopyToClipboard}>
                        {isCopied ? 'Copied!' : 'Copy'}
                    </button>
                </div>

                <a href="https://shuleplus.co.ke/app" target="_blank" rel="noopener noreferrer" className="btn btn-brand btn-block btn-lg">
                    Proceed to Shule Plus App
                </a>
            </div>
        </>
    );

    if (isFetchingSchoolMeta || (schoolIdFromUrl && studentRegStatus === 'loading')) {
        return (
            <>
                <CustomStyles />
                <div className="register-container">
                    <div className="register-card" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '400px'}}>
                        <div className="page-loader">
                            <div className="spinner-border" role="status"><span className="sr-only">Loading...</span></div>
                            <p className="mt-2 text-muted">Loading school details...</p>
                        </div>
                    </div>
                </div>
            </>
        );
    }
    
    return (
        <>
            <CustomStyles />
            <div className="register-container">
                <div className="register-card">
                    <div className="col-lg-7 form-panel order-lg-2 order-2">
                        {schoolIdFromUrl ? (
                            <>
                                {studentRegStatus === 'form' && renderStudentRegistrationForm()}
                                {studentRegStatus === 'success' && renderSuccessView({ isAlreadyRegistered: false })}
                                {studentRegStatus === 'already_registered' && renderSuccessView({ isAlreadyRegistered: true })}
                            </>
                        ) : (
                            currentStep === 1 ? renderSchoolAdminRegistrationStep1() : renderSchoolAdminRegistrationStep2() /* Fallback for admin reg */
                        )}
                    </div>
                    <div className="col-lg-5 info-panel order-lg-1 order-1">
                        <div>
                            {/* NEW & UPDATED: Improved accessibility and consistency */}
                            {currentSchoolLogo && schoolIdFromUrl && <img src={currentSchoolLogo} alt={`${currentSchoolDisplayName} Logo`} className="school-logo-image mb-3" />}
                            <h1 className="text-logo" style={{color: 'var(--info-text-color)'}}>{currentSchoolDisplayName}</h1>
                            
                            {schoolIdFromUrl && schoolMeta ? (
                                <>
                                    <h1>Welcome to {schoolMeta.name}!</h1>
                                    <p className="mb-4">Register as a student to access transportation updates, learning materials, and stay connected with your school community.</p>
                                </>
                            ) : (
                                <>
                                    <h1>The Ultimate Platform for Learning & School Management.</h1>
                                    <p className="mb-4">Join Shule Plus today and transform your school's operations. Get started instantly.</p>
                                </>
                            )}
                             <ul>
                                <li>Easy and Quick Sign-Up</li>
                                <li>Real-time Bus Tracking</li>
                                <li>Seamless Parent-School Communication</li>
                            </ul>
                            <p><strong>Ready to get started?</strong> Complete the simple steps to gain immediate access.</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Register;