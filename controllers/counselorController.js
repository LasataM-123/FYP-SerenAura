const Counselor = require('../models/counselorModel');
const asyncHandler = require('express-async-handler');
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
 * @route  PUT /api/counselors/edit-profile
 * @desc   Edit counselor profile
 * @access Private (counselor only)
 */
const editCounselorProfile = asyncHandler(async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, contactNumber, dateOfBirth, profileUrl } = req.body;

        // Find user in Patient or Counselor
        const user= await Counselor.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Update name & email
        if (name) user.name = name;
        if (contactNumber) user.contactNumber = contactNumber;
        // Update dateOfBirth with validation
        if (dateOfBirth) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(dateOfBirth)) {
                return res.status(400).json({ message: "Date of Birth must be in YYYY-MM-DD format" });
            }
            const [yearStr, monthStr, dayStr] = dateOfBirth.split("-");
            const year = parseInt(yearStr, 10);
            const month = parseInt(monthStr, 10);
            const day = parseInt(dayStr, 10);

            if (month < 1 || month > 12) {
                return res.status(400).json({ message: "Month must be between 01 and 12" });
            }

            const daysInMonth = [
                31,
                (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28,
                31, 30, 31, 30, 31, 31, 30, 31, 30, 31
            ];

            if (day < 1 || day > daysInMonth[month - 1]) {
                return res.status(400).json({
                    message: `Day must be between 01 and ${daysInMonth[month - 1]} for month ${monthStr}`,
                });
            }

            user.dateOfBirth = dateOfBirth;
        }

        // Handle profile picture
        if (req.file && req.file.path) {
            // Delete old profile image from Cloudinary
            if (user.profileUrl) {
                await deleteUploadedFile(user.profileUrl);
            }
            user.profileUrl = req.file.path; // multer + CloudinaryStorage sets secure URL here
        } else if (profileUrl) {
            // Update profileUrl via direct URL if provided
            if (user.profileUrl && user.profileUrl !== profileUrl) {
                await deleteUploadedFile(user.profileUrl);
            }
            user.profileUrl = profileUrl;
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            profile: {
                name: user.name,
                contactNumber: user.contactNumber || null,
    dob: user.dateOfBirth ? user.dateOfBirth.toISOString().split('T')[0] : null,
                profileUrl: user.profileUrl || null,
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
});


module.exports = {getCounselor, getCounselorById, deleteCounselorAccount, editCounselorProfile };