const asyncHandler = require('express-async-handler');
const BreathingExercise = require('../models/breathingExerciseModel');
const cloudinary = require('../config/cloudinaryConfig');

const deleteUploadedFile = async (file) => {
    if (!file || !file.path) return;
    try {
        const publicId = file.filename || file.path.split('/').pop().split('.')[0]; // Extract public ID
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error("Error deleting uploaded file from Cloudinary:", error);
    }
};

/**
 * @route  POST /api/breathe/create
 * @desc   Create breathing exercises
 * @access Public
 */
const createExercise = asyncHandler(async(req,res)=>{
    try{
        const {title, inhaleTime, exhaleTime, holdTime, cycles, inhaleDescription, exhaleDescription, holdDescription} = req.body;
        if(!title || !inhaleTime || !exhaleTime || !holdTime || !cycles || !inhaleDescription || !exhaleDescription || !holdDescription){
             await deleteUploadedFile(req.file);
            return res.status(400).json({ error: "Please fill all fields" });
        }
        const existingExercise = await BreathingExercise.findOne({title});
        if(existingExercise){
             res.status(400).json({ message: 'Exercise already exists' });
        }
        if (!req.file) {
            return res.status(400).json({ error: "Profile image is required" });
        }
        const imageUrl = req.file.path;
        const newExercise = await BreathingExercise.create({
            title,
            imageUrl,
            inhaleTime,
            exhaleTime,
            holdTime,
            cycles,
            inhaleDescription,
            exhaleDescription,
            holdDescription
        })
        if(!newExercise){
            return res.status(400).json({message: "Error while creating exercise"})
        }
        return res.status(201).json({success:true, newExercise});
    }catch(e){
        return res.status(500).json({message:e.message});
    }
})

/**
 * @route  GET /api/breathe/get
 * @desc   Get breathing exercises
 * @access Private (patient only)
 */
const getBreathing = asyncHandler(async(req,res)=>{
    try{
        const breathingExercise = await BreathingExercise.find();
        if(!breathingExercise){
            return res.status(404).json({message: "No breathing exercises found"})
        }
        const formattedExercises = breathingExercise.map((ex) => {
        const totalSeconds = (ex.inhaleTime + ex.holdTime + ex.exhaleTime) * ex.cycles;
        const totalMinutes = (totalSeconds / 60).toFixed(1); // round to 1 decimal
        return {
            _id: ex._id,
            title: ex.title,
            totalTime: Number(totalMinutes), // numeric value
            imageUrl: ex.imageUrl
        };
        });
        return res.status(200).json({success:true, breathingExercises: formattedExercises })
    }catch(e){
        return res.status(500).json({message: e.message});
    }
})

/**
 * @route  GET /get/:breatheId
 * @desc   Get breathing exercise by Id
 * @access Private (patient only)
 */
const getBreathingById = asyncHandler(async(req,res)=>{
    try{
        const {breatheId} = req.params;
        if(!breatheId){
            return res.status(400).json({message: "Breathe Id is required"});
        }
        const breathingExercise = await BreathingExercise.findById(breatheId);
        if(!breathingExercise){
            return res.status(404).json({message: "Breathing exercise not found"});
        }
        return res.status(200).json({success:true, breathingExercise});
    }catch(e){
        return res.status(500).json({message: e.message});
    }
})
module.exports = {createExercise, getBreathing, getBreathingById}
