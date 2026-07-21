/**
 * API Base URL Configuration
 * Auto-detects environment:
 *   - localhost / 127.0.0.1  → local dev backend on port 5000
 *   - 10.x.x.x / 192.168.x  → internal server backend on port 5000 (can reach corporate JIRA)
 *   - everything else        → Render production backend
 */
(function() {
    const host = window.location.hostname;
    let base;
    if (host === 'localhost' || host === '127.0.0.1') {
        base = 'http://localhost:5000';
    } else if (/^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)) {
        base = 'http://' + host + ':5000';
    } else {
        base = '';
    }
    window.PRODUCT360_API_BASE = base;
})();
