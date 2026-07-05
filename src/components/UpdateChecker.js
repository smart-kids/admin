import React, { useState, useEffect } from 'react';
import buildMeta from '../build-meta.json';

const UPDATE_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const DISMISS_DURATION = 60 * 60 * 1000; // 1 hour

const UpdateChecker = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Check for updates
    const checkForUpdate = async () => {
      try {
        // If dismissed recently, skip check
        const dismissedUntil = localStorage.getItem('update_dismissed_until');
        if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
          return;
        }

        const res = await fetch(`/meta.json?t=${Date.now()}`);
        if (!res.ok) return;
        
        const remoteMeta = await res.json();
        
        // Compare timestamps
        if (remoteMeta.timestamp && buildMeta.timestamp && remoteMeta.timestamp > buildMeta.timestamp) {
          setUpdateAvailable(true);
        }
      } catch (err) {
        console.error('Failed to check for updates', err);
      }
    };

    // Initial check after 5 seconds to not block main thread loading
    setTimeout(checkForUpdate, 5000);

    // Periodic check
    const interval = setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const handleUpdate = () => {
    // Clear caches if supported
    if (window.caches) {
      caches.keys().then(names => {
        for (let name of names) {
          caches.delete(name);
        }
      });
    }
    // Force reload bypassing cache
    window.location.reload(true);
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
    localStorage.setItem('update_dismissed_until', (Date.now() + DISMISS_DURATION).toString());
  };

  if (!updateAvailable) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 99999,
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
      padding: '20px',
      maxWidth: '320px',
      borderLeft: '5px solid #1cac81',
      fontFamily: '"Inter", sans-serif'
    }}>
      <h6 style={{ margin: 0, fontWeight: 'bold', fontSize: '15px', color: '#333' }}>
        <i className="la la-cloud-download-alt text-primary mr-2" style={{ fontSize: '18px' }}></i>
        Update Available!
      </h6>
      <p style={{ margin: '10px 0 15px', fontSize: '13px', color: '#666', lineHeight: '1.4' }}>
        A new version of ShulePlus is available. Update now to get the latest features and bug fixes.
      </p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button 
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#888',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            padding: '6px 12px',
            borderRadius: '6px'
          }}
        >
          Later
        </button>
        <button 
          onClick={handleUpdate}
          style={{
            background: '#1cac81',
            border: 'none',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            padding: '6px 16px',
            borderRadius: '6px',
            boxShadow: '0 4px 10px rgba(28,172,129,0.3)'
          }}
        >
          Update Now
        </button>
      </div>
    </div>
  );
};

export default UpdateChecker;
