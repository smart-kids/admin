import React, { useState, useEffect } from 'react';

// Removed super admin restriction since we want everyone to see the requests

const NetworkDebugOverlay = () => {
    const [debug, setDebug] = useState({
        requests: [],
        socketConnected: false,
        pingMs: 0
    });
    
    const [speedMbps, setSpeedMbps] = useState(null);

    useEffect(() => {
        const updateSpeed = () => {
            if (navigator.connection && navigator.connection.downlink) {
                setSpeedMbps(navigator.connection.downlink);
            }
        };
        updateSpeed();
        
        if (navigator.connection) {
            navigator.connection.addEventListener('change', updateSpeed);
            return () => navigator.connection.removeEventListener('change', updateSpeed);
        }
    }, []);

    useEffect(() => {

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
                IDLE [{debug.pingMs}ms] {speedMbps ? `| ${speedMbps}Mbps` : ''}
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
                        {activeRequests.map(r => r.action).join(', ')}
                    </span>
                </>
            )}
            {speedMbps && (
                <>
                    <span style={{opacity: 0.5}}>|</span>
                    <span style={{ color: '#00ffcc' }}>{speedMbps}Mbps</span>
                </>
            )}
        </div>
    );
};

export default NetworkDebugOverlay;
