const mongoose = require('mongoose');

const counselorSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true
    },
    dateOfBirth:{
        type: Date,
        required: true
    },
    profileUrl:{
        type: String,
        required: true

    },
   experience:{
        type: Number,
        required: true
   },
   speciality:{
        type: String,
        required: true
   },
    chat:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat'
    }],
   notificationsEnabled: {
        type: Boolean,
        default: false 
    }

},{
    timestamps: true
});

module.exports = mongoose.model('Counselor', counselorSchema);