const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    timestamp: { 
        type: Date, 
        default: Date.now, 
        index: true 
    },
    event_type: { 
        type: String, 
        required: true,
        enum: [
            'SESSION_CREATED',
            'SESSION_JOINED',
            'SESSION_LEFT',
            'SESSION_ENDED',
            'ESTIMATION_PROVIDED',
            'STORY_CREATED',
            'STORY_UPDATED',
            'STORY_DELETED',
            'STORY_COMPLETED',
            'STORY_REOPENED',
            'USER_LOGIN',
            'USER_LOGOUT',
            'REASON_ADDED',
            'REASON_REMOVED',
            'DASHBOARD_VIEWED'
        ],
        index: true
    },
    user_id: { 
        type: String, 
        index: true 
    },
    session_id: { 
        type: String, 
        index: true,
        sparse: true
    },
    ip_address: String,
    user_agent: String,
    details: mongoose.Schema.Types.Mixed
}, {
    timestamps: false // We use our own timestamp field
});

// Index for efficient querying
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ event_type: 1, timestamp: -1 });
auditLogSchema.index({ session_id: 1, timestamp: -1 });
auditLogSchema.index({ user_id: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
