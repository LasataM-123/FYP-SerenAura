const mongoose = require('mongoose');

const meditationSchema = new mongoose.Schema({
    title:{
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true
    },
    by:{
        type: String,
        required: true
    },
    imageUrl:{
        type: String,
        required: true
    },
    audioUrl:{
        type: String,
        required: true
    },
    moodCategory:{
        type: String,
        required: true
    },
    isLocked:{
        type: Boolean,
        default: false,
        required: true
    }
});

module.exports = mongoose.model("Meditaion",meditationSchema)