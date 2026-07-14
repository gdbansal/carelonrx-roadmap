const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        required: true,
        enum: ['Dev Lead', 'Developer', 'QA', 'Scrum Master', 'Product Owner', 'Architect', 'Designer', 'DevOps'],
        trim: true
    },
    team: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: String
    },
    updatedAt: {
        type: Date
    }
});

// Index for faster queries
teamMemberSchema.index({ team: 1, isActive: 1 });

module.exports = mongoose.model('TeamMember', teamMemberSchema);
