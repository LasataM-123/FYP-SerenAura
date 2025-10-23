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
    },
    dateOfBirth:{
        type: Date,
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
    playlists: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Playlist'
    }],
    favourites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Favourite'
    }],
    chat:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat'
    }],
    recentSearch:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RecentSearch'
    }]

},{
    timestamps: true
});

module.exports = mongoose.model('Patient', patientSchema);