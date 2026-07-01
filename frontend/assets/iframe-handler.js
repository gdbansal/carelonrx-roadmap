/**
 * Product 360 Iframe Handler
 * Automatically adjusts navigation when pages are loaded inside Product 360 iframe
 */

(function() {
    // Check if page is loaded in an iframe
    if (window.self !== window.top) {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', adjustNavigationInIframe);
        } else {
            adjustNavigationInIframe();
        }
    }

    function adjustNavigationInIframe() {
        // Find the navigation bar
        const nav = document.querySelector('nav');
        if (nav) {
            // Hide only the logo and title section, keep the navigation buttons
            const logoSection = nav.querySelector('.flex.items-center.space-x-4:first-child');
            if (logoSection) {
                logoSection.style.display = 'none';
            }

            // Adjust navigation bar styling
            nav.style.paddingLeft = '20px';
            nav.style.paddingRight = '20px';
        }

        // Adjust body padding if needed
        const body = document.body;
        if (body) {
            body.style.paddingTop = '0';
        }
    }
})();
