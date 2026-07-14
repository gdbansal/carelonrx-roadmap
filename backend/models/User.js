const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Encryption key for sensitive data (should be in environment variable in production)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'carelonrx-secure-key-2026-change-in-prod';
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

// Helper functions for email encryption
function encryptEmail(email) {
    try {
        const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
        let encrypted = cipher.update(email, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
        console.error('Email encryption error:', error);
        return email; // Fallback to plain text if encryption fails
    }
}

function decryptEmail(encryptedEmail) {
    try {
        if (!encryptedEmail || !encryptedEmail.includes(':')) {
            return encryptedEmail; // Return as-is if not encrypted format
        }
        const parts = encryptedEmail.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
        const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error('Email decryption error:', error);
        return encryptedEmail; // Return as-is if decryption fails
    }
}

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        set: encryptEmail,
        get: decryptEmail
    },
    role: {
        type: String,
        required: true,
        trim: true
    },
    profileImage: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date,
        default: null
    }
}, {
    toJSON: { getters: true },
    toObject: { getters: true }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }
    
    try {
        // Generate salt and hash password
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Method to get decrypted email
userSchema.methods.getDecryptedEmail = function() {
    return decryptEmail(this.email);
};

module.exports = mongoose.model('User', userSchema);
