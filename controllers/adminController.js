const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Counselor = require('../models/counselorModel');
const bcrypt = require('bcrypt');
const SupportQuestion = require("../models/faqModel");
const cloudinary = require('../config/cloudinaryConfig');
const Patient = require('../models/patientModel');
const jwt = require('jsonwebtoken');


const JWT_SECRET = process.env.JWT_SECRET_KEY;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET_KEY;

const generateTokens = (email, role) => {
  const accessToken = jwt.sign(
    { email, role },
    JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { email, role },
    JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};


const resetMonthlyPayments = async () => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    await Counselor.updateMany(
        {
            isPaid: true,
            lastPaidAt: { $lte: oneMonthAgo }
        },
        {
            $set: { isPaid: false }
        }
    );
};

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

const adminLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPasswordHash = process.env.ADMIN_HASH_PASSWORD;
    

    // Check email
    if (email !== adminEmail) {
        return res.status(401).json({
            message: "Invalid credentials"
        });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(
        password,
        adminPasswordHash
    );

    if (!isPasswordValid) {
        return res.status(401).json({
            message: "Invalid credentials"
        });
    }
    
    const { accessToken, refreshToken } = generateTokens(
        adminEmail,
        "admin"
    );

    res.status(200).json({
        message: "Admin login successful",
        accessToken,
        refreshToken
    });
});

/**
 * @route  POST /api/admin/create-counselor
 * @desc   Create counselor account
 * @access Private (admin only)
 */
const createCounselor=asyncHandler(async(req, res) => {
    try{
        const { name, email, password, dateOfBirth, experience, speciality, contactNumber } = req.body;
        if(!name || !email || !password || !dateOfBirth || !experience || !speciality || !contactNumber){
             await deleteUploadedFile(req.file);
            return res.status(400).json({ error: "Please fill all fields" });
        }
        const existingCounselor = await Counselor.findOne({ email });
        if(existingCounselor){
            await deleteUploadedFile(req.file);
            return res.status(400).json({ message: 'Counselor already exists' });
        }
        // Regex: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special character
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

     if (!passwordRegex.test(password)) {
    await deleteUploadedFile(req.file);
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
            profileUrl,
            contactNumber
        });
        res.status(201).json({counselor ,message:"Counselor created successfully"});
    }catch(e){
        res.status(500).json({ message: e.message });
    }
});

/**
 * @route  GET /api/admin/get-all
 * @desc   Get all counselors (for admin)
 * @access Private (admin only)
 */
const getCounselorForAdmin = asyncHandler(async (req, res) => {
  try {
    const counselors = await Counselor.find().select(
      "_id name profileUrl experience speciality contactNumber isPaid lastPaidAt"
    );

    const data = counselors.map(c => ({
      id: c._id,            
      name: c.name,
      experience: c.experience,
      speciality: c.speciality,
      profileUrl: c.profileUrl,
    contactNumber: c.contactNumber,
    isPaid: c.isPaid,
    lastPaidAt: c.lastPaidAt,
    }));

    res.set('X-Total-Count', data.length);
    res.set('Access-Control-Expose-Headers', 'X-Total-Count');

    return res.status(200).json(data); 
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

/**
 * @route  GET /api/admin/get/:id
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

/**
 * @route  POST /api/admin/answer-question/:questionId
 * @desc   Answer a support question
 * @access Private (admin)
 */
const answerSupportQuestion = asyncHandler(async (req, res) => {
    try{
        const { answer } = req.body;
        const questionId = req.params.questionId;

        if (!questionId || !answer) {
            res.status(400);
            throw new Error("Question ID and answer are required");
        }

        const question = await SupportQuestion.findById(questionId);

        if (!question) {
            res.status(404);
            throw new Error("Question not found");
        }

        question.answer = answer;
        question.isAnswered = true;

        await question.save();

        res.json({
            message: "Answer added successfully",
            data: question,
        });
    }catch(err){
        return res.status(500).json({ message: err.message });
    }
});

/**
 * @route  GET /api/admin/total-counselors
 * @desc   Get total number of counselors
 * @access Private (admin only)
 */
const getTotalCounselors = asyncHandler(async (req, res) => {
    const totalCounselors = await Counselor.countDocuments();
    res.status(200).json({ totalCounselors });
});

/**
 * @route  GET /api/admin/earnings
 * @desc   Get total earnings from subscriptions
 * @access Private (admin only)
 */
const getAdminDashboardStats = asyncHandler(async (req, res) => {
    // Reset monthly payment eligibility
    await resetMonthlyPayments();

    // =======================
    // EARNINGS
    // =======================
    const subscribedPatients = await Patient.find({ isSubscribed: true });

    let earnings = 0;
    subscribedPatients.forEach(p => {
        if (p.subscriptionType === "monthly") earnings += 100;
        if (p.subscriptionType === "yearly") earnings += 1100;
    });

    // =======================
    // SPENDING (pending payouts)
    // =======================
    const unpaidCounselors = await Counselor.find({ isPaid: false });
    const spending = unpaidCounselors.length * 1000;

    // =======================
    // PROFIT
    // =======================
    const profit = earnings - spending;

    // =======================
    // RESPONSE
    // =======================
    res.status(200).json({
        subscribers: subscribedPatients.length,
        counselorsPendingPayment: unpaidCounselors.length,
        earnings,
        spending,
        profit
    });
});

/**
 * @route  PUT /api/admin/pay-counselors
 * @desc   Pay counselors who are due for payment
 * @access Private (admin only)
 */
const payCounselors = asyncHandler(async (req, res) => {
    await resetMonthlyPayments();

    const unpaidCounselors = await Counselor.find({ isPaid: false });
    const spending = unpaidCounselors.length * 1000;
    const now = new Date();

    await Counselor.updateMany(
        { isPaid: false },
        {
            $set: {
                isPaid: true,
                lastPaidAt: now
            }
        }
    );

    res.status(200).json({
        counselorsPaid: unpaidCounselors.length,
        spending
    });
});

module.exports = {createCounselor, getCounselorByIdForAdmin, getCounselorForAdmin, answerSupportQuestion,getTotalCounselors, getAdminDashboardStats, payCounselors, adminLogin };