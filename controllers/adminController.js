const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Counselor = require('../models/counselorModel');
const bcrypt = require('bcrypt');
const SupportQuestion = require("../models/faqModel");
const cloudinary = require('../config/cloudinaryConfig');
const Patient = require('../models/patientModel');
const Transaction = require('../models/transactionModel');
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
        if (
        !name ||
        !email ||
        !password ||
        !dateOfBirth ||
        experience === undefined ||
        !speciality ||
        !contactNumber
        ) {
        if (req.file) await deleteUploadedFile(req.file);
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
      "_id name profileUrl experience dateOfBirth speciality contactNumber isPaid lastPaidAt"
    );

    const data = counselors.map(c => ({
      id: c._id,            
      name: c.name,
      experience: c.experience,
      speciality: c.speciality,
      profileUrl: c.profileUrl,
    contactNumber: c.contactNumber,
    dateOfBirth: c.dateOfBirth
        ? c.dateOfBirth.toISOString().split("T")[0]
        : null,
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
 * @route  PUT /api/admin/answer-question/:questionId
 * @desc   Answer a support question
 * @access Private (admin)
 */
const answerSupportQuestion = asyncHandler(async (req, res) => {
    try {
        const { answer } = req.body;
        const { questionId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(questionId)) {
            return res.status(400).json({ 
                message: "Invalid Question ID format. Please provide a valid 24-character ID." 
            });
        }

        if (!answer) {
            return res.status(400).json({ message: "Answer is required" });
        }

        const question = await SupportQuestion.findById(questionId);

        if (!question) {
            return res.status(404).json({ message: "Question not found" });
        }

        question.answer = answer;
        question.isAnswered = true;

        await question.save();

        res.json({
            success: true,
            message: "Answer added successfully",
            data: question,
        });

    } catch (err) {
        console.error("Answer Controller Error:", err);
        return res.status(500).json({ message: err.message });
    }
});

/**
 * @route  GET /api/admin/earnings
 * @desc   Get total earnings from subscriptions
 * @access Private (admin only)
 */
const getAdminDashboardStats = asyncHandler(async (req, res) => {
    await resetMonthlyPayments();

    const [stats, recentTransactions, monthlyData, activeSubscribers, unpaidCounselors, totalCounselors] = await Promise.all([
        // 1. Financial Stats
        Transaction.aggregate([
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: { $cond: [{ $eq: ["$type", "INCOME"] }, "$amount", 0] } },
                    totalSpending: { $sum: { $cond: [{ $eq: ["$type", "EXPENSE"] }, "$amount", 0] } }
                }
            }
        ]),

        // 2. Recent Transactions
        Transaction.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('counselorId', 'name')
            .lean(),

        // 3. Monthly Data
        Transaction.aggregate([
            {
                $group: {
                    _id: { $month: "$timestamp" },
                    earnings: { $sum: { $cond: [{ $eq: ["$type", "INCOME"] }, "$amount", 0] } },
                    spending: { $sum: { $cond: [{ $eq: ["$type", "EXPENSE"] }, "$amount", 0] } }
                }
            },
            { $sort: { "_id": 1 } }
        ]),

        // 4. Counts
        Patient.countDocuments({ isSubscribed: true }),     // Active Subscribers
        Counselor.countDocuments({ isPaid: false }),        // Pending Payouts
        Counselor.countDocuments({})                        // TOTAL COUNSELORS (New!)
    ]);

    const financialData = stats[0] || { totalEarnings: 0, totalSpending: 0 };

    // Format transactions
    const formattedTransactions = await Promise.all(recentTransactions.map(async (t) => {
        const patient = t.patientId ? await Patient.findById(t.patientId) : null;

    return {
        ...t,
        id: t._id,
        date: t.timestamp ? new Date(t.timestamp).toISOString().split('T')[0] : "N/A",
        counselorName: t.counselorId?.name || "N/A",
        patientName: patient ? patient.name : "N/A",        
        date: t.timestamp ? new Date(t.timestamp).toISOString().split('T')[0] : "N/A",   };
}));

    res.status(200).json({
        summary: {
            subscribers: activeSubscribers,
            counselorsPendingPayment: unpaidCounselors,
            totalCounselors: totalCounselors, 
            totalEarnings: financialData.totalEarnings,
            totalSpending: financialData.totalSpending,
            profit: financialData.totalEarnings - financialData.totalSpending
        },
        recentTransactions: formattedTransactions, 
        chartData: monthlyData 
    });
});

/**
 * @route   PUT /api/admin/pay-counselor/:id
 * @desc    Pay a specific counselor who is due for payment
 * @access  Private (admin only)
 */
const payCounselor = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid counselor ID format" });
    }

    await resetMonthlyPayments();
    const counselor = await Counselor.findById(id);

    if (!counselor) {
        return res.status(404).json({ message: "Counselor not found" });
    }
    if (counselor.isPaid) {
        return res.status(400).json({ message: "Counselor already paid for this month." });
    }

    counselor.isPaid = true;
    counselor.lastPaidAt = new Date();
    await counselor.save();

    await Transaction.create({
        type: 'EXPENSE',
        amount: 1000,
        category: 'payout',
        counselorId: counselor._id,
        description: `Monthly payout to ${counselor.name}`
    });

    res.status(200).json({
        success: true,
        message: `Successfully paid Rs. 1000 to ${counselor.name}`,
    });
});

/**
 * @route  PUT /api/admin/edit-counselor/:id
 * @desc   Edit counselor profile
 * @access Private (admin only)
 */
const editCounselor = asyncHandler(async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, contactNumber, dateOfBirth, profileUrl, experience } = req.body;

        // Find user in Patient or Counselor
        const user= await Counselor.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Update name & email
        if (name) user.name = name;
        if (contactNumber) user.contactNumber = contactNumber;
        if (experience) user.experience = experience;
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
/**
 * @route  DELETE /api/admin/delete-counselor/:id
 * @desc   Delete counselor account
 * @access Private (admin only)
 */
const deleteCounselor = asyncHandler(async (req, res) => {
    try {
        const userId = req.params.id;
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
 * @route   GET /api/admin/view-question/:id
 * @desc    Get a specific support question and its answer
 * @access  Private (admin only)
 */
const getAnsweredQuestionById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid question ID format" });
    }

    const faq = await SupportQuestion.findById(id);

    if (!faq || !faq.isAnswered) {
        return res.status(404).json({ 
            message: "This question is not available or has not been answered yet." 
        });
    }

    res.status(200).json({
        success: true,
        data: faq
    });
});

/**
 * @route   PUT /api/admin/update-question/:id
 * @desc    Update an existing (already answered) answer
 * @access  Private (Admin)
 */
const updateSupportQuestion = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { answer } = req.body;

    const faq = await SupportQuestion.findById(id);

    if (!faq) {
        return res.status(404).json({ message: "Question not found" });
    }

    if (!faq.isAnswered) {
        return res.status(403).json({ 
            message: "This question cannot be updated because it hasn't been answered yet. Use the 'answer' endpoint instead." 
        });
    }

    if (answer) faq.answer = answer;

    const updatedFaq = await faq.save();

    res.status(200).json({
        message: "Question updated successfully",
        success: true,
        data: updatedFaq
    });
});

/**
 * @route   GET /api/admin/weekly-revenue
 * @desc    Get income vs expense for the last 7 days (using 'timestamp' field)
 * @access  Private (Admin)
 */
const getWeeklyStats = asyncHandler(async (req, res) => {
    // 1. Get date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // 2. Aggregate Data using "timestamp"
    const dailyStats = await Transaction.aggregate([
        {
            $match: {
                timestamp: { $gte: sevenDaysAgo } // CHANGED: used timestamp
            }
        },
        {
            $group: {
                _id: { 
                    // CHANGED: used timestamp for grouping
                    day: { $dayOfWeek: "$timestamp" }, 
                    date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }
                },
                income: { 
                    $sum: { $cond: [{ $eq: ["$type", "INCOME"] }, "$amount", 0] } 
                },
                expense: { 
                    $sum: { $cond: [{ $eq: ["$type", "EXPENSE"] }, "$amount", 0] } 
                }
            }
        },
        { $sort: { "_id.date": 1 } }
    ]);

    // 3. Fill in missing days
    const result = [];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateString = d.toISOString().split('T')[0];
        const dayName = days[d.getDay()];

        const found = dailyStats.find(s => s._id.date === dateString);

        result.push({
            day: dayName,
            income: found ? found.income : 0,
            expense: found ? found.expense : 0
        });
    }

    res.status(200).json(result);
});

/**
 * @route   GET /api/admin/monthly-revenue
 * @desc    Get monthly income vs expense for the FULL YEAR (Jan-Dec)
 * @access  Private (Admin)
 */
const getMonthlyStats = asyncHandler(async (req, res) => {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);

    const stats = await Transaction.aggregate([
        {
            $match: {
                timestamp: { $gte: startOfYear } 
            }
        },
        {
            $group: {
                _id: { $month: "$timestamp" }, 
                income: { $sum: { $cond: [{ $eq: ["$type", "INCOME"] }, "$amount", 0] } },
                expense: { $sum: { $cond: [{ $eq: ["$type", "EXPENSE"] }, "$amount", 0] } }
            }
        },
        { $sort: { "_id": 1 } }
    ]);

    const result = [];
    const standardMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let i = 1; i <= 12; i++) {
        const found = stats.find(s => s._id === i);
        
        result.push({
            month: standardMonths[i - 1],
            income: found ? found.income : 0,
            expense: found ? found.expense : 0
        });
    }

    res.status(200).json(result);
});

/**
 * @route   GET /api/admin/pie-stats
 * @desc    Get Income vs Expense distribution based on time filter
 * @access  Private (Admin)
 */
const getPieStats = asyncHandler(async (req, res) => {
    const { filter } = req.query; // 'weekly', 'monthly', 'yearly'
    
    let startDate = new Date();
    const now = new Date();

    // Determine Start Date based on filter
    if (filter === 'weekly') {
        startDate.setDate(now.getDate() - 7);
    } else if (filter === 'monthly') {
        startDate.setMonth(now.getMonth() - 1);
    } else if (filter === 'yearly') {
        startDate.setFullYear(now.getFullYear() - 1);
    } else {
        startDate = new Date(0); 
    }

    const stats = await Transaction.aggregate([
        {
            $match: {
                timestamp: { $gte: startDate } // Filter by date
            }
        },
        {
            $group: {
                _id: "$type", // Group by "INCOME" or "EXPENSE"
                totalAmount: { $sum: "$amount" }
            }
        }
    ]);

    let income = 0;
    let expense = 0;

    stats.forEach(stat => {
        if (stat._id === "INCOME") income = stat.totalAmount;
        if (stat._id === "EXPENSE") expense = stat.totalAmount;
    });

    res.status(200).json({ income, expense });
});

module.exports = {createCounselor, getCounselorByIdForAdmin, getCounselorForAdmin, answerSupportQuestion, getAdminDashboardStats, payCounselor, adminLogin, editCounselor, deleteCounselor, getAnsweredQuestionById, updateSupportQuestion, getWeeklyStats, getMonthlyStats, getPieStats };