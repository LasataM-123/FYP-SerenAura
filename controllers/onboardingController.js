const asyncHandler = require("express-async-handler");
const Onboarding = require("../models/onboardingModel");

// @route POST /create
// @desc Create onboarding responses
// @access private

const createOnboarding = asyncHandler(async (req, res) => {
  const { responses } = req.body;

  if (!responses || responses.length === 0) {
    return res.status(400).json({ message: "Responses are required" });
  }

  // Check if user already has onboarding data
  const existing = await Onboarding.findOne({ userId: req.user.id });

  if (existing) {
    //Update existing onboarding instead of creating a new one
    existing.responses = responses;
    const updated = await existing.save();

    return res.status(200).json({
      message: "Onboarding updated successfully",
      onboarding: updated,
    });
  }

  // If no existing record, create a new one
  const onboarding = await Onboarding.create({
    userId: req.user.id,
    responses,
  });

  if (!onboarding) {
    return res.status(400).json({ message: "Invalid onboarding data" });
  }

  res.status(201).json({
    message: "Onboarding created successfully",
    onboarding,
  });
});

module.exports = { createOnboarding };