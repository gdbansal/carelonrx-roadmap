const mongoose = require('mongoose');

const roleModuleMappingSchema = new mongoose.Schema({
    role: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    modules: {
        roadmap:          { type: Boolean, default: true },
        storyEstimations: { type: Boolean, default: false },
        capacityPlanning: { type: Boolean, default: false }
    },
    updatedBy: { type: String },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RoleModuleMapping', roleModuleMappingSchema);
