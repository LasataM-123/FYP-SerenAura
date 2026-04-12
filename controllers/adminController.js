const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Counselor = require('../models/counselorModel');
const bcrypt = require('bcrypt');
const SupportQuestion = require("../models/faqModel");
const cloudinary = require('../config/cloudinaryConfig');
const Patient = require('../models/patientModel');
const Transaction = require('../models/transactionModel');
const jwt = require('jsonwebtoken');
const Chat = require('../models/chatModel');
const axios = require('axios');
const crypto = require('crypto'); 

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

const deleteUploadedFile = async (file) => {
    try {
        if (!file) return;

        let url = typeof file === "string" ? file : file.path;
        if (!url) return;
        const uploadIndex = url.indexOf('/upload/');
        if (uploadIndex === -1) return;

        const afterUpload = url.substring(uploadIndex + 8); 
        const parts = afterUpload.split('/');
        parts.shift(); 

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
        return res.status(400).json({ message: "Email and password are required" });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPasswordHash = process.env.ADMIN_HASH_PASSWORD;
    
    if (email !== adminEmail) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, adminPasswordHash);

    if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
    
    const { accessToken, refreshToken } = generateTokens(adminEmail, "admin");

    res.status(200).json({
        message: "Admin login successful",
        accessToken,
        refreshToken
    });
});

const createCounselor=asyncHandler(async(req, res) => {
    try{
        const { name, email, password, dateOfBirth, experience, speciality, contactNumber } = req.body;
        if (!name || !email || !password || !dateOfBirth || experience === undefined || !speciality || !contactNumber) {
            if (req.file) await deleteUploadedFile(req.file);
            return res.status(400).json({ error: "Please fill all fields" });
        }

        const existingCounselor = await Counselor.findOne({ email });
        if(existingCounselor){
            await deleteUploadedFile(req.file);
            return res.status(400).json({ message: 'Counselor already exists' });
        }
        
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
            name, email, password: hashedPassword, dateOfBirth, experience, speciality, profileUrl, contactNumber
        });
        res.status(201).json({counselor ,message:"Counselor created successfully"});
    }catch(e){
        res.status(500).json({ message: e.message });
    }
});

const getCounselorForAdmin = asyncHandler(async (req, res) => {
  try {
    const counselors = await Counselor.find().select(
      "_id name profileUrl experience dateOfBirth speciality contactNumber isPaid lastPaidAt"
    );

    const RATE_PER_CHAT = 500; 

    const data = await Promise.all(counselors.map(async (c) => {
      const pendingChats = await Chat.countDocuments({
          counselorId: c._id,
          status: { $in: ['ended'] },
          isPaid: false
      });

      return {
        id: c._id,            
        name: c.name,
        experience: c.experience,
        speciality: c.speciality,
        profileUrl: c.profileUrl,
        contactNumber: c.contactNumber,
        dateOfBirth: c.dateOfBirth ? c.dateOfBirth.toISOString().split("T")[0] : null,
        isPaid: pendingChats === 0, 
        lastPaidAt: c.lastPaidAt,
        pendingChatsCount: pendingChats,
        pendingPayoutAmount: pendingChats * RATE_PER_CHAT
      };
    }));

    res.set('X-Total-Count', data.length);
    res.set('Access-Control-Expose-Headers', 'X-Total-Count');

    return res.status(200).json(data); 
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

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

const answerSupportQuestion = asyncHandler(async (req, res) => {
    try {
        const { answer } = req.body;
        const { questionId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(questionId)) {
            return res.status(400).json({ message: "Invalid Question ID format." });
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

        res.json({ success: true, message: "Answer added successfully", data: question });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

const getAdminDashboardStats = asyncHandler(async (req, res) => {
    const [stats, recentTransactions, monthlyData, activeSubscribers, totalCounselors] = await Promise.all([
        Transaction.aggregate([
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: { $cond: [{ $eq: ["$type", "INCOME"] }, "$amount", 0] } },
                    totalSpending: { $sum: { $cond: [{ $eq: ["$type", "EXPENSE"] }, "$amount", 0] } }
                }
            }
        ]),
        Transaction.find().sort({ createdAt: -1 }).limit(10).populate('counselorId', 'name').lean(),
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
        Patient.countDocuments({ isSubscribed: true }),
        Counselor.countDocuments({})
    ]);

    const counselorsPendingPayment = await Chat.distinct("counselorId", {
        status: { $in: ['ended'] },
        isPaid: false
    });

    const financialData = stats[0] || { totalEarnings: 0, totalSpending: 0 };

    const formattedTransactions = await Promise.all(recentTransactions.map(async (t) => {
        const patient = t.patientId ? await Patient.findById(t.patientId) : null;
        return {
            ...t,
            id: t._id,
            date: t.timestamp ? new Date(t.timestamp).toISOString().split('T')[0] : "N/A",
            counselorName: t.counselorId?.name || "N/A",
            patientName: patient ? patient.name : "N/A"
        };
    }));

    res.status(200).json({
        summary: {
            subscribers: activeSubscribers,
            counselorsPendingPayment: counselorsPendingPayment.length,
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
 * @desc    Generate eSewa payload to pay a counselor for unpaid chats
 * @access  Private (admin only)
 */
const payCounselor = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid counselor ID format" });
    }

    const counselor = await Counselor.findById(id);
    if (!counselor) {
        return res.status(404).json({ message: "Counselor not found" });
    }

    const unpaidChatsCount = await Chat.countDocuments({
        counselorId: counselor._id,
        status: { $in: ['ended'] },
        isPaid: false
    });

    if (unpaidChatsCount === 0) {
        return res.status(400).json({ message: "Counselor has no unpaid completed chats." });
    }

    const RATE_PER_CHAT = 500; 
    const totalPayoutAmount = unpaidChatsCount * RATE_PER_CHAT;

    try {
        // eSewa Setup
        const transaction_uuid = `PAYOUT-${counselor._id}-${Date.now()}`;
        const amount = totalPayoutAmount;
        
        // Use EPAYTEST and the test key for development. Swap to env vars for production.
        const product_code = process.env.ESEWA_MERCHANT_CODE || "EPAYTEST";
        const secret_key = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";

        // Create exactly what eSewa demands for the signature
        const message = `total_amount=${amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
        const signature = crypto.createHmac('sha256', secret_key).update(message).digest('base64');

        // We embed counselorId and amount in the success URL so confirmPayout can process it later
        const successUrl = `${process.env.FRONTEND_URL}admin/payout-success?counselorId=${counselor._id}&amount=${amount}&chats=${unpaidChatsCount}`;

        const esewaPayload = {
            amount: amount,
            failure_url: `${process.env.FRONTEND_URL}/admin/payout-failed`,
            product_delivery_charge: "0",
            product_service_charge: "0",
            product_code: product_code,
            signature: signature,
            signed_field_names: "total_amount,transaction_uuid,product_code",
            success_url: successUrl,
            tax_amount: "0",
            total_amount: amount,
            transaction_uuid: transaction_uuid
        };

        // Send this back to React so it can build the form
        res.status(200).json({
            success: true,
            message: "eSewa credentials generated successfully",
            esewa_url: "https://rc-epay.esewa.com.np/api/epay/main/v2/form", // eSewa testing URL
            formData: esewaPayload
        });

    } catch (error) {
        console.error("eSewa Generation Error:", error);
        return res.status(500).json({ message: "Failed to generate eSewa payment payload." });
    }
});

/**
 * @route   POST /api/admin/confirm-payout
 * @desc    Mark counselor as paid after returning from eSewa
 * @access  Private (admin only)
 */
const confirmPayout = asyncHandler(async (req, res) => {
    const { counselorId, amount, chatsCount } = req.body;

    if (!counselorId || !amount || !chatsCount) {
         return res.status(400).json({ message: "Missing required payout data." });
    }

    const counselor = await Counselor.findById(counselorId);
    if (!counselor) return res.status(404).json({ message: "Counselor not found" });

    const updatedChats = await Chat.updateMany(
        { counselorId: counselor._id, status: { $in: [ 'ended'] }, isPaid: false },
        { $set: { isPaid: true } }
    );

    counselor.lastPaidAt = new Date();
    counselor.isPaid = true;
    await counselor.save();

    await Transaction.create({
        type: 'EXPENSE',
        amount: Number(amount),
        category: 'payout',
        counselorId: counselor._id,
        description: `Payout for ${updatedChats.modifiedCount} chats via eSewa.`
    });

    res.status(200).json({ 
        success: true, 
        message: `Payout confirmed. ${updatedChats.modifiedCount} chats marked as paid.` 
    });
});

const editCounselor = asyncHandler(async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, contactNumber, dateOfBirth, profileUrl, experience } = req.body;

        const user= await Counselor.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (name) user.name = name;
        if (contactNumber) user.contactNumber = contactNumber;
        if (experience) user.experience = experience;

        if (dateOfBirth) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(dateOfBirth)) return res.status(400).json({ message: "Date of Birth must be in YYYY-MM-DD format" });
            
            const [yearStr, monthStr, dayStr] = dateOfBirth.split("-");
            const year = parseInt(yearStr, 10);
            const month = parseInt(monthStr, 10);
            const day = parseInt(dayStr, 10);

            if (month < 1 || month > 12) return res.status(400).json({ message: "Month must be between 01 and 12" });

            const daysInMonth = [31, (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

            if (day < 1 || day > daysInMonth[month - 1]) {
                return res.status(400).json({ message: `Day must be between 01 and ${daysInMonth[month - 1]} for month ${monthStr}` });
            }

            user.dateOfBirth = dateOfBirth;
        }

        if (req.file && req.file.path) {
            if (user.profileUrl) await deleteUploadedFile(user.profileUrl);
            user.profileUrl = req.file.path; 
        } else if (profileUrl) {
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
        return res.status(500).json({ message: err.message });
    }
});

const deleteCounselor = asyncHandler(async (req, res) => {
    try {
        const userId = req.params.id;
        const counselor = await Counselor.findById(userId);

        if (!counselor) return res.status(404).json({ message: "Counselor not found" });

        await deleteUploadedFile(counselor.profileUrl);
        await Counselor.findByIdAndDelete(userId);

        return res.status(200).json({ success: true, message: "Counselor account deleted successfully" });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

const getAnsweredQuestionById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid question ID format" });

    const faq = await SupportQuestion.findById(id);
    if (!faq || !faq.isAnswered) return res.status(404).json({ message: "This question is not available or has not been answered yet." });

    res.status(200).json({ success: true, data: faq });
});

const updateSupportQuestion = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { answer } = req.body;

    const faq = await SupportQuestion.findById(id);
    if (!faq) return res.status(404).json({ message: "Question not found" });
    if (!faq.isAnswered) return res.status(403).json({ message: "This question cannot be updated because it hasn't been answered yet." });

    if (answer) faq.answer = answer;
    const updatedFaq = await faq.save();

    res.status(200).json({ message: "Question updated successfully", success: true, data: updatedFaq });
});

const getWeeklyStats = asyncHandler(async (req, res) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyStats = await Transaction.aggregate([
        { $match: { timestamp: { $gte: sevenDaysAgo } } },
        {
            $group: {
                _id: { 
                    day: { $dayOfWeek: "$timestamp" }, 
                    date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }
                },
                income: { $sum: { $cond: [{ $eq: ["$type", "INCOME"] }, "$amount", 0] } },
                expense: { $sum: { $cond: [{ $eq: ["$type", "EXPENSE"] }, "$amount", 0] } }
            }
        },
        { $sort: { "_id.date": 1 } }
    ]);

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

const getMonthlyStats = asyncHandler(async (req, res) => {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);

    const stats = await Transaction.aggregate([
        { $match: { timestamp: { $gte: startOfYear } } },
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

const getPieStats = asyncHandler(async (req, res) => {
    const { filter } = req.query; 
    let startDate = new Date();
    const now = new Date();

    if (filter === 'weekly') startDate.setDate(now.getDate() - 7);
    else if (filter === 'monthly') startDate.setMonth(now.getMonth() - 1);
    else if (filter === 'yearly') startDate.setFullYear(now.getFullYear() - 1);
    else startDate = new Date(0); 

    const stats = await Transaction.aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        {
            $group: {
                _id: "$type", 
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

module.exports = {createCounselor, getCounselorByIdForAdmin, getCounselorForAdmin, answerSupportQuestion, getAdminDashboardStats, payCounselor, adminLogin, editCounselor, deleteCounselor, getAnsweredQuestionById, updateSupportQuestion, getWeeklyStats, getMonthlyStats, getPieStats, confirmPayout };