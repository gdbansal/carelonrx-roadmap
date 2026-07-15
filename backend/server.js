require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/database');
const User = require('./models/User');
const Initiative = require('./models/Initiative');
const EstimationSession = require('./models/EstimationSession');
const AuditLog = require('./models/AuditLog');
const EstimationUser = require('./models/EstimationUser');
const UserSession = require('./models/UserSession');
const LineOfBusiness = require('./models/LineOfBusiness');
const TeamMember = require('./models/TeamMember');
const CapacityPlan = require('./models/CapacityPlan');
const RoleModuleMapping = require('./models/RoleModuleMapping');
const { logAuditEvent } = require('./middleware/auditLogger');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// CORS configuration for production
const corsOptions = {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb' }));

// Trust proxy to get correct IP addresses (for Render, Heroku, etc.)
app.set('trust proxy', true);

// Helper function to get client IP address
function getClientIp(req) {
    // Check X-Forwarded-For header first (for proxies/load balancers)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        // X-Forwarded-For can contain multiple IPs, get the first one
        return forwarded.split(',')[0].trim();
    }
    
    // Fallback to other headers and connection
    return req.headers['x-real-ip'] || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           req.ip ||
           'unknown';
}

function generateToken(user) {
    return Buffer.from(JSON.stringify({ id: user._id || user.id, username: user.username })).toString('base64');
}

async function verifyToken(token) {
    try {
        const decoded = JSON.parse(Buffer.from(token.replace('Bearer ', ''), 'base64').toString());
        const user = await User.findById(decoded.id);
        return user;
    } catch {
        return null;
    }
}

async function authMiddleware(req, res, next) {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    const user = await verifyToken(token);
    if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    
    req.user = user;
    next();
}

// Initialize default admin user if database is empty
async function initializeDefaultData() {
    try {
        const userCount = await User.countDocuments();
        if (userCount === 0) {
            console.log('📝 Initializing default admin user...');
            await User.create({
                username: 'admin',
                password: 'admin123',
                name: 'Administrator',
                email: 'admin@carelon.com',
                role: 'admin'
            });
            console.log('✅ Default admin user created');
        }
    } catch (error) {
        console.error('Error initializing default data:', error);
    }
}

// Call initialization after DB connection
setTimeout(initializeDefaultData, 2000);

// ========== AUTH ENDPOINTS ==========

app.post('/api/signup', async (req, res) => {
    try {
        const { name, username, email, role, password } = req.body;
        
        if (!name || !username || !email || !role || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }
        
        const allowedDomains = ['elevancehealth.com', 'carelon.com'];
        const emailDomain = email.split('@')[1]?.toLowerCase();
        
        if (!emailDomain || !allowedDomains.includes(emailDomain)) {
            return res.status(400).json({
                success: false,
                message: 'Email must be from @elevancehealth.com or @carelon.com domain'
            });
        }
        
        if (role === 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Admin role cannot be assigned during signup.'
            });
        }
        const validRoleDoc = await RoleModuleMapping.findOne({ role });
        if (!validRoleDoc) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role selected. Please choose a valid role.'
            });
        }
        
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists. Please choose a different username.'
            });
        }
        
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered. Please use a different email.'
            });
        }
        
        const newUser = await User.create({
            username,
            password,
            name,
            email,
            role
        });
        
        console.log('New user created:', username, 'with role:', role);
        
        res.json({
            success: true,
            message: 'Account created successfully',
            user: {
                id: newUser._id,
                username: newUser.username,
                name: newUser.name,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating account'
        });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        console.log('Login request received:', req.body);
        const { username, password } = req.body;
        
        // Find user by username only
        const user = await User.findOne({ username });
        
        if (!user) {
            console.log('User NOT found - invalid username');
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }
        
        // Compare password using bcrypt
        const isPasswordValid = await user.comparePassword(password);
        
        if (isPasswordValid) {
            console.log('User authenticated:', user.username);
            
            // Update last login
            user.lastLogin = new Date();
            await user.save();
            
            const token = generateToken(user);
            res.json({
                success: true,
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    profileImage: user.profileImage,
                    lastLogin: user.lastLogin
                }
            });
        } else {
            console.log('Invalid password for user:', username);
            res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during login'
        });
    }
});

// ========== INITIATIVE ENDPOINTS ==========

app.get('/api/initiatives', authMiddleware, async (req, res) => {
    try {
        const initiatives = await Initiative.find().sort({ wsjf: -1 });
        res.json({
            success: true,
            initiatives: initiatives.map(i => ({
                id: i._id,
                name: i.name,
                description: i.description,
                businessUnit: i.businessUnit,
                program: i.program,
                year: i.year,
                quarter: i.quarter,
                startDate: i.startDate,
                deliveryDate: i.deliveryDate,
                sitStartDate: i.sitStartDate,
                sitEndDate: i.sitEndDate,
                uatStartDate: i.uatStartDate,
                uatEndDate: i.uatEndDate,
                businessCommitmentDate: i.businessCommitmentDate,
                budgetApproved: i.budgetApproved,
                priority: i.priority,
                holdReason: i.holdReason,
                wsjf: i.wsjf,
                userBusinessValue: i.userBusinessValue,
                timeCriticality: i.timeCriticality,
                riskReduction: i.riskReduction,
                jobSize: i.jobSize,
                owner: i.owner,
                dependentSystems: i.dependentSystems,
                businessValue: i.businessValue,
                risks: i.risks,
                dependencies: i.dependencies,
                createdAt: i.createdAt,
                createdBy: i.createdBy,
                updatedAt: i.updatedAt,
                updatedBy: i.updatedBy,
                changeLog: i.changeLog,
                canEdit: req.user.role === 'admin' || i.createdBy === req.user.username
            }))
        });
    } catch (error) {
        console.error('Error fetching initiatives:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching initiatives'
        });
    }
});

app.get('/api/initiatives/:id', authMiddleware, async (req, res) => {
    try {
        const initiative = await Initiative.findById(req.params.id);
        
        if (initiative) {
            res.json({
                success: true,
                initiative: {
                    id: initiative._id,
                    name: initiative.name,
                    description: initiative.description,
                    businessUnit: initiative.businessUnit,
                    program: initiative.program,
                    year: initiative.year,
                    quarter: initiative.quarter,
                    startDate: initiative.startDate,
                    deliveryDate: initiative.deliveryDate,
                    sitStartDate: initiative.sitStartDate,
                    sitEndDate: initiative.sitEndDate,
                    uatStartDate: initiative.uatStartDate,
                    uatEndDate: initiative.uatEndDate,
                    businessCommitmentDate: initiative.businessCommitmentDate,
                    budgetApproved: initiative.budgetApproved,
                    priority: initiative.priority,
                    holdReason: initiative.holdReason,
                    wsjf: initiative.wsjf,
                    userBusinessValue: initiative.userBusinessValue,
                    timeCriticality: initiative.timeCriticality,
                    riskReduction: initiative.riskReduction,
                    jobSize: initiative.jobSize,
                    owner: initiative.owner,
                    dependentSystems: initiative.dependentSystems,
                    businessValue: initiative.businessValue,
                    risks: initiative.risks,
                    dependencies: initiative.dependencies,
                    createdAt: initiative.createdAt,
                    createdBy: initiative.createdBy,
                    updatedAt: initiative.updatedAt,
                    updatedBy: initiative.updatedBy,
                    changeLog: initiative.changeLog,
                    canEdit: req.user.role === 'admin' || initiative.createdBy === req.user.username
                }
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Initiative not found'
            });
        }
    } catch (error) {
        console.error('Error fetching initiative:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching initiative'
        });
    }
});

app.post('/api/initiatives', authMiddleware, async (req, res) => {
    try {
        const wsjfValue = parseFloat(req.body.wsjf);
        const existingWSJF = await Initiative.findOne({ wsjf: wsjfValue });
        
        if (existingWSJF) {
            return res.status(400).json({
                success: false,
                message: `WSJF value ${wsjfValue.toFixed(2)} is already used by initiative "${existingWSJF.name}". Please use a unique WSJF value.`
            });
        }
        
        const timestamp = new Date();
        const newInitiative = await Initiative.create({
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
        });
        
        res.json({
            success: true,
            message: 'Initiative created successfully',
            initiative: {
                id: newInitiative._id,
                ...newInitiative.toObject()
            }
        });
    } catch (error) {
        console.error('Error creating initiative:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating initiative',
            error: error.message || 'Unknown error'
        });
    }
});

app.put('/api/initiatives/:id', authMiddleware, async (req, res) => {
    try {
        const initiative = await Initiative.findById(req.params.id);
        
        if (!initiative) {
            return res.status(404).json({
                success: false,
                message: 'Initiative not found'
            });
        }
        
        if (req.user.role !== 'admin' && initiative.createdBy !== req.user.username) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to edit this initiative'
            });
        }
        
        const wsjfValue = parseFloat(req.body.wsjf);
        const existingWSJF = await Initiative.findOne({ 
            _id: { $ne: req.params.id }, 
            wsjf: wsjfValue 
        });
        
        if (existingWSJF) {
            return res.status(400).json({
                success: false,
                message: `WSJF value ${wsjfValue.toFixed(2)} is already used by initiative "${existingWSJF.name}". Please use a unique WSJF value.`
            });
        }
        
        const timestamp = new Date();
        
        // Track field-level changes
        const fieldChanges = [];
        const fieldsToTrack = ['name', 'description', 'businessUnit', 'program', 'year', 'quarter', 
                               'startDate', 'deliveryDate', 'sitStartDate', 'sitEndDate', 'uatStartDate', 'uatEndDate',
                               'businessCommitmentDate', 'budgetApproved', 'priority', 'holdReason', 'wsjf', 
                               'userBusinessValue', 'timeCriticality', 'riskReduction', 'jobSize', 'owner', 
                               'businessValue', 'risks', 'dependencies'];
        
        fieldsToTrack.forEach(field => {
            if (req.body[field] !== undefined) {
                const oldValue = initiative[field];
                const newValue = req.body[field];
                
                // Convert to strings for comparison to handle type differences
                const oldStr = oldValue === null || oldValue === undefined ? '' : String(oldValue);
                const newStr = newValue === null || newValue === undefined ? '' : String(newValue);
                
                if (oldStr !== newStr) {
                    console.log(`Field ${field} changed: "${oldValue}" -> "${newValue}"`);
                    fieldChanges.push({
                        field: field,
                        oldValue: oldValue,
                        newValue: newValue
                    });
                }
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
        
        // Update initiative - only assign known safe fields
        const allowedFields = ['name', 'description', 'businessUnit', 'program', 'year', 'quarter',
            'startDate', 'deliveryDate', 'sitStartDate', 'sitEndDate', 'uatStartDate', 'uatEndDate',
            'businessCommitmentDate', 'budgetApproved', 'priority', 'holdReason', 'wsjf', 
            'userBusinessValue', 'timeCriticality', 'riskReduction', 'jobSize',
            'owner', 'dependentSystems', 'businessValue', 'risks', 'dependencies'];
        
        console.log('=== UPDATE INITIATIVE DEBUG ===');
        console.log('Initiative ID:', req.params.id);
        console.log('Current businessUnit in DB:', initiative.businessUnit);
        console.log('New businessUnit from request:', req.body.businessUnit);
        console.log('Request body keys:', Object.keys(req.body));
        
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                const oldValue = initiative[field];
                // Convert empty string to null for optional date fields
                if (['startDate', 'deliveryDate', 'sitStartDate', 'sitEndDate', 'uatStartDate', 'uatEndDate', 'businessCommitmentDate'].includes(field)) {
                    initiative[field] = req.body[field] || null;
                } else {
                    initiative[field] = req.body[field];
                }
                if (field === 'businessUnit') {
                    console.log(`businessUnit assignment: ${oldValue} -> ${initiative[field]}`);
                }
            }
        });
        
        console.log('After assignment - businessUnit value:', initiative.businessUnit);
        console.log('Field changes detected:', fieldChanges.length);
        console.log('=== END DEBUG ===');
        initiative.updatedAt = timestamp;
        initiative.updatedBy = req.user.username;
        initiative.changeLog.push(changeLogEntry);
        
        await initiative.save();
        
        res.json({
            success: true,
            message: 'Initiative updated successfully',
            initiative: {
                id: initiative._id,
                ...initiative.toObject()
            }
        });
    } catch (error) {
        console.error('Error updating initiative:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating initiative',
            error: error.message
        });
    }
});

app.delete('/api/initiatives/:id', authMiddleware, async (req, res) => {
    try {
        const initiative = await Initiative.findById(req.params.id);
        
        if (!initiative) {
            return res.status(404).json({
                success: false,
                message: 'Initiative not found'
            });
        }
        
        if (req.user.role !== 'admin' && initiative.createdBy !== req.user.username) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this initiative'
            });
        }
        
        await Initiative.findByIdAndDelete(req.params.id);
        
        res.json({
            success: true,
            message: 'Initiative deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting initiative:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting initiative'
        });
    }
});

app.get('/api/stats', authMiddleware, async (req, res) => {
    try {
        const initiatives = await Initiative.find();
        
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
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching stats'
        });
    }
});

// ========== USER MANAGEMENT ENDPOINTS ==========

app.get('/api/users', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }
        
        const users = await User.find().select('-password');
        
        res.json({
            success: true,
            users: users.map(u => ({
                id: u._id,
                username: u.username,
                name: u.name,
                email: u.email,
                role: u.role,
                profileImage: u.profileImage,
                createdAt: u.createdAt
            }))
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users'
        });
    }
});

app.get('/api/users/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }
        
        const user = await User.findById(req.params.id).select('-password');
        
        if (user) {
            res.json({
                success: true,
                user: {
                    id: user._id,
                    username: user.username,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    profileImage: user.profileImage
                }
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user'
        });
    }
});

app.post('/api/users', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }
        
        const { username, password, name, email, role } = req.body;
        
        if (!username || !password || !name || !email || !role) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }
        
        const allowedDomains = ['elevancehealth.com', 'carelon.com'];
        const emailDomain = email.split('@')[1]?.toLowerCase();
        
        if (!emailDomain || !allowedDomains.includes(emailDomain)) {
            return res.status(400).json({
                success: false,
                message: 'Email must be from @elevancehealth.com or @carelon.com domain'
            });
        }
        
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            });
        }
        
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }
        
        const newUser = await User.create({
            username,
            password,
            name,
            email,
            role
        });
        
        res.json({
            success: true,
            message: 'User created successfully',
            user: {
                id: newUser._id,
                username: newUser.username,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating user'
        });
    }
});

app.put('/api/users/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }
        
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const { username, password, name, email, role } = req.body;
        
        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username, _id: { $ne: req.params.id } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already exists'
                });
            }
            user.username = username;
        }
        
        if (email && email !== user.email) {
            const allowedDomains = ['elevancehealth.com', 'carelon.com'];
            const emailDomain = email.split('@')[1]?.toLowerCase();
            
            if (!emailDomain || !allowedDomains.includes(emailDomain)) {
                return res.status(400).json({
                    success: false,
                    message: 'Email must be from @elevancehealth.com or @carelon.com domain'
                });
            }
            
            const existingEmail = await User.findOne({ email, _id: { $ne: req.params.id } });
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered'
                });
            }
            user.email = email;
        }
        
        if (password) user.password = password;
        if (name) user.name = name;
        if (role) user.role = role;
        
        await user.save();
        
        res.json({
            success: true,
            message: 'User updated successfully',
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user'
        });
    }
});

app.delete('/api/users/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }
        
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }
        
        await User.findByIdAndDelete(req.params.id);
        
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user'
        });
    }
});

// ========== PROFILE ENDPOINTS ==========

app.get('/api/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        
        if (user) {
            res.json({
                success: true,
                user: {
                    id: user._id,
                    username: user.username,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    profileImage: user.profileImage
                }
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile'
        });
    }
});

app.put('/api/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const { name, email, password, profileImage } = req.body;
        
        if (email && email !== user.email) {
            const allowedDomains = ['elevancehealth.com', 'carelon.com'];
            const emailDomain = email.split('@')[1]?.toLowerCase();
            
            if (!emailDomain || !allowedDomains.includes(emailDomain)) {
                return res.status(400).json({
                    success: false,
                    message: 'Email must be from @elevancehealth.com or @carelon.com domain'
                });
            }
            
            const existingEmail = await User.findOne({ email, _id: { $ne: req.user._id } });
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered'
                });
            }
            
            user.email = email;
        }
        
        if (name) user.name = name;
        if (password) user.password = password;
        if (profileImage !== undefined) user.profileImage = profileImage;
        
        await user.save();
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile'
        });
    }
});

// ========== MIGRATION ENDPOINTS (ADMIN ONLY) ==========

// Migrate passwords endpoint - ADMIN ONLY
app.post('/api/migrate-passwords', authMiddleware, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }
        
        const bcrypt = require('bcryptjs');
        
        // Find all users
        const users = await User.find({});
        let migratedCount = 0;
        const results = [];

        for (const user of users) {
            // Check if password is already hashed (bcrypt hashes start with $2a$ or $2b$)
            if (user.password && !user.password.startsWith('$2')) {
                const plainPassword = user.password;
                
                // Hash the plain text password
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(plainPassword, salt);
                
                // Update the user with hashed password
                await User.updateOne(
                    { _id: user._id },
                    { $set: { password: hashedPassword } }
                );
                
                results.push(`✅ Hashed password for: ${user.username}`);
                migratedCount++;
            } else {
                results.push(`⏭️ Skipped (already hashed): ${user.username}`);
            }
        }

        // Verify admin user
        const adminUser = await User.findOne({ username: 'admin' });
        let adminVerified = false;
        if (adminUser) {
            adminVerified = await bcrypt.compare('admin123', adminUser.password);
        }

        res.json({
            success: true,
            message: 'Password migration completed',
            totalUsers: users.length,
            migratedCount,
            alreadyHashed: users.length - migratedCount,
            adminVerified,
            details: results
        });
    } catch (error) {
        console.error('Migration error:', error);
        res.status(500).json({
            success: false,
            message: 'Migration failed',
            error: error.message
        });
    }
});

// Update user role endpoint - ADMIN ONLY
app.post('/api/update-user-role', authMiddleware, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }
        
        const { username, role } = req.body;
        
        if (!username || !role) {
            return res.status(400).json({
                success: false,
                message: 'Username and role are required'
            });
        }

        // List all users
        const allUsers = await User.find({}, 'username name email role');
        
        // Find the user
        let user = await User.findOne({ username });
        
        if (!user) {
            // Try by email
            user = await User.findOne({ email: new RegExp(username, 'i') });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: `User '${username}' not found`,
                availableUsers: allUsers.map(u => ({
                    username: u.username,
                    name: u.name,
                    email: u.email,
                    role: u.role
                }))
            });
        }

        const oldRole = user.role;
        
        // Update role
        await User.collection.updateOne(
            { _id: user._id },
            { $set: { role } }
        );
        
        // Verify update
        const updatedUser = await User.findById(user._id);

        res.json({
            success: true,
            message: `Role updated successfully`,
            user: {
                username: updatedUser.username,
                name: updatedUser.name,
                email: updatedUser.email,
                oldRole,
                newRole: updatedUser.role
            },
            note: 'User must logout and login again to see changes'
        });
    } catch (error) {
        console.error('Role update error:', error);
        res.status(500).json({
            success: false,
            message: 'Role update failed',
            error: error.message
        });
    }
});

// ========== ESTIMATION USER AUTHENTICATION ==========

// Login or create estimation user (simple name + role based)
app.post('/api/estimation-auth/login', async (req, res) => {
    try {
        const { name, role } = req.body;
        
        if (!name || !role) {
            return res.status(400).json({
                success: false,
                message: 'Name and role are required'
            });
        }
        
        // Find or create user
        let user = await EstimationUser.findOne({ name, role });
        
        if (!user) {
            user = new EstimationUser({
                name,
                role,
                loginCount: 0
            });
        }
        
        // Record login
        await user.recordLogin();
        
        // Generate session token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        
        // Create user session
        const userSession = new UserSession({
            userId: user._id,
            token,
            expiresAt,
            ipAddress: getClientIp(req),
            userAgent: req.headers['user-agent']
        });
        
        await userSession.save();
        
        // Log audit event
        await logAuditEvent(
            'USER_LOGIN',
            `${name}_${role}`,
            null,
            {
                action: 'User logged in',
                loginCount: user.loginCount
            },
            req
        );
        
        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user._id,
                name: user.name,
                role: user.role,
                lastActiveSessionId: user.lastActiveSessionId
            },
            token,
            expiresAt
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
});

// Get current user info
app.get('/api/estimation-auth/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        
        const userSession = await UserSession.findOne({ token }).populate('userId');
        
        if (!userSession || !userSession.isValid()) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
        
        // Extend session
        await userSession.extend();
        
        const user = userSession.userId;
        
        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                role: user.role,
                lastActiveSessionId: user.lastActiveSessionId,
                lastActiveSessionAt: user.lastActiveSessionAt
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user info',
            error: error.message
        });
    }
});

// Logout
app.post('/api/estimation-auth/logout', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (token) {
            const userSession = await UserSession.findOne({ token }).populate('userId');
            
            if (userSession) {
                const user = userSession.userId;
                
                // Log audit event
                await logAuditEvent(
                    'USER_LOGOUT',
                    `${user.name}_${user.role}`,
                    null,
                    {
                        action: 'User logged out'
                    },
                    req
                );
                
                // Delete session
                await UserSession.deleteOne({ token });
            }
        }
        
        res.json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed',
            error: error.message
        });
    }
});

// Update user's last active session
app.put('/api/estimation-auth/last-session', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const { sessionId, sessionName } = req.body;
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        
        const userSession = await UserSession.findOne({ token }).populate('userId');
        
        if (!userSession || !userSession.isValid()) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
        
        const user = userSession.userId;
        await user.updateLastSession(sessionId, sessionName);
        
        res.json({
            success: true,
            message: 'Last session updated',
            lastActiveSessionId: user.lastActiveSessionId
        });
    } catch (error) {
        console.error('Update last session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update last session',
            error: error.message
        });
    }
});

// Get user's session history
app.get('/api/estimation-auth/session-history', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        
        const userSession = await UserSession.findOne({ token }).populate('userId');
        
        if (!userSession || !userSession.isValid()) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
        
        const user = userSession.userId;
        
        res.json({
            success: true,
            sessionHistory: user.sessionHistory || []
        });
    } catch (error) {
        console.error('Get session history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get session history',
            error: error.message
        });
    }
});

// ========== STORY ESTIMATIONS API ==========

// Create a new estimation session
app.post('/api/sessions', async (req, res) => {
    try {
        console.log('📥 Received create session request');
        console.log('Request body keys:', Object.keys(req.body));
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        
        // Support both formats: { sessionId, sessionData } and { sessionId, ...data }
        const { sessionId, sessionData, ...restData } = req.body;
        const dataToSave = sessionData || restData;
        
        console.log('SessionId:', sessionId);
        console.log('Data to save keys:', Object.keys(dataToSave));
        
        // Check if session already exists
        const existingSession = await EstimationSession.findOne({ sessionId });
        if (existingSession) {
            console.log('⚠️ Session already exists:', sessionId);
            return res.status(409).json({
                success: false,
                message: 'Session already exists'
            });
        }
        
        const session = new EstimationSession({
            sessionId,
            ...dataToSave
        });
        
        console.log('💾 Saving session to database...');
        await session.save();
        console.log('✅ Session saved successfully:', sessionId);
        
        // Log audit event
        await logAuditEvent(
            'SESSION_CREATED',
            sessionData.createdBy || 'Unknown',
            sessionId,
            {
                action: 'Created new estimation session',
                teamName: sessionData.teamName,
                sprintValue: sessionData.sprintValue
            },
            req
        );
        
        res.status(201).json({
            success: true,
            message: 'Session created successfully',
            session: session.toObject()
        });
    } catch (error) {
        console.error('❌ Create session error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to create session',
            error: error.message
        });
    }
});

// Get a specific session
app.get('/api/sessions/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const session = await EstimationSession.findOne({ sessionId });
        
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }
        
        // Convert to object and handle Map fields
        const sessionObj = session.toObject();
        
        // Convert Map fields to plain objects
        if (sessionObj.estimations instanceof Map) {
            sessionObj.estimations = Object.fromEntries(sessionObj.estimations);
        }
        if (sessionObj.completedStories instanceof Map) {
            sessionObj.completedStories = Object.fromEntries(sessionObj.completedStories);
        }
        if (sessionObj.revealedStories instanceof Map) {
            sessionObj.revealedStories = Object.fromEntries(sessionObj.revealedStories);
        }
        
        console.log('📤 Sending session with estimations:', JSON.stringify(sessionObj.estimations));
        
        res.json(sessionObj);
    } catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve session',
            error: error.message
        });
    }
});

// Update a session
app.put('/api/sessions/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { sessionData } = req.body;
        
        console.log('📝 Updating session:', sessionId);
        console.log('📦 Request body keys:', Object.keys(req.body));
        console.log('📦 SessionData keys:', sessionData ? Object.keys(sessionData) : 'undefined');
        console.log('📦 Received estimations:', JSON.stringify(sessionData?.estimations));
        
        // Find the session first
        const session = await EstimationSession.findOne({ sessionId });
        
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }
        
        // Update fields manually to ensure Map types are handled correctly
        Object.keys(sessionData).forEach(key => {
            if (key === 'estimations' || key === 'completedStories' || key === 'revealedStories') {
                // For Map fields, convert plain object to Map
                session[key] = new Map(Object.entries(sessionData[key] || {}));
            } else {
                session[key] = sessionData[key];
            }
        });
        
        session.lastUpdated = new Date();
        
        await session.save();
        
        console.log('✅ Session updated, estimations:', JSON.stringify(Object.fromEntries(session.estimations)));
        
        res.json({
            success: true,
            message: 'Session updated successfully',
            session: session.toObject()
        });
    } catch (error) {
        console.error('❌ Update session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update session',
            error: error.message
        });
    }
});

// Add participant to session
app.post('/api/sessions/:sessionId/participants', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { participant } = req.body;
        
        const session = await EstimationSession.findOne({ sessionId });
        
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }
        
        // Check if participant already exists
        const existingParticipant = session.participants.find(
            p => p.name === participant.name && p.role === participant.role
        );
        
        if (!existingParticipant) {
            session.participants.push({
                ...participant,
                joinedAt: new Date()
            });
            await session.save();
            
            // Log audit event
            await logAuditEvent(
                'SESSION_JOINED',
                `${participant.name}_${participant.role}`,
                sessionId,
                {
                    action: 'Joined estimation session',
                    participantName: participant.name,
                    participantRole: participant.role
                },
                req
            );
        }
        
        res.json({
            success: true,
            message: 'Participant added successfully',
            session: session.toObject()
        });
    } catch (error) {
        console.error('Add participant error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add participant',
            error: error.message
        });
    }
});

// Get all sessions (for admin/audit log - includes both active and closed)
app.get('/api/sessions', async (req, res) => {
    try {
        // Get all sessions, not just active ones
        const sessions = await EstimationSession.find({})
            .sort({ createdAt: -1 })
            .limit(100); // Increased limit for audit log
        
        res.json({
            success: true,
            sessions: sessions.map(s => s.toObject())
        });
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve sessions',
            error: error.message
        });
    }
});

// Delete/Close a session
app.delete('/api/sessions/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { closedBy } = req.body;
        
        const session = await EstimationSession.findOneAndUpdate(
            { sessionId },
            {
                status: 'closed',
                closedBy: closedBy || 'Unknown',
                closedAt: new Date()
            },
            { new: true }
        );
        
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }
        
        // Log audit event
        await logAuditEvent(
            'SESSION_ENDED',
            closedBy || 'Unknown',
            sessionId,
            {
                action: 'Ended estimation session',
                teamName: session.teamName,
                totalStories: session.stories?.length || 0,
                totalParticipants: session.participants?.length || 0
            },
            req
        );
        
        res.json({
            success: true,
            message: 'Session closed successfully',
            session: session.toObject()
        });
    } catch (error) {
        console.error('Close session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to close session',
            error: error.message
        });
    }
});

// ========== AUDIT LOGS ==========

// Get audit logs with filters
app.get('/api/audit-logs', async (req, res) => {
    try {
        const { sessionId, userId, eventType, dateFrom, dateTo, limit = 100 } = req.query;
        
        const query = {};
        
        if (sessionId) query.session_id = sessionId;
        if (userId) query.user_id = new RegExp(userId, 'i');
        if (eventType) query.event_type = eventType;
        
        if (dateFrom || dateTo) {
            query.timestamp = {};
            if (dateFrom) query.timestamp.$gte = new Date(dateFrom);
            if (dateTo) {
                const endDate = new Date(dateTo);
                endDate.setHours(23, 59, 59, 999);
                query.timestamp.$lte = endDate;
            }
        }
        
        const logs = await AuditLog.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit));
        
        res.json(logs);
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve audit logs',
            error: error.message
        });
    }
});

// Get audit log statistics
app.get('/api/audit-logs/stats', async (req, res) => {
    try {
        const totalLogs = await AuditLog.countDocuments();
        
        const uniqueSessions = await AuditLog.distinct('session_id', { session_id: { $ne: null } });
        const uniqueUsers = await AuditLog.distinct('user_id');
        
        const eventTypeStats = await AuditLog.aggregate([
            { $group: { _id: '$event_type', count: { $sum: 1 } } },
            { $project: { event_type: '$_id', count: 1, _id: 0 } },
            { $sort: { count: -1 } }
        ]);
        
        res.json({
            totalLogs,
            totalSessions: uniqueSessions.length,
            totalUsers: uniqueUsers.length,
            eventTypeStats
        });
    } catch (error) {
        console.error('Get audit stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve audit statistics',
            error: error.message
        });
    }
});

// Get session IDs for filter dropdown
app.get('/api/audit-logs/session-ids', async (req, res) => {
    try {
        const { dateFrom, dateTo } = req.query;
        
        const query = { session_id: { $ne: null } };
        
        if (dateFrom || dateTo) {
            query.timestamp = {};
            if (dateFrom) query.timestamp.$gte = new Date(dateFrom);
            if (dateTo) {
                const endDate = new Date(dateTo);
                endDate.setHours(23, 59, 59, 999);
                query.timestamp.$lte = endDate;
            }
        }
        
        const sessionIds = await AuditLog.distinct('session_id', query);
        
        res.json({ sessionIds: sessionIds.filter(id => id) });
    } catch (error) {
        console.error('Get session IDs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve session IDs',
            error: error.message
        });
    }
});

// Export audit logs as CSV
app.get('/api/audit-logs/export', async (req, res) => {
    try {
        const { sessionId, userId, eventType, dateFrom, dateTo } = req.query;
        
        const query = {};
        
        if (sessionId) query.session_id = sessionId;
        if (userId) query.user_id = new RegExp(userId, 'i');
        if (eventType) query.event_type = eventType;
        
        if (dateFrom || dateTo) {
            query.timestamp = {};
            if (dateFrom) query.timestamp.$gte = new Date(dateFrom);
            if (dateTo) {
                const endDate = new Date(dateTo);
                endDate.setHours(23, 59, 59, 999);
                query.timestamp.$lte = endDate;
            }
        }
        
        const logs = await AuditLog.find(query).sort({ timestamp: -1 });
        
        // Generate CSV
        const csvHeader = 'Timestamp,Event Type,User ID,Session ID,IP Address,Details\n';
        const csvRows = logs.map(log => {
            const details = JSON.stringify(log.details).replace(/"/g, '""');
            return `"${log.timestamp}","${log.event_type}","${log.user_id || ''}","${log.session_id || ''}","${log.ip_address || ''}","${details}"`;
        }).join('\n');
        
        const csv = csvHeader + csvRows;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('Export audit logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export audit logs',
            error: error.message
        });
    }
});

// Export estimation deviation analysis
app.get('/api/estimation-analysis/export', async (req, res) => {
    try {
        const { sessionId } = req.query;
        
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID is required'
            });
        }
        
        const session = await EstimationSession.findOne({ sessionId });
        
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }
        
        // Generate deviation analysis CSV
        const csvHeader = 'Story Number,Story Summary,User,Role,Estimation,Dev Average,QA Average,Overall Average,Deviation from Average\n';
        const csvRows = [];
        
        session.stories.forEach(story => {
            const estimations = session.estimations.get(story.id) || {};
            const allEstimations = Object.values(estimations).map(e => typeof e === 'object' ? e.points : e).filter(p => p !== null);
            
            if (allEstimations.length === 0) return;
            
            const overallAvg = allEstimations.reduce((a, b) => a + b, 0) / allEstimations.length;
            
            const devEstimations = Object.entries(estimations)
                .filter(([key]) => key.includes('_Dev'))
                .map(([, e]) => typeof e === 'object' ? e.points : e)
                .filter(p => p !== null);
            const devAvg = devEstimations.length > 0 ? devEstimations.reduce((a, b) => a + b, 0) / devEstimations.length : 0;
            
            const qaEstimations = Object.entries(estimations)
                .filter(([key]) => key.includes('_QA'))
                .map(([, e]) => typeof e === 'object' ? e.points : e)
                .filter(p => p !== null);
            const qaAvg = qaEstimations.length > 0 ? qaEstimations.reduce((a, b) => a + b, 0) / qaEstimations.length : 0;
            
            Object.entries(estimations).forEach(([userKey, estimation]) => {
                const [name, role] = userKey.split('_');
                const points = typeof estimation === 'object' ? estimation.points : estimation;
                const deviation = points - overallAvg;
                
                csvRows.push(`"${story.number}","${story.summary}","${name}","${role}","${points}","${devAvg.toFixed(1)}","${qaAvg.toFixed(1)}","${overallAvg.toFixed(1)}","${deviation.toFixed(1)}"`);
            });
        });
        
        const csv = csvHeader + csvRows.join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=estimation-analysis-${sessionId}-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('Export estimation analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export estimation analysis',
            error: error.message
        });
    }
});

// ========== JIRA INTEGRATION ==========

const https = require('https');

function jiraRequest(url) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.JIRA_API_TOKEN}`,
                'Accept': 'application/json'
            }
        };
        const req = https.request(options, (resp) => {
            let data = '';
            resp.on('data', chunk => data += chunk);
            resp.on('end', () => {
                try {
                    resolve({ status: resp.statusCode, body: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: resp.statusCode, body: { errorMessages: [`Non-JSON response: ${data.substring(0, 200)}`] } });
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

app.get('/api/jira/issue/:issueKey', authMiddleware, async (req, res) => {
    try {
        const { issueKey } = req.params;

        if (!process.env.JIRA_BASE_URL || !process.env.JIRA_API_TOKEN) {
            return res.status(503).json({ success: false, message: 'JIRA integration not configured' });
        }

        const url = `${process.env.JIRA_BASE_URL}/rest/api/2/issue/${issueKey}?fields=summary,status,assignee,priority,issuetype`;

        const { status, body } = await jiraRequest(url);

        if (status !== 200) {
            return res.status(status).json({ success: false, message: `JIRA returned ${status}: ${body.errorMessages || body.message || ''}` });
        }

        res.json({
            success: true,
            issue: {
                key: body.key,
                summary: body.fields.summary,
                status: body.fields.status?.name,
                statusCategory: body.fields.status?.statusCategory?.name,
                assignee: body.fields.assignee?.displayName || 'Unassigned',
                priority: body.fields.priority?.name,
                issueType: body.fields.issuetype?.name
            }
        });
    } catch (error) {
        console.error('JIRA fetch error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch JIRA issue' });
    }
});

app.get('/api/jira/sprints', authMiddleware, async (req, res) => {
    try {
        if (!process.env.JIRA_BASE_URL || !process.env.JIRA_API_TOKEN) {
            return res.status(503).json({ success: false, message: 'JIRA integration not configured' });
        }

        const { projectKey } = req.query;
        if (!projectKey) {
            return res.status(400).json({ success: false, message: 'projectKey query param is required' });
        }

        const jiraBase = process.env.JIRA_BASE_URL.replace(/\/$/, '');

        // Step 1: find boards for this project
        const boardsUrl = `${jiraBase}/rest/agile/1.0/board?projectKeyOrId=${encodeURIComponent(projectKey)}&maxResults=10`;
        const { status: bs, body: boardsBody } = await jiraRequest(boardsUrl);
        console.log(`JIRA boards [${projectKey}] status=${bs} boards=${boardsBody?.values?.length}`);

        if (bs !== 200 || !boardsBody.values || boardsBody.values.length === 0) {
            return res.json({ success: true, sprints: [], message: `No boards found for project ${projectKey}` });
        }

        // Try all boards until we find one with sprints
        let sprints = [];
        for (const board of boardsBody.values) {
            if (board.type === 'kanban') continue; // kanban boards don't have sprints
            const sprintsUrl = `${jiraBase}/rest/agile/1.0/board/${board.id}/sprint?state=active,future&maxResults=20`;
            const { status: ss, body: sprintsBody } = await jiraRequest(sprintsUrl);
            console.log(`JIRA sprints board=${board.id} type=${board.type} status=${ss} count=${sprintsBody?.values?.length}`);

            if (ss === 200 && sprintsBody.values && sprintsBody.values.length > 0) {
                sprints = sprintsBody.values.map(s => ({
                    id: s.id,
                    name: s.name,
                    state: s.state,
                    startDate: s.startDate,
                    endDate: s.endDate
                }));
                break;
            }
        }

        res.json({ success: true, sprints });
    } catch (error) {
        console.error('JIRA sprints error:', error);
        res.status(500).json({ success: false, message: `Failed to fetch sprints: ${error.message}` });
    }
});

app.get('/api/jira/boards', authMiddleware, async (req, res) => {
    try {
        if (!process.env.JIRA_BASE_URL || !process.env.JIRA_API_TOKEN) {
            return res.status(503).json({ success: false, message: 'JIRA integration not configured', boards: [] });
        }
        const { projectKey } = req.query;
        if (!projectKey) {
            return res.status(400).json({ success: false, message: 'projectKey is required', boards: [] });
        }
        const jiraBase = process.env.JIRA_BASE_URL.replace(/\/$/, '');
        const url = `${jiraBase}/rest/agile/1.0/board?projectKeyOrId=${encodeURIComponent(projectKey)}&maxResults=50`;
        const { status, body } = await jiraRequest(url);
        if (status !== 200 || !body.values) {
            return res.json({ success: true, boards: [] });
        }
        const boards = body.values.map(b => ({ id: b.id, name: b.name, type: b.type }))
                                  .sort((a, b) => a.name.localeCompare(b.name));
        res.json({ success: true, boards });
    } catch (error) {
        console.error('JIRA boards error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch JIRA boards', boards: [] });
    }
});

app.get('/api/jira/projects', authMiddleware, async (req, res) => {
    try {
        if (!process.env.JIRA_BASE_URL || !process.env.JIRA_API_TOKEN) {
            return res.status(503).json({ success: false, message: 'JIRA integration not configured', projects: [] });
        }
        const jiraBase = process.env.JIRA_BASE_URL.replace(/\/$/, '');
        const url = `${jiraBase}/rest/api/2/project?maxResults=200`;
        const { status, body } = await jiraRequest(url);
        if (status !== 200 || !Array.isArray(body)) {
            return res.json({ success: true, projects: [] });
        }
        const projects = body.map(p => ({ key: p.key, name: p.name }))
                             .sort((a, b) => a.name.localeCompare(b.name));
        res.json({ success: true, projects });
    } catch (error) {
        console.error('JIRA projects error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch JIRA projects', projects: [] });
    }
});

app.get('/api/jira/teams', authMiddleware, async (req, res) => {
    try {
        if (!process.env.JIRA_BASE_URL || !process.env.JIRA_API_TOKEN) {
            return res.status(503).json({ success: false, message: 'JIRA integration not configured', teams: [] });
        }
        const { projectKey } = req.query;
        if (!projectKey) {
            return res.status(400).json({ success: false, message: 'projectKey is required', teams: [] });
        }
        const jiraBase = process.env.JIRA_BASE_URL.replace(/\/$/, '');
        const teamsMap = {};
        let startAt = 0;
        let total = 1;
        while (startAt < total && startAt < 500) {
            const url = `${jiraBase}/rest/api/2/search?jql=project=${encodeURIComponent(projectKey)}+AND+sprint+in+openSprints()&maxResults=100&startAt=${startAt}&fields=customfield_10317`;
            const { status, body } = await jiraRequest(url);
            if (status !== 200) break;
            total = body.total || 0;
            (body.issues || []).forEach(issue => {
                const t = issue.fields && issue.fields.customfield_10317;
                if (t && t.value) teamsMap[t.value] = true;
            });
            startAt += 100;
        }
        const teams = Object.keys(teamsMap).sort();
        res.json({ success: true, teams });
    } catch (error) {
        console.error('JIRA teams error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch JIRA teams', teams: [] });
    }
});

app.get('/api/jira/test', authMiddleware, async (req, res) => {
    try {
        if (!process.env.JIRA_BASE_URL || !process.env.JIRA_API_TOKEN) {
            return res.json({ success: false, message: 'Env vars missing', vars: { JIRA_BASE_URL: !!process.env.JIRA_BASE_URL, JIRA_API_TOKEN: !!process.env.JIRA_API_TOKEN } });
        }
        const url = `${process.env.JIRA_BASE_URL}/rest/api/2/myself`;
        const { status, body } = await jiraRequest(url);
        res.json({ success: status === 200, httpStatus: status, jiraUser: body.displayName || body.name, jiraEmail: body.emailAddress, error: status !== 200 ? body : undefined });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});


// ========== LINE OF BUSINESS MANAGEMENT ==========

// Get all Lines of Business
app.get('/api/line-of-business', authMiddleware, async (req, res) => {
    try {
        const lobs = await LineOfBusiness.find().sort({ name: 1 });
        res.json({
            success: true,
            lobs
        });
    } catch (error) {
        console.error('Get LOBs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve Lines of Business',
            error: error.message
        });
    }
});

// Get active Lines of Business (for dropdowns)
app.get('/api/line-of-business/active', async (req, res) => {
    try {
        const lobs = await LineOfBusiness.find({ isActive: true }).sort({ name: 1 });
        res.json({
            success: true,
            lobs: lobs.map(lob => lob.name)
        });
    } catch (error) {
        console.error('Get active LOBs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve active Lines of Business',
            error: error.message
        });
    }
});

// Get single Line of Business
app.get('/api/line-of-business/:id', authMiddleware, async (req, res) => {
    try {
        const lob = await LineOfBusiness.findById(req.params.id);
        
        if (!lob) {
            return res.status(404).json({
                success: false,
                message: 'Line of Business not found'
            });
        }
        
        res.json({
            success: true,
            lob
        });
    } catch (error) {
        console.error('Get LOB error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve Line of Business',
            error: error.message
        });
    }
});

// Create new Line of Business (Admin only)
app.post('/api/line-of-business', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        
        const { name, description } = req.body;
        
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Line of Business name is required'
            });
        }
        
        // Check if LOB already exists
        const existingLob = await LineOfBusiness.findOne({ name: name.trim() });
        if (existingLob) {
            return res.status(400).json({
                success: false,
                message: 'Line of Business already exists'
            });
        }
        
        const lob = new LineOfBusiness({
            name: name.trim(),
            description: description?.trim(),
            createdBy: req.user.username
        });
        
        await lob.save();
        
        res.json({
            success: true,
            message: 'Line of Business created successfully',
            lob
        });
    } catch (error) {
        console.error('Create LOB error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create Line of Business',
            error: error.message
        });
    }
});

// Update Line of Business (Admin only)
app.put('/api/line-of-business/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        
        const { name, description, isActive } = req.body;
        
        const lob = await LineOfBusiness.findById(req.params.id);
        
        if (!lob) {
            return res.status(404).json({
                success: false,
                message: 'Line of Business not found'
            });
        }
        
        // Check if new name conflicts with existing LOB
        if (name && name.trim() !== lob.name) {
            const existingLob = await LineOfBusiness.findOne({ name: name.trim() });
            if (existingLob) {
                return res.status(400).json({
                    success: false,
                    message: 'Line of Business with this name already exists'
                });
            }
            lob.name = name.trim();
        }
        
        if (description !== undefined) lob.description = description?.trim();
        if (isActive !== undefined) lob.isActive = isActive;
        
        lob.updatedBy = req.user.username;
        lob.updatedAt = new Date();
        
        await lob.save();
        
        res.json({
            success: true,
            message: 'Line of Business updated successfully',
            lob
        });
    } catch (error) {
        console.error('Update LOB error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update Line of Business',
            error: error.message
        });
    }
});

// Delete Line of Business (Admin only)
app.delete('/api/line-of-business/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        
        const lob = await LineOfBusiness.findById(req.params.id);
        
        if (!lob) {
            return res.status(404).json({
                success: false,
                message: 'Line of Business not found'
            });
        }
        
        // Check if LOB is being used by any initiatives
        const initiativesUsingLob = await Initiative.countDocuments({ businessUnit: lob.name });
        
        if (initiativesUsingLob > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete Line of Business. It is currently used by ${initiativesUsingLob} initiative(s). Please reassign those initiatives first.`
            });
        }
        
        await LineOfBusiness.findByIdAndDelete(req.params.id);
        
        res.json({
            success: true,
            message: 'Line of Business deleted successfully'
        });
    } catch (error) {
        console.error('Delete LOB error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete Line of Business',
            error: error.message
        });
    }
});

// ========== TEAM MEMBERS MANAGEMENT ==========

// Get all team members
app.get('/api/team-members', authMiddleware, async (req, res) => {
    try {
        const { team, project } = req.query;
        const query = { isActive: true };
        if (team) query.team = team;
        if (project) query.project = project;
        
        const members = await TeamMember.find(query).sort({ team: 1, name: 1 });
        res.json({
            success: true,
            members
        });
    } catch (error) {
        console.error('Get team members error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve team members',
            error: error.message
        });
    }
});

// Get unique project names
app.get('/api/team-members/projects', authMiddleware, async (req, res) => {
    try {
        const { team } = req.query;
        const query = { isActive: true, project: { $exists: true, $ne: '' } };
        if (team) query.team = team;
        const projects = await TeamMember.distinct('project', query);
        res.json({
            success: true,
            projects: projects.filter(Boolean).sort()
        });
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve projects',
            error: error.message
        });
    }
});

// Get unique team names
app.get('/api/team-members/teams', authMiddleware, async (req, res) => {
    try {
        const teams = await TeamMember.distinct('team', { isActive: true });
        res.json({
            success: true,
            teams: teams.sort()
        });
    } catch (error) {
        console.error('Get teams error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve teams',
            error: error.message
        });
    }
});

// Get single team member
app.get('/api/team-members/:id', authMiddleware, async (req, res) => {
    try {
        const member = await TeamMember.findById(req.params.id);
        
        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Team member not found'
            });
        }
        
        res.json({
            success: true,
            member
        });
    } catch (error) {
        console.error('Get team member error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve team member',
            error: error.message
        });
    }
});

// Create new team member (Admin only)
app.post('/api/team-members', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        
        const { name, role, team, project, email } = req.body;
        
        if (!name || !role || !team) {
            return res.status(400).json({
                success: false,
                message: 'Name, role, and team are required'
            });
        }
        
        const member = new TeamMember({
            name: name.trim(),
            role,
            team: team.trim(),
            project: project?.trim(),
            email: email?.trim(),
            createdBy: req.user.username
        });
        
        await member.save();
        
        res.json({
            success: true,
            message: 'Team member created successfully',
            member
        });
    } catch (error) {
        console.error('Create team member error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create team member',
            error: error.message
        });
    }
});

// Update team member (Admin only)
app.put('/api/team-members/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        
        const { name, role, team, project, email, isActive } = req.body;
        
        const member = await TeamMember.findById(req.params.id);
        
        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Team member not found'
            });
        }
        
        if (name) member.name = name.trim();
        if (role) member.role = role;
        if (team) member.team = team.trim();
        if (project !== undefined) member.project = project?.trim();
        if (email !== undefined) member.email = email?.trim();
        if (isActive !== undefined) member.isActive = isActive;
        
        member.updatedBy = req.user.username;
        member.updatedAt = new Date();
        
        await member.save();
        
        res.json({
            success: true,
            message: 'Team member updated successfully',
            member
        });
    } catch (error) {
        console.error('Update team member error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update team member',
            error: error.message
        });
    }
});

// Delete team member (Admin only)
app.delete('/api/team-members/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        
        const member = await TeamMember.findById(req.params.id);
        
        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Team member not found'
            });
        }
        
        // Check if member has capacity plans
        const capacityPlans = await CapacityPlan.countDocuments({ teamMemberId: req.params.id });
        
        if (capacityPlans > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete team member. They have ${capacityPlans} capacity plan(s). Please remove those first.`
            });
        }
        
        await TeamMember.findByIdAndDelete(req.params.id);
        
        res.json({
            success: true,
            message: 'Team member deleted successfully'
        });
    } catch (error) {
        console.error('Delete team member error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete team member',
            error: error.message
        });
    }
});

// ========== CAPACITY PLANNING ==========

// Get capacity plans with filters
app.get('/api/capacity-plans', authMiddleware, async (req, res) => {
    try {
        const { lineOfBusiness, program, project, team, pi } = req.query;
        
        const query = {};
        if (lineOfBusiness) query.lineOfBusiness = lineOfBusiness;
        if (program) query.program = program;
        if (project) query.project = project;
        if (team) query.team = team;
        if (pi) query.pi = pi;
        
        const plans = await CapacityPlan.find(query)
            .populate('teamMemberId')
            .sort({ teamMemberName: 1 });
        
        res.json({
            success: true,
            plans
        });
    } catch (error) {
        console.error('Get capacity plans error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve capacity plans',
            error: error.message
        });
    }
});

// Create or update capacity plan
app.post('/api/capacity-plans', authMiddleware, async (req, res) => {
    try {
        const { lineOfBusiness, project, team, pi, capacities } = req.body;
        
        if (!lineOfBusiness || !project || !team || !pi || !capacities) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required (lineOfBusiness, project, team, pi)'
            });
        }
        
        // Process each team member's capacity
        const results = [];
        
        for (const capacity of capacities) {
            const { teamMemberId, teamMemberName, role, capacityPercentage, sprints } = capacity;
            
            // Check if plan already exists
            let plan = await CapacityPlan.findOne({
                lineOfBusiness,
                project,
                team,
                pi,
                teamMemberId
            });
            
            if (plan) {
                // Update existing plan
                plan.sprints = sprints;
                plan.capacityPercentage = capacityPercentage !== undefined ? capacityPercentage : 100;
                plan.updatedBy = req.user.username;
                plan.updatedAt = new Date();
            } else {
                // Create new plan
                plan = new CapacityPlan({
                    lineOfBusiness,
                    project,
                    team,
                    pi,
                    teamMemberId,
                    teamMemberName,
                    role,
                    capacityPercentage: capacityPercentage !== undefined ? capacityPercentage : 100,
                    sprints,
                    createdBy: req.user.username
                });
            }
            
            await plan.save();
            results.push(plan);
        }
        
        res.json({
            success: true,
            message: 'Capacity plans saved successfully',
            plans: results
        });
    } catch (error) {
        console.error('Save capacity plans error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save capacity plans',
            error: error.message
        });
    }
});

// Get capacity summary/statistics
app.get('/api/capacity-plans/summary', authMiddleware, async (req, res) => {
    try {
        const { lineOfBusiness, program, project, team, sprint } = req.query;
        
        const query = {};
        if (lineOfBusiness) query.lineOfBusiness = lineOfBusiness;
        if (program) query.program = program;
        if (project) query.project = project;
        if (team) query.team = team;
        if (sprint) query.sprint = sprint;
        
        const plans = await CapacityPlan.find(query);
        
        // Calculate summary statistics
        const summary = {
            totalMembers: plans.length,
            totalCapacity: 0,
            averageCapacity: 0,
            sprintSummaries: {}
        };
        
        plans.forEach(plan => {
            plan.sprints.forEach(sprint => {
                if (!summary.sprintSummaries[sprint.sprintNumber]) {
                    summary.sprintSummaries[sprint.sprintNumber] = {
                        totalCapacity: 0,
                        memberCount: 0,
                        averageCapacity: 0
                    };
                }
                summary.sprintSummaries[sprint.sprintNumber].totalCapacity += sprint.capacity;
                summary.sprintSummaries[sprint.sprintNumber].memberCount++;
                summary.totalCapacity += sprint.capacity;
            });
        });
        
        // Calculate averages
        const totalSprints = Object.keys(summary.sprintSummaries).length;
        if (totalSprints > 0) {
            summary.averageCapacity = summary.totalCapacity / (plans.length * totalSprints);
            
            Object.keys(summary.sprintSummaries).forEach(sprintNum => {
                const sprintData = summary.sprintSummaries[sprintNum];
                sprintData.averageCapacity = sprintData.totalCapacity / sprintData.memberCount;
            });
        }
        
        res.json({
            success: true,
            summary
        });
    } catch (error) {
        console.error('Get capacity summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve capacity summary',
            error: error.message
        });
    }
});

// Delete capacity plan
app.delete('/api/capacity-plans/:id', authMiddleware, async (req, res) => {
    try {
        const plan = await CapacityPlan.findById(req.params.id);
        
        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Capacity plan not found'
            });
        }
        
        await CapacityPlan.findByIdAndDelete(req.params.id);
        
        res.json({
            success: true,
            message: 'Capacity plan deleted successfully'
        });
    } catch (error) {
        console.error('Delete capacity plan error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete capacity plan',
            error: error.message
        });
    }
});

// ========== ROLE MODULE MAPPING ==========

// Public endpoint: returns list of roles from MongoDB (excludes admin; used by signup + user management dropdowns)
app.get('/api/roles', async (req, res) => {
    try {
        let mappings = await RoleModuleMapping.find({ role: { $ne: 'admin' } }).sort({ role: 1 });

        // If no roles in DB at all, seed the defaults so dropdowns are never empty
        if (mappings.length === 0) {
            const defaults = [
                { role: 'product_owner',   label: 'Product Owner',   modules: { roadmap: true, storyEstimations: true,  capacityPlanning: true  } },
                { role: 'product_manager', label: 'Product Manager',  modules: { roadmap: true, storyEstimations: false, capacityPlanning: false } },
                { role: 'business_owner',  label: 'Business Owner',   modules: { roadmap: true, storyEstimations: false, capacityPlanning: false } },
                { role: 'stakeholder',     label: 'Stakeholder',      modules: { roadmap: true, storyEstimations: false, capacityPlanning: false } },
                { role: 'rte',             label: 'RTE (Release Train Engineer)', modules: { roadmap: true, storyEstimations: true, capacityPlanning: true } },
                { role: 'scrum_master',    label: 'Scrum Master',     modules: { roadmap: true, storyEstimations: true,  capacityPlanning: true  } }
            ];
            for (const d of defaults) {
                await RoleModuleMapping.findOneAndUpdate(
                    { role: d.role },
                    { label: d.label, modules: d.modules },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
            }
            mappings = await RoleModuleMapping.find({ role: { $ne: 'admin' } }).sort({ role: 1 });
        }

        // Deduplicate: prefer snake_case entries over display-name duplicates
        const seen = new Map();
        mappings.forEach(m => {
            const norm = m.role.toLowerCase().replace(/[\s_]+/g, '');
            const isSnake = /^[a-z_]+$/.test(m.role);
            if (!seen.has(norm) || isSnake) {
                seen.set(norm, { value: m.role, label: m.label || m.role });
            }
        });
        const roles = Array.from(seen.values());
        res.json({ success: true, roles });
    } catch (error) {
        res.status(500).json({ success: false, roles: [] });
    }
});

// Admin-only: clean up stale display-name role entries that have snake_case equivalents
app.delete('/api/role-module-mappings/cleanup', authMiddleware, async (req, res) => {
    try {
        const all = await RoleModuleMapping.find();
        const snakeKeys = new Set(all.filter(m => /^[a-z_]+$/.test(m.role)).map(m => m.role));
        const toDelete = all.filter(m => {
            if (/^[a-z_]+$/.test(m.role)) return false; // keep snake_case
            const snake = m.role.toLowerCase().replace(/\s+/g, '_');
            return snakeKeys.has(snake); // delete if snake version exists
        });
        const deleted = [];
        for (const doc of toDelete) {
            await RoleModuleMapping.findByIdAndDelete(doc._id);
            deleted.push(doc.role);
        }
        res.json({ success: true, deleted });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Get all role-module mappings
app.get('/api/role-module-mappings', authMiddleware, async (req, res) => {
    try {
        const mappings = await RoleModuleMapping.find().sort({ role: 1 });
        res.json({ success: true, mappings });
    } catch (error) {
        console.error('Get role-module mappings error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch mappings' });
    }
});

// Save all role-module mappings (upsert per role)
app.post('/api/role-module-mappings', authMiddleware, async (req, res) => {
    try {
        const { mappings } = req.body;
        if (!Array.isArray(mappings) || mappings.length === 0) {
            return res.status(400).json({ success: false, message: 'mappings array is required' });
        }
        const results = [];
        for (const m of mappings) {
            const doc = await RoleModuleMapping.findOneAndUpdate(
                { role: m.role.trim() },
                { label: m.label || m.role.trim(), modules: m.modules, updatedBy: req.user.username, updatedAt: new Date() },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            results.push(doc);
        }
        res.json({ success: true, message: 'Mappings saved successfully', mappings: results });
    } catch (error) {
        console.error('Save role-module mappings error:', error);
        res.status(500).json({ success: false, message: 'Failed to save mappings', error: error.message });
    }
});

// Delete a role mapping
app.delete('/api/role-module-mappings/:role', authMiddleware, async (req, res) => {
    try {
        await RoleModuleMapping.findOneAndDelete({ role: req.params.role });
        res.json({ success: true, message: 'Role deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete role' });
    }
});

// ========== HEALTH CHECK ==========

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'CarelonRx Roadmap API is running',
        timestamp: new Date().toISOString(),
        database: require('mongoose').connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

app.listen(PORT, () => {
    console.log(`\n🚀 CarelonRx Product 360 API Server`);
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log(`\n📋 Available endpoints:`);
    console.log(`\n   🗺️  ROADMAP MODULE:`);
    console.log(`   POST   /api/signup`);
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
    console.log(`   GET    /api/profile`);
    console.log(`   PUT    /api/profile`);
    console.log(`   GET    /api/stats`);
    console.log(`\n   🧮 STORY ESTIMATIONS MODULE:`);
    console.log(`   POST   /api/estimation-auth/login`);
    console.log(`   POST   /api/estimation-auth/logout`);
    console.log(`   GET    /api/estimation-auth/me`);
    console.log(`   PUT    /api/estimation-auth/last-session`);
    console.log(`   GET    /api/estimation-auth/session-history`);
    console.log(`   POST   /api/sessions`);
    console.log(`   GET    /api/sessions`);
    console.log(`   GET    /api/sessions/:sessionId`);
    console.log(`   PUT    /api/sessions/:sessionId`);
    console.log(`   DELETE /api/sessions/:sessionId`);
    console.log(`   POST   /api/sessions/:sessionId/participants`);
    console.log(`\n   📊 AUDIT LOGS MODULE:`);
    console.log(`   GET    /api/audit-logs`);
    console.log(`   GET    /api/audit-logs/stats`);
    console.log(`   GET    /api/audit-logs/session-ids`);
    console.log(`   GET    /api/audit-logs/export`);
    console.log(`   GET    /api/estimation-analysis/export`);
    console.log(`\n   ❤️  HEALTH:`);
    console.log(`   GET    /api/health`);
    console.log(`\n✅ Ready to accept requests!\n`);
});
