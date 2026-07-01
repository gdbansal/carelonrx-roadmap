const mongoose = require('mongoose');

const estimationSessionSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    teamName: {
        type: String,
        required: true
    },
    sprintValue: {
        type: String,
        required: true
    },
    createdBy: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    minimumActiveUntil: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'closed'],
        default: 'active'
    },
    closedBy: String,
    closedAt: Date,
    participants: [{
        name: String,
        role: {
            type: String,
            enum: ['Dev', 'QA', 'PO', 'SM', 'Admin']
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    stories: [{
        id: String,
        number: String,
        numberUrl: String,
        summary: String,
        title: String,
        restrictions: {
            devOnly: Boolean,
            qaOnly: Boolean
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    estimations: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    },
    completedStories: {
        type: Map,
        of: {
            completedBy: String,
            completedAt: Date
        },
        default: {}
    },
    revealedStories: {
        type: Map,
        of: {
            revealedBy: String,
            revealedAt: Date
        },
        default: {}
    },
    devEstimationReasons: [String],
    qaEstimationReasons: [String]
}, {
    timestamps: true
});

// Index for faster queries
estimationSessionSchema.index({ status: 1, createdAt: -1 });
estimationSessionSchema.index({ 'participants.name': 1 });

// Update lastUpdated on save
estimationSessionSchema.pre('save', function(next) {
    this.lastUpdated = new Date();
    next();
});

module.exports = mongoose.model('EstimationSession', estimationSessionSchema);
