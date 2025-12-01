const Counselor = require('../models/counselorModel');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const cloudinary = require('../config/cloudinaryConfig');
const mongoose = require('mongoose');

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
 * @route  POST /api/counselors/create
 * @desc   Create counselor account
 * @access Public
 */
const createCounselor=asyncHandler(async(req, res) => {
    try{
        const { name, email, password, dateOfBirth, experience, speciality } = req.body;
        if(!name || !email || !password || !dateOfBirth || !experience || !speciality){
             await deleteUploadedFile(req.file);
            return res.status(400).json({ error: "Please fill all fields" });
        }
        const existingPatient = await Counselor.findOne({ email });
        if(existingPatient){
            res.status(400).json({ message: 'Counselor already exists' });
        }
        // Regex: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special character
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

        if (!passwordRegex.test(password)) {
        return res.status(400).json({
            message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        });
        }
         if (!req.file) {
            return res.status(400).json({ error: "Profile image is required" });
        }

        const profileUrl = req.file.path;

        const hashedPassword = await bcrypt.hash(password, 10);
        const counselor = await Counselor.create({
            name,
            email,
            password: hashedPassword,
            dateOfBirth,
            experience,
            speciality,
            profileUrl
        });
        res.status(201).json({counselor ,message:"Counselor created successfully"});
    }catch(e){
        res.status(500).json({ message: e.message });
    }
});

/**
 * @route  GET /api/counselors/get
 * @desc   Get all counselors
 * @access Public 
 */
const getCounselor = asyncHandler(async (req, res) => {
  try {
    const counselors = await Counselor.find().select(
      "_id name profileUrl experience speciality"
    );

    if (counselors.length === 0) {
      return res.status(404).json({message: "No counselors found." });
    }

    return res.status(200).json({
      success: true,
      counselors,
    });
  } catch (e) {
    return res.status(500).json({message: e.message });
  }
});


/**
 * @route  GET /api/counselors/get/:id
 * @desc   Get counselor by Id
 * @access Private (patient and counselor)
 */
const getCounselorById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Id is required." });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({message: "Invalid counselor ID format." });
    }

    const foundCounselor = await Counselor.findById(id).select(
      "_id name profileUrl experience speciality"
    );

    if (!foundCounselor) {
      return res.status(404).json({message: "Counselor not found." });
    }

    return res.status(200).json({
      success: true,
      counselor: foundCounselor,
    });
  } catch (e) {
    return res.status(500).json({message: e.message });
  }
});

/**
 * @route  DELETE /api/counselors/delete
 * @desc   Delete counselor account
 * @access Private (counselor only)
 */
const deleteCounselorAccount = asyncHandler(async (req, res) => {
    try {
        const userId = req.user.id;
        const counselor = await Counselor.findById(userId);

        if (!counselor) {
            return res.status(404).json({ message: "Counselor not found" });
        }

        // Delete profile image
        await deleteUploadedFile(counselor.profileUrl);

        // Delete counselor document
        await Counselor.findByIdAndDelete(userId);

        return res.status(200).json({
            success: true,
            message: "Counselor account deleted successfully"
        });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

module.exports = { createCounselor, getCounselor, getCounselorById, deleteCounselorAccount };