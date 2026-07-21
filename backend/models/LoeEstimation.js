const mongoose = require('mongoose');

const systemLoeSchema = new mongoose.Schema({
    system: { type: String, required: true },
    devEffort: { type: Number, default: 0 },
    qaEffort: { type: Number, default: 0 },
    supportEffort: { type: Number, default: 0 },
    confidencePct: { type: Number, default: 0, min: 0, max: 100 }
}, { _id: false });

const loeEstimationSchema = new mongoose.Schema({
    initiativeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Initiative', required: true, unique: true },
    initiativeName: { type: String },
    systems: [systemLoeSchema],
    blendedRate: { type: Number, default: 150 },
    hoursPerSp: { type: Number, default: 8 },
    lastUpdatedBy: { type: String },
    lastUpdatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('LoeEstimation', loeEstimationSchema);
