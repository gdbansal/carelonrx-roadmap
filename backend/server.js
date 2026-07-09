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
        
        const allowedRoles = ['product_owner', 'product_manager', 'business_owner', 'stakeholder', 'rte', 'scrum_master'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role selected. Admin role cannot be assigned during signup.'
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
                program: i.program,
                year: i.year,
                quarter: i.quarter,
                startDate: i.startDate,
                deliveryDate: i.deliveryDate,
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
                    program: initiative.program,
                    year: initiative.year,
                    quarter: initiative.quarter,
                    startDate: initiative.startDate,
                    deliveryDate: initiative.deliveryDate,
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
        const fieldsToTrack = ['name', 'description', 'program', 'year', 'quarter', 'startDate', 'deliveryDate', 
                               'budgetApproved', 'priority', 'holdReason', 'wsjf', 'userBusinessValue', 'timeCriticality', 
                               'riskReduction', 'jobSize', 'owner', 'businessValue', 'risks'];
        
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

function jiraRequest(url, auth) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`,
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
                    reject(new Error('Invalid JSON from JIRA'));
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

        if (!process.env.JIRA_BASE_URL || !process.env.JIRA_EMAIL || !process.env.JIRA_API_TOKEN) {
            return res.status(503).json({ success: false, message: 'JIRA integration not configured' });
        }

        const base64Auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');
        const url = `${process.env.JIRA_BASE_URL}/rest/api/2/issue/${issueKey}?fields=summary,status,assignee,priority,issuetype`;

        const { status, body } = await jiraRequest(url, base64Auth);

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

app.get('/api/jira/test', authMiddleware, async (req, res) => {
    try {
        if (!process.env.JIRA_BASE_URL || !process.env.JIRA_EMAIL || !process.env.JIRA_API_TOKEN) {
            return res.json({ success: false, message: 'Env vars missing', vars: { JIRA_BASE_URL: !!process.env.JIRA_BASE_URL, JIRA_EMAIL: !!process.env.JIRA_EMAIL, JIRA_API_TOKEN: !!process.env.JIRA_API_TOKEN } });
        }
        const base64Auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');
        const url = `${process.env.JIRA_BASE_URL}/rest/api/2/myself`;
        const { status, body } = await jiraRequest(url, base64Auth);
        res.json({ success: status === 200, httpStatus: status, jiraUser: body.displayName || body.name, jiraEmail: body.emailAddress, error: status !== 200 ? body : undefined });
    } catch (error) {
        res.json({ success: false, message: error.message });
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
