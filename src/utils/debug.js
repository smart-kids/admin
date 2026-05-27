const isDev = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    (process.env.NODE_ENV !== 'production' && !window.location.hostname.includes('shuleplus.co.ke'))
);

/**
 * Lightweight debug logger module.
 * Logs only in development/local environments and is completely silent in production.
 * 
 * Usage:
 *   import debug from '../../utils/debug';
 *   const log = debug('shuleplus:data');
 *   log('Data loaded', payload);
 */
export default function debug(namespace) {
    return (...args) => {
        if (isDev) {
            console.log(`[${namespace}]`, ...args);
        }
    };
}
