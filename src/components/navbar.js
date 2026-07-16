import React from "react";
import { Link } from "react-router-dom";
import app from "../scripts.bundle"; // Assuming this is Metronic's app bundle
import Data from "../utils/data";
import { applySchoolBranding } from "../utils/branding";
import { withRouter } from "react-router";
import Pace from 'react-pace-progress';
import { useTheme } from "../contexts/ThemeContext";
const toastr = window.toastr;

// Keep the Metronic JS initializers for things like dropdowns and the profile offcanvas
const KTUtil = window.KTUtil;
const KTOffcanvas = window.KTOffcanvas;
const KTMenu = window.KTMenu;

// --- SVG Icon Components (Keep as is) ---
const SvgSchoolsIcon = ({ style }) => ( <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path> <polyline points="9 22 9 12 15 12 15 22"></polyline> </svg> );
const SvgAdminsIcon = ({ style }) => ( <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path> <circle cx="9" cy="7" r="4"></circle> <rect x="14" y="10" width="8" height="7" rx="1"></rect> <path d="M18 10V8a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v2"></path> </svg> );
const SvgInvitationsIcon = ({ style }) => ( <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path> <polyline points="22,6 12,13 2,6"></polyline> </svg> );
const SvgDriversIcon = ({ style }) => ( <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <circle cx="12" cy="12" r="8"></circle> <circle cx="12" cy="12" r="2"></circle> <line x1="12" y1="4" x2="12" y2="8"></line> <line x1="12" y1="16" x2="12" y2="20"></line> <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line> <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line> <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line> <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line> </svg> );
const SvgBusesIcon = ({ style }) => ( <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M5 15C5 14.4477 5.44772 14 6 14H18C18.5523 14 19 14.4477 19 15V19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V15Z"></path> <path d="M5 14V9C5 7.34315 6.34315 6 8 6H16C17.6569 6 19 7.34315 19 9V14"></path> <path d="M2 19H5"></path> <path d="M19 19H22"></path> <path d="M6 10H10"></path> <path d="M14 10H18"></path> <circle cx="7.5" cy="17.5" r="1.5"></circle> <circle cx="16.5" cy="17.5" r="1.5"></circle> </svg> );
const SvgRoutesIcon = ({ style }) => ( <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path> <circle cx="12" cy="10" r="3"></circle> </svg> );
const SvgSchedulesIcon = ({ style }) => ( <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect> <line x1="16" y1="2" x2="16" y2="6"></line> <line x1="8" y1="2" x2="8" y2="6"></line> <line x1="3" y1="10" x2="21" y2="10"></line> </svg> );
const SvgClassesIcon = ({ style }) => ( <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path> <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path> </svg> );
const SvgTeachersIcon = ({ style }) => ( <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <rect x="2" y="4" width="20" height="16" rx="2"></rect> <circle cx="8" cy="10" r="2"></circle> <line x1="13" y1="8" x2="18" y2="8"></line> <line x1="13" y1="12" x2="18" y2="12"></line> <line x1="6" y1="16" x2="18" y2="16"></line> </svg> );
const SvgStudentsIcon = ({ style }) => ( <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M22 10l-10-5-10 5 4 2v6h12v-6l4-2z"></path> <path d="M6 12v6"></path> <path d="M12 14v7"></path> <path d="M12 21h-1"></path> </svg> );
const SvgParentsIcon = ({ style }) => ( <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path> <circle cx="9" cy="7" r="4"></circle> <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path> <path d="M16 3.13a4 4 0 0 1 0 7.75"></path> </svg> );
const SvgSettingsIcon = ({ style }) => ( <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <circle cx="12" cy="12" r="3"></circle> <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1-2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path> </svg> );
const SvgLibraryIcon = ({ style }) => ( <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path> <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path> </svg> );
const SvgResultsIcon = ({ style }) => ( <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path> <path d="M22 12A10 10 0 0 0 12 2v10z"></path> </svg> );
const SvgTimeTablesIcon = ({ style }) => ( <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect> <line x1="16" y1="2" x2="16" y2="6"></line> <line x1="8" y1="2" x2="8" y2="6"></line> <line x1="3" y1="10" x2="21" y2="10"></line> </svg> );
const SvgFinanceIcon = ({ style }) => ( <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <line x1="12" y1="1" x2="12" y2="23"></line> <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path> </svg> );
const SvgLockIcon = ({ style }) => ( <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> );


const DEFAULT_TOP_NAV_BG_COLOR = 'var(--bg-secondary)';
const DEFAULT_TOP_NAV_TEXT_COLOR = 'var(--text-primary)'; // Dark color for text
const DEFAULT_TOP_NAV_ICON_COLOR = 'var(--text-primary)'; // Dark color for icons

const BOTTOM_NAV_BG_COLOR = 'var(--bg-secondary)';
const BOTTOM_NAV_TEXT_COLOR = 'var(--text-primary)';
const BOTTOM_NAV_ICON_COLOR = 'var(--text-primary)';

const LIGHT_GREY_HOVER_BG = 'var(--hover-bg)'; // Subtle hover
const GLASS_BACKDROP = 'blur(10px) saturate(180%)';
const GLASS_BG = 'var(--glass-bg)';

class Navbar extends React.Component {
  state = {
    selectedSchool: {},
    availableSchools: Data.schools.list(),
    userRole: "",
    fetchingSchools: Data.schools.list().length === 0,
    topNavbarHeight: 75,
    mobileTopBarHeight: 60,
    secondaryNavbarEffectiveHeight: 65,
    gapBetweenNavbars: 15,
    secondaryNavbarHorizontalMargin: 20,
    isMobile: window.innerWidth < 1024,
    isMobileMenuOpen: false, // State to control mobile menu
    openMobileSubmenu: null, // State for mobile accordion submenus
    showSchoolSelector: false, // State for desktop school selector dropdown
    showManageData: false, // State for manage data dropdown
    isDataLoading: false, // State to track data loading from Data utility
    pwaInstallAvailable: false, // Whether the PWA install prompt is available
  };

  schoolSelectorRef = React.createRef();
  manageDataRef = React.createRef();

  getUserFlags = () => {
    const ENABLE_ROLE_RESTRICTIONS = false; // Toggle this to true once all admins have assigned roles
    const storedUser = JSON.parse(localStorage.getItem("user")) || {};
    const effectiveRole = this.state.userRole || storedUser.userType || storedUser.role;
    let normalizedRole = String(effectiveRole || '').toLowerCase().replace(/ /g, '_');
    
    if (!ENABLE_ROLE_RESTRICTIONS) {
       const isTeacherRole = ['teacher', 'parent'].includes(normalizedRole);
       const isSuper = normalizedRole === 'sAdmin' || (storedUser && storedUser.userType === 'sAdmin');
       if (!isTeacherRole && !isSuper) {
          normalizedRole = 'admin';
       }
    }

    const isSuperAdmin = normalizedRole === 'sAdmin' || 
                        (storedUser && storedUser.userType === 'sAdmin');
                        
    const isCsm = ['customer_success_manager', 'csm'].includes(normalizedRole);
    const isPrincipal = ['principal_admin', 'principal'].includes(normalizedRole);
    const isOps = ['admin_operations', 'operations', 'finance'].includes(normalizedRole);
    const isAcademics = ['admin_academics', 'academics', 'headteacher'].includes(normalizedRole);
    const isAdmin = isSuperAdmin || isCsm || isPrincipal || isOps || isAcademics || ['admin', 'school_admin', 'schooladmin'].includes(normalizedRole);
    
    const isTeacher = !isAdmin && ['teacher', 'parent'].includes(normalizedRole);
    
    return { isSuperAdmin, isCsm, isPrincipal, isOps, isAcademics, isAdmin, isTeacher, effectiveRole, storedUser, normalizedRole };
  };

  getSecondaryNavItems = () => {
    const { isSuperAdmin, isCsm, isPrincipal, isOps, isAcademics, isTeacher } = this.getUserFlags();

    let items = [];

    if (isTeacher) {
      return [
        { path: "/comms", label: "Comms", icon: "la-envelope" },
        { path: "/learning", label: "Learning", icon: "la-graduation-cap" },
        { path: "/library", label: "Library", icon: "la-book" },
        { path: "/results", label: "Results", icon: "la-bar-chart" },
        { path: "/time-tables", label: "Timetables", icon: "la-calendar-check-o" }
      ];
    }

    if (isOps) {
      return [
        { path: "/home", label: "Reports", icon: "la-dashboard" },
        { path: "/finance/fees", label: "Fee", icon: "la-money" },
        { path: "/trips/all", label: "Transport", icon: "la-bus" }
      ];
    }

    if (isAcademics) {
      return [
        { path: "/home", label: "Reports", icon: "la-dashboard" },
        { path: "/comms", label: "Comms", icon: "la-envelope" },
        { path: "/learning", label: "Learning", icon: "la-graduation-cap" },
        { path: "/library", label: "Library", icon: "la-book" },
        { path: "/results", label: "Results", icon: "la-bar-chart" },
        { path: "/time-tables", label: "Timetables", icon: "la-calendar-check-o" }
      ];
    }

    // Default for Admin, Super Admin, CSM, Principal
    items = [
      { path: "/home", label: "Reports", icon: "la-dashboard" },
      { path: "/comms", label: "Comms", icon: "la-envelope" },
      { path: "/learning", label: "Learning", icon: "la-graduation-cap" },
      { path: "/library", label: "Library", icon: "la-book" },
      { path: "/results", label: "Results", icon: "la-bar-chart" },
      { path: "/time-tables", label: "Timetables", icon: "la-calendar-check-o" },
      { path: "/finance/fees", label: "Fee", icon: "la-money" },
      { path: "/finance/budgets", label: "Budgets", icon: "la-pie-chart" },
      { path: "/finance/expenses", label: "Expenses", icon: "la-credit-card" },
      { path: "/trips/all", label: "Transport", icon: "la-bus" },
      { path: "/games", label: "Games", icon: "la-gamepad" },
      { path: "/mdm", label: "Devices", icon: "la-tablet" }
    ];
    
    if (isSuperAdmin || isPrincipal) {
      items.push({ path: "/activity-log", label: "Logs", icon: "la-history" });
    }

    const isRestricted = this.state.selectedSchool?.dashboardsRestricted && !isSuperAdmin;
    if (isRestricted) {
      return items.map(item => ({
        ...item,
        path: "/finance/institutional-deposits",
        icon: "la-lock"
      }));
    }

    return items;
  };

  componentDidMount() {
    const userData = JSON.parse(localStorage.getItem("user")) || {};
    const schools = Data.schools.list() || [];
    
    // If schools are already loaded, don't show loading spinner
    const shouldShowInitialLoading = schools.length === 0;
    
    this.setState({ 
      schools,
      fetchingSchools: shouldShowInitialLoading,
      userRole: userData.userType || userData.role
    });

    this.schoolsSubscription = Data.schools.subscribe(({ schools, selectedSchool }) => {
      const schoolsArray = (schools || [])
        .filter(s => s && s.id && !s.isDeleted)
        .sort((a, b) => (b.studentsCount || 0) - (a.studentsCount || 0));
      
      // Force fetchingSchools to false if we have schools data
      const shouldShowLoading = schoolsArray.length === 0;
      
      this.setState({
        availableSchools: schoolsArray,
        selectedSchool,
        fetchingSchools: shouldShowLoading
      }, () => {
        if (selectedSchool && selectedSchool.id) {
          localStorage.setItem("school", selectedSchool.id);
          
          // Keep only lightweight metadata to avoid QuotaExceededError in localStorage
          const schoolMetadata = {
            id: selectedSchool.id,
            name: selectedSchool.name,
            logo: selectedSchool.logo,
            theme_color: selectedSchool.theme_color,
            primaryColor: selectedSchool.primaryColor,
            secondaryColor: selectedSchool.secondaryColor,
            supportEmail: selectedSchool.supportEmail,
            logoUrl: selectedSchool.logoUrl || selectedSchool.logo,
            financial: selectedSchool.financial ? {
              balance: selectedSchool.financial.balance,
              balanceFormated: selectedSchool.financial.balanceFormated
            } : undefined
          };
          localStorage.setItem("schoolData", JSON.stringify(schoolMetadata));
          
          // Apply comprehensive dynamic branding (title, favicon, iOS touch-icon, and dynamic PWA manifest)
          applySchoolBranding(selectedSchool);
        }
        // Initialize menu after schools load
        this.initDesktopMenu();
      });
    });

    // Add an immediate check for schools data and update state if available
    const checkAndForceLoadingState = () => {
      const currentSchools = Data.schools.list() || [];
      if (currentSchools.length > 0 && this.state.fetchingSchools) {
        this.setState({ 
          fetchingSchools: false,
          availableSchools: currentSchools 
        });
      }
    };

    // Check immediately
    checkAndForceLoadingState();
    
    // Also check after a delay in case data is still loading
    setTimeout(checkAndForceLoadingState, 1000);
    setTimeout(checkAndForceLoadingState, 3000);

    // Fallback: Hide loading indicator after 10 seconds max to prevent it from getting stuck
    this.loadingTimeout = setTimeout(() => {
      if (this.state.fetchingSchools) {
        this.setState({ fetchingSchools: false });
      }
    }, 10000);
    
    let role = userData.userType || userData.role || "";
    if (!role && userData && typeof userData === 'object' && Object.keys(userData).length > 0) {
      if (typeof Object.keys(userData)[0] === 'string' && ['teacher', 'admin', 'student', 'parent'].includes(Object.keys(userData)[0].toLowerCase())) {
          role = Object.keys(userData)[0];
      }
    }
    this.setState({ userRole: role });

    // Initialize dark mode
    this.initializeDarkMode();

    this.loadingSubscription = Data.loading.subscribe(({ loading }) => {
      this.setState({ isDataLoading: loading });
    });

    app.init();
    this.initProfileOffcanvas();
    // Initial menu setup
    setTimeout(() => this.initDesktopMenu(), 500);
    window.addEventListener('resize', this.handleResize);
    document.addEventListener('mousedown', this.handleClickOutside);

    // Track PWA install prompt availability
    this._pwaPromptListener = () => {
      const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
      this.setState({ pwaInstallAvailable: !isStandalone && !!window.deferredInstallPrompt });
    };
    window.addEventListener('pwa_prompt_ready', this._pwaPromptListener);
    // Check immediately in case it was already set
    this._pwaPromptListener();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('mousedown', this.handleClickOutside);
    if (this._pwaPromptListener) {
      window.removeEventListener('pwa_prompt_ready', this._pwaPromptListener);
    }
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }
    if (this.schoolsSubscription) {
      this.schoolsSubscription();
    }
    if (this.loadingSubscription) {
      this.loadingSubscription();
    }
  }

  handleClickOutside = (event) => {
    if (this.schoolSelectorRef.current && !this.schoolSelectorRef.current.contains(event.target)) {
      this.setState({ showSchoolSelector: false });
    }
    if (this.manageDataRef.current && !this.manageDataRef.current.contains(event.target)) {
      this.setState({ showManageData: false });
    }
  }
  
  componentDidUpdate(prevProps, prevState) {
      if (prevProps.location.pathname !== this.props.location.pathname) {
          this.setState({ isMobileMenuOpen: false });
      }

      // Re-init menu if switching from mobile to desktop or if number of schools changed
      if (!this.state.isMobile && (prevState.isMobile || (prevState.availableSchools || []).length !== (this.state.availableSchools || []).length)) {
          this.initDesktopMenu();
      }
  }

  initDesktopMenu = () => {
    if (this.state.isMobile) return;
    
    // Use a small delay to ensure DOM is ready
    setTimeout(() => {
        const desktopTopMenu = KTUtil.get('kt_header_menu');
        if (desktopTopMenu) {
            new KTMenu(desktopTopMenu, {});
        }
    }, 200);
  }

  handleResize = () => {
    const isMobileNow = window.innerWidth < 992;
    if (this.state.isMobile !== isMobileNow) {
        this.setState({ isMobile: isMobileNow, isMobileMenuOpen: false });
    }
  }

  toggleMobileMenu = () => {
    this.setState(prevState => ({ isMobileMenuOpen: !prevState.isMobileMenuOpen }));
  };

  toggleMobileSubmenu = (menuName) => {
    this.setState(prevState => ({
      openMobileSubmenu: prevState.openMobileSubmenu === menuName ? null : menuName
    }));
  }

  initProfileOffcanvas = () => {
    const profilePanel = KTUtil.get('kt_offcanvas_toolbar_profile');
    if (profilePanel && !profilePanel.getAttribute('data-kt-initialized')) {
      profilePanel.setAttribute('data-kt-initialized', 'true');
      new KTOffcanvas(profilePanel, {
        overlay: true, baseClass: 'kt-offcanvas-panel', closeBy: 'kt_offcanvas_toolbar_profile_close',
        toggleBy: [
          { target: 'kt_offcanvas_toolbar_profile_toggler_btn', state: 'kt-header__topbar-toggler--active' },
          { target: 'kt_header_mobile_topbar_toggler', state: 'kt-header-mobile__toolbar-topbar-toggler--active' }
        ]
      });
      // Add custom styles for the offcanvas overlay to make it blurred
      const overlay = document.querySelector('.kt-offcanvas-panel-overlay');
      if (overlay) overlay.style.backdropFilter = 'blur(5px)';
    }
  }

  initializeDarkMode = () => {
    // Check localStorage first
    const stored = localStorage.getItem('darkMode');
    let isDarkMode = false;
    
    if (stored !== null) {
      isDarkMode = JSON.parse(stored);
    } else if (typeof window !== 'undefined' && window.matchMedia) {
      // Check system preference
      isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    // Apply theme
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.classList.remove('dark-mode');
    }
    
    // Update icon
    this.updateDarkModeIcon(isDarkMode);
    
    // Listen for system theme changes
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        const stored = localStorage.getItem('darkMode');
        if (stored === null) {
          const newDarkMode = e.matches;
          document.documentElement.setAttribute('data-theme', newDarkMode ? 'dark' : 'light');
          document.body.classList.toggle('dark-mode', newDarkMode);
          this.updateDarkModeIcon(newDarkMode);
        }
      };
      mediaQuery.addEventListener('change', handleChange);
    }
  }

  updateDarkModeIcon = (isDarkMode) => {
    const icon = document.getElementById('dark-mode-icon');
    if (icon) {
      icon.className = isDarkMode ? 'la la-sun-o' : 'la la-moon-o';
    }
  }

  switchSchools = (newSchool) => {
    this.setState({ 
      selectedSchool: newSchool, 
      fetchingSchools: false, 
      isMobileMenuOpen: false,
      showSchoolSelector: false,
      showManageData: false
    });
    Data.schools.setSchool(newSchool.id);
    if (window.toastr) window.toastr.success(`Switched to ${newSchool.name}`);
  }

  handleInstallApp = () => {
    if (window.deferredInstallPrompt) {
      window.deferredInstallPrompt.prompt();
      window.deferredInstallPrompt.userChoice.then((choiceResult) => {
        window.deferredInstallPrompt = null;
        this.forceUpdate();
      });
    }
  };

  isActiveRoute = (path) => {
    return this.props.location.pathname === path;
  }

  renderMobileNav = () => {
    const { isMobileMenuOpen, availableSchools, selectedSchool, openMobileSubmenu } = this.state;
    
    // Theme calculation for mobile nav
    const useSchoolTheme = selectedSchool && selectedSchool.theme_color;
    const effectiveTopBarBgColor = useSchoolTheme ? selectedSchool.theme_color : DEFAULT_TOP_NAV_BG_COLOR;
    const { isTeacher, isSuperAdmin, isCsm, isOps, isAcademics, effectiveRole, storedUser: userData } = this.getUserFlags();
    const showLowBalanceIndicator = selectedSchool && selectedSchool.financial && typeof selectedSchool.financial.balance === 'number' && selectedSchool.financial.balance < 300;
    const manageDataItems = [
        { path: "/schools", label: "Schools", IconComponent: SvgSchoolsIcon }, { path: "/admins", label: "Admins", IconComponent: SvgAdminsIcon },
        { path: "/invitations", label: "Invitations", IconComponent: SvgInvitationsIcon }, { path: "/drivers", label: "Drivers", IconComponent: SvgDriversIcon },
        { path: "/buses", label: "Buses", IconComponent: SvgBusesIcon }, { path: "/routes", label: "Routes", IconComponent: SvgRoutesIcon },
        { path: "/schedules", label: "Schedules", IconComponent: SvgSchedulesIcon }, { path: "/classes", label: "Classes", IconComponent: SvgClassesIcon },
        { path: "/teachers", label: "Teachers", IconComponent: SvgTeachersIcon }, { path: "/students", label: "Students", IconComponent: SvgStudentsIcon },
        { path: "/parents", label: "Parents", IconComponent: SvgParentsIcon }, { path: "/library", label: "Library", IconComponent: SvgLibraryIcon }, { path: "/settings/school", label: "School Details", IconComponent: SvgSettingsIcon },
        { path: "/fee-structures", label: "Fee Structures", IconComponent: SvgFinanceIcon },
        { path: "/finance/fees", label: "Payment", IconComponent: SvgFinanceIcon },
        { path: "/finance/charge-types", label: "Charge Types", IconComponent: SvgFinanceIcon },
        { path: "/results", label: "Results", IconComponent: SvgResultsIcon },
        { path: "/terms", label: "Terms", IconComponent: SvgSchedulesIcon },
        { path: "/assessment-types", label: "Assessment Types", IconComponent: SvgResultsIcon },
        { path: "/rubrics", label: "Rubrics", IconComponent: SvgResultsIcon },
    ].filter(item => {
        if (isTeacher) {
            const forbidden = ["/schools", "/admins", "/invitations", "/finance/fees", "/finance/charge-types", "/settings/school", "/terms", "/assessment-types", "/rubrics"];
            return !forbidden.includes(item.path);
        }
        
        if (item.path === "/schools" && (!isSuperAdmin && !isCsm)) {
            return false;
        }

        if (isOps) {
            const allowedForOps = ["/fee-structures", "/finance/fees", "/finance/charge-types", "/drivers", "/buses", "/routes", "/schedules"];
            return allowedForOps.includes(item.path);
        }

        if (isAcademics) {
            const forbiddenForAcademics = ["/schools", "/admins", "/invitations", "/fee-structures", "/finance/fees", "/finance/charge-types", "/drivers", "/buses", "/routes", "/schedules"];
            return !forbiddenForAcademics.includes(item.path);
        }
        
        return true;
    });

    const isRestricted = selectedSchool?.dashboardsRestricted && !isSuperAdmin;
    let finalManageDataItems = manageDataItems;
    if (isRestricted) {
        finalManageDataItems = manageDataItems.map(item => ({
            ...item,
            path: "/finance/institutional-deposits",
            IconComponent: SvgLockIcon
        }));
    }

    const financeItems = [
      { path: "/finance/topup", label: "Mpesa Top Up" },
      { path: "/finance/charges", label: "SMS Usage History" },
      { path: "/finance/institutional-deposits", label: "Billing" },
    ];

    const mobileMenuStyle = {
      position: 'fixed', top: '100px', bottom: '80px', right: '15px', width: '300px', maxWidth: '85%',
      backgroundColor: 'var(--bg-primary)', zIndex: 1005,
      transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(120%)',
      transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)', 
      boxShadow: '-5px 10px 30px rgba(0,0,0,0.15)',
      borderRadius: '20px',
      overflowY: 'auto', padding: '0', color: 'var(--text-primary)'
    };
    const overlayStyle = {
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.4)', zIndex: 1004,
      display: isMobileMenuOpen ? 'block' : 'none', 
      transition: 'opacity 0.4s ease',
      opacity: isMobileMenuOpen ? 1 : 0,
      backdropFilter: 'blur(4px)',
    };
    const buttonStyle = {
      display: 'flex', alignItems: 'center', padding: '12px 15px', textDecoration: 'none',
      color: 'var(--text-primary)', borderRadius: '6px', fontWeight: 500, width: '100%',
      border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer',
    };
    const linkStyle = { ...buttonStyle }; // Link will be styled like a button
    const subLinkStyle = { ...linkStyle, paddingLeft: '40px' };
    const subButtonStyle = { ...buttonStyle, paddingLeft: '40px' };

    return (
      <>
        <div style={overlayStyle} onClick={this.toggleMobileMenu}></div>
        <div style={mobileMenuStyle}>
            <div style={{ 
                padding: '20px 20px', 
                background: useSchoolTheme ? effectiveTopBarBgColor : 'var(--bg-tertiary)',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                borderBottom: '1px solid var(--border-primary)',
                position: 'relative',
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px'
            }}>
                <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '12px', 
                    backgroundColor: '#fff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    overflow: 'hidden'
                }}>
                    <img src={selectedSchool?.logo || '/assets/media/logos/ic_launcher.png'} alt="Logo" style={{ width: '85%', height: 'auto' }} />
                </div>
                <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ color: useSchoolTheme ? '#fff' : 'var(--text-primary)', fontWeight: 700, fontSize: '1.1rem' }}>{selectedSchool?.name || "Shule Plus"}</div>
                    <div style={{ color: useSchoolTheme ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>Menu</div>
                </div>
                <button onClick={this.toggleMobileMenu} style={{ background: 'rgba(0,0,0,0.1)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: useSchoolTheme ? '#fff' : 'var(--text-primary)' }}>
                    <i className="la la-close" style={{ fontSize: '1.2rem' }}></i>
                </button>
            </div>
            <ul style={{ listStyle: 'none', padding: '10px 0 0 0', margin: 0 }}>
                {/* Sync Data (Mobile) */}
                <li style={{ marginBottom: '5px' }}>
                    <button 
                        onClick={() => {
                            if (window.toastr) window.toastr.info("Pulling latest data from server...");
                            Data.init();
                            this.toggleMobileMenu();
                        }}
                        style={{ ...buttonStyle, background: 'rgba(57, 102, 255, 0.05)', color: '#3966ff' }}
                    >
                        <i className="la la-refresh" style={{ marginRight: '12px', fontSize: '1.2rem' }}></i> 
                        <strong>Sync Data Now</strong>
                    </button>
                    <div style={{ height: '1px', background: 'var(--border-primary)', margin: '10px 15px' }}></div>
                </li>
                {/* School Switcher */}
                {availableSchools.length > 1 && (
                    <li>
                        <button onClick={() => this.toggleMobileSubmenu('schools')} style={buttonStyle}>
                            <i className="la la-school" style={{marginRight: '12px', fontSize: '1.2rem', color: 'var(--text-tertiary)'}}></i> {selectedSchool?.name || "Select School"} <i className={`la la-angle-${openMobileSubmenu === 'schools' ? 'down' : 'right'}`} style={{marginLeft: 'auto'}}></i>
                        </button>
                        {openMobileSubmenu === 'schools' && (
                            <ul style={{listStyle: 'none', padding: 0, margin: '0 0 10px 0', backgroundColor: 'var(--bg-tertiary)'}}>
                                {availableSchools.map(schoolItem => (
                                    <li key={schoolItem.id}>
                                        <button onClick={() => this.switchSchools(schoolItem)} style={{ ...subButtonStyle, display: 'flex', alignItems: 'center', padding: '10px 15px' }}>
                                            {/* School Logo */}
                                            <div style={{ 
                                              width: '28px', 
                                              height: '28px', 
                                              borderRadius: '4px', 
                                              marginRight: '10px', 
                                              backgroundColor: schoolItem.theme_color || 'var(--bg-tertiary)',
                                              display: 'flex', 
                                              alignItems: 'center', 
                                              justifyContent: 'center',
                                              overflow: 'hidden',
                                              flexShrink: 0
                                            }}>
                                              {schoolItem.logo ? (
                                                <img src={schoolItem.logo} alt={schoolItem.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                              ) : (
                                                <i className="la la-school" style={{ color: '#fff', fontSize: '14px' }}></i>
                                              )}
                                            </div>
                                            
                                            {/* School Info */}
                                            <div style={{ flex: 1, textAlign: 'left' }}>
                                              <div style={{ 
                                                color: 'var(--text-primary)', 
                                                fontWeight: '500', 
                                                fontSize: '0.9rem',
                                                marginBottom: '2px'
                                              }}>
                                                {schoolItem.name}
                                              </div>
                                              <div style={{ 
                                                color: 'var(--text-secondary)', 
                                                fontSize: '0.75rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                              }}>
                                                <span style={{ 
                                                  display: 'inline-block',
                                                  width: '6px',
                                                  height: '6px',
                                                  borderRadius: '50%',
                                                  backgroundColor: schoolItem.theme_color || 'var(--brand-color)'
                                                }}></span>
                                                {schoolItem.students?.length || schoolItem.studentCount || 0} students
                                              </div>
                                            </div>
                                            
                                            {/* Selection Indicator */}
                                            {selectedSchool?.id === schoolItem.id && (
                                              <i className="la la-check" style={{ color: 'var(--brand-color)', fontSize: '0.9rem', marginLeft: '8px' }}></i>
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>
                )}
                {/* Main Links */}
                {!isTeacher && <li><Link to={isRestricted ? "/finance/institutional-deposits" : "/home"} style={linkStyle} onClick={this.toggleMobileMenu}><i className={`la ${isRestricted ? 'la-lock' : 'la-dashboard'}`} style={{marginRight: '12px', fontSize: '1.2rem', color: 'var(--text-tertiary)'}}></i> Reports</Link></li>}
                
                {this.getSecondaryNavItems().map((item) => {
                    // Match icons consistently for side drawer
                    let iconName = item.icon;
                    if (item.path === "/comms") iconName = "la-bullhorn";
                    if (item.path === "/time-tables") iconName = "la-calendar";

                    return (
                        <li key={item.path}>
                            <Link to={item.path} style={linkStyle} onClick={this.toggleMobileMenu}>
                                <i className={`la ${iconName}`} style={{marginRight: '12px', fontSize: '1.2rem', color: 'var(--text-tertiary)'}}></i> 
                                {item.label}
                            </Link>
                        </li>
                    );
                })}
                 {/* Manage Data */}
                 {!isTeacher && (
                    <li>
                        <button onClick={() => this.toggleMobileSubmenu('manage')} style={buttonStyle}>
                            <i className="la la-database" style={{marginRight: '12px', fontSize: '1.2rem', color: 'var(--text-tertiary)'}}></i> Manage Data <i className={`la la-angle-${openMobileSubmenu === 'manage' ? 'down' : 'right'}`} style={{marginLeft: 'auto', fontSize: '0.8rem', opacity: 0.5}}></i>
                        </button>
                        <div style={{ maxHeight: openMobileSubmenu === 'manage' ? '400px' : '0', overflowY: 'auto', transition: 'all 0.4s ease-in-out', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', margin: '0 10px', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)' }}>
                            <ul style={{listStyle: 'none', padding: '5px 0', margin: 0 }}>
                                {finalManageDataItems.map(item => (
                                    <li key={item.path}>
                                        <Link to={item.path} style={{ ...subLinkStyle, display: 'flex', alignItems: 'center' }} onClick={this.toggleMobileMenu}>
                                            {item.IconComponent && <item.IconComponent style={{ width: '18px', height: '18px', marginRight: '12px', opacity: 0.7 }} />}
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </li>
                 )}
                {/* Finance */}
                 {!isTeacher && (
                    <li>
                        <button onClick={() => this.toggleMobileSubmenu('finance')} style={buttonStyle}>
                            <i className="la la-money" style={{marginRight: '12px', fontSize: '1.2rem', color: 'var(--text-tertiary)'}}></i> SMS Balance {showLowBalanceIndicator && <span className="balance-dot" title="Low Balance Notice"></span>} <i className={`la la-angle-${openMobileSubmenu === 'finance' ? 'down' : 'right'}`} style={{marginLeft: 'auto', fontSize: '0.8rem', opacity: 0.5}}></i>
                        </button>
                        <div style={{ maxHeight: openMobileSubmenu === 'finance' ? '200px' : '0', overflowY: 'auto', transition: 'all 0.4s ease-in-out', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', margin: '0 10px' }}>
                            <ul style={{listStyle: 'none', padding: '5px 0', margin: 0 }}>
                                {financeItems.map(item => (
                                    <li key={item.path}>
                                        <Link to={item.path} style={{ ...subLinkStyle, display: 'flex', alignItems: 'center' }} onClick={this.toggleMobileMenu}>
                                            <SvgFinanceIcon style={{ width: '18px', height: '18px', marginRight: '12px', opacity: 0.7 }} />
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </li>
                 )}
            </ul>
        </div>
      </>
    );
  }

  renderBottomNav = () => {
    const { isMobile } = this.state;
    if (!isMobile) return null;

    const { isTeacher, isSuperAdmin } = this.getUserFlags();

    let navItems = this.getSecondaryNavItems();
    
    // Hide specific items from bottom nav to prevent overcrowding (they remain in the 'More' menu)
    navItems = navItems.filter(item => item.label !== "Games" && item.label !== "Devices");

    // Prioritize "Fee", "Results", "Transport" to be visible in the bottom nav
    const priorityLabels = ["Results", "Fee", "Transport"];
    priorityLabels.reverse().forEach(label => {
        const idx = navItems.findIndex(i => i.label === label);
        if (idx > -1) {
            const item = navItems.splice(idx, 1)[0];
            navItems.splice(0, 0, item); // move to front to ensure it's picked up and next to each other
        }
    });

    // Limit to 5 items + "More" button for perfect spacing
    if (navItems.length > 5) {
      navItems = navItems.slice(0, 5);
    }

    return (
      <div className="mobile-bottom-nav">
        {navItems.map(item => {
          const isActive = this.isActiveRoute(item.path);
          return (
            <Link key={item.path} to={item.path} className={`bottom-nav-item ${isActive ? 'active' : ''}`}>
              <i className={`la ${item.icon}`}></i>
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button 
          className="bottom-nav-item" 
          onClick={this.toggleMobileMenu}
          style={{ border: 'none', background: 'none', outline: 'none' }}
        >
          <i className="la la-ellipsis-h"></i>
          <span>More</span>
        </button>
      </div>
    );
  }

  render() {
    const { isSuperAdmin, isTeacher, isCsm, isOps, isAcademics, effectiveRole, storedUser } = this.getUserFlags();
    let user = storedUser.names || "Guest";

    const {
        selectedSchool,
        availableSchools,
        fetchingSchools,
        topNavbarHeight,
        mobileTopBarHeight,
        secondaryNavbarEffectiveHeight,
        gapBetweenNavbars,
        secondaryNavbarHorizontalMargin,
        isMobile,
    } = this.state;
    
    const useSchoolTheme = selectedSchool && selectedSchool.theme_color;
    const effectiveTopBarBgColor = useSchoolTheme ? selectedSchool.theme_color : DEFAULT_TOP_NAV_BG_COLOR;
    const effectiveTopBarTextColor = useSchoolTheme ? '#FFFFFF' : DEFAULT_TOP_NAV_TEXT_COLOR;
    const effectiveTopBarIconColor = useSchoolTheme ? '#FFFFFF' : DEFAULT_TOP_NAV_ICON_COLOR;

    const topNavlinkStyle = { color: effectiveTopBarTextColor };
    const topNavIconStyle = { color: effectiveTopBarIconColor };

    const firstBarHeight = isMobile ? mobileTopBarHeight : topNavbarHeight;
    const bottomNavCommonLinkStyle = { color: BOTTOM_NAV_TEXT_COLOR };
    const paceLoaderColor = effectiveTopBarTextColor;
    const fixedContentSpacerHeight = firstBarHeight + gapBetweenNavbars;

    const showLowBalanceIndicator = selectedSchool && selectedSchool.financial && typeof selectedSchool.financial.balance === 'number' && selectedSchool.financial.balance < 300;
    const manageDataItems = [
      { path: "/schools", label: "Schools", IconComponent: SvgSchoolsIcon }, { path: "/admins", label: "Admins", IconComponent: SvgAdminsIcon },
      { path: "/invitations", label: "Invitations", IconComponent: SvgInvitationsIcon }, { path: "/drivers", label: "Drivers", IconComponent: SvgDriversIcon },
      { path: "/buses", label: "Buses", IconComponent: SvgBusesIcon }, { path: "/routes", label: "Routes", IconComponent: SvgRoutesIcon },
      { path: "/schedules", label: "Schedules", IconComponent: SvgSchedulesIcon }, { path: "/classes", label: "Classes", IconComponent: SvgClassesIcon },
      { path: "/teachers", label: "Teachers", IconComponent: SvgTeachersIcon }, { path: "/students", label: "Students", IconComponent: SvgStudentsIcon },
      { path: "/parents", label: "Parents", IconComponent: SvgParentsIcon }, { path: "/library", label: "Library", IconComponent: SvgLibraryIcon }, { path: "/settings/school", label: "School Details", IconComponent: SvgSettingsIcon },
      { path: "/fee-structures", label: "Fee Structures", IconComponent: SvgFinanceIcon },
      { path: "/finance/fees", label: "Payment", IconComponent: SvgFinanceIcon },
      { path: "/finance/charge-types", label: "Charge Types", IconComponent: SvgFinanceIcon },
      { path: "/results", label: "Results", IconComponent: SvgResultsIcon },
      { path: "/time-tables", label: "Timetables", IconComponent: SvgTimeTablesIcon },
      { path: "/terms", label: "Terms", IconComponent: SvgSchedulesIcon },
      { path: "/assessment-types", label: "Assessment Types", IconComponent: SvgSettingsIcon },
      { path: "/rubrics", label: "Rubrics", IconComponent: SvgSettingsIcon },
    ].filter(item => {
        
        if (isTeacher) {
            const forbidden = ["/schools", "/admins", "/invitations", "/finance/fees", "/finance/charge-types", "/settings/school", "/terms", "/assessment-types", "/rubrics"];
            return !forbidden.includes(item.path);
        }
        
        if (item.path === "/schools" && (!isSuperAdmin && !isCsm)) {
            return false;
        }

        if (isOps) {
            const allowedForOps = ["/fee-structures", "/finance/fees", "/finance/charge-types", "/drivers", "/buses", "/routes", "/schedules"];
            return allowedForOps.includes(item.path);
        }

        if (isAcademics) {
            const forbiddenForAcademics = ["/schools", "/admins", "/invitations", "/fee-structures", "/finance/fees", "/finance/charge-types", "/drivers", "/buses", "/routes", "/schedules"];
            return !forbiddenForAcademics.includes(item.path);
        }
        
        return true;
    });

    const isRestricted = selectedSchool?.dashboardsRestricted && !isSuperAdmin;
    let finalManageDataItems = manageDataItems;
    if (isRestricted) {
        finalManageDataItems = manageDataItems.map(item => ({
            ...item,
            path: "/finance/institutional-deposits",
            IconComponent: SvgLockIcon
        }));
    }
    const financeItems = [
      { path: "/finance/topup", label: "Top Up SMS: " + `${selectedSchool?.financial?.balanceFormated || "0 SMS's"}`
      }, { path: "/finance/charges", label: "SMS Usage History" },
    ];

    const customHoverStyle = `
        .kt-header-menu .kt-menu__nav > .kt-menu__item:hover > .kt-menu__link,
        .kt-header-menu .kt-menu__nav > .kt-menu__item.kt-menu__item--hover > .kt-menu__link,
        #kt_bottom_nav_menu_container .kt-menu__nav > .kt-menu__item:hover > .kt-menu__link,
        #kt_bottom_nav_menu_container .kt-menu__nav > .kt-menu__item.kt-menu__item--hover > .kt-menu__link { background-color: ${LIGHT_GREY_HOVER_BG} !important; }
        ${!useSchoolTheme ? `
            #kt_header .kt-header-menu .kt-menu__nav > .kt-menu__item:hover > .kt-menu__link .kt-menu__link-text,
            #kt_header .kt-header-menu .kt-menu__nav > .kt-menu__item.kt-menu__item--hover > .kt-menu__link .kt-menu__link-text { color: ${DEFAULT_TOP_NAV_TEXT_COLOR} !important; }
            #kt_header .kt-header-menu .kt-menu__nav > .kt-menu__item:hover > .kt-menu__link .kt-menu__hor-arrow,
            #kt_header .kt-header-menu .kt-menu__nav > .kt-menu__item.kt-menu__item--hover > .kt-menu__link .kt-menu__hor-arrow,
            #kt_header .kt-header-menu .kt-menu__nav > .kt-menu__item:hover > .kt-menu__link .kt-menu__ver-arrow,
            #kt_header .kt-header-menu .kt-menu__nav > .kt-menu__item.kt-menu__item--hover > .kt-menu__link .kt-menu__ver-arrow { color: ${DEFAULT_TOP_NAV_ICON_COLOR} !important; }
        ` : ''}
        .kt-menu__submenu .kt-menu__item:hover > .kt-menu__link,
        .kt-menu__submenu .kt-menu__item.kt-menu__item--hover > .kt-menu__link { background-color: ${LIGHT_GREY_HOVER_BG} !important; }
        .balance-dot { height: 8px; width: 8px; background-color: #FA064B; border-radius: 50%; display: inline-block; margin-left: 5px; vertical-align: middle; box-shadow: 0 0 4px rgba(250, 6, 75, 0.5); }
        
        @keyframes badgePulse { 
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(250, 6, 75, 0.7); } 
            70% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(250, 6, 75, 0); } 
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(250, 6, 75, 0); } 
        }
        
        /* Enhanced navbar styles */
        .kt-header-menu .kt-menu__nav > .kt-menu__item > .kt-menu__link {
            transition: all 0.3s ease;
        }
        .kt-header-menu .kt-menu__nav > .kt-menu__item:hover > .kt-menu__link {
            transform: translateY(-1px);
        }
        .class-selector-highlight {
            background: linear-gradient(135deg, rgba(57, 102, 255, 0.1), rgba(57, 102, 255, 0.05)) !important;
            border: 1px solid rgba(57, 102, 255, 0.2) !important;
        }
        .compact-profile-btn {
            transition: all 0.2s ease;
        }
        .compact-profile-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        #kt_offcanvas_toolbar_profile_toggler_btn {
            transition: all 0.3s ease;
            border-radius: 8px;
            padding: 4px 10px !important;
            margin: 6px 0;
            display: flex;
            align-items: center;
        }
        #kt_offcanvas_toolbar_profile_toggler_btn:hover {
            background: rgba(255, 255, 255, 0.1) !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        
        /* New Context Control Styles */
        .context-control-container {
            display: flex;
            align-items: center;
            gap: 15px;
            transition: all 0.3s ease;
        }
        .manage-data-cog-btn {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .manage-data-cog-btn:hover i {
            transform: rotate(90deg);
            color: var(--brand-color) !important;
            opacity: 1 !important;
        }
        .school-selector-btn {
            padding: 8px 0 !important;
            border-radius: 8px !important;
            transition: all 0.2s ease !important;
        }
        .school-selector-btn:hover {
            opacity: 0.8;
        }
    `;

    return (
      <>
        <style>{customHoverStyle}</style>
        {isMobile && this.renderMobileNav()}
        {isMobile && this.renderBottomNav()}
        {(fetchingSchools || this.state.isDataLoading) && <Pace color={paceLoaderColor} height={5} style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2000 }} />}

        {/* DESKTOP TOP NAVBAR (Remains Fixed) */}
        <div id="kt_header" className="kt-header kt-grid__item d-none d-lg-flex" style={{ backgroundColor: useSchoolTheme ? effectiveTopBarBgColor : GLASS_BG, backdropFilter: GLASS_BACKDROP, alignItems: 'center', justifyContent: 'space-between', height: `${topNavbarHeight}px`, zIndex: 1002, position: 'fixed', top: `${gapBetweenNavbars}px`, left: `${secondaryNavbarHorizontalMargin}px`, right: `${secondaryNavbarHorizontalMargin}px`, borderRadius: '16px', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)', padding: `0 30px`, border: '1px solid rgba(255, 255, 255, 0.4)', transition: 'all 0.3s ease' }}>
          <div className="kt-header__brand" style={{ padding: 0, display: 'flex', alignItems: 'center' }}>
            {!selectedSchool || Object.keys(selectedSchool).length === 0 || !selectedSchool.name ? ( <div className="kt-spinner kt-spinner--sm kt-spinner--brand" /> ) : ( <Link to="/home"> <img alt="School Logo" style={{ maxHeight: '52px', width: 'auto', borderRadius: '8px', transition: 'all 0.3s ease' }} src={selectedSchool.logo || '/assets/media/logos/ic_launcher.png'} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} /> </Link> )}
          </div>
          
          
          <div className="kt-header__topbar">
            <div className="kt-header-menu-wrapper" style={{ flex: '1', display: 'flex', justifyContent: 'center' }}>
            <div id="kt_header_menu" className="kt-header-menu kt-header-menu-mobile">
              <ul className="kt-menu__nav">
                  
                
                {!isTeacher && (
                    <li className="kt-menu__item kt-menu__item--submenu kt-menu__item--rel" data-ktmenu-submenu-toggle="click" aria-haspopup="true">
                        <a href="!#" onClick={e => e.preventDefault()} className="kt-menu__link kt-menu__toggle">
                        <span className="kt-menu__link-text" style={{ ...topNavlinkStyle, fontWeight: '500' }}>Billing {showLowBalanceIndicator && <span className="balance-dot" title="Low Balance Notice"></span>}</span>
                        <i className="kt-menu__hor-arrow la la-angle-down" style={{ ...topNavIconStyle, color: effectiveTopBarTextColor }} />
                    </a>
                    <div className="kt-menu__submenu kt-menu__submenu--classic kt-menu__submenu--left">
                        <ul className="kt-menu__subnav">
                            <li className="kt-menu__item" aria-haspopup="true">
                            <Link to="/finance/institutional-deposits" className="kt-menu__link">
                                <span className="kt-menu__link-text" style={{ color: effectiveTopBarTextColor }}>
                                Billing & Invoices
                                </span>
                            </Link>
                            </li>
                        {financeItems.map(item => (
                            <li key={item.path} className="kt-menu__item" aria-haspopup="true">
                            <Link to={item.path} className="kt-menu__link">
                                <span className="kt-menu__link-text" style={{ color: effectiveTopBarTextColor }}>
                                {item.label}
                                </span>
                            </Link>
                            </li>
                        ))}
                        </ul>
                    </div>
                    </li>
                )}
              </ul>
            </div>
          </div>
            {/* Billing & Invoices Link */}
            
            {/* Dark Mode Toggle Button */}
            <div className="kt-header__topbar-item" style={{ marginRight: '15px' }}>
              <div 
                className="kt-header__topbar-wrapper" 
                onClick={() => {
                  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
                  const newTheme = isDarkMode ? 'light' : 'dark';
                  document.documentElement.setAttribute('data-theme', newTheme);
                  document.body.classList.toggle('dark-mode', newTheme === 'dark');
                  localStorage.setItem('darkMode', JSON.stringify(newTheme === 'dark'));
                  this.updateDarkModeIcon(newTheme === 'dark');
                  if (window.toastr) window.toastr.info(`${newTheme === 'dark' ? 'Dark' : 'Light'} mode enabled`);
                }}
                style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', display: 'flex', alignItems: 'center' }}
                title="Toggle Dark Mode"
              >
                <i className="la la-moon-o" id="dark-mode-icon" style={{ color: effectiveTopBarTextColor, fontSize: '1.4rem' }}></i>
              </div>
            </div>

            {/* Sync Data Button */}
            <div className="kt-header__topbar-item" style={{ marginRight: '15px' }}>
              <div 
                className="kt-header__topbar-wrapper" 
                onClick={() => {
                  if (window.toastr) window.toastr.info("Pulling latest data from server...");
                  Data.init();
                }}
                style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', display: 'flex', alignItems: 'center' }}
                title="Sync Data"
              >
                <i className="la la-refresh" style={{ color: effectiveTopBarTextColor, fontSize: '1.4rem' }}></i>
              </div>
            </div>

            <div className="kt-header__topbar-item kt-header__topbar-item--user" id="kt_offcanvas_toolbar_profile_toggler_btn" style={{ cursor: 'pointer' }}>
              <div className="kt-header__topbar-welcome" style={{ color: effectiveTopBarTextColor }}>Hi,</div>
              <div className="kt-header__topbar-username" style={{ color: effectiveTopBarTextColor, marginLeft: '5px', fontWeight: '500' }}>{user} <span style={{ opacity: 0.7, fontSize: '0.8rem', fontWeight: '400', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px', marginLeft: '5px' }}>({this.state.userRole || storedUser.role || 'User'})</span> </div>
              <div className="kt-header__topbar-wrapper" style={{ marginLeft: '10px' }}>
                <img alt="User avatar" src={storedUser?.avatar || `https://picsum.photos/30/30?random=${storedUser?.id || 1027}`} style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE TOP NAVBAR (Remains Fixed) */}
        <div id="kt_header_mobile" className="kt-header-mobile kt-header-mobile--fixed d-lg-none" style={{ 
            backgroundColor: useSchoolTheme ? effectiveTopBarBgColor : GLASS_BG, 
            backdropFilter: GLASS_BACKDROP, 
            minHeight: `80px`, 
            top: 0, 
            left: 0, 
            right: 0, 
            borderRadius: '0 0 24px 24px', 
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)', 
            zIndex: 1002, 
            padding: '15px 20px', 
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
          <div className="kt-header-mobile__logo" style={{ display: 'flex', alignItems: 'center' }}>
              <Link to="/home" style={{display: 'flex', alignItems: 'center', gap: '15px', textDecoration: 'none'}}>
                  <div style={{ 
                      backgroundColor: '#fff', 
                      padding: '4px', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      height: '52px',
                      width: '52px',
                      overflow: 'hidden',
                      flexShrink: 0
                  }}>
                      <img alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} src={selectedSchool?.logo || '/assets/media/logos/ic_launcher.png'} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: effectiveTopBarTextColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}> 
                      {selectedSchool?.name || 'Shule Plus'} 
                    </span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.8, color: effectiveTopBarTextColor, marginTop: '2px' }}>Dashboard</span>
                  </div>
              </Link>
          </div>

          <div className="kt-header-mobile__toolbar" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="kt-header-mobile__toolbar-topbar-toggler" id="kt_header_mobile_topbar_toggler" style={{ margin: 0, padding: 0, border: 'none', background: 'none' }}>
              <img alt="User" src={storedUser?.avatar || `https://picsum.photos/30/30?random=${storedUser?.id || 1027}`} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}/>
            </button>
          </div>
        </div>

        <div style={{ height: `${(fixedContentSpacerHeight-60)}px` }} />

        {/* SECONDARY NAVBAR (Bottom Section) */}
        <div id="kt_header_secondary" className="d-none d-lg-flex" style={{ backgroundColor: GLASS_BG, backdropFilter: GLASS_BACKDROP, justifyContent: 'space-between', alignItems: 'center', height: `${secondaryNavbarEffectiveHeight}px`, position: 'relative', marginLeft: `${secondaryNavbarHorizontalMargin}px`, marginRight: `${secondaryNavbarHorizontalMargin}px`, marginBottom: `${gapBetweenNavbars}px`, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', padding: '0 30px', border: '1px solid var(--glass-border)', transition: 'all 0.3s ease', zIndex: 1001 }}>
            <div className="context-control-container" style={{ display: 'flex', alignItems: 'center', paddingLeft: 0, marginLeft: 0 }}>
                {/* SCHOOL SELECTOR */}
                <div className="kt-header-menu-wrapper" style={{ zIndex: 1100, marginLeft: 0, paddingLeft: 0 }} ref={this.schoolSelectorRef}>
                    <div id="kt_header_school_selector" className="kt-header-menu kt-header-menu-mobile" style={{ margin: 0, padding: 0 }}>
                        <ul className="kt-menu__nav" style={{margin: 0, padding: 0}}>
                            <li className={`kt-menu__item ${availableSchools.length > 1 ? 'kt-menu__item--submenu kt-menu__item--rel' : ''} ${this.state.showSchoolSelector ? 'kt-menu__item--hover' : ''}`} aria-haspopup="true" style={{ padding: 0, margin: 0 }}>
                                <a href="javascript:;" onClick={e => { e.preventDefault(); e.stopPropagation(); this.setState({ showSchoolSelector: !this.state.showSchoolSelector, showManageData: false }); }} className={`kt-menu__link school-selector-btn ${availableSchools.length > 1 ? 'kt-menu__toggle' : ''}`} style={{ textDecoration: 'none', padding: 0, margin: 0, display: 'flex', alignItems: 'center' }}>
                                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', letterSpacing: '-0.5px', marginLeft: 0, paddingLeft: 0 }}>
                                        {selectedSchool?.name || 'Shule Plus'}
                                    </span>
                                    {availableSchools.length > 1 && <i className="la la-angle-down ml-3" style={{fontSize: '1.4rem', color: 'var(--text-primary)', transition: 'transform 0.3s ease', transform: this.state.showSchoolSelector ? 'rotate(180deg)' : 'none'}} />}
                                </a>
                                {availableSchools.length > 1 && this.state.showSchoolSelector && (
                                    <div className="kt-menu__submenu kt-menu__submenu--classic kt-menu__submenu--left" style={{ display: 'block', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', zIndex: 1200, marginTop: '10px', width: '500px', left: 0 }}>
                                        <ul className="kt-menu__subnav" style={{ padding: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            {availableSchools.map(schoolItem => (
                                                <li key={schoolItem.id} className="kt-menu__item" aria-haspopup="true" style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', backgroundColor: selectedSchool?.id === schoolItem.id ? 'var(--bg-tertiary)' : 'transparent' }}>
                                                    <a href="javascript:;" onClick={e => { e.preventDefault(); this.switchSchools(schoolItem); }} className="kt-menu__link" style={{ display: 'flex', alignItems: 'center', padding: '10px', transition: 'all 0.2s ease' }}>
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '6px', marginRight: '10px', backgroundColor: schoolItem.theme_color || 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                                                            {schoolItem.logo ? (
                                                                <img src={schoolItem.logo} alt={schoolItem.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }} />
                                                            ) : (
                                                                <i className="la la-school" style={{ color: '#fff', fontSize: '16px' }}></i>
                                                            )}
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.85rem', marginBottom: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {schoolItem.name}
                                                            </div>
                                                            <div style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>
                                                                {schoolItem.students?.length || schoolItem.studentCount || 0} Students
                                                            </div>
                                                        </div>
                                                        {selectedSchool?.id === schoolItem.id && (
                                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3966ff', marginLeft: '10px' }} />
                                                        )}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </li>
                        </ul>
                    </div>
                </div>

                {/* MANAGE DATA COG */}
                {!isTeacher && (
                    <div className="kt-header-menu-wrapper" style={{ zIndex: 1100 }} ref={this.manageDataRef}>
                        <div className="kt-header-menu">
                            <ul className="kt-menu__nav" style={{margin: 0, padding: 0}}>
                                <li className={`kt-menu__item kt-menu__item--submenu kt-menu__item--rel ${this.state.showManageData ? 'kt-menu__item--hover' : ''}`} aria-haspopup="true">
                                    <a href="javascript:;" onClick={e => { e.preventDefault(); e.stopPropagation(); this.setState({ showManageData: !this.state.showManageData, showSchoolSelector: false }); }} className="kt-menu__link manage-data-cog-btn" style={{ textDecoration: 'none', padding: '0 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="la la-cog" style={{ fontSize: '1.4rem', color: 'var(--text-primary)', transition: 'all 0.3s ease' }} />
                                        <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Manage Data</span>
                                        <i className={`la la-angle-down`} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', transition: 'transform 0.3s ease', transform: this.state.showManageData ? 'rotate(180deg)' : 'none' }} />
                                    </a>

                                    {this.state.showManageData && (
                                        <div className="kt-menu__submenu kt-menu__submenu--classic kt-menu__submenu--left" style={{ display: 'block', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', zIndex: 1200, marginTop: '10px', width: '500px' }}>
                                            <div style={{ padding: '10px 15px', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.85rem', letterSpacing: '-0.2px' }}>Manage Data</span>
                                                <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 700, opacity: 0.8 }}>{finalManageDataItems.length} MODULES</span>
                                            </div>
                                            <ul className="kt-menu__subnav" style={{ padding: '10px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                                                {finalManageDataItems.map((item, idx) => (
                                                    <li key={`${item.path}-${idx}`} className="kt-menu__item" aria-haspopup="true">
                                                        <Link to={item.path} onClick={() => this.setState({ showManageData: false })} className="kt-menu__link" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 5px', borderRadius: '10px', transition: 'all 0.2s ease', textAlign: 'center', width: '100%' }}>
                                                            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: `${selectedSchool?.theme_color || '#3966ff'}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', marginBottom: '6px' }} className="manage-data-icon-wrapper">
                                                                <item.IconComponent style={{ width: '24px', height: '24px', color: selectedSchool?.theme_color || 'var(--brand-color)' }} />
                                                            </div>
                                                            <span className="kt-menu__link-text" style={{ color: 'var(--text-primary)', fontWeight: '800', fontSize: '0.75rem', lineHeight: '1.2', display: 'block', maxWidth: '100%' }}>
                                                                {item.label}
                                                            </span>
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            <div id="kt_bottom_nav_menu_container" className="kt-header-menu-wrapper" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div id="kt_header_menu" className="kt-header-menu kt-header-menu-mobile">
                    <ul className="kt-menu__nav" style={{ display: 'flex', listStyle: 'none', margin: 0, padding: 0, alignItems: 'center' }}>
                        {this.getSecondaryNavItems().map((item) => {
                            if (item.hideFromTeacher && isTeacher) return null;
                            if (item.hidden) return null;
                            if (isRestricted && item.requiresSubscription) return null;
                            const isActive = this.isActiveRoute(item.path);
                            return (
                                <li key={item.path} className={`kt-menu__item ${isActive ? 'kt-menu__item--active' : ''}`} style={{ margin: 0, padding: '0 4px' }}>
                                    <Link to={item.path} className="kt-menu__link" style={{ textDecoration: 'none', padding: '8px 16px', borderRadius: '8px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', backgroundColor: isActive ? 'rgba(57, 102, 255, 0.1)' : 'transparent', border: isActive ? '1px solid rgba(57, 102, 255, 0.2)' : '1px solid transparent' }}>
                                        <i className={`la ${item.icon}`} style={{ fontSize: '1rem', color: isActive ? 'var(--brand-color)' : 'var(--text-secondary)', transition: 'color 0.3s ease' }} />
                                        <span className="kt-menu__link-text" style={{ ...bottomNavCommonLinkStyle, ...(isActive ? { color: 'var(--brand-color)', fontWeight: '600' } : { color: 'var(--text-primary)', fontWeight: '500' }), position: 'relative', paddingBottom: '2px', transition: 'all 0.3s ease', fontSize: '0.9rem' }}>
                                            {item.label}
                                            {isActive && (
                                                <span style={{ position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%)', width: '20px', height: '3px', backgroundColor: 'var(--brand-color)', borderRadius: '2px', boxShadow: '0 2px 4px rgba(57, 102, 255, 0.3)' }} />
                                            )}
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </div>
        
        {/* PROFILE PANEL (Offcanvas) - Compact Design */}
        <div id="kt_offcanvas_toolbar_profile" className="kt-offcanvas-panel" style={{ margin: '15px', maxHeight: '320px', marginTop: '110px', borderRadius: '10px', width: '280px' }}>
            <div className="kt-offcanvas-panel__head" style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-primary)' }}>
                <h3 className="kt-offcanvas-panel__title" style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>Profile</h3>
                <a href="!#" onClick={e => e.preventDefault()} className="kt-offcanvas-panel__close" id="kt_offcanvas_toolbar_profile_close" style={{ fontSize: '1.2rem' }}><i className="la la-times" /></a>
            </div>
            <div className="kt-offcanvas-panel__body" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                    <img alt="User avatar" src={storedUser?.avatar || `https://picsum.photos/40/40?random=${storedUser?.id || 1027}`} style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '12px' }} />
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>{this.state.userRole || storedUser.role || 'User'}</div>
                    </div>
                </div>
                
                {storedUser?.email && (
                    <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            <i className="la la-envelope" style={{ marginRight: '8px' }}></i>
                            {storedUser.email}
                        </div>
                    </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button className="btn btn-sm btn-bold compact-profile-btn" style={{ backgroundColor: 'var(--brand-color)', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 12px', fontSize: '0.85rem' }} type="button" onClick={() => this.props.history.push({ pathname: "/settings/user" })}>
                        <i className="la la-cog" style={{ marginRight: '6px' }}></i> Profile Settings
                    </button>
                    {this.state.pwaInstallAvailable && (
                        <button className="btn btn-sm btn-bold compact-profile-btn" style={{ backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 12px', fontSize: '0.85rem' }} type="button" onClick={this.handleInstallApp}>
                            <i className="la la-download" style={{ marginRight: '6px' }}></i> Install App
                        </button>
                    )}
                    <button className="btn btn-sm btn-bold compact-profile-btn" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: 'none', borderRadius: '6px', padding: '8px 12px', fontSize: '0.85rem' }} type="button" onClick={() => { localStorage.clear(); window.location.href = '/'; }}>
                        <i className="la la-sign-out" style={{ marginRight: '6px' }}></i> Log Out
                    </button>
                </div>
            </div>
        </div>
      </>
    );
  }
}

export default withRouter(Navbar);