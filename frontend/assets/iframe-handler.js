/**
 * Product 360 Iframe Handler
 * Automatically hides navigation when pages are loaded inside Product 360 iframe
 */

(function() {
    // Check if page is loaded in an iframe
    if (window.self !== window.top) {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', hideNavigationInIframe);
        } else {
            hideNavigationInIframe();
        }
    }

    function hideNavigationInIframe() {
        // Hide the main navigation bar
        const nav = document.querySelector('nav');
        if (nav) {
            nav.style.display = 'none';
        }

        // Adjust body padding if needed
        const body = document.body;
        if (body) {
            body.style.paddingTop = '0';
        }

        // Adjust container padding
        const container = document.querySelector('.container');
        if (container) {
            container.style.paddingTop = '20px';
        }
    }
})();
