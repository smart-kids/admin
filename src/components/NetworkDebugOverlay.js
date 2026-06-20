import React, { useState, useEffect } from 'react';

const NetworkDebugOverlay = () => {
    const [debug, setDebug] = useState({
        action: 'Idle',
        socketConnected: false,
        pingMs: 0
    });

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

    // Only render if we aren't idle or if socket is disconnected (for awareness)
    if (debug.action === 'Idle' && debug.socketConnected) {
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
            fontSize: '11px',
            padding: '0 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            opacity: 0.9
        }}>
            <span>{debug.socketConnected ? '⚡' : '❌'}</span>
            <span>{debug.pingMs}ms</span>
            <span style={{opacity: 0.5}}>|</span>
            <span style={{ color: '#00ccff' }}>{debug.action}</span>
            {navigator.connection && (
                <>
                    <span style={{opacity: 0.5}}>|</span>
                    <span style={{ color: '#ffcc00' }}>{navigator.connection.downlink}Mb/s</span>
                </>
            )}
        </div>
    );
};

export default NetworkDebugOverlay;
