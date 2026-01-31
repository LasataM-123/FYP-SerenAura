const nodemailer = require("nodemailer");
const asyncHandler = require('express-async-handler');
const SupportQuestion = require("../models/faqModel");
const sendSupportQuestionEmail = async ({ userEmail, question }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"SerenAura Support" <${process.env.EMAIL_USER}>`,
    to: "serenaura.space@gmail.com", 
    subject: "🆘 New Help & Support Question",
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 40px 0;">
        <div style="max-width: 500px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          
          <h2 style="color: #553434; text-align: center;">
            New Support Question
          </h2>

          <p style="color: #555; font-size: 15px; margin-top: 20px;">
            <strong>From:</strong> ${userEmail}
          </p>

          <div style="margin-top: 20px; padding: 15px; background-color: #f0f8ff; border-radius: 8px; color: #333;">
            ${question}
          </div>

          <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
            &copy; ${new Date().getFullYear()} SerenAura Support System
          </p>
        </div>
      </div>
    `,
  });
};

/**
 * @route  POST /api/faq/create-question
 * @desc   Create a new support question
 * @access Private (patient and counselor)
 */
const createSupportQuestion = asyncHandler(async (req, res) => {
    try{
        const { question } = req.body;

        if (!question) {
            res.status(400);
            throw new Error("Question is required");
        }

        const supportQuestion = await SupportQuestion.create({
            question,
            askedBy: req.user.id,
        });

        await sendSupportQuestionEmail({
            userEmail: req.user.email,
            question,
        });

        res.status(201).json({
            message: "Support question submitted successfully",
            success: true,
            data: supportQuestion,
        });
    }catch(err){
        return res.status(500).json({ message: err.message });
    }
});



/**
 * @route  GET /api/faq/get-questions
 * @desc   Get top support questions    
 * @access Public
 */
// backend/controllers/faqController.js

const getTopQuestions = asyncHandler(async (req, res) => {
  try {
    const faqs = await SupportQuestion.aggregate([
      {
        $group: {
          _id: { $toLower: "$question" }, 
          question: { $first: "$question" },

          questionId: { $first: "$_id" }, 

          count: { $sum: 1 },
          isAnswered: { $max: { $cond: ["$isAnswered", 1, 0] } },
          answer: { $first: "$answer" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      total: faqs.length,
      data: faqs,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



module.exports = {
    createSupportQuestion,
    getTopQuestions
};