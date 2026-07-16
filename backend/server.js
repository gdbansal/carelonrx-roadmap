require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
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
const LoeEstimation = require('./models/LoeEstimation');
const { logAuditEvent } = require('./middleware/auditLogger');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy only in production (Render, EC2 behind Nginx)
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Connect to MongoDB
connectDB();

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));

// CORS - no wildcard fallback
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5000')
    .split(',').map(o => o.trim());
[
    'https://carelonrx-roadmap.onrender.com',
    'https://carelonrx-roadmap1.onrender.com',
    'http://localhost:5000',
    'http://localhost:3000',
    'http://localhost:8080',
    'http://127.0.0.1:5000'
].forEach(o => { if (!allowedOrigins.includes(o)) allowedOrigins.push(o); });

const corsOptions = {
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) ||
            /^http:\/\/(10|192\.168|172\.(1[6-9]|2\d|3[01]))\./i.test(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '2mb' }));

// S4: Rate limiting on auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false
});

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

// S1: Signed JWT tokens (replaces plain base64)
function generateToken(user) {
    return jwt.sign(
        { id: String(user._id || user.id), username: user.username },
        JWT_SECRET,
        { expiresIn: '8h' }
    );
}

async function verifyToken(token) {
    try {
        const decoded = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
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
            const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || crypto.randomBytes(16).toString('hex');
            console.log('ðŸ“ Initializing default admin user...');
            await User.create({
                username: 'admin',
                password: defaultPassword,
                name: 'Administrator',
                email: 'admin@carelon.com',
                role: 'admin'
            });
            console.log(`âœ… Default admin user created. Password: ${defaultPassword}`);
            console.log('âš ï¸  Set ADMIN_DEFAULT_PASSWORD in .env before first deploy, or change password immediately.');
        }
    } catch (error) {
        console.error('Error initializing default data:', error);
    }
}

// Call initialization after DB connection
setTimeout(initializeDefaultData, 2000);

// ========== AUTH ENDPOINTS ==========

app.post('/api/signup', authLimiter, async (req, res) => {
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

app.post('/api/login', authLimiter, async (req, res) => {
    try {
        console.log('Login attempt for user:', req.body?.username);
        const { username, password } = req.body;
        
        // Find user by username only
        const user = await User.findOne({ username });
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }
        
        // Compare password using bcrypt
        const isPasswordValid = await user.comparePassword(password);
        
        if (isPasswordValid) {
            
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
            error: 'An internal error occurred'
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
        
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                // Convert empty string to null for optional date fields
                if (['startDate', 'deliveryDate', 'sitStartDate', 'sitEndDate', 'uatStartDate', 'uatEndDate', 'businessCommitmentDate'].includes(field)) {
                    initiative[field] = req.body[field] || null;
                } else {
                    initiative[field] = req.body[field];
                }
            }
        });
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
            message: 'Error updating initiative' });
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
        if (profileImage !== undefined) {
            if (profileImage && Buffer.byteLength(profileImage, 'utf8') > 1.5 * 1024 * 1024) {
                return res.status(400).json({ success: false, message: 'Profile image must be under 1.5MB' });
            }
            user.profileImage = profileImage;
        }
        
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
        const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours
        
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
            message: 'Login failed' });
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
            message: 'Failed to get user info' });
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
            message: 'Logout failed' });
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
            message: 'Failed to update last session' });
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
            message: 'Failed to get session history' });
    }
});

// ========== STORY ESTIMATIONS API ==========

// Create a new estimation session
app.post('/api/sessions', async (req, res) => {
    try {
        
        // Support both formats: { sessionId, sessionData } and { sessionId, ...data }
        const { sessionId, sessionData, ...restData } = req.body;
        const dataToSave = sessionData || restData;
        
        // Check if session already exists
        const existingSession = await EstimationSession.findOne({ sessionId });
        if (existingSession) {
            return res.status(409).json({
                success: false,
                message: 'Session already exists'
            });
        }
        
        const session = new EstimationSession({
            sessionId,
            ...dataToSave
        });
        await session.save();
        
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
        console.error('âŒ Create session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create session' });
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
        
        res.json(sessionObj);
    } catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve session' });
    }
});

// Update a session
app.put('/api/sessions/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { sessionData } = req.body;
        
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
        
        res.json({
            success: true,
            message: 'Session updated successfully',
            session: session.toObject()
        });
    } catch (error) {
        console.error('âŒ Update session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update session' });
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
            message: 'Failed to add participant' });
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
            message: 'Failed to retrieve sessions' });
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
            message: 'Failed to close session' });
    }
});

// ========== AUDIT LOGS ==========

// Get audit logs with filters
app.get('/api/audit-logs', async (req, res) => {
    try {
        const rawLimit = parseInt(req.query.limit) || 100;
        const safeLimit = Math.min(rawLimit, 500);
        const { sessionId, userId, eventType, dateFrom, dateTo } = req.query;
        const limit = safeLimit;
        
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
            message: 'Failed to retrieve audit logs' });
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
            message: 'Failed to retrieve audit statistics' });
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
            message: 'Failed to retrieve session IDs' });
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
            message: 'Failed to export audit logs' });
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
            message: 'Failed to export estimation analysis' });
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

        if (bs !== 200 || !boardsBody.values || boardsBody.values.length === 0) {
            return res.json({ success: true, sprints: [], message: `No boards found for project ${projectKey}` });
        }

        // Try all boards until we find one with sprints
        let sprints = [];
        for (const board of boardsBody.values) {
            if (board.type === 'kanban') continue; // kanban boards don't have sprints
            const sprintsUrl = `${jiraBase}/rest/agile/1.0/board/${board.id}/sprint?state=active,future&maxResults=20`;
            const { status: ss, body: sprintsBody } = await jiraRequest(sprintsUrl);

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

// Active projects + active teams (boards with active sprints)
app.get('/api/jira/projects', async (req, res) => {
    try {
        if (!process.env.JIRA_BASE_URL || !process.env.JIRA_API_TOKEN) {
            return res.status(503).json({ success: false, message: 'JIRA integration not configured', projects: [] });
        }
        const jiraBase = process.env.JIRA_BASE_URL.replace(/\/$/, '');
        const { status, body } = await jiraRequest(`${jiraBase}/rest/api/2/project?maxResults=500`);
        if (status !== 200 || !Array.isArray(body)) {
            return res.status(500).json({ success: false, message: 'Failed to fetch projects', projects: [] });
        }
        // Deduplicate by key, sort by name
        const seen = new Set();
        const projects = body
            .filter(p => { if (seen.has(p.key)) return false; seen.add(p.key); return true; })
            .map(p => ({ key: p.key, name: p.name, label: `${p.name} (${p.key})` }))
            .sort((a, b) => a.name.localeCompare(b.name));
        res.json({ success: true, projects });
    } catch (error) {
        console.error('JIRA projects error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch projects', projects: [] });
    }
});

app.get('/api/jira/active-teams', async (req, res) => {
    try {
        if (!process.env.JIRA_BASE_URL || !process.env.JIRA_API_TOKEN) {
            return res.status(503).json({ success: false, message: 'JIRA integration not configured', data: [] });
        }
        const jiraBase = process.env.JIRA_BASE_URL.replace(/\/$/, '');

        // Step 1: Get all non-archived projects
        const { status: ps, body: projectsBody } = await jiraRequest(`${jiraBase}/rest/api/2/project?maxResults=500`);
        if (ps !== 200 || !Array.isArray(projectsBody)) {
            return res.json({ success: true, data: [] });
        }
        const activeProjects = projectsBody.filter(p => !p.archived);

        // Step 2: Get all boards (paginated)
        let allBoards = [];
        let boardStart = 0;
        let boardTotal = 1;
        while (boardStart < boardTotal) {
            const { status: bs, body: boardsBody } = await jiraRequest(
                `${jiraBase}/rest/agile/1.0/board?maxResults=50&startAt=${boardStart}`
            );
            if (bs !== 200 || !boardsBody.values) break;
            allBoards = allBoards.concat(boardsBody.values);
            boardTotal = boardsBody.total || 0;
            boardStart += 50;
            if (boardsBody.values.length === 0) break;
        }

        // Step 3: For each board, check active sprints in parallel (batches of 10)
        const activeBoardsByProject = {};
        const batchSize = 10;
        for (let i = 0; i < allBoards.length; i += batchSize) {
            const batch = allBoards.slice(i, i + batchSize);
            await Promise.all(batch.map(async (board) => {
                if (board.type === 'kanban') {
                    // Kanban boards don't have sprints â€” check recent issues instead
                    const projectKey = board.location && board.location.projectKey;
                    if (!projectKey) return;
                    if (!activeBoardsByProject[projectKey]) activeBoardsByProject[projectKey] = [];
                    activeBoardsByProject[projectKey].push({ id: board.id, name: board.name, type: 'kanban' });
                    return;
                }
                try {
                    const { status: ss, body: sprintsBody } = await jiraRequest(
                        `${jiraBase}/rest/agile/1.0/board/${board.id}/sprint?state=active&maxResults=1`
                    );
                    if (ss === 200 && sprintsBody.values && sprintsBody.values.length > 0) {
                        const projectKey = board.location && board.location.projectKey;
                        if (!projectKey) return;
                        if (!activeBoardsByProject[projectKey]) activeBoardsByProject[projectKey] = [];
                        activeBoardsByProject[projectKey].push({ id: board.id, name: board.name, type: 'scrum' });
                    }
                } catch (e) { /* skip board on error */ }
            }));
        }

        // Step 4: Build result â€” only active projects that have active teams
        const projectMap = {};
        activeProjects.forEach(p => { projectMap[p.key] = p.name; });

        const result = Object.entries(activeBoardsByProject)
            .filter(([key]) => projectMap[key])
            .map(([key, teams]) => ({
                projectKey: key,
                projectName: projectMap[key],
                activeTeams: teams.sort((a, b) => a.name.localeCompare(b.name))
            }))
            .sort((a, b) => a.projectName.localeCompare(b.projectName));

        res.json({ success: true, totalProjects: result.length, totalTeams: result.reduce((s, p) => s + p.activeTeams.length, 0), data: result });
    } catch (error) {
        console.error('JIRA active-teams error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch active teams', data: [] });
    }
});

// Sprints for a given team name (all: closed + active + future)
app.get('/api/jira/sprint-for-team', async (req, res) => {
    try {
        const { teamName } = req.query;
        if (!teamName) {
            return res.status(400).json({ success: false, message: 'teamName query param is required', sprints: [], preSelectedSprintId: null });
        }
        if (!process.env.JIRA_BASE_URL || !process.env.JIRA_API_TOKEN) {
            return res.status(503).json({ success: false, message: 'JIRA integration not configured', sprints: [], preSelectedSprintId: null });
        }
        const jiraBase = process.env.JIRA_BASE_URL.replace(/\/$/, '');

        // Step 1: Find board matching teamName (case-insensitive)
        let matchedBoard = null;
        let boardStart = 0;
        let boardTotal = 1;
        while (boardStart < boardTotal && !matchedBoard) {
            const { status: bs, body: boardsBody } = await jiraRequest(
                `${jiraBase}/rest/agile/1.0/board?maxResults=50&startAt=${boardStart}`
            );
            if (bs !== 200 || !boardsBody.values) break;
            matchedBoard = boardsBody.values.find(b =>
                b.name.toLowerCase() === teamName.toLowerCase()
            );
            boardTotal = boardsBody.total || 0;
            boardStart += 50;
            if (boardsBody.values.length === 0) break;
        }

        if (!matchedBoard) {
            return res.json({ success: false, message: `No board found for team: ${teamName}`, sprints: [], preSelectedSprintId: null });
        }

        // Step 2: Fetch ALL sprints (closed + active + future) paginated
        let allSprints = [];
        let sprintStart = 0;
        let sprintTotal = 1;
        while (sprintStart < sprintTotal) {
            const { status: ss, body: sprintsBody } = await jiraRequest(
                `${jiraBase}/rest/agile/1.0/board/${matchedBoard.id}/sprint?maxResults=50&startAt=${sprintStart}`
            );
            if (ss !== 200 || !sprintsBody.values) break;
            allSprints = allSprints.concat(sprintsBody.values);
            sprintTotal = sprintsBody.total || 0;
            sprintStart += 50;
            if (sprintsBody.values.length === 0) break;
        }

        // Step 3: Sort by startDate ascending
        allSprints.sort((a, b) => {
            const da = a.startDate ? new Date(a.startDate) : new Date(0);
            const db = b.startDate ? new Date(b.startDate) : new Date(0);
            return da - db;
        });

        // Step 4: Determine pre-selected sprint
        const activeSprint = allSprints.find(s => s.state === 'active');
        const activeIndex = activeSprint ? allSprints.indexOf(activeSprint) : -1;
        const nextSprint = activeIndex >= 0
            ? allSprints.slice(activeIndex + 1).find(s => s.state === 'future')
            : null;
        const preSelected = nextSprint || activeSprint || null;

        const sprints = allSprints.map(s => ({
            id: s.id,
            name: s.name,
            state: s.state,
            startDate: s.startDate || null,
            endDate: s.endDate || null
        }));

        res.json({
            success: true,
            boardId: matchedBoard.id,
            boardName: matchedBoard.name,
            sprints,
            preSelectedSprintId: preSelected ? preSelected.id : null,
            preSelectedSprintName: preSelected ? preSelected.name : null
        });
    } catch (error) {
        console.error('JIRA sprint-for-team error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch sprints', sprints: [], preSelectedSprintId: null });
    }
});

// Sprint issues for a given team + sprint name
app.get('/api/jira/sprint-issues', async (req, res) => {
    try {
        const { teamName, sprintName } = req.query;
        if (!teamName || !sprintName) {
            return res.status(400).json({ success: false, message: 'teamName and sprintName are required', issues: [] });
        }
        if (!process.env.JIRA_BASE_URL || !process.env.JIRA_API_TOKEN) {
            return res.status(503).json({ success: false, message: 'JIRA integration not configured', issues: [] });
        }
        const jiraBase = process.env.JIRA_BASE_URL.replace(/\/$/, '');

        // Step 1: Find board matching teamName
        let matchedBoard = null;
        let boardStart = 0;
        let boardTotal = 1;
        while (boardStart < boardTotal && !matchedBoard) {
            const { status: bs, body: boardsBody } = await jiraRequest(
                `${jiraBase}/rest/agile/1.0/board?maxResults=50&startAt=${boardStart}`
            );
            if (bs !== 200 || !boardsBody.values) break;
            matchedBoard = boardsBody.values.find(b =>
                b.name.toLowerCase() === teamName.toLowerCase()
            );
            boardTotal = boardsBody.total || 0;
            boardStart += 50;
            if (boardsBody.values.length === 0) break;
        }
        if (!matchedBoard) {
            return res.json({ success: false, message: `No board found for team: ${teamName}`, issues: [] });
        }

        // Step 2: Find sprint matching sprintName on that board
        let matchedSprint = null;
        let sprintStart = 0;
        let sprintTotal = 1;
        while (sprintStart < sprintTotal && !matchedSprint) {
            const { status: ss, body: sprintsBody } = await jiraRequest(
                `${jiraBase}/rest/agile/1.0/board/${matchedBoard.id}/sprint?maxResults=50&startAt=${sprintStart}`
            );
            if (ss !== 200 || !sprintsBody.values) break;
            matchedSprint = sprintsBody.values.find(s =>
                s.name.toLowerCase() === sprintName.toLowerCase()
            );
            sprintTotal = sprintsBody.total || 0;
            sprintStart += 50;
            if (sprintsBody.values.length === 0) break;
        }
        if (!matchedSprint) {
            return res.json({ success: false, message: `No sprint found: ${sprintName}`, issues: [] });
        }

        // Step 3: Fetch all issues in that sprint (paginated)
        let allIssues = [];
        let issueStart = 0;
        let issueTotal = 1;
        while (issueStart < issueTotal) {
            const { status: is, body: issuesBody } = await jiraRequest(
                `${jiraBase}/rest/agile/1.0/sprint/${matchedSprint.id}/issue?maxResults=50&startAt=${issueStart}&fields=summary,status,issuetype,assignee`
            );
            if (is !== 200 || !issuesBody.issues) break;
            allIssues = allIssues.concat(issuesBody.issues);
            issueTotal = issuesBody.total || 0;
            issueStart += 50;
            if (issuesBody.issues.length === 0) break;
        }

        const issues = allIssues.map(issue => ({
            id: issue.id,
            key: issue.key,
            summary: issue.fields.summary,
            status: issue.fields.status ? issue.fields.status.name : 'Unknown',
            issueType: issue.fields.issuetype ? issue.fields.issuetype.name : 'Story',
            assignee: issue.fields.assignee ? issue.fields.assignee.displayName : 'Unassigned',
            url: `${jiraBase}/browse/${issue.key}`
        }));

        res.json({
            success: true,
            boardName: matchedBoard.name,
            sprintName: matchedSprint.name,
            total: issues.length,
            issues
        });
    } catch (error) {
        console.error('JIRA sprint-issues error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch sprint issues', issues: [] });
    }
});

// ========== JIRA2 INTEGRATION (Elevance Health) ==========

function jiraRequest2(url) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.JIRA2_API_TOKEN}`,
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

app.get('/api/jira2/projects', authMiddleware, async (req, res) => {
    try {
        if (!process.env.JIRA2_BASE_URL || !process.env.JIRA2_API_TOKEN) {
            return res.status(503).json({ success: false, message: 'JIRA2 integration not configured', projects: [] });
        }
        const jiraBase = process.env.JIRA2_BASE_URL.replace(/\/$/, '');
        const url = `${jiraBase}/rest/api/2/project?maxResults=200`;
        const { status, body } = await jiraRequest2(url);
        if (status !== 200 || !Array.isArray(body)) {
            return res.json({ success: true, projects: [] });
        }
        const projects = body.map(p => ({ key: p.key, name: p.name }))
                             .sort((a, b) => a.name.localeCompare(b.name));
        res.json({ success: true, projects });
    } catch (error) {
        console.error('JIRA2 projects error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch JIRA2 projects', projects: [] });
    }
});

app.get('/api/jira2/teams', authMiddleware, async (req, res) => {
    try {
        if (!process.env.JIRA2_BASE_URL || !process.env.JIRA2_API_TOKEN) {
            return res.status(503).json({ success: false, message: 'JIRA2 integration not configured', teams: [] });
        }
        const { projectKey } = req.query;
        if (!projectKey) {
            return res.status(400).json({ success: false, message: 'projectKey is required', teams: [] });
        }
        const jiraBase = process.env.JIRA2_BASE_URL.replace(/\/$/, '');
        const teamsMap = {};
        let startAt = 0;
        let total = 1;
        while (startAt < total && startAt < 500) {
            const url = `${jiraBase}/rest/api/2/search?jql=project=${encodeURIComponent(projectKey)}+AND+sprint+in+openSprints()&maxResults=100&startAt=${startAt}&fields=customfield_12479`;
            const { status, body } = await jiraRequest2(url);
            if (status !== 200) break;
            total = body.total || 0;
            (body.issues || []).forEach(issue => {
                const raw = issue.fields && issue.fields.customfield_12479;
                if (!raw) return;
                const items = Array.isArray(raw) ? raw : [raw];
                items.forEach(item => {
                    if (item && item.value && !item.disabled) teamsMap[item.value] = true;
                });
            });
            startAt += 100;
        }
        const teams = Object.keys(teamsMap).sort();
        res.json({ success: true, teams });
    } catch (error) {
        console.error('JIRA2 teams error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch JIRA2 teams', teams: [] });
    }
});

app.get('/api/jira2/boards', authMiddleware, async (req, res) => {
    try {
        if (!process.env.JIRA2_BASE_URL || !process.env.JIRA2_API_TOKEN) {
            return res.status(503).json({ success: false, message: 'JIRA2 integration not configured', boards: [] });
        }
        const { projectKey } = req.query;
        if (!projectKey) {
            return res.status(400).json({ success: false, message: 'projectKey is required', boards: [] });
        }
        const jiraBase = process.env.JIRA2_BASE_URL.replace(/\/$/, '');
        const url = `${jiraBase}/rest/agile/1.0/board?projectKeyOrId=${encodeURIComponent(projectKey)}&maxResults=50`;
        const { status, body } = await jiraRequest2(url);
        if (status !== 200 || !body.values) {
            return res.json({ success: true, boards: [] });
        }
        const boards = body.values.map(b => ({ id: b.id, name: b.name, type: b.type }))
                                  .sort((a, b) => a.name.localeCompare(b.name));
        res.json({ success: true, boards });
    } catch (error) {
        console.error('JIRA2 boards error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch JIRA2 boards', boards: [] });
    }
});

app.get('/api/jira2/sprints', authMiddleware, async (req, res) => {
    try {
        if (!process.env.JIRA2_BASE_URL || !process.env.JIRA2_API_TOKEN) {
            return res.status(503).json({ success: false, message: 'JIRA2 integration not configured' });
        }
        const { projectKey } = req.query;
        if (!projectKey) {
            return res.status(400).json({ success: false, message: 'projectKey query param is required' });
        }
        const jiraBase = process.env.JIRA2_BASE_URL.replace(/\/$/, '');
        const boardsUrl = `${jiraBase}/rest/agile/1.0/board?projectKeyOrId=${encodeURIComponent(projectKey)}&maxResults=10`;
        const { status: bs, body: boardsBody } = await jiraRequest2(boardsUrl);
        if (bs !== 200 || !boardsBody.values || boardsBody.values.length === 0) {
            return res.json({ success: true, sprints: [] });
        }
        let sprints = [];
        for (const board of boardsBody.values) {
            if (board.type === 'kanban') continue;
            const sprintsUrl = `${jiraBase}/rest/agile/1.0/board/${board.id}/sprint?state=active,future&maxResults=20`;
            const { status: ss, body: sprintsBody } = await jiraRequest2(sprintsUrl);
            if (ss === 200 && sprintsBody.values && sprintsBody.values.length > 0) {
                sprints = sprintsBody.values.map(s => ({
                    id: s.id, name: s.name, state: s.state,
                    startDate: s.startDate, endDate: s.endDate
                }));
                break;
            }
        }
        res.json({ success: true, sprints });
    } catch (error) {
        console.error('JIRA2 sprints error:', error);
        res.status(500).json({ success: false, message: `Failed to fetch JIRA2 sprints: ${error.message}` });
    }
});

app.get('/api/jira2/test', authMiddleware, async (req, res) => {
    try {
        if (!process.env.JIRA2_BASE_URL || !process.env.JIRA2_API_TOKEN) {
            return res.json({ success: false, message: 'JIRA2 env vars missing', vars: { JIRA2_BASE_URL: !!process.env.JIRA2_BASE_URL, JIRA2_API_TOKEN: !!process.env.JIRA2_API_TOKEN } });
        }
        const url = `${process.env.JIRA2_BASE_URL}/rest/api/2/myself`;
        const { status, body } = await jiraRequest2(url);
        res.json({ success: status === 200, httpStatus: status, jiraUser: body.displayName || body.name, jiraEmail: body.emailAddress, error: status !== 200 ? body : undefined });
    } catch (error) {
        res.json({ success: false, message: error.message });
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


// ========== CONFLUENCE INTEGRATION (CarelonRx) ==========

function confluenceRequest(url) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.CONFLUENCE_API_TOKEN}`,
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
                    resolve({ status: resp.statusCode, body: { message: `Non-JSON response: ${data.substring(0, 200)}` } });
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

app.get('/api/confluence/test', authMiddleware, async (req, res) => {
    try {
        if (!process.env.CONFLUENCE_BASE_URL || !process.env.CONFLUENCE_API_TOKEN) {
            return res.json({ success: false, message: 'Confluence env vars missing', vars: { CONFLUENCE_BASE_URL: !!process.env.CONFLUENCE_BASE_URL, CONFLUENCE_API_TOKEN: !!process.env.CONFLUENCE_API_TOKEN } });
        }
        const url = `${process.env.CONFLUENCE_BASE_URL.replace(/\/$/, '')}/rest/api/user/current`;
        const { status, body } = await confluenceRequest(url);
        res.json({ success: status === 200, httpStatus: status, confluenceUser: body.displayName || body.username, error: status !== 200 ? body : undefined });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

app.get('/api/confluence/spaces', authMiddleware, async (req, res) => {
    try {
        if (!process.env.CONFLUENCE_BASE_URL || !process.env.CONFLUENCE_API_TOKEN) {
            return res.status(503).json({ success: false, message: 'Confluence integration not configured', spaces: [] });
        }
        const base = process.env.CONFLUENCE_BASE_URL.replace(/\/$/, '');
        const url = `${base}/rest/api/space?limit=200&type=global`;
        const { status, body } = await confluenceRequest(url);
        if (status !== 200 || !body.results) {
            return res.json({ success: true, spaces: [] });
        }
        const spaces = body.results.map(s => ({ key: s.key, name: s.name, type: s.type }))
                                   .sort((a, b) => a.name.localeCompare(b.name));
        res.json({ success: true, spaces });
    } catch (error) {
        console.error('Confluence spaces error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch Confluence spaces', spaces: [] });
    }
});

app.get('/api/confluence/pages', authMiddleware, async (req, res) => {
    try {
        if (!process.env.CONFLUENCE_BASE_URL || !process.env.CONFLUENCE_API_TOKEN) {
            return res.status(503).json({ success: false, message: 'Confluence integration not configured', pages: [] });
        }
        const { spaceKey, title } = req.query;
        if (!spaceKey) {
            return res.status(400).json({ success: false, message: 'spaceKey is required', pages: [] });
        }
        const base = process.env.CONFLUENCE_BASE_URL.replace(/\/$/, '');
        let url = `${base}/rest/api/content?spaceKey=${encodeURIComponent(spaceKey)}&type=page&limit=50&expand=version`;
        if (title) url += `&title=${encodeURIComponent(title)}`;
        const { status, body } = await confluenceRequest(url);
        if (status !== 200 || !body.results) {
            return res.json({ success: true, pages: [] });
        }
        const pages = body.results.map(p => ({ id: p.id, title: p.title, url: `${base}${p._links && p._links.webui ? p._links.webui : ''}`, version: p.version && p.version.number }));
        res.json({ success: true, pages });
    } catch (error) {
        console.error('Confluence pages error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch Confluence pages', pages: [] });
    }
});

app.get('/api/confluence/search', authMiddleware, async (req, res) => {
    try {
        if (!process.env.CONFLUENCE_BASE_URL || !process.env.CONFLUENCE_API_TOKEN) {
            return res.status(503).json({ success: false, message: 'Confluence integration not configured', results: [] });
        }
        const { query, spaceKey } = req.query;
        if (!query) {
            return res.status(400).json({ success: false, message: 'query is required', results: [] });
        }
        const base = process.env.CONFLUENCE_BASE_URL.replace(/\/$/, '');
        let cql = `type=page AND text~"${query}"`;
        if (spaceKey) cql += ` AND space="${spaceKey}"`;
        const url = `${base}/rest/api/content/search?cql=${encodeURIComponent(cql)}&limit=25&expand=space`;
        const { status, body } = await confluenceRequest(url);
        if (status !== 200 || !body.results) {
            return res.json({ success: true, results: [] });
        }
        const results = body.results.map(p => ({ id: p.id, title: p.title, space: p.space && p.space.name, url: `${base}${p._links && p._links.webui ? p._links.webui : ''}` }));
        res.json({ success: true, results });
    } catch (error) {
        console.error('Confluence search error:', error);
        res.status(500).json({ success: false, message: 'Failed to search Confluence', results: [] });
    }
});

app.get('/api/confluence/page/:pageId', authMiddleware, async (req, res) => {
    try {
        if (!process.env.CONFLUENCE_BASE_URL || !process.env.CONFLUENCE_API_TOKEN) {
            return res.status(503).json({ success: false, message: 'Confluence integration not configured' });
        }
        const base = process.env.CONFLUENCE_BASE_URL.replace(/\/$/, '');
        const url = `${base}/rest/api/content/${req.params.pageId}?expand=body.storage,version,space`;
        const { status, body } = await confluenceRequest(url);
        if (status !== 200) {
            return res.json({ success: false, message: 'Page not found' });
        }
        res.json({ success: true, page: { id: body.id, title: body.title, space: body.space && body.space.name, version: body.version && body.version.number, body: body.body && body.body.storage && body.body.storage.value, url: `${base}${body._links && body._links.webui ? body._links.webui : ''}` } });
    } catch (error) {
        console.error('Confluence page error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch Confluence page' });
    }
});

// ========== CONFLUENCE2 INTEGRATION (Elevance Health) ==========

function confluenceRequest2(url) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.CONFLUENCE2_API_TOKEN}`,
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
                    resolve({ status: resp.statusCode, body: { message: `Non-JSON response: ${data.substring(0, 200)}` } });
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

app.get('/api/confluence2/test', authMiddleware, async (req, res) => {
    try {
        if (!process.env.CONFLUENCE2_BASE_URL || !process.env.CONFLUENCE2_API_TOKEN) {
            return res.json({ success: false, message: 'Confluence2 env vars missing', vars: { CONFLUENCE2_BASE_URL: !!process.env.CONFLUENCE2_BASE_URL, CONFLUENCE2_API_TOKEN: !!process.env.CONFLUENCE2_API_TOKEN } });
        }
        const url = `${process.env.CONFLUENCE2_BASE_URL.replace(/\/$/, '')}/rest/api/user/current`;
        const { status, body } = await confluenceRequest2(url);
        res.json({ success: status === 200, httpStatus: status, confluenceUser: body.displayName || body.username, error: status !== 200 ? body : undefined });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

app.get('/api/confluence2/spaces', authMiddleware, async (req, res) => {
    try {
        if (!process.env.CONFLUENCE2_BASE_URL || !process.env.CONFLUENCE2_API_TOKEN) {
            return res.status(503).json({ success: false, message: 'Confluence2 integration not configured', spaces: [] });
        }
        const base = process.env.CONFLUENCE2_BASE_URL.replace(/\/$/, '');
        const url = `${base}/rest/api/space?limit=200&type=global`;
        const { status, body } = await confluenceRequest2(url);
        if (status !== 200 || !body.results) {
            return res.json({ success: true, spaces: [] });
        }
        const spaces = body.results.map(s => ({ key: s.key, name: s.name, type: s.type }))
                                   .sort((a, b) => a.name.localeCompare(b.name));
        res.json({ success: true, spaces });
    } catch (error) {
        console.error('Confluence2 spaces error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch Confluence2 spaces', spaces: [] });
    }
});

app.get('/api/confluence2/pages', authMiddleware, async (req, res) => {
    try {
        if (!process.env.CONFLUENCE2_BASE_URL || !process.env.CONFLUENCE2_API_TOKEN) {
            return res.status(503).json({ success: false, message: 'Confluence2 integration not configured', pages: [] });
        }
        const { spaceKey, title } = req.query;
        if (!spaceKey) {
            return res.status(400).json({ success: false, message: 'spaceKey is required', pages: [] });
        }
        const base = process.env.CONFLUENCE2_BASE_URL.replace(/\/$/, '');
        let url = `${base}/rest/api/content?spaceKey=${encodeURIComponent(spaceKey)}&type=page&limit=50&expand=version`;
        if (title) url += `&title=${encodeURIComponent(title)}`;
        const { status, body } = await confluenceRequest2(url);
        if (status !== 200 || !body.results) {
            return res.json({ success: true, pages: [] });
        }
        const pages = body.results.map(p => ({ id: p.id, title: p.title, url: `${base}${p._links && p._links.webui ? p._links.webui : ''}`, version: p.version && p.version.number }));
        res.json({ success: true, pages });
    } catch (error) {
        console.error('Confluence2 pages error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch Confluence2 pages', pages: [] });
    }
});

app.get('/api/confluence2/search', authMiddleware, async (req, res) => {
    try {
        if (!process.env.CONFLUENCE2_BASE_URL || !process.env.CONFLUENCE2_API_TOKEN) {
            return res.status(503).json({ success: false, message: 'Confluence2 integration not configured', results: [] });
        }
        const { query, spaceKey } = req.query;
        if (!query) {
            return res.status(400).json({ success: false, message: 'query is required', results: [] });
        }
        const base = process.env.CONFLUENCE2_BASE_URL.replace(/\/$/, '');
        let cql = `type=page AND text~"${query}"`;
        if (spaceKey) cql += ` AND space="${spaceKey}"`;
        const url = `${base}/rest/api/content/search?cql=${encodeURIComponent(cql)}&limit=25&expand=space`;
        const { status, body } = await confluenceRequest2(url);
        if (status !== 200 || !body.results) {
            return res.json({ success: true, results: [] });
        }
        const results = body.results.map(p => ({ id: p.id, title: p.title, space: p.space && p.space.name, url: `${base}${p._links && p._links.webui ? p._links.webui : ''}` }));
        res.json({ success: true, results });
    } catch (error) {
        console.error('Confluence2 search error:', error);
        res.status(500).json({ success: false, message: 'Failed to search Confluence2', results: [] });
    }
});

app.get('/api/confluence2/page/:pageId', authMiddleware, async (req, res) => {
    try {
        if (!process.env.CONFLUENCE2_BASE_URL || !process.env.CONFLUENCE2_API_TOKEN) {
            return res.status(503).json({ success: false, message: 'Confluence2 integration not configured' });
        }
        const base = process.env.CONFLUENCE2_BASE_URL.replace(/\/$/, '');
        const url = `${base}/rest/api/content/${req.params.pageId}?expand=body.storage,version,space`;
        const { status, body } = await confluenceRequest2(url);
        if (status !== 200) {
            return res.json({ success: false, message: 'Page not found' });
        }
        res.json({ success: true, page: { id: body.id, title: body.title, space: body.space && body.space.name, version: body.version && body.version.number, body: body.body && body.body.storage && body.body.storage.value, url: `${base}${body._links && body._links.webui ? body._links.webui : ''}` } });
    } catch (error) {
        console.error('Confluence2 page error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch Confluence2 page' });
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
            message: 'Failed to retrieve Lines of Business' });
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
            message: 'Failed to retrieve active Lines of Business' });
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
            message: 'Failed to retrieve Line of Business' });
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
            message: 'Failed to create Line of Business' });
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
            message: 'Failed to update Line of Business' });
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
            message: 'Failed to delete Line of Business' });
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
            message: 'Failed to retrieve team members' });
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
            message: 'Failed to retrieve projects' });
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
            message: 'Failed to retrieve teams' });
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
            message: 'Failed to retrieve team member' });
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
            message: 'Failed to create team member' });
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
            message: 'Failed to update team member' });
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
            message: 'Failed to delete team member' });
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
            message: 'Failed to retrieve capacity plans' });
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
            message: 'Failed to save capacity plans' });
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
            message: 'Failed to retrieve capacity summary' });
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
            message: 'Failed to delete capacity plan' });
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
                { $set: { label: m.label || m.role.trim(), modules: m.modules, updatedBy: req.user.username, updatedAt: new Date() } },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            results.push(doc);
        }
        res.json({ success: true, message: 'Mappings saved successfully', mappings: results });
    } catch (error) {
        console.error('Save role-module mappings error:', error);
        res.status(500).json({ success: false, message: 'Failed to save mappings' });
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

// ========== LOE ESTIMATION MODULE ==========

// GET /api/loe â€” list all saved LOE initiatives (for dropdown)
app.get('/api/loe', authMiddleware, async (req, res) => {
    try {
        const loes = await LoeEstimation.find({}, 'initiativeId initiativeName lastUpdatedAt lastUpdatedBy').sort({ lastUpdatedAt: -1 });
        res.json({ success: true, loes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch LOE list' });
    }
});

// GET /api/loe/:initiativeId â€” get LOE for an initiative (merges latest dependent systems)
app.get('/api/loe/:initiativeId', authMiddleware, async (req, res) => {
    try {
        const initiative = await Initiative.findById(req.params.initiativeId);
        if (!initiative) return res.status(404).json({ success: false, message: 'Initiative not found' });

        const latestSystems = (initiative.dependentSystems || []).map(s => s.system).filter(Boolean);
        let loe = await LoeEstimation.findOne({ initiativeId: req.params.initiativeId });

        if (!loe) {
            // First time â€” build skeleton from initiative's dependent systems
            return res.json({
                success: true,
                initiativeId: req.params.initiativeId,
                initiativeName: initiative.name,
                systems: latestSystems.map(s => ({ system: s, devEffort: 0, qaEffort: 0, supportEffort: 0, confidencePct: 0 })),
                blendedRate: 150,
                hoursPerSp: 8,
                isNew: true
            });
        }

        // Merge: keep saved values, add any new systems from initiative, flag removed ones
        const savedMap = {};
        loe.systems.forEach(s => { savedMap[s.system] = s; });

        const mergedSystems = latestSystems.map(s => savedMap[s]
            ? { system: s, devEffort: savedMap[s].devEffort, qaEffort: savedMap[s].qaEffort, supportEffort: savedMap[s].supportEffort, confidencePct: savedMap[s].confidencePct }
            : { system: s, devEffort: 0, qaEffort: 0, supportEffort: 0, confidencePct: 0, isNew: true }
        );

        // Flag systems that were removed from initiative but have LOE data
        loe.systems.forEach(s => {
            if (!latestSystems.includes(s.system) && (s.devEffort || s.qaEffort || s.supportEffort)) {
                mergedSystems.push({ system: s.system, devEffort: s.devEffort, qaEffort: s.qaEffort, supportEffort: s.supportEffort, confidencePct: s.confidencePct, removed: true });
            }
        });

        res.json({
            success: true,
            initiativeId: req.params.initiativeId,
            initiativeName: initiative.name,
            systems: mergedSystems,
            blendedRate: loe.blendedRate,
            hoursPerSp: loe.hoursPerSp,
            lastUpdatedBy: loe.lastUpdatedBy,
            lastUpdatedAt: loe.lastUpdatedAt
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch LOE' });
    }
});

// PUT /api/loe/:initiativeId â€” save/update LOE
app.put('/api/loe/:initiativeId', authMiddleware, async (req, res) => {
    try {
        const { systems, blendedRate, hoursPerSp } = req.body;
        const initiative = await Initiative.findById(req.params.initiativeId);
        if (!initiative) return res.status(404).json({ success: false, message: 'Initiative not found' });

        const loe = await LoeEstimation.findOneAndUpdate(
            { initiativeId: req.params.initiativeId },
            {
                initiativeId: req.params.initiativeId,
                initiativeName: initiative.name,
                systems: systems || [],
                blendedRate: blendedRate || 150,
                hoursPerSp: hoursPerSp || 8,
                lastUpdatedBy: req.user?.username || req.user?.name || 'Unknown',
                lastUpdatedAt: new Date()
            },
            { upsert: true, new: true }
        );
        res.json({ success: true, message: 'LOE saved', loe });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to save LOE' });
    }
});

// GET /api/loe/:initiativeId/export â€” export LOE as CSV (for Excel)
app.get('/api/loe/:initiativeId/export', authMiddleware, async (req, res) => {
    try {
        const initiative = await Initiative.findById(req.params.initiativeId);
        const loe = await LoeEstimation.findOne({ initiativeId: req.params.initiativeId });
        if (!initiative) return res.status(404).json({ success: false, message: 'Initiative not found' });

        const systems = loe ? loe.systems : [];
        const blendedRate = loe?.blendedRate || 150;
        const hoursPerSp = loe?.hoursPerSp || 8;

        let csv = `LOE Estimation â€” ${initiative.name}\n`;
        csv += `Blended Rate: $${blendedRate}/hr | Hours per SP: ${hoursPerSp}\n\n`;
        csv += `Dependent System,Dev Effort (SP),QA Effort (SP),Support Effort (SP),Total SP,Dev $(USD),QA $(USD),Support $(USD),Total $(USD),Confidence %\n`;

        let totalDev = 0, totalQA = 0, totalSupport = 0;
        systems.forEach(s => {
            const rowSP = (s.devEffort || 0) + (s.qaEffort || 0) + (s.supportEffort || 0);
            const devD  = (s.devEffort || 0) * hoursPerSp * blendedRate;
            const qaD   = (s.qaEffort || 0) * hoursPerSp * blendedRate;
            const supD  = (s.supportEffort || 0) * hoursPerSp * blendedRate;
            totalDev += (s.devEffort || 0); totalQA += (s.qaEffort || 0); totalSupport += (s.supportEffort || 0);
            csv += `${s.system},${s.devEffort || 0},${s.qaEffort || 0},${s.supportEffort || 0},${rowSP},${devD},${qaD},${supD},${devD + qaD + supD},${s.confidencePct || 0}%\n`;
        });

        const grandSP = totalDev + totalQA + totalSupport;
        const grandD  = grandSP * hoursPerSp * blendedRate;
        csv += `GRAND TOTAL,${totalDev},${totalQA},${totalSupport},${grandSP},${totalDev * hoursPerSp * blendedRate},${totalQA * hoursPerSp * blendedRate},${totalSupport * hoursPerSp * blendedRate},${grandD},\n`;

        const filename = `LOE_${initiative.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Export failed' });
    }
});

// ========== STORY MAPPING MODULE ==========

// Helper: detect JIRA instance from URL
function getJiraCredentials(url) {
    if (url.includes('elevancehealth.com')) {
        return { base: process.env.JIRA2_BASE_URL, token: process.env.JIRA2_API_TOKEN };
    }
    return { base: process.env.JIRA_BASE_URL, token: process.env.JIRA_API_TOKEN };
}

// Helper: make authenticated request to any JIRA/Confluence instance
function makeAuthRequest(url, token) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        };
        const https = require('https');
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
                catch(e) { resolve({ status: res.statusCode, body: data }); }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

// POST /api/story-mapping/fetch-jira â€” fetch JIRA feature issue content (uses same jiraRequest as active-teams/sprint-for-team)
app.post('/api/story-mapping/fetch-jira', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ success: false, message: 'JIRA URL is required' });
        if (!process.env.JIRA_BASE_URL || !process.env.JIRA_API_TOKEN) {
            return res.status(503).json({ success: false, message: 'JIRA not configured on server' });
        }

        // Extract issue key from URL (e.g. VPIE-1234)
        const match = url.match(/\/browse\/([A-Z]+-\d+)/) || url.match(/([A-Z]+-\d+)/);
        if (!match) return res.status(400).json({ success: false, message: 'Could not extract issue key from URL' });
        const issueKey = match[1];
        const jiraBase = process.env.JIRA_BASE_URL.replace(/\/$/, '');

        // Use same jiraRequest helper as all other working JIRA endpoints
        const { status, body } = await jiraRequest(
            `${jiraBase}/rest/api/2/issue/${issueKey}?expand=names,renderedFields&fields=*all`
        );
        if (status !== 200) return res.status(status).json({ success: false, message: `JIRA returned ${status}` });

        const fields = body.fields || {};
        const fieldsMeta = body.names || {};
        let acceptanceCriteria = '';

        // Find Acceptance Criteria field by name dynamically
        for (const [fieldId, fieldName] of Object.entries(fieldsMeta)) {
            if (fieldName && fieldName.toLowerCase().includes('acceptance criteria')) {
                const raw = fields[fieldId];
                if (raw && typeof raw === 'string') { acceptanceCriteria = raw; break; }
                const rendered = body.renderedFields?.[fieldId];
                if (rendered) {
                    acceptanceCriteria = rendered.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                    break;
                }
                if (raw && typeof raw === 'object') { acceptanceCriteria = JSON.stringify(raw); break; }
            }
        }

        res.json({
            success: true,
            issueKey,
            featureName: fields.summary || '',
            summary: fields.summary || '',
            description: fields.description || '',
            acceptanceCriteria,
            issueType: fields.issuetype?.name || 'Feature',
            project: { key: fields.project?.key, name: fields.project?.name },
            url
        });
    } catch (error) {
        console.error('Story mapping fetch-jira error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch JIRA issue' });
    }
});

// POST /api/story-mapping/fetch-confluence â€” fetch Confluence page content (uses same token as JIRA)
app.post('/api/story-mapping/fetch-confluence', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ success: false, message: 'Confluence URL is required' });
        if (!process.env.JIRA_API_TOKEN) {
            return res.status(503).json({ success: false, message: 'JIRA token not configured on server' });
        }

        // Extract page ID from URL â€” supports /pages/123456 and /display/SPACE/Title?pageId=123456
        let pageId = null;
        const pageIdMatch = url.match(/\/pages\/(\d+)/) || url.match(/[?&]pageId=(\d+)/);
        if (pageIdMatch) pageId = pageIdMatch[1];
        if (!pageId) return res.status(400).json({ success: false, message: 'Could not extract page ID from Confluence URL' });

        const confBase = process.env.CONFLUENCE_BASE_URL
            ? process.env.CONFLUENCE_BASE_URL.replace(/\/$/, '')
            : 'https://confluence.carelonrx.com';

        // Use same jiraRequest pattern â€” reuse helper with confluence base
        const { status, body } = await jiraRequest(
            `${confBase}/rest/api/content/${pageId}?expand=body.view,body.storage`
        );
        if (status !== 200) return res.status(status).json({ success: false, message: `Confluence returned ${status}` });

        const htmlContent = body.body?.view?.value || body.body?.storage?.value || '';
        const plainText = htmlContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

        res.json({
            success: true,
            pageId,
            title: body.title || '',
            content: plainText,
            url
        });
    } catch (error) {
        console.error('Story mapping fetch-confluence error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch Confluence page' });
    }
});

// Rule-based story analyzer
function analyzeWithRules(featureData, confluenceData) {
    const STORY_KEYWORDS = ['user can', 'user should', 'user must', 'should be able', 'must be able',
        'display', 'show', 'view', 'verify', 'validate', 'notify', 'receive', 'see', 'access',
        'able to', 'allow', 'provide', 'confirm', 'present'];
    const TASK_KEYWORDS = ['implement', 'create', 'build', 'develop', 'integrate', 'configure',
        'setup', 'set up', 'migrate', 'update', 'modify', 'refactor', 'add', 'remove', 'delete',
        'api', 'service', 'database', 'schema', 'backend', 'script', 'deploy', 'infrastructure'];

    function classify(text) {
        const lower = text.toLowerCase();
        let storyScore = STORY_KEYWORDS.filter(k => lower.includes(k)).length;
        let taskScore = TASK_KEYWORDS.filter(k => lower.includes(k)).length;
        return taskScore > storyScore ? 'Task' : 'Story';
    }

    function makeSummary(text, maxLen = 80) {
        const clean = text.replace(/^\s*[-â€¢*\d.]+\s*/, '').trim();
        return clean.length > maxLen ? clean.substring(0, maxLen).trim() + '...' : clean;
    }

    function makeAcceptanceCriteria(text, type) {
        const clean = text.replace(/^\s*[-â€¢*\d.]+\s*/, '').trim();
        if (type === 'Story') return `Given the feature is implemented,\nWhen ${clean.toLowerCase()},\nThen the system should behave as expected.`;
        return `Complete the following: ${clean}`;
    }

    // Parse AC text into bullet points
    const acText = featureData.acceptanceCriteria || featureData.description || '';
    const confText = confluenceData?.content || '';
    const combined = `${acText}\n${confText}`.trim();

    // Split into individual items
    const rawItems = combined
        .split(/\n|<br\s*\/?>/i)
        .map(l => l.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ' ').trim())
        .filter(l => l.length > 15);

    // Deduplicate
    const seen = new Set();
    const items = rawItems.filter(l => { const k = l.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });

    const results = [];
    let epicAdded = false;

    // Always add one Epic (hidden by default)
    results.push({
        id: `item-0`,
        type: 'Epic',
        summary: featureData.featureName || featureData.summary || 'Feature Epic',
        acceptanceCriteria: '',
        expectation: '',
        approved: false,
        hidden: true
    });

    items.slice(0, 20).forEach((item, i) => {
        const type = classify(item);
        results.push({
            id: `item-${i + 1}`,
            type,
            summary: makeSummary(item),
            acceptanceCriteria: type === 'Story' ? makeAcceptanceCriteria(item, type) : '',
            expectation: type === 'Task' ? makeAcceptanceCriteria(item, type) : '',
            approved: false,
            hidden: false
        });
    });

    return results;
}

// POST /api/story-mapping/analyze
app.post('/api/story-mapping/analyze', async (req, res) => {
    try {
        const { featureData, confluenceData } = req.body;
        if (!featureData) return res.status(400).json({ success: false, message: 'featureData is required' });

        const mode = process.env.STORY_MAPPING_MODE || 'rule-based';
        const items = analyzeWithRules(featureData, confluenceData);

        res.json({
            success: true,
            mode,
            total: items.length,
            stories: items.filter(i => i.type === 'Story').length,
            tasks: items.filter(i => i.type === 'Task').length,
            epics: items.filter(i => i.type === 'Epic').length,
            items
        });
    } catch (error) {
        console.error('Story mapping analyze error:', error);
        res.status(500).json({ success: false, message: 'Analysis failed' });
    }
});

// POST /api/story-mapping/create-tickets â€” create approved tickets in JIRA
app.post('/api/story-mapping/create-tickets', async (req, res) => {
    try {
        const { items, projectKey, jiraBaseUrl } = req.body;
        if (!items || !projectKey) return res.status(400).json({ success: false, message: 'items and projectKey are required' });

        const { base, token } = getJiraCredentials(jiraBaseUrl || '');
        if (!base || !token) return res.status(503).json({ success: false, message: 'JIRA not configured' });
        const jiraBase = base.replace(/\/$/, '');

        const created = [];
        const failed = [];

        for (const item of items) {
            if (!item.approved || item.type === 'Epic') continue;
            try {
                const issueBody = {
                    fields: {
                        project: { key: projectKey },
                        summary: item.summary,
                        description: item.summary,
                        issuetype: { name: item.type }
                    }
                };
                const https = require('https');
                const payload = JSON.stringify(issueBody);
                const parsedUrl = new URL(`${jiraBase}/rest/api/2/issue`);
                const result = await new Promise((resolve, reject) => {
                    const options = {
                        hostname: parsedUrl.hostname,
                        path: parsedUrl.pathname,
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'Content-Length': Buffer.byteLength(payload)
                        }
                    };
                    const req2 = https.request(options, (r) => {
                        let d = '';
                        r.on('data', c => d += c);
                        r.on('end', () => { try { resolve({ status: r.statusCode, body: JSON.parse(d) }); } catch(e) { resolve({ status: r.statusCode, body: d }); } });
                    });
                    req2.on('error', reject);
                    req2.write(payload);
                    req2.end();
                });

                if (result.status === 201) {
                    created.push({ itemId: item.id, key: result.body.key, url: `${jiraBase}/browse/${result.body.key}` });
                } else {
                    failed.push({ itemId: item.id, summary: item.summary, error: JSON.stringify(result.body) });
                }
            } catch (e) {
                failed.push({ itemId: item.id, summary: item.summary, error: e.message });
            }
        }

        res.json({ success: true, created, failed, totalCreated: created.length, totalFailed: failed.length });
    } catch (error) {
        console.error('Story mapping create-tickets error:', error);
        res.status(500).json({ success: false, message: 'Failed to create tickets' });
    }
});

app.listen(PORT, () => {
    console.log(`Product 360 API running on port ${PORT}`);
});
