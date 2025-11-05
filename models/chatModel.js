const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    patientId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    counselorId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Counselor',
        required: true
    },
    status:{
        type: String,
        enum: ['active', 'closed','pending'],
        default: 'pending'
    },
    appointmentDate:{
        type: Date,
        required: true
    },
    requestSentDate:{
        type:Date,
        default: Date.now
    },
    endTime:{
        type:Date,
    },
    messages:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message'
        }
    ],
},{
    timestamps: true
});

module.exports = mongoose.model('Chat', chatSchema);