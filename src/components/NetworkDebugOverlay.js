import React, { useState, useEffect } from 'react';

const isSuperAdmin = () => {
    try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        return userData.userType === 'super_admin' || 
               userData.userType === 'superadmin' || 
               userData.userType === 'Super Admin' ||
               userData.isSuperAdmin ||
               userData.role === 'super_admin';
    } catch (e) {
        return false;
    }
};

const NetworkDebugOverlay = () => {
    const [debug, setDebug] = useState({
        requests: [],
        socketConnected: false,
        pingMs: 0
    });
    
    const [superAdmin, setSuperAdmin] = useState(false);

    useEffect(() => {
        setSuperAdmin(isSuperAdmin());

        const handleUpdate = () => {
            if (window.__debugState) {
                setDebug({ ...window.__debugState });
            }
        };
        window.addEventListener('debug_update', handleUpdate);
        
        // Initial state
        handleUpdate();
        
        return () => window.removeEventListener('debug_update', handleUpdate);
    }, []);

    const activeRequests = debug.requests || [];
    
    // Only render if we aren't idle or if socket is disconnected (for awareness)
    if (activeRequests.length === 0 && debug.socketConnected) {
        return (
            <div style={{
                color: '#888',
                fontFamily: 'monospace',
                fontSize: '10px',
                padding: '0 8px',
                opacity: 0.6,
                display: 'inline-block'
            }}>
                IDLE [{debug.pingMs}ms]
            </div>
        );
    }

    return (
        <div style={{
            color: '#aaa',
            fontFamily: 'monospace',
            fontSize: '10px',
            padding: '0 5px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            opacity: 0.9,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '180px'
        }}>
            <span>{debug.socketConnected ? '⚡' : '❌'}</span>
            <span>{debug.pingMs}ms</span>
            {activeRequests.length > 0 && (
                <>
                    <span style={{opacity: 0.5}}>|</span>
                    <span style={{ color: '#00ccff', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {superAdmin ? activeRequests.map(r => r.action).join(', ') : 'Fetching...'}
                    </span>
                </>
            )}
        </div>
    );
};

export default NetworkDebugOverlay;
