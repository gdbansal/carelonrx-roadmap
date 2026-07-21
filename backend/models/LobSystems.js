const mongoose = require('mongoose');

const lobSystemsSchema = new mongoose.Schema({
    lob: {
        type: String,
        required: true,
        trim: true
    },
    systems: [{
        type: String,
        trim: true
    }],
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

lobSystemsSchema.index({ lob: 1 }, { unique: true });

module.exports = mongoose.model('LobSystems', lobSystemsSchema);
