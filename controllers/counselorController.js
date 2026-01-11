const Counselor = require('../models/counselorModel');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const cloudinary = require('../config/cloudinaryConfig');
const mongoose = require('mongoose');

const deleteUploadedFile = async (file) => {
    try {
        if (!file) return;

        let url = typeof file === "string" ? file : file.path;
        if (!url) return;
        const uploadIndex = url.indexOf('/upload/');
        if (uploadIndex === -1) return;

        const afterUpload = url.substring(uploadIndex + 8); 
        // Example: v1764859307/Patients/abc123.webp

        // Remove version
        const parts = afterUpload.split('/');
        parts.shift(); // remove v1764859307

        let publicId = parts.join('/');
        publicId = publicId.replace(/\.[^/.]+$/, ""); 

        if (publicId) {
            const res = await cloudinary.uploader.destroy(publicId);
            console.log("Cloudinary delete response:", res);
        }
    } catch (error) {
        console.error("Error deleting uploaded file from Cloudinary:", error);
    }
};



/**
 * @route  POST /api/counselors/create
 * @desc   Create counselor account
 * @access Private (admin only)
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

/**
 * @route  GET /api/counselors/admin/get-all
 * @desc   Get all counselors (for admin)
 * @access Private (admin only)
 */
const getCounselorForAdmin = asyncHandler(async (req, res) => {
  try {
    const counselors = await Counselor.find().select(
      "_id name profileUrl experience speciality"
    );

    const data = counselors.map(c => ({
      id: c._id,            
      name: c.name,
      experience: c.experience,
      speciality: c.speciality,
      profileUrl: c.profileUrl,
    }));

    res.set('X-Total-Count', data.length);
    res.set('Access-Control-Expose-Headers', 'X-Total-Count');

    return res.status(200).json(data); 
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

/**
 * @route  GET /api/counselors/admin/get/:id
 * @desc   Get counselor by Id (for admin)
 * @access Private (admin only)
 */
const getCounselorByIdForAdmin = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid counselor ID format." });
    }

    const c = await Counselor.findById(id).select(
      "_id name profileUrl experience speciality"
    );

    if (!c) {
      return res.status(404).json({ message: "Counselor not found." });
    }

    return res.status(200).json({
      id: c._id,                  
      name: c.name,
      experience: c.experience,
      speciality: c.speciality,
      profileUrl: c.profileUrl,
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

module.exports = { createCounselor, getCounselor, getCounselorById, deleteCounselorAccount, getCounselorByIdForAdmin, getCounselorForAdmin };