import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

// Bugsnag Imports
import Bugsnag from '@bugsnag/js';
import BugsnagPluginReact from '@bugsnag/plugin-react';
import BugsnagPerformance from '@bugsnag/browser-performance';

// ========================================================================
// --- 1. Production-Ready Bugsnag Initialization ---
// Initialize Bugsnag and Performance monitoring once at the app's entry point.
// ========================================================================

Bugsnag.start({
  apiKey: '05fe04ebc304ae56dcdc160914d06c1c', // Your actual Bugsnag API key
  plugins: [new BugsnagPluginReact()],
  enabledBreadcrumbTypes: ['error', 'log', 'navigation', 'request', 'process', 'user', 'state'],
  onError: (event) => {
    // 1. Populate Authenticated User Details
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (user) {
        event.setUser(
          user.id || user.userId || "anonymous",
          user.email || "",
          user.fullName || user.name || user.username || ""
        );
        event.addMetadata("user", {
          id: user.id || user.userId,
          name: user.fullName || user.name || user.username,
          email: user.email,
          role: user.userType || user.role,
          phone: user.phone || user.phoneNumber,
          schoolId: user.schoolId || user.school,
          username: user.username,
          status: user.status
        });
      }
    } catch (err) {
      console.warn("Failed to parse user details for Bugsnag:", err);
    }

    // 2. Populate Selected School Details
    try {
      const schoolData = JSON.parse(localStorage.getItem("schoolData"));
      if (schoolData) {
        const {
          id,
          name, 
          theme_color,
          primaryColor,
          secondaryColor,
          supportEmail,
          logo,
          logoUrl
        } = schoolData;
        event.addMetadata("schoolData", {
          id,
          name,
          theme_color,
          primaryColor,
          secondaryColor,
          supportEmail,
          logo,
          logoUrl
        });
      }
    } catch (err) {
      console.warn("Failed to parse school metadata for Bugsnag:", err);
    }

    // 3. Add Rich Browser and Navigation Context
    try {
      event.addMetadata("browserContext", {
        href: window.location.href,
        pathname: window.location.pathname,
        hash: window.location.hash,
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        devicePixelRatio: window.devicePixelRatio,
        languages: navigator.languages,
        onlineStatus: navigator.onLine ? "online" : "offline"
      });
    } catch (err) {}
  }
});

// Start performance monitoring separately
BugsnagPerformance.start({ apiKey: '05fe04ebc304ae56dcdc160914d06c1c' }); // Your Bugsnag Performance API key

// Create a single, reusable ErrorBoundary component from the Bugsnag plugin.
// This is the standard, recommended approach.
const ErrorBoundary = Bugsnag.getPlugin('react').createErrorBoundary(React);


// ========================================================================
// --- 2. Professional Error Fallback UI ---
// This component is displayed to the user when a crash occurs. It's clean,
// user-friendly, and provides a clear action.
// In a real application, this would typically live in its own file,
// e.g., 'src/components/ErrorFallback.js'
// ========================================================================
const ErrorFallback = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'sans-serif',
    textAlign: 'center',
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
  }}>
    <div style={{
      backgroundColor: '#ffffff',
      padding: '40px 50px',
      borderRadius: '12px',
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
      maxWidth: '500px',
    }}>
      <p style={{ fontSize: '1rem', color: '#777', lineHeight: '1.6', marginBottom: '30px' }}>
        We apologize for the inconvenience. Our technical team has been automatically
        notified. Please refresh the page to continue.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          padding: '12px 30px',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          backgroundColor: '#007bff',
          color: 'white',
          fontSize: '1rem',
          fontWeight: 'bold',
          transition: 'background-color 0.2s ease-in-out',
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
      >
        Reload Page
      </button>
    </div>
  </div>
);


// ========================================================================
// --- 3. Development-Only Crashing Component ---
// A tool for testing the Error Boundary during development.
// It is crucial that this component is NOT included in production builds.
// In a real application, this might live in 'src/components/dev/CrashingComponent.js'
// ========================================================================
const CrashingComponent = () => {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('This is a test crash to verify the Error Boundary!');
  }

  return (
    <div style={{ position: 'fixed', bottom: '10px', right: '10px', zIndex: 9999 }}>
        <button
          onClick={() => setShouldThrow(true)}
          style={{
            padding: '10px 20px',
            fontSize: '1rem',
            cursor: 'pointer',
            border: '1px solid #d9534f',
            backgroundColor: '#fbeeee',
            color: '#d9534f',
            borderRadius: '5px',
          }}
        >
          Test Error Boundary
        </button>
    </div>
  );
};


// ========================================================================
// --- 4. Render the Application ---
// The entire app is wrapped in the ErrorBoundary.
// The CrashingComponent is only rendered if the environment is 'development'.
// ========================================================================
ReactDOM.render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <App />
      
      {/* This ensures the crash-testing button only appears during development */}
      {process.env?.NODE_ENV === 'development' && <CrashingComponent />}

    </ErrorBoundary>
  </React.StrictMode>,
  document.getElementById('root')
);


// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();