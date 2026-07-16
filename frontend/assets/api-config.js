/**
 * API Base URL Configuration
 * Auto-detects environment:
 *   - localhost / 127.0.0.1  → local dev backend on port 5000
 *   - everything else        → Render production backend (handles MongoDB Atlas)
 */
(function() {
    const host = window.location.hostname;
    let base;
    if (host === 'localhost' || host === '127.0.0.1') {
        base = 'http://localhost:5000';
    } else {
        base = 'https://carelonrx-roadmap.onrender.com';
    }
    window.PRODUCT360_API_BASE = base;
})();
