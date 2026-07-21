const mongoose = require('mongoose');

const dependentSystemSchema = new mongoose.Schema({
    system: String,
    pmSpoc: String,
    jiraUrl: String
}, { _id: false });

const changeLogSchema = new mongoose.Schema({
    action: String,
    user: String,
    username: String,
    timestamp: Date,
    changes: String,
    fieldChanges: [{
        field: String,
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed
    }]
}, { _id: false });

const initiativeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    businessUnit: {
        type: String,
        required: true
    },
    program: {
        type: String,
        required: true
    },
    year: {
        type: String,
        required: true
    },
    quarter: {
        type: String,
        required: true
    },
    startDate: {
        type: String,
        default: null
    },
    deliveryDate: {
        type: String,
        default: null
    },
    sitStartDate: {
        type: String,
        default: null
    },
    sitEndDate: {
        type: String,
        default: null
    },
    uatStartDate: {
        type: String,
        default: null
    },
    uatEndDate: {
        type: String,
        default: null
    },
    businessCommitmentDate: {
        type: String,
        default: null
    },
    budgetApproved: {
        type: String,
        enum: ['Approved', 'Pending', 'Rejected', null],
        default: 'Pending'
    },
    priority: {
        type: String,
        required: true,
        enum: ['Critical', 'High', 'Medium', 'Low', 'On Hold']
    },
    holdReason: {
        type: String,
        default: null
    },
    wsjf: {
        type: Number,
        default: null
    },
    userBusinessValue: {
        type: Number,
        default: null
    },
    timeCriticality: {
        type: Number,
        default: null
    },
    riskReduction: {
        type: Number,
        default: null
    },
    jobSize: {
        type: Number,
        default: null
    },
    owner: {
        type: String,
        required: true
    },
    dependentSystems: [dependentSystemSchema],
    businessValue: String,
    risks: String,
    dependencies: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: String,
        required: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    updatedBy: String,
    changeLog: [changeLogSchema]
});

module.exports = mongoose.model('Initiative', initiativeSchema);
