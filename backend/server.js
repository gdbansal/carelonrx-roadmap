const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration for production
const corsOptions = {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

let users = [
    { id: '1', username: 'admin', password: 'admin123', name: 'Administrator', email: 'admin@carelonrx.com', role: 'admin' },
    { id: '2', username: 'user1', password: 'user123', name: 'John Doe', email: 'john.doe@carelonrx.com', role: 'user' },
    { id: '3', username: 'user2', password: 'user123', name: 'Jane Smith', email: 'jane.smith@carelonrx.com', role: 'user' }
];

let initiatives = [
    {
        id: uuidv4(),
        name: 'NY Mandate',
        description: 'New York state mandate implementation',
        program: 'AHD',
        year: '2026',
        quarter: 'Q1',
        startDate: '2026-03-01',
        deliveryDate: '2026-04-30',
        budgetApproved: true,
        priority: 'Critical',
        wsjf: 85.50,
        owner: 'AHD Team',
        dependentSystems: [
            { system: 'Intel Engine', pmSpoc: 'John Smith', jiraUrl: 'https://jira.carelonrx.com/browse/AHD-001' }
        ],
        businessValue: 'Compliance with NY state regulations',
        risks: 'Regulatory deadline',
        createdAt: new Date().toISOString(),
        createdBy: 'admin'
    },
    {
        id: uuidv4(),
        name: 'ORx DP Migration MVP',
        description: 'ORx Data Platform Migration - Minimum Viable Product',
        program: 'AHD',
        year: '2026',
        quarter: 'Q1',
        startDate: '2026-03-15',
        deliveryDate: '2026-04-30',
        budgetApproved: true,
        priority: 'High',
        wsjf: 72.25,
        owner: 'AHD Team',
        dependentSystems: [
            { system: 'Enterprise Rx', pmSpoc: 'Sarah Johnson', jiraUrl: 'https://jira.carelonrx.com/browse/AHD-002' },
            { system: 'CPDL', pmSpoc: 'Mike Chen', jiraUrl: 'https://jira.carelonrx.com/browse/AHD-003' },
            { system: 'Enterprise Rx', pmSpoc: 'Tom Wilson', jiraUrl: 'https://jira.carelonrx.com/browse/AHD-020' }
        ],
        businessValue: 'Foundation for ORx data platform migration',
        risks: 'Technical complexity',
        createdAt: new Date().toISOString(),
        createdBy: 'admin'
    },
    {
        id: uuidv4(),
        name: 'IVR Quick Pay',
        description: 'Interactive Voice Response Quick Payment feature',
        program: 'AHD',
        year: '2026',
        quarter: 'Q1',
        startDate: '2026-03-01',
        deliveryDate: '2026-04-30',
        budgetApproved: true,
        priority: 'Medium',
        wsjf: 45.75,
        owner: 'AHD Team',
        dependentSystems: [
            { system: 'Payment Hub', pmSpoc: 'Emily Davis', jiraUrl: 'https://jira.carelonrx.com/browse/AHD-004' },
            { system: 'Self Service Portal', pmSpoc: 'Robert Brown', jiraUrl: 'https://jira.carelonrx.com/browse/AHD-005' }
        ],
        businessValue: 'Improve customer payment experience',
        risks: 'IVR integration complexity',
        createdAt: new Date().toISOString(),
        createdBy: 'admin'
    },
    {
        id: uuidv4(),
        name: 'Member Auth Threshold',
        description: 'Member Authorization Threshold implementation',
        program: 'AHD',
        year: '2026',
        quarter: 'Q1',
        startDate: '2026-03-01',
        deliveryDate: '2026-09-30',
        budgetApproved: true,
        priority: 'High',
        wsjf: 68.90,
        owner: 'AHD Team',
        dependentSystems: [
            { system: 'Intel Engine', pmSpoc: 'John Smith', jiraUrl: 'https://jira.carelonrx.com/browse/AHD-006' },
            { system: 'SOA', pmSpoc: 'Lisa Anderson', jiraUrl: 'https://jira.carelonrx.com/browse/AHD-007' }
        ],
        businessValue: 'Enhanced member authorization controls',
        risks: 'Cross-system dependencies',
        createdAt: new Date().toISOString(),
        createdBy: 'admin'
    },
    {
        id: uuidv4(),
        name: 'Address id association to CPUID',
        description: 'Address ID association to Central Person Unique ID',
        program: 'AHD',
        year: '2026',
        quarter: 'Q2',
        startDate: '2026-06-01',
        deliveryDate: '2026-08-31',
        budgetApproved: true,
        priority: 'Medium',
        wsjf: 38.20,
        owner: 'AHD Team',
        dependentSystems: [
            { system: 'CPDL', pmSpoc: 'Mike Chen', jiraUrl: 'https://jira.carelonrx.com/browse/AHD-008' },
            { system: 'Intel Engine', pmSpoc: 'John Smith', jiraUrl: 'https://jira.carelonrx.com/browse/AHD-009' }
        ],
        businessValue: 'Improved data consistency and member identification',
        risks: 'Data migration complexity',
        createdAt: new Date().toISOString(),
        createdBy: 'admin'
    },
    {
        id: uuidv4(),
        name: 'Decouple PCS Phase 2 and 3',
        description: 'Decouple Pharmacy Claims System Phase 2 and 3',
        program: 'AHD',
        year: '2026',
        quarter: 'Q2',
        startDate: '2026-07-01',
        deliveryDate: '2026-11-30',
        budgetApproved: true,
        priority: 'High',
        wsjf: 59.80,
        owner: 'AHD Team',
        dependentSystems: [
            { system: 'Enterprise Rx', pmSpoc: 'Sarah Johnson', jiraUrl: 'https://jira.carelonrx.com/browse/AHD-010' },
            { system: 'PST', pmSpoc: 'David Wilson', jiraUrl: 'https://jira.carelonrx.com/browse/AHD-011' }
        ],
        businessValue: 'Modular architecture for better maintainability',
        risks: 'System integration challenges',
        createdAt: new Date().toISOString(),
        createdBy: 'admin'
    },
    {
        id: uuidv4(),
        name: 'ORx DP Migration Release 1',
        description: 'ORx Data Platform Migration - Release 1',
        program: 'AHD',
        year: '2026',
        quarter: 'Q2',
        startDate: '2026-06-01',
        deliveryDate: '2026-08-31',
        budgetApproved: true,
        priority: 'Critical',
        wsjf: 91.75,
        owner: 'AHD Team',
        dependentSystems: [
            { system: 'Enterprise Rx', pmSpoc: 'Sarah Johnson', jiraUrl: 'https://jira.carelonrx.com/browse/AHD-012' },
            { system: 'CPDL', pmSpoc: 'Mike Chen', jiraUrl: 'https://jira.carelonrx.com/browse/AHD-013' },
            { system: 'Digital Integrated', pmSpoc: 'Jennifer Lee', jiraUrl: 'https://jira.carelonrx.com/browse/AHD-014' }
        ],
        businessValue: 'First major release of ORx migration',
        risks: 'Data integrity during migration',
        createdAt: new Date().toISOString(),
        createdBy: 'admin'
    },
    {
        id: uuidv4(),
        name: 'ORx DP Migration Release 2',
        description: 'ORx Data Platform Migration - Release 2',
        program: 'AHD',
        year: '2026',
        quarter: 'Q2',
        startDate: '2026-07-01',
        deliveryDate: '2026-09-30',
        budgetApproved: true,
        priority: 'Critical',
        wsjf: 88.40,
        owner: 'AHD Team',
        dependentSystems: [
            { system: 'Enterprise Rx', pmSpoc: 'Sarah Johnson', jiraUrl: 'https://jira.carelonrx.com/browse/AHD-015' },
            { system: 'CPDL', pmSpoc: 'Mike Chen', jiraUrl: 'https://jira.carelonrx.com/browse/AHD-016' },
            { system: 'Digital Standalone', pmSpoc: 'Kevin Martinez', jiraUrl: 'https://jira.carelonrx.com/browse/AHD-017' }
        ],
        businessValue: 'Second major release of ORx migration',
        risks: 'System performance during transition',
        createdAt: new Date().toISOString(),
        createdBy: 'admin'
    },
    {
        id: uuidv4(),
        name: 'Patient New comm 5 SRs',
        description: 'Patient New Communication - 5 Service Requests',
        program: 'AHD',
        year: '2026',
        quarter: 'Q3',
        startDate: '2026-08-01',
        deliveryDate: '2026-11-30',
        budgetApproved: true,
        priority: 'Medium',
        wsjf: 42.60,
        owner: 'AHD Team',
        dependentSystems: [
            { system: 'Self Service Portal', pmSpoc: 'Robert Brown', jiraUrl: 'https://jira.carelonrx.com/browse/AHD-018' },
            { system: 'CCT', pmSpoc: 'Amanda Taylor', jiraUrl: 'https://jira.carelonrx.com/browse/AHD-019' }
        ],
        businessValue: 'Enhanced patient communication capabilities',
        risks: 'Multi-channel integration',
        createdAt: new Date().toISOString(),
        createdBy: 'admin'
    }
];

function generateToken(user) {
    return Buffer.from(JSON.stringify({ id: user.id, username: user.username })).toString('base64');
}

function verifyToken(token) {
    try {
        const decoded = JSON.parse(Buffer.from(token.replace('Bearer ', ''), 'base64').toString());
        return users.find(u => u.id === decoded.id);
    } catch {
        return null;
    }
}

function authMiddleware(req, res, next) {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    const user = verifyToken(token);
    if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    
    req.user = user;
    next();
}

app.post('/api/signup', (req, res) => {
    const { name, username, email, role, password } = req.body;
    
    // Validate required fields
    if (!name || !username || !email || !role || !password) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required'
        });
    }
    
    // Validate email domain
    const allowedDomains = ['elevancehealth.com', 'carelon.com'];
    const emailDomain = email.split('@')[1]?.toLowerCase();
    
    if (!emailDomain || !allowedDomains.includes(emailDomain)) {
        return res.status(400).json({
            success: false,
            message: 'Email must be from @elevancehealth.com or @carelon.com domain'
        });
    }
    
    // Validate role - prevent admin role from being selected
    const allowedRoles = ['product_owner', 'product_manager', 'business_owner', 'stakeholder', 'rte', 'scrum_master'];
    if (!allowedRoles.includes(role)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid role selected. Admin role cannot be assigned during signup.'
        });
    }
    
    // Check if username already exists
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: 'Username already exists. Please choose a different username.'
        });
    }
    
    // Check if email already exists
    const existingEmail = users.find(u => u.email === email);
    if (existingEmail) {
        return res.status(400).json({
            success: false,
            message: 'Email already registered. Please use a different email.'
        });
    }
    
    // Create new user
    const newUser = {
        id: uuidv4(),
        username,
        password, // In production, this should be hashed
        name,
        email,
        role: role, // Use the selected role
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    
    console.log('New user created:', username, 'with role:', role);
    
    res.json({
        success: true,
        message: 'Account created successfully',
        user: {
            id: newUser.id,
            username: newUser.username,
            name: newUser.name,
            role: newUser.role
        }
    });
});

app.post('/api/login', (req, res) => {
    console.log('Login request received:', req.body);
    const { username, password } = req.body;
    
    console.log('Looking for user:', username);
    console.log('Available users:', users.map(u => ({ username: u.username, password: u.password })));
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        console.log('User found:', user.username);
        const token = generateToken(user);
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role
            }
        });
    } else {
        console.log('User NOT found - invalid credentials');
        res.status(401).json({
            success: false,
            message: 'Invalid username or password'
        });
    }
});

app.get('/api/initiatives', authMiddleware, (req, res) => {
    res.json({
        success: true,
        initiatives: initiatives.map(i => ({
            ...i,
            canEdit: req.user.role === 'admin' || i.createdBy === req.user.username
        }))
    });
});

app.get('/api/initiatives/:id', authMiddleware, (req, res) => {
    const initiative = initiatives.find(i => i.id === req.params.id);
    
    if (initiative) {
        res.json({
            success: true,
            initiative: {
                ...initiative,
                canEdit: req.user.role === 'admin' || initiative.createdBy === req.user.username
            }
        });
    } else {
        res.status(404).json({
            success: false,
            message: 'Initiative not found'
        });
    }
});

app.post('/api/initiatives', authMiddleware, (req, res) => {
    // Check if WSJF value already exists
    const wsjfValue = parseFloat(req.body.wsjf);
    const existingWSJF = initiatives.find(i => parseFloat(i.wsjf) === wsjfValue);
    
    if (existingWSJF) {
        return res.status(400).json({
            success: false,
            message: `WSJF value ${wsjfValue.toFixed(2)} is already used by initiative "${existingWSJF.name}". Please use a unique WSJF value.`
        });
    }
    
    const timestamp = new Date().toISOString();
    const newInitiative = {
        id: uuidv4(),
        ...req.body,
        createdAt: timestamp,
        createdBy: req.user.username,
        updatedAt: timestamp,
        updatedBy: req.user.username,
        changeLog: [
            {
                action: 'created',
                user: req.user.name || req.user.username,
                username: req.user.username,
                timestamp: timestamp,
                changes: 'Initiative created'
            }
        ]
    };
    
    initiatives.push(newInitiative);
    
    res.json({
        success: true,
        message: 'Initiative created successfully',
        initiative: newInitiative
    });
});

app.put('/api/initiatives/:id', authMiddleware, (req, res) => {
    const index = initiatives.findIndex(i => i.id === req.params.id);
    
    if (index === -1) {
        return res.status(404).json({
            success: false,
            message: 'Initiative not found'
        });
    }
    
    const initiative = initiatives[index];
    
    if (req.user.role !== 'admin' && initiative.createdBy !== req.user.username) {
        return res.status(403).json({
            success: false,
            message: 'You do not have permission to edit this initiative'
        });
    }
    
    // Check if WSJF value already exists (excluding current initiative)
    const wsjfValue = parseFloat(req.body.wsjf);
    const existingWSJF = initiatives.find(i => i.id !== req.params.id && parseFloat(i.wsjf) === wsjfValue);
    
    if (existingWSJF) {
        return res.status(400).json({
            success: false,
            message: `WSJF value ${wsjfValue.toFixed(2)} is already used by initiative "${existingWSJF.name}". Please use a unique WSJF value.`
        });
    }
    
    const timestamp = new Date().toISOString();
    
    // Track field-level changes
    const fieldChanges = [];
    const fieldsToTrack = ['name', 'description', 'program', 'year', 'quarter', 'startDate', 'deliveryDate', 
                           'budgetApproved', 'priority', 'wsjf', 'owner', 'businessValue', 'risks'];
    
    fieldsToTrack.forEach(field => {
        if (req.body[field] !== undefined && req.body[field] !== initiative[field]) {
            fieldChanges.push({
                field: field,
                oldValue: initiative[field],
                newValue: req.body[field]
            });
        }
    });
    
    // Track dependent systems changes
    if (req.body.dependentSystems && JSON.stringify(req.body.dependentSystems) !== JSON.stringify(initiative.dependentSystems)) {
        fieldChanges.push({
            field: 'dependentSystems',
            oldValue: initiative.dependentSystems || [],
            newValue: req.body.dependentSystems
        });
    }
    
    const changeLogEntry = {
        action: 'updated',
        user: req.user.name || req.user.username,
        username: req.user.username,
        timestamp: timestamp,
        changes: fieldChanges.length > 0 ? `Updated ${fieldChanges.length} field(s)` : 'Initiative updated',
        fieldChanges: fieldChanges
    };
    
    const existingChangeLog = initiative.changeLog || [];
    
    initiatives[index] = {
        ...initiative,
        ...req.body,
        id: initiative.id,
        createdAt: initiative.createdAt,
        createdBy: initiative.createdBy,
        updatedAt: timestamp,
        updatedBy: req.user.username,
        changeLog: [...existingChangeLog, changeLogEntry]
    };
    
    res.json({
        success: true,
        message: 'Initiative updated successfully',
        initiative: initiatives[index]
    });
});

app.delete('/api/initiatives/:id', authMiddleware, (req, res) => {
    const index = initiatives.findIndex(i => i.id === req.params.id);
    
    if (index === -1) {
        return res.status(404).json({
            success: false,
            message: 'Initiative not found'
        });
    }
    
    const initiative = initiatives[index];
    
    if (req.user.role !== 'admin' && initiative.createdBy !== req.user.username) {
        return res.status(403).json({
            success: false,
            message: 'You do not have permission to delete this initiative'
        });
    }
    
    initiatives.splice(index, 1);
    
    res.json({
        success: true,
        message: 'Initiative deleted successfully'
    });
});

app.get('/api/stats', authMiddleware, (req, res) => {
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
    
    res.json({
        success: true,
        stats
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'CarelonRx Roadmap API is running',
        timestamp: new Date().toISOString()
    });
});

// User Management Endpoints
app.get('/api/users', authMiddleware, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }
    
    console.log('Fetching all users. Total users:', users.length);
    console.log('Users:', users.map(u => ({ username: u.username, name: u.name, role: u.role })));
    
    res.json({
        success: true,
        users: users.map(u => ({
            id: u.id,
            username: u.username,
            name: u.name,
            email: u.email,
            role: u.role,
            createdAt: u.createdAt
        }))
    });
});

app.get('/api/users/:id', authMiddleware, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }
    
    const user = users.find(u => u.id === req.params.id);
    
    if (user) {
        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role
            }
        });
    } else {
        res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }
});

app.post('/api/users', authMiddleware, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }
    
    const { username, password, name, role } = req.body;
    
    if (!username || !password || !name || !role) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required'
        });
    }
    
    if (users.find(u => u.username === username)) {
        return res.status(400).json({
            success: false,
            message: 'Username already exists'
        });
    }
    
    const newUser = {
        id: uuidv4(),
        username,
        password,
        name,
        role
    };
    
    users.push(newUser);
    
    res.json({
        success: true,
        message: 'User created successfully',
        user: {
            id: newUser.id,
            username: newUser.username,
            name: newUser.name,
            role: newUser.role
        }
    });
});

app.put('/api/users/:id', authMiddleware, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }
    
    const userIndex = users.findIndex(u => u.id === req.params.id);
    
    if (userIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }
    
    const { username, password, name, role } = req.body;
    
    if (username && username !== users[userIndex].username) {
        if (users.find(u => u.username === username && u.id !== req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            });
        }
        users[userIndex].username = username;
    }
    
    if (password) {
        users[userIndex].password = password;
    }
    
    if (name) {
        users[userIndex].name = name;
    }
    
    if (role) {
        users[userIndex].role = role;
    }
    
    res.json({
        success: true,
        message: 'User updated successfully',
        user: {
            id: users[userIndex].id,
            username: users[userIndex].username,
            name: users[userIndex].name,
            role: users[userIndex].role
        }
    });
});

app.delete('/api/users/:id', authMiddleware, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }
    
    const userIndex = users.findIndex(u => u.id === req.params.id);
    
    if (userIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }
    
    if (users[userIndex].id === req.user.id) {
        return res.status(400).json({
            success: false,
            message: 'Cannot delete your own account'
        });
    }
    
    users.splice(userIndex, 1);
    
    res.json({
        success: true,
        message: 'User deleted successfully'
    });
});

app.listen(PORT, () => {
    console.log(`\n🚀 CarelonRx Roadmap API Server`);
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log(`\n📋 Available endpoints:`);
    console.log(`   POST   /api/login`);
    console.log(`   GET    /api/initiatives`);
    console.log(`   POST   /api/initiatives`);
    console.log(`   GET    /api/initiatives/:id`);
    console.log(`   PUT    /api/initiatives/:id`);
    console.log(`   DELETE /api/initiatives/:id`);
    console.log(`   GET    /api/users (admin only)`);
    console.log(`   POST   /api/users (admin only)`);
    console.log(`   GET    /api/users/:id (admin only)`);
    console.log(`   PUT    /api/users/:id (admin only)`);
    console.log(`   DELETE /api/users/:id (admin only)`);
    console.log(`   GET    /api/stats`);
    console.log(`   GET    /api/health`);
    console.log(`\n👤 Demo users:`);
    console.log(`   admin / admin123 (Administrator)`);
    console.log(`   user1 / user123 (John Doe)`);
    console.log(`   user2 / user123 (Jane Smith)`);
    console.log(`\n✅ Ready to accept requests!\n`);
});
