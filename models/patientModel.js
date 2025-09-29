const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
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

    },
    verified:{
        type: Boolean,
        default: false
    },
    isSubscribed:{
        type: Boolean,
        default: false
    },
    playlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Playlist'
    }],
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Favourite'
    }],
    chat:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat'
    }],
    moodEntry:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MoodEntry'
    }],
    recentSearch:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RecentSearch'
    }]

},{
    timestamps: true
});

module.exports = mongoose.model('Patient', patientSchema);