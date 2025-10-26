const mongoose = require('mongoose');

const breathingExerciseSchema = new mongoose.Schema({
    title:{
        type: String,
        required: true
    },
    imageUrl:{
        type:String,
        required:true
    },
    inhaleTime:{
        type: Number,
        required:true
    },
    exhaleTime:{
        type:Number,
        required: true
    },
    holdTime:{
        type:Number,
        required: true
    },
    cycles:{
        type:Number,
        required: true
    },
    inhaleDescription:{
        type:String,
        required: true
    },
    exhaleDescription:{
        type:String,
        required: true
    },
    holdDescription:{
        type:String,
        required: true
    }
},{
    timestamps: true
})

module.exports = mongoose.model("BreathingExercise",breathingExerciseSchema);