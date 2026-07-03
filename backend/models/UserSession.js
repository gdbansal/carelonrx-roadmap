const mongoose = require('mongoose');

const userSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EstimationUser',
        required: true,
        index: true
    },
    token: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true
    },
    ipAddress: String,
    userAgent: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastAccessedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: false
});

// Index for cleanup of expired sessions
userSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to check if session is valid
userSessionSchema.methods.isValid = function() {
    return this.expiresAt > new Date();
};

// Method to extend session
userSessionSchema.methods.extend = function(hours = 24) {
    this.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    this.lastAccessedAt = new Date();
    return this.save();
};

module.exports = mongoose.model('UserSession', userSessionSchema);
