const mongoose = require('mongoose');

const estimationUserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        sparse: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['Dev', 'QA', 'PO', 'SM', 'Admin'],
        required: true
    },
    // Track user's last active session for auto-resume
    lastActiveSessionId: {
        type: String,
        default: null
    },
    lastActiveSessionAt: {
        type: Date,
        default: null
    },
    // Session history for analytics
    sessionHistory: [{
        sessionId: String,
        sessionName: String,
        lastAccessed: Date,
        role: String
    }],
    // User preferences
    preferences: {
        autoJoinLastSession: {
            type: Boolean,
            default: true
        },
        defaultRole: String
    },
    // Tracking
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLoginAt: {
        type: Date,
        default: Date.now
    },
    loginCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for faster queries
estimationUserSchema.index({ name: 1, role: 1 });
estimationUserSchema.index({ lastLoginAt: -1 });

// Method to update last session
estimationUserSchema.methods.updateLastSession = function(sessionId, sessionName) {
    this.lastActiveSessionId = sessionId;
    this.lastActiveSessionAt = new Date();
    
    // Add to session history (keep last 10)
    const historyEntry = {
        sessionId,
        sessionName,
        lastAccessed: new Date(),
        role: this.role
    };
    
    // Remove if already exists
    this.sessionHistory = this.sessionHistory.filter(h => h.sessionId !== sessionId);
    
    // Add to beginning
    this.sessionHistory.unshift(historyEntry);
    
    // Keep only last 10
    if (this.sessionHistory.length > 10) {
        this.sessionHistory = this.sessionHistory.slice(0, 10);
    }
    
    return this.save();
};

// Method to record login
estimationUserSchema.methods.recordLogin = function() {
    this.lastLoginAt = new Date();
    this.loginCount += 1;
    return this.save();
};

module.exports = mongoose.model('EstimationUser', estimationUserSchema);
