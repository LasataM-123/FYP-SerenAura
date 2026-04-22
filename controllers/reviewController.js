const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Chat = require('../models/chatModel'); 
const Review = require('../models/reviewModel');
const Counselor = require('../models/counselorModel');

/**
 * @route   POST /api/reviews/add
 * @desc    Add a review for a counselor
 * @access  Private (Patient only)
 */
const addReview = asyncHandler(async (req, res) => {
    const { chatId, text, rating } = req.body;

    if (!chatId || !text || !rating) {
        return res.status(400).json({ message: "Chat ID, text, and rating are required." });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
        return res.status(404).json({ message: "Chat not found." });
    }

    if (chat.status !== 'ended') {
        return res.status(400).json({ 
            message: "You can only review the counselor after the chat session has ended." 
        });
    }

    if (chat.patientId.toString() !== req.user.id.toString()) {
         return res.status(403).json({ message: "Not authorized to review this session." });
     }

    const newReview = await Review.create({
        patientId: chat.patientId,
        counselorId: chat.counselorId,
        text,
        rating
    });

    const allReviews = await Review.find({ counselorId: chat.counselorId });
    const totalRating = allReviews.reduce((acc, curr) => acc + curr.rating, 0);
    
    const averageRating = Math.round((totalRating / allReviews.length) * 10) / 10;

    await Counselor.findByIdAndUpdate(chat.counselorId, {
        $push: { reviews: newReview._id },
        rating: averageRating
    });

    return res.status(201).json({
        success: true,
        message: "Review added successfully.",
        review: newReview
    });
});

/**
 * @route   GET /api/reviews/counselor/:counselorId
 * @desc    Get all reviews for a specific counselor
 * @access  Private (Counselor only)
 */
const getReviewsByCounselorId = asyncHandler(async (req, res) => {
  try {
    const { counselorId } = req.params;

    if (!counselorId) {
      return res.status(400).json({ message: "Counselor Id is required." });
    }

    if (!mongoose.Types.ObjectId.isValid(counselorId)) {
      return res.status(400).json({ message: "Invalid counselor ID format." });
    }

    const counselor = await Counselor.findById(counselorId).select("rating");

    if (!counselor) {
      return res.status(404).json({ message: "Counselor not found." });
    }

    const reviews = await Review.find({ counselorId })
      .populate({
        path: "patientId",
        select: "name profileUrl",
      })
      .sort({ reviewDate: -1 });

    return res.status(200).json({
      success: true,
      averageRating: counselor.rating || 0,
      count: reviews.length,
      reviews, 
    });

  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});
module.exports = {addReview, getReviewsByCounselorId }