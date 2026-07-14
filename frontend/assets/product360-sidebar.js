/**
 * Product 360 Side Panel Component
 * Reusable sidebar for all pages
 */

(function() {
    // Check if user is authenticated
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.username) {
        return; // Don't show sidebar if not logged in
    }

    // Create and inject the side panel HTML
    const sidebarHTML = `
        <!-- Left Side Panel -->
        <div id="sidePanel" class="side-panel">
            <div class="side-panel-header">
                <h2 class="text-white font-bold text-xl leading-tight mb-2">Product 360</h2>
                <p class="text-white text-opacity-70 text-sm">Integrated Product Suite</p>
            </div>
            <nav class="mt-6">
                <a href="dashboard.html" class="side-panel-link" data-module="roadmap">
                    <i data-lucide="map" class="w-5 h-5"></i>
                    <span>Roadmap</span>
                </a>
                <a href="story-estimations.html" class="side-panel-link" data-module="story-estimations">
                    <i data-lucide="calculator" class="w-5 h-5"></i>
                    <span>Story Estimations</span>
                </a>
                <a href="capacity-planning.html" class="side-panel-link" data-module="capacity-planning">
                    <i data-lucide="users-2" class="w-5 h-5"></i>
                    <span>Capacity Planning</span>
                </a>
                <div class="mt-6 pt-6 border-t border-white border-opacity-20">
                    <a href="user-guide.html" class="side-panel-link" data-module="user-guide">
                        <i data-lucide="book-open" class="w-5 h-5"></i>
                        <span>User Guide</span>
                    </a>
                </div>
            </nav>
            
            <div class="absolute bottom-0 left-0 right-0 p-6 border-t border-white border-opacity-20">
                <div class="text-white text-opacity-60 text-xs">
                    <p class="font-semibold mb-1">Version 2.3</p>
                    <p>© 2026 Product 360</p>
                </div>
            </div>
        </div>

        <!-- Toggle Button -->
        <button id="sidePanelToggle" class="side-panel-toggle" onclick="toggleSidePanel()">
            <i data-lucide="chevron-left" class="w-5 h-5"></i>
        </button>

        <!-- Coming Soon Modal -->
        <div id="comingSoonModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-8 text-center">
                <div class="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="clock" class="w-10 h-10 text-yellow-600"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">Coming Soon</h2>
                <p class="text-gray-600 mb-6">Story Estimations module is under development and will be available soon.</p>
                <button onclick="closeComingSoonModal()" class="btn-carelon-primary text-white px-6 py-2 rounded-lg">
                    Got it
                </button>
            </div>
        </div>
    `;

    // Inject CSS FIRST before any DOM manipulation to prevent layout flash
    if (!document.getElementById('product360-styles')) {
        const styles = document.createElement('style');
        styles.id = 'product360-styles';
        styles.textContent = `
            /* Side Panel Styles */
            .side-panel {
                position: fixed;
                left: 0;
                top: 0;
                bottom: 0;
                width: 280px;
                background: linear-gradient(180deg, #5009B5 0%, #3d0891 100%);
                box-shadow: 2px 0 10px rgba(0,0,0,0.1);
                z-index: 100;
                padding-top: 20px;
                transition: transform 0.3s ease;
            }
            .side-panel-header {
                padding: 20px 24px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            }
            .side-panel-link {
                display: flex;
                align-items: center;
                padding: 16px 24px;
                color: rgba(255, 255, 255, 0.8);
                text-decoration: none;
                transition: all 0.3s;
                border-left: 4px solid transparent;
                font-weight: 500;
                cursor: pointer;
            }
            .side-panel-link:hover {
                background-color: rgba(255, 255, 255, 0.1);
                color: white;
                border-left-color: #fbbf24;
            }
            .side-panel-link.active {
                background-color: rgba(255, 255, 255, 0.15);
                color: white;
                border-left-color: #fbbf24;
            }
            .side-panel-link.disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            .side-panel-link.disabled:hover {
                background-color: transparent;
                border-left-color: transparent;
            }
            .side-panel-link i {
                margin-right: 12px;
                width: 20px;
                height: 20px;
            }
            .coming-soon-badge {
                display: inline-block;
                background: rgba(251, 191, 36, 0.2);
                color: #fbbf24;
                font-size: 10px;
                padding: 2px 8px;
                border-radius: 12px;
                margin-left: 8px;
                font-weight: 600;
            }
            .main-content-with-sidebar {
                margin-left: 280px;
                transition: margin-left 0.3s ease;
                min-height: 100vh;
            }
            .side-panel-toggle {
                position: fixed;
                left: 280px;
                top: 90px;
                background: #5009B5;
                color: white;
                border: none;
                border-radius: 0 8px 8px 0;
                padding: 12px 8px;
                cursor: pointer;
                z-index: 101;
                transition: left 0.3s ease;
                box-shadow: 2px 2px 8px rgba(0,0,0,0.2);
            }
            .side-panel-toggle:hover {
                background: #3d0891;
            }
            .side-panel.collapsed {
                transform: translateX(-280px);
            }
            .side-panel.collapsed + .side-panel-toggle {
                left: 0;
            }
            body.has-sidebar .side-panel.collapsed ~ .main-content-with-sidebar {
                margin-left: 0;
            }
            @media (max-width: 768px) {
                .side-panel {
                    transform: translateX(-280px);
                }
                .side-panel-toggle {
                    left: 0;
                }
                .main-content-with-sidebar {
                    margin-left: 0;
                }
                .side-panel.mobile-open {
                    transform: translateX(0);
                }
                .side-panel.mobile-open + .side-panel-toggle {
                    left: 280px;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    // Add main-content-with-sidebar class to body
    document.body.classList.add('has-sidebar');

    // Wrap all existing body children in a main-content div (preserves event listeners)
    const mainWrapper = document.createElement('div');
    mainWrapper.className = 'main-content-with-sidebar';
    while (document.body.firstChild) {
        mainWrapper.appendChild(document.body.firstChild);
    }
    // Inject sidebar HTML first, then append content wrapper
    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
    document.body.appendChild(mainWrapper);

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Set active link based on current page
    setActiveLink();

    // Enforce role-module visibility
    applyRoleModuleVisibility();
})();

// Toggle sidebar function
function toggleSidePanel() {
    const sidePanel = document.getElementById('sidePanel');
    const toggleBtn = document.getElementById('sidePanelToggle');
    const toggleIcon = toggleBtn.querySelector('i');
    
    sidePanel.classList.toggle('collapsed');
    
    if (sidePanel.classList.contains('collapsed')) {
        toggleIcon.setAttribute('data-lucide', 'chevron-right');
    } else {
        toggleIcon.setAttribute('data-lucide', 'chevron-left');
    }
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Show coming soon modal
function showComingSoon(event) {
    event.preventDefault();
    const modal = document.getElementById('comingSoonModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Close coming soon modal
function closeComingSoonModal() {
    const modal = document.getElementById('comingSoonModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// Set active link based on current page
function setActiveLink() {
    const currentPage = window.location.pathname.split('/').pop();
    const links = document.querySelectorAll('.side-panel-link[data-module]');
    
    links.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        const module = link.getAttribute('data-module');
        
        // Check if current page matches the link
        if (href && currentPage === href) {
            link.classList.add('active');
        }
        // Default to dashboard for empty/root path
        else if (currentPage === '' && href === 'dashboard.html') {
            link.classList.add('active');
        }
        // Handle story-estimations page
        else if (currentPage === 'story-estimations.html' && module === 'story-estimations') {
            link.classList.add('active');
        }
        // Handle capacity-planning page
        else if (currentPage === 'capacity-planning.html' && module === 'capacity-planning') {
            link.classList.add('active');
        }
        // Handle user-guide page
        else if (currentPage === 'user-guide.html' && module === 'user-guide') {
            link.classList.add('active');
        }
        // Handle all roadmap module pages (dashboard, analytics, admin, etc.)
        else if (module === 'roadmap' && (
            currentPage.includes('dashboard') || 
            currentPage.includes('analytics') || 
            currentPage.includes('admin') || 
            currentPage.includes('roadmap') || 
            currentPage.includes('intake') || 
            currentPage.includes('profile')
        )) {
            link.classList.add('active');
        }
    });
}

// Close modal on outside click
document.addEventListener('click', function(e) {
    const modal = document.getElementById('comingSoonModal');
    if (modal && e.target === modal) {
        closeComingSoonModal();
    }
});

// data-module attr -> DB key mapping
const MODULE_KEY_MAP = {
    'roadmap':          'roadmap',
    'story-estimations': 'storyEstimations',
    'capacity-planning': 'capacityPlanning'
};

// page filename -> data-module
const PAGE_MODULE_MAP = {
    'story-estimations.html': 'story-estimations',
    'capacity-planning.html': 'capacity-planning'
};

async function applyRoleModuleVisibility() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    if (!user.role || !token) return;

    let mappings = [];
    try {
        const API_BASE = 'https://carelonrx-roadmap.onrender.com';
        const res = await fetch(`${API_BASE}/api/role-module-mappings`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) mappings = data.mappings;
    } catch (e) {
        return; // fail open — show everything if API is down
    }

    // Match role: try exact, then snake_case->display name conversion
    const toDisplay = r => r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const roleMap = mappings.find(m =>
        m.role === user.role ||
        m.role === toDisplay(user.role) ||
        m.role.toLowerCase().replace(/\s+/g, '_') === user.role
    );
    if (!roleMap) return; // role not configured — show everything

    const currentPage = window.location.pathname.split('/').pop();

    document.querySelectorAll('.side-panel-link[data-module]').forEach(link => {
        const attr = link.getAttribute('data-module');
        const dbKey = MODULE_KEY_MAP[attr];
        if (!dbKey) return; // user-guide etc — always show
        const allowed = roleMap.modules[dbKey];
        if (!allowed) {
            link.style.display = 'none';
            // If user is currently on this restricted page, redirect to dashboard
            const linkedPage = PAGE_MODULE_MAP[currentPage];
            if (linkedPage === attr) {
                window.location.href = 'dashboard.html';
            }
        }
    });
}
