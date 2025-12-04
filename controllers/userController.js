const Patient = require('../models/patientModel');
const Counselor = require('../models/counselorModel');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const OTP_EXPIRY = 5 * 60; 
const JWT_SECRET = process.env.JWT_SECRET_KEY;
const cloudinary = require('../config/cloudinaryConfig');
const Playlist = require('../models/playlistModel');
const PlaylistJunction = require('../models/playlistJunctionModel');
const Favourite = require('../models/favouriteModel');
const RecentSearch = require('../models/recentSearchModel');
const Mood = require("../models/moodModel");
const Onboarding = require("../models/onboardingModel")
const deleteUploadedFile = async (file) => {
    try {
        if (!file) return;

        let url = typeof file === "string" ? file : file.path;
        if (!url) return;
        const uploadIndex = url.indexOf('/upload/');
        if (uploadIndex === -1) return;

        const afterUpload = url.substring(uploadIndex + 8); 

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



// --- Helper: generate OTP ---
const generateOTP = () =>
  Math.floor(1000 + Math.random() * 9000).toString();

// --- Helper: send password reset email ---
const sendPasswordResetEmail = async (email, otp) => {
   const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  
  await transporter.sendMail({
    from: `"SerenAura" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🔐 Reset your SerenAura password",
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 40px 0;">
        <div style="max-width: 500px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-align: center;">
          <h1 style="color: #553434;">Password Reset Request</h1>
          <p style="color: #555;">You requested to reset your SerenAura account password. Use the OTP below to proceed:</p>
       <div style="font-size: 32px; font-weight: bold; color: #74CEE2; margin: 20px 0; letter-spacing: 4px; background-color: #f0f8ff; padding: 15px 0; border-radius: 8px;">
      ${otp}
    </div>
          <p style="color: #555;">This OTP will expire in <strong>5 minutes</strong>.</p>
          <p style="color: #999;">If you did not request this, please ignore this email.</p>
           <p style="color: #999; font-size: 12px; margin-top: 10px;">
      &copy; ${new Date().getFullYear()} SerenAura
    </p>
        </div>
      </div>
    `,
  });
};

/**
 * @route  POST /api/users/forgot-password
 * @desc   Enter email of user to send OTP code
 * @access Public
 */
const forgotPassword = asyncHandler(async(req,res)=>{
  try{
    const {email} = req.body;
    if(!email){
      return res.status(400).json({message:"Please enter your email"});
    }
    let user = await Patient.findOne({email});
    if(!user){
      user = await Counselor.findOne({email});
    }
    if(!user) return res.status(400).json({message:"Please enter a valid email of your SerenAura account"});
    const otp = generateOTP();

    // Put user info in token 
    const otpToken = jwt.sign(
      { email, otp },
      JWT_SECRET,
      { expiresIn: `${OTP_EXPIRY}s` }
    );

     await sendPasswordResetEmail(email, otp);
    res.json({ otpToken, message: "OTP sent to email. Please verify." });

  }catch(err){
    return res.status(400).json({message:err.message});
  }
})

/**
 * @route  POST /api/users/reset-password
 * @desc   Reset password after OTP verification
 * @access Public
 */
const resetPassword = asyncHandler(async(req,res)=>{
  try{
    const { email, newPassword, confirmPassword } = req.body;
    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Please fill all fields" });
    }
    if(newPassword !== confirmPassword){
      return res.status(400).json({message:"Passwords do not match"});
    }
    const user = await Patient.findOne({ email });
    if (!user) {
     user = await Counselor.findOne({ email });
    }
    if(!user) return res.status(400).json({message:"User not found"});

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"});
    }
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ success: "Password reset successful" });
  }catch(err){
    return res.status(400).json({message:err.message});
  }
});

/**
 * @route  POST /api/users/add-dob
 * @desc   Add date of birth for patients registered via Google
 * @access Private (patient only)
 */
const addDOB = asyncHandler(async (req, res) => {
  try{
    const { dateOfBirth } = req.body;
    if(!dateOfBirth){
      return res.status(400).json({message:"Please provide your date of birth"});
    }
    // Validate date format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateOfBirth)) {
      return res.status(400).json({ message: "Date of Birth must be in YYYY-MM-DD format" });
    }

    // Split into parts
    const [yearStr, monthStr, dayStr] = dateOfBirth.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    // Check month
    if (month < 1 || month > 12) {
      return res.status(400).json({ message: "Month must be between 01 and 12" });
    }

    // Days per month (handle leap year for February)
    const daysInMonth = [
      31,
      (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28,
      31,
      30,
      31,
      30,
      31,
      31,
      30,
      31,
      30,
      31,
    ];
    if (day < 1 || day > daysInMonth[month - 1]) {
      return res.status(400).json({
        message: `Day must be between 01 and ${daysInMonth[month - 1]} for month ${monthStr}`,
      });
    }
    const patient = await Patient.findById(req.user.id);
    if(!patient) return res.status(404).json({message:"Patient not found"});
    patient.dateOfBirth = dateOfBirth;
    await patient.save();
    return res.status(200).json({success:"Date of birth added successfully", patient});
  }catch(err){
    return res.status(400).json({message:err.message});
  }
});

/**
 * @route  GET /api/users/profile
 * @desc   Get profile of user
 * @access Private (patient and counselor)
 */
const getProfile = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Try Patient
    let user = await Patient.findById(userId).select("name email dateOfBirth profileUrl");

    // If not patient, try Counselor
    if (!user) {
      user = await Counselor.findById(userId).select("name email dateOfBirth profileUrl");
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      success:true,
      message: "Profile fetched successfully",
      profile: {
        name: user.name,
        email: user.email,
        dob: user.dateOfBirth,
        profileUrl: user.profileUrl || null,
      },
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

/**
 * @route  POST /api/users/change-password
 * @desc   Change password (requires old password)
 * @access Private (patient & counselor)
 */
const changePassword = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Find user in Patient or Counselor
    let user = await Patient.findById(userId);
    if (!user) {
      user = await Counselor.findById(userId);
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect old password" });
    }

    // Validate new password strength
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character",
      });
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/**
 * @route  DELETE /api/users/delete
 * @desc   Delete patient account
 * @access Private (patient only)
 */
const deletePatientAccount = asyncHandler(async (req, res) => {
    try {
        const userId = req.user.id;
        const patient = await Patient.findById(userId);

        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        // Delete profile picture from Cloudinary
        await deleteUploadedFile(patient.profileUrl);

        // Delete playlists + junction rows
        if (patient.playlists.length > 0) {
            await PlaylistJunction.deleteMany({ playlistId: { $in: patient.playlists } });
            await Playlist.deleteMany({ _id: { $in: patient.playlists } });
        }

        // Delete favourites
        await Favourite.deleteMany({ _id: { $in: patient.favourites } });

        // Delete recent searches
        await RecentSearch.deleteMany({ _id: { $in: patient.recentSearch } });

        // Delete onboarding rows
        await Onboarding.deleteOne({ userId });

        // Delete moods tied to patient
        await Mood.deleteMany({ patientId: userId });

        // Delete patient
        await Patient.findByIdAndDelete(userId);

        return res.status(200).json({
            success: true,
            message: "Patient and all related data deleted successfully"
        });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

/**
 * @route  PUT /api/users/edit-profile
 * @desc   Edit profile (name, email, date of birth, profile picture)
 * @access Private (patient & counselor)
 */
const editProfile = asyncHandler(async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, email, dateOfBirth, profileUrl } = req.body;

        // Find user in Patient or Counselor
        let user = await Patient.findById(userId);
        if (!user) {
            user = await Counselor.findById(userId);
        }
        if (!user) return res.status(404).json({ message: "User not found" });

        // Update name & email
        if (name) user.name = name;
        if (email) user.email = email;

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
                email: user.email,
    dob: user.dateOfBirth ? user.dateOfBirth.toISOString().split('T')[0] : null,
                profileUrl: user.profileUrl || null,
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
});



module.exports = {
  forgotPassword,
  resetPassword,
  addDOB,
  getProfile,
  changePassword,
  deletePatientAccount,
  editProfile
};

