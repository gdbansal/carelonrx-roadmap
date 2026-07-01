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
            // Hide only the logo image, keep the title text
            const logoImg = nav.querySelector('img[alt*="Logo"]');
            if (logoImg) {
                logoImg.style.display = 'none';
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
