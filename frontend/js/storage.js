const StorageManager = {
    USERS_KEY: 'carelonrx_users',
    INITIATIVES_KEY: 'carelonrx_initiatives',
    CURRENT_USER_KEY: 'carelonrx_current_user',

    initializeData() {
        if (!localStorage.getItem(this.USERS_KEY)) {
            const defaultUsers = [
                { id: '1', username: 'admin', password: 'admin123', name: 'Administrator', role: 'admin' },
                { id: '2', username: 'user1', password: 'user123', name: 'John Doe', role: 'user' },
                { id: '3', username: 'user2', password: 'user123', name: 'Jane Smith', role: 'user' }
            ];
            localStorage.setItem(this.USERS_KEY, JSON.stringify(defaultUsers));
        }

        if (!localStorage.getItem(this.INITIATIVES_KEY)) {
            const defaultInitiatives = [
                {
                    id: this.generateId(),
                    name: 'Member Portal Enhancement',
                    description: 'Upgrade member portal with new features and improved UX',
                    year: '2026',
                    quarter: 'Q2',
                    deliveryDate: '2026-06-15',
                    budgetApproved: true,
                    priority: 'High',
                    owner: 'Sarah Johnson',
                    dependentSystems: [
                        { system: 'Member Portal', details: 'Core system upgrade' },
                        { system: 'Claims Processing System', details: 'API integration' }
                    ],
                    businessValue: 'Improve member satisfaction and reduce call center volume by 30%',
                    risks: 'Dependency on third-party API availability',
                    createdAt: new Date().toISOString(),
                    createdBy: 'admin'
                },
                {
                    id: this.generateId(),
                    name: 'Pharmacy Benefits Integration',
                    description: 'Integrate with new PBM system for real-time benefits verification',
                    year: '2026',
                    quarter: 'Q3',
                    deliveryDate: '2026-08-30',
                    budgetApproved: true,
                    priority: 'Critical',
                    owner: 'Michael Chen',
                    dependentSystems: [
                        { system: 'Pharmacy Benefits Manager (PBM)', details: 'Complete integration' },
                        { system: 'Third-Party Integration Hub', details: 'API gateway setup' }
                    ],
                    businessValue: 'Enable real-time prescription coverage verification, reducing claim rejections',
                    risks: 'PBM vendor timeline dependencies',
                    createdAt: new Date().toISOString(),
                    createdBy: 'admin'
                },
                {
                    id: this.generateId(),
                    name: 'Mobile App Redesign',
                    description: 'Complete redesign of mobile application with modern UI/UX',
                    year: '2026',
                    quarter: 'Q4',
                    deliveryDate: null,
                    budgetApproved: false,
                    priority: 'Medium',
                    owner: 'Emily Rodriguez',
                    dependentSystems: [
                        { system: 'Mobile Application', details: 'Full rebuild' },
                        { system: 'Data Analytics Platform', details: 'Analytics integration' }
                    ],
                    businessValue: 'Increase mobile engagement by 50% and improve app store ratings',
                    risks: 'Resource availability and design approval timeline',
                    createdAt: new Date().toISOString(),
                    createdBy: 'admin'
                }
            ];
            localStorage.setItem(this.INITIATIVES_KEY, JSON.stringify(defaultInitiatives));
        }
    },

    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    login(username, password) {
        const users = JSON.parse(localStorage.getItem(this.USERS_KEY) || '[]');
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            const userSession = {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role
            };
            localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(userSession));
            return { success: true, user: userSession };
        }
        
        return { success: false, message: 'Invalid username or password' };
    },

    logout() {
        localStorage.removeItem(this.CURRENT_USER_KEY);
    },

    getCurrentUser() {
        const userStr = localStorage.getItem(this.CURRENT_USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    },

    getInitiatives() {
        return JSON.parse(localStorage.getItem(this.INITIATIVES_KEY) || '[]');
    },

    getInitiative(id) {
        const initiatives = this.getInitiatives();
        return initiatives.find(i => i.id === id);
    },

    addInitiative(initiative) {
        const initiatives = this.getInitiatives();
        const currentUser = this.getCurrentUser();
        
        const newInitiative = {
            id: this.generateId(),
            ...initiative,
            createdAt: new Date().toISOString(),
            createdBy: currentUser ? currentUser.username : 'unknown',
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser ? currentUser.username : 'unknown'
        };
        
        initiatives.push(newInitiative);
        localStorage.setItem(this.INITIATIVES_KEY, JSON.stringify(initiatives));
        
        return { success: true, initiative: newInitiative };
    },

    updateInitiative(id, updates) {
        const initiatives = this.getInitiatives();
        const index = initiatives.findIndex(i => i.id === id);
        
        if (index === -1) {
            return { success: false, message: 'Initiative not found' };
        }
        
        const currentUser = this.getCurrentUser();
        initiatives[index] = {
            ...initiatives[index],
            ...updates,
            id: initiatives[index].id,
            createdAt: initiatives[index].createdAt,
            createdBy: initiatives[index].createdBy,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser ? currentUser.username : 'unknown'
        };
        
        localStorage.setItem(this.INITIATIVES_KEY, JSON.stringify(initiatives));
        
        return { success: true, initiative: initiatives[index] };
    },

    deleteInitiative(id) {
        const initiatives = this.getInitiatives();
        const filtered = initiatives.filter(i => i.id !== id);
        
        if (filtered.length === initiatives.length) {
            return { success: false, message: 'Initiative not found' };
        }
        
        localStorage.setItem(this.INITIATIVES_KEY, JSON.stringify(filtered));
        return { success: true };
    },

    getStats() {
        const initiatives = this.getInitiatives();
        const stats = {
            total: initiatives.length,
            byYear: {},
            byQuarter: {},
            byPriority: {},
            budgetApproved: initiatives.filter(i => i.budgetApproved).length,
            budgetPending: initiatives.filter(i => !i.budgetApproved).length
        };
        
        initiatives.forEach(initiative => {
            stats.byYear[initiative.year] = (stats.byYear[initiative.year] || 0) + 1;
            stats.byQuarter[initiative.quarter] = (stats.byQuarter[initiative.quarter] || 0) + 1;
            stats.byPriority[initiative.priority] = (stats.byPriority[initiative.priority] || 0) + 1;
        });
        
        return stats;
    }
};

StorageManager.initializeData();
