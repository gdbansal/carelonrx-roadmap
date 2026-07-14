const mongoose = require('mongoose');

const roleModuleMappingSchema = new mongoose.Schema({
    role: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    modules: {
        dashboard:        { type: Boolean, default: true },
        roadmap:          { type: Boolean, default: true },
        intake:           { type: Boolean, default: true },
        storyEstimations: { type: Boolean, default: false },
        capacityPlanning: { type: Boolean, default: false },
        analytics:        { type: Boolean, default: false },
        adminPanel:       { type: Boolean, default: false }
    },
    updatedBy: { type: String },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RoleModuleMapping', roleModuleMappingSchema);
