import React, { useState, useEffect } from 'react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [showSafariGuide, setShowSafariGuide] = useState(false);

  useEffect(() => {
    // Detect Safari on Mac/iOS (no beforeinstallprompt support)
    const ua = navigator.userAgent;
    const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(ua);
    setIsSafari(isSafariBrowser);

    // If already installed as standalone, don't show
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Also expose on window so navbar button can trigger it
      window.deferredInstallPrompt = e;
      // Dispatch event so navbar can react
      window.dispatchEvent(new Event('pwa_prompt_ready'));
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setIsVisible(false);
      setDeferredPrompt(null);
      window.deferredInstallPrompt = null;
      window.dispatchEvent(new Event('pwa_prompt_ready'));
    });

    // For Safari: show the prompt after a short delay if not installed
    if (isSafariBrowser) {
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isSafari) {
      setShowSafariGuide(true);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    setDeferredPrompt(null);
    window.deferredInstallPrompt = null;
    window.dispatchEvent(new Event('pwa_prompt_ready'));
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '30px',
      right: '24px',
      backgroundColor: '#ffffff',
      padding: '20px',
      borderRadius: '16px',
      boxShadow: '0 16px 50px rgba(0, 0, 0, 0.18)',
      zIndex: 9999,
      maxWidth: '340px',
      width: 'calc(100vw - 48px)',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      border: '1px solid #ebeef2',
      animation: 'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h5 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="la la-cloud-download-alt" style={{ fontSize: '20px', color: '#007bff' }}></i>
          Install ShulePlus Admin
        </h5>
        <button
          onClick={handleClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', color: '#a0a5b1', padding: '0 0 4px 10px', lineHeight: 1 }}
        >
          &times;
        </button>
      </div>

      {showSafariGuide ? (
        <div style={{ fontSize: '13px', color: '#333', lineHeight: '1.7' }}>
          <strong>To install on Safari:</strong>
          <ol style={{ margin: '8px 0 0 0', paddingLeft: '18px' }}>
            <li>Tap the <strong>Share</strong> button <span style={{ fontSize: '16px' }}>⎋</span> at the bottom of your browser</li>
            <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
            <li>Tap <strong>"Add"</strong> to confirm</li>
          </ol>
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: '13px', color: '#6e7687', lineHeight: '1.5' }}>
          {isSafari
            ? 'Add ShulePlus to your Home Screen for quick access and a full-screen experience.'
            : 'Install the admin dashboard as a standalone app for a faster, full-screen experience and quick access from your taskbar or dock.'}
        </p>
      )}

      <button
        onClick={handleInstallClick}
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, #007bff, #0056b3)',
          color: 'white',
          border: 'none',
          padding: '12px',
          borderRadius: '10px',
          fontWeight: '600',
          cursor: 'pointer',
          fontSize: '14px',
          transition: 'all 0.2s',
          boxShadow: '0 4px 14px rgba(0, 123, 255, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        <i className="la la-download"></i>
        {isSafari ? (showSafariGuide ? 'Got it!' : 'How to Install') : 'Install Now'}
      </button>
    </div>
  );
};

export default PWAInstallPrompt;
