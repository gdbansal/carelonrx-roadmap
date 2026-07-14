const mongoose = require('mongoose');

const sprintCapacitySchema = new mongoose.Schema({
    sprintNumber: {
        type: Number,
        required: true
    },
    sprintName: {
        type: String,
        trim: true
    },
    startDate: {
        type: Date,
        default: null
    },
    endDate: {
        type: Date,
        default: null
    },
    capacity: {
        type: Number,
        required: true,
        min: 0
    }
});

const capacityPlanSchema = new mongoose.Schema({
    lineOfBusiness: {
        type: String,
        required: true,
        trim: true
    },
    program: {
        type: String,
        required: false,
        trim: true
    },
    project: {
        type: String,
        required: true,
        trim: true
    },
    team: {
        type: String,
        required: true,
        trim: true
    },
    pi: {
        type: String,
        required: true,
        trim: true
    },
    teamMemberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TeamMember',
        required: true
    },
    teamMemberName: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    sprints: [sprintCapacitySchema],
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

// Compound index for efficient queries
capacityPlanSchema.index({ lineOfBusiness: 1, project: 1, team: 1, pi: 1 });
capacityPlanSchema.index({ teamMemberId: 1 });

module.exports = mongoose.model('CapacityPlan', capacityPlanSchema);
