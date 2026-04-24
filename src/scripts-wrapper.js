// Wrapper for scripts.bundle.js to handle CommonJS exports
import './scripts.bundle.js';

// The scripts.bundle.js file attaches its exports to the window object
// We need to create a proper ES module export for the app object
const app = window.app || window.KTApp;

export default app;
