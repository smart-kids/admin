import React, { useState, useEffect } from 'react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If the app is already installed, this event won't fire in Chrome.
    // However, we can also listen to appinstalled to hide the UI.
    window.addEventListener('appinstalled', () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      backgroundColor: '#ffffff',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
      zIndex: 9999,
      maxWidth: '320px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      border: '1px solid #ebeef2'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h5 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#1a1a1a', display: 'flex', alignItems: 'center' }}>
          <i className="la la-cloud-download-alt text-primary" style={{ fontSize: '20px', marginRight: '8px' }}></i> 
          Install ShulePlus Admin
        </h5>
        <button 
          onClick={handleClose} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', color: '#a0a5b1', padding: '0 0 4px 10px', display: 'flex' }}
        >
          &times;
        </button>
      </div>
      
      <p style={{ margin: 0, fontSize: '13px', color: '#6e7687', lineHeight: '1.5' }}>
        Install the admin dashboard as a standalone app for a faster, full-screen experience and quick access from your dock or home screen.
      </p>
      
      <button 
        onClick={handleInstallClick}
        style={{
          marginTop: '6px',
          width: '100%',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          padding: '12px',
          borderRadius: '8px',
          fontWeight: '600',
          cursor: 'pointer',
          fontSize: '14px',
          transition: 'background-color 0.2s',
          boxShadow: '0 4px 12px rgba(0, 123, 255, 0.2)'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
      >
        Install Now
      </button>
    </div>
  );
};

export default PWAInstallPrompt;
