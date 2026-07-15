const mongoose = require('mongoose');

const roleModuleMappingSchema = new mongoose.Schema({
    role: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    label: {
        type: String,
        trim: true
    },
    modules: {
        requirementsIntake: { type: Boolean, default: true },
        roadmap:            { type: Boolean, default: true },
        capacityPlanning:   { type: Boolean, default: false },
        storyMapping:       { type: Boolean, default: false },
        storyEstimations:   { type: Boolean, default: false }
    },
    updatedBy: { type: String },
    updatedAt: { type: Date, default: Date.now }
});

roleModuleMappingSchema.set('strict', false);

module.exports = mongoose.model('RoleModuleMapping', roleModuleMappingSchema);
