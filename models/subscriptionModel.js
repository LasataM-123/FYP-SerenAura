const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    subscriptionType:{
        type: String,
        enum: ['monthly', 'yearly'],
        required: true
    },
    startDate:{
        type: Date,
        required: true
    },
    endDate:{
        type: Date,
        required: true
    },
    status:{
        type: String,
        enum: ['active', 'expired', 'cancelled'],
        required: true
    }
},{
    timestamps: true
});

module.exports = mongoose.model('Subscription', subscriptionSchema);