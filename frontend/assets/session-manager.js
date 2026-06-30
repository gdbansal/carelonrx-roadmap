// Session Management with Auto-Logout
// Timeout: 30 minutes of inactivity
// Browser/Tab Close: Requires reauthentication

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const WARNING_TIME = 5 * 60 * 1000; // Show warning 5 minutes before timeout
let sessionTimer = null;
let warningTimer = null;
let warningShown = false;

// Initialize session management
function initSessionManagement() {
    // Check if token exists in sessionStorage (cleared on browser/tab close)
    const token = sessionStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // If user exists but no session token, require reauthentication
    if (user.username && !token) {
        localStorage.setItem('sessionClosed', 'true');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
        return;
    }
    
    if (!user.username) {
        return; // Not logged in, no need to manage session
    }

    // Reset timers on user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
        document.addEventListener(event, resetSessionTimer, true);
    });

    // Start the session timer
    resetSessionTimer();
}

// Reset the session timer
function resetSessionTimer() {
    // Clear existing timers
    if (sessionTimer) clearTimeout(sessionTimer);
    if (warningTimer) clearTimeout(warningTimer);
    
    // Hide warning if shown
    if (warningShown) {
        hideSessionWarning();
    }

    // Set warning timer (5 minutes before logout)
    warningTimer = setTimeout(() => {
        showSessionWarning();
    }, SESSION_TIMEOUT - WARNING_TIME);

    // Set logout timer (30 minutes)
    sessionTimer = setTimeout(() => {
        handleSessionTimeout();
    }, SESSION_TIMEOUT);
}

// Show session timeout warning
function showSessionWarning() {
    warningShown = true;
    
    // Create warning modal if it doesn't exist
    let modal = document.getElementById('sessionWarningModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'sessionWarningModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
                <div class="flex items-center space-x-3 mb-4">
                    <div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                        <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 class="text-lg font-bold text-gray-800">Session Expiring Soon</h3>
                        <p class="text-sm text-gray-600">Your session will expire in 5 minutes</p>
                    </div>
                </div>
                <p class="text-gray-700 mb-6">
                    You will be automatically logged out due to inactivity. Click "Stay Logged In" to continue your session.
                </p>
                <div class="flex space-x-3">
                    <button onclick="extendSession()" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold">
                        Stay Logged In
                    </button>
                    <button onclick="logoutNow()" class="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition font-semibold">
                        Logout Now
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        modal.classList.remove('hidden');
    }
}

// Hide session warning
function hideSessionWarning() {
    warningShown = false;
    const modal = document.getElementById('sessionWarningModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Extend session (user clicked "Stay Logged In")
function extendSession() {
    hideSessionWarning();
    resetSessionTimer();
}

// Logout immediately
function logoutNow() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    window.location.href = 'login.html';
}

// Handle session timeout
function handleSessionTimeout() {
    // Show timeout message
    localStorage.setItem('sessionExpired', 'true');
    
    // Clear user data
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    
    // Redirect to login
    window.location.href = 'login.html';
}

// Check if session expired and show message on login page
function checkSessionExpired() {
    if (localStorage.getItem('sessionExpired') === 'true') {
        localStorage.removeItem('sessionExpired');
        return true;
    }
    return false;
}

// Check if session was closed (browser/tab closed)
function checkSessionClosed() {
    if (localStorage.getItem('sessionClosed') === 'true') {
        localStorage.removeItem('sessionClosed');
        return true;
    }
    return false;
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSessionManagement);
} else {
    initSessionManagement();
}
