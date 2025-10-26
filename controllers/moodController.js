const asyncHandler = require('express-async-handler');
const Mood = require('../models/moodModel');

/**
 * @route  POST /api/mood/add-update
 * @desc   Add or update existing mood
 * @access Private (patient only)
 */
const createOrUpdateMood = asyncHandler(async(req,res)=>{
    try{
        const patientId = req.user.id;
        const {mood, feeling, journal} = req.body;
        if(!mood){
            return res.status(400).json({message: "Mood is required"});
        }
        if (journal && journal.length > 100) {
            return res.status(400).json({ message: "Journal cannot exceed 100 characters." });
        }
        // Define today's start and end (00:00 → 23:59)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

         // Delete entries older than a year
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        await Mood.deleteMany({
            patientId,
            entryDate: { $lt: oneYearAgo },
        });

         // Check if today's mood already exists
        const existingMood = await Mood.findOne({
            patientId,
            entryDate: { $gte: today, $lt: tomorrow },
        });
        if (existingMood) {
             // Update today's mood entry
            existingMood.mood = mood;
            existingMood.journal = journal || existingMood.journal;
            existingMood.feeling = feeling || existingMood.feeling;
            existingMood.entryDate = new Date(); // update timestamp
            const moodEntry = await existingMood.save();
            return res.status(200).json({
            success: true,
            successMessage: "Mood updated successfully.",
            data: moodEntry,
        });

        } else {
            // Create a new mood entry for today
            const moodEntry = await Mood.create({
                patientId,
                entryDate: new Date(),
                mood,
                journal,
                feeling,
            });
            return res.status(201).json({
            success: true,
            successMessage: "Mood added successfully.",
            data: moodEntry,
            });
        }
        
    }catch(e){
        return res.status(500).json({message: e.message});
    }
})

/**
 * @route   GET /api/mood/calendar
 * @desc    Get mood entries for a specific month (calendar-friendly)
 * @access  Private (patient only)
 */
const getCalendarMoodEntries = asyncHandler(async (req, res) => {
    try{
        const patientId = req.user.id;
        const now = new Date();
        const month = parseInt(req.query.month) || now.getMonth() + 1; // 1-12
        const year = parseInt(req.query.year) || now.getFullYear();

        // First and last day of requested month
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

        // 🧹 Enforce 1-year data retention
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        if (endOfMonth < oneYearAgo) {
            return res.status(400).json({
            success: false,
            message: "Data older than 1 year is not available.",
            });
        }

        // Fetch moods in the requested month
        const entries = await Mood.find({
            patientId,
            entryDate: { $gte: startOfMonth, $lte: endOfMonth },
        });

        const daysInMonth = endOfMonth.getDate();

        // Build calendar array (one entry per day)
        const calendar = [];
        for (let day = 1; day <= daysInMonth; day++) {
            const entryForDay = entries.find(e => e.entryDate.getDate() === day);
            if (entryForDay) {
            calendar.push({
                day,
                mood: entryForDay.mood,
                journal: entryForDay.journal || null,
                feeling: entryForDay.feeling || null,
            });
            } else {
            calendar.push({ day, mood: null, journal: null, feeling: null });
            }
        }

        return res.status(200).json({
            success: true,
            month,
            year,
            daysInMonth,
            entries: calendar,
        });
    }catch(e){
        return res.status(500).json({message:e.message})
    }
 
});

/**
 * @route  GET /api/mood/insights
 * @desc   Get mood insights of each month
 * @access Private (patient only)
 */
const getMonthlyInsights = asyncHandler(async (req, res) => {
    try{
        const patientId = req.user.id;
        const month = parseInt(req.query.month) || new Date().getMonth() + 1;
        const year = parseInt(req.query.year) || new Date().getFullYear();

        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59, 999);

        const entries = await Mood.find({ patientId, entryDate: { $gte: start, $lte: end } });

        if (entries.length === 0) {
            return res.status(200).json({ success: true, message: "No entries found for this month." });
        }

        // Mood frequency
        const moodCounts = {};
        const feelingCounts = {};

        for (const e of entries) {
            moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;

            if (Array.isArray(e.feeling)) {
            for (const f of e.feeling) {
                feelingCounts[f] = (feelingCounts[f] || 0) + 1;
            }
            }
        }

        // Top mood
        const mostCommonMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0];

        // Top 3 feelings
        const topFeelings = Object.entries(feelingCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([feeling, count]) => ({ feeling, count }));

        // Mood percentage
        const total = entries.length;
        const moodPercentages = Object.fromEntries(
            Object.entries(moodCounts).map(([mood, count]) => [mood, ((count / total) * 100).toFixed(1) + "%"])
        );

        return res.status(200).json({
            success: true,
            totalEntries: total,
            mostCommonMood,
            topFeelings,
            moodPercentages,
        });
    }catch(e){
        return res.status(500).json({message:e.message})
    }
 
});

/**
 * @route  GET /api/mood/today
 * @desc   Get today's mood
 * @access Private (patient only)
 */
const getTodayMood = asyncHandler(async (req, res) => {
  const patientId = req.user.id;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const moodEntry = await Mood.findOne({
    patientId,
    entryDate: { $gte: today, $lt: tomorrow },
  });

  if (!moodEntry) {
    return res.status(200).json({ success: true, message: "No mood logged today." });
  }

  return res.status(200).json({ success: true, data: moodEntry });
});

module.exports = {createOrUpdateMood, getCalendarMoodEntries, getMonthlyInsights, getTodayMood};