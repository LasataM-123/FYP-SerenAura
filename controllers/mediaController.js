const asyncHandler = require("express-async-handler");
const Music = require("../models/musicModel");
const Onboarding = require("../models/onboardingModel");
const Meditation = require("../models/meditationModel");
const moodCategoryMap = require("../utils/moodCategoryMap");
const axios = require("axios");
const mm = require("music-metadata");
const Mood = require("../models/moodModel");
const Patient = require("../models/patientModel");
const mongoose = require("mongoose");

/* ======================================================
   HELPER → Attach isLockedForUser based on subscription
====================================================== */
const attachLockStatus = (items, isSubscribed) => {
  return items.map((item) => {
    const obj = item.toObject ? item.toObject() : item;

    return {
      ...obj,
      isLockedForUser: obj.isLocked && !isSubscribed,
    };
  });
};

/**
 * @route GET /api/media/get-recommendations
 */
const getRecommendations = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    const patient = await Patient.findById(userId).select("isSubscribed");
    const isSubscribed = patient?.isSubscribed || false;

    let source = "random";
    let categories = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);

    const [recentMood, onboarding] = await Promise.all([
      Mood.findOne({
        patientId: userId,
        entryDate: { $gte: threeDaysAgo },
      }).sort({ entryDate: -1 }),

      Onboarding.findOne({ userId }),
    ]);

    /* ========= MOOD BASED ========= */
    if (
      recentMood?.mood &&
      moodCategoryMap[recentMood.mood.toLowerCase()]
    ) {
      source = "mood";
      categories = moodCategoryMap[recentMood.mood.toLowerCase()];

      const queries = categories.map((category) =>
        Music.aggregate([
          { $match: { moodCategory: new RegExp(`^${category}$`, "i") } },
          { $sample: { size: 3 } },
        ])
      );

      const results = await Promise.all(queries);

      const recommendations = {};
      categories.forEach((c, i) => {
        recommendations[c] = {
          title: `${c} Music`,
          data: attachLockStatus(results[i], isSubscribed),
        };
      });

      return res
        .status(200)
        .json({ success: true, source, recommendations });
    }

    /* ========= ONBOARDING BASED ========= */
    if (onboarding?.responses) {
      const onboardingCategories = [];

      onboarding.responses.forEach(({ question, answer }) => {
        if (!question || !answer) return;

        if (/what brings you here today/i.test(question)) {
          if (/stress/i.test(answer)) onboardingCategories.push("stress relief");
          if (/sleep/i.test(answer)) onboardingCategories.push("sleep");
          if (/focus/i.test(answer)) onboardingCategories.push("focus");
          if (/happy/i.test(answer)) onboardingCategories.push("calm");
        }

        if (/when do you need relaxation/i.test(question)) {
          if (/anxious/i.test(answer)) onboardingCategories.push("anxiety");
          if (/after stress/i.test(answer)) onboardingCategories.push("calm");
          if (/work|study/i.test(answer)) onboardingCategories.push("focus");
          if (/bed/i.test(answer)) onboardingCategories.push("sleep");
        }
      });

      categories = [...new Set(onboardingCategories)];

      if (categories.length > 0) {
        source = "onboarding";

        const queries = categories.map((category) =>
          Music.aggregate([
            { $match: { moodCategory: category } },
            { $sample: { size: 3 } },
          ])
        );

        const results = await Promise.all(queries);

        const recommendations = {};
        categories.forEach((c, i) => {
          recommendations[c] = {
            title: `${c} Music`,
            data: attachLockStatus(results[i], isSubscribed),
          };
        });

        return res
          .status(200)
          .json({ success: true, source, recommendations });
      }
    }

    /* ========= RANDOM FALLBACK ========= */
    const [randomMeditations, randomMusic] = await Promise.all([
      Meditation.aggregate([{ $sample: { size: 3 } }]),
      Music.aggregate([{ $sample: { size: 3 } }]),
    ]);

    return res.status(200).json({
      success: true,
      source,
      recommendations: {
        Meditation: {
          title: "Meditation Recommendations",
          data: attachLockStatus(randomMeditations, isSubscribed),
        },
        Music: {
          title: "Music Recommendations",
          data: attachLockStatus(randomMusic, isSubscribed),
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/**
 * @route GET /api/media/filter
 */
const filterByCategory = asyncHandler(async (req, res) => {
  try {
    const category = req.query.category?.toLowerCase();

    const patient = await Patient.findById(req.user.id).select("isSubscribed");
    const isSubscribed = patient?.isSubscribed || false;

    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    if (category === "all") {
      const moodCategories = ["calm", "stress relief", "focus", "sleep", "anxiety"];
      const musicByCategory = {};

      for (const mood of moodCategories) {
        const music = await Music.find({ moodCategory: mood }).limit(3);
        musicByCategory[mood] = attachLockStatus(music, isSubscribed);
      }

      const meditations = await Meditation.find().limit(3);

      return res.status(200).json({
        success: true,
        type: "all",
        data: {
          musicByCategory,
          meditations: attachLockStatus(meditations, isSubscribed),
        },
      });
    }

    if (category === "meditation") {
      const data = await Meditation.find();
      return res.status(200).json({
        success: true,
        type: "meditation",
        data: attachLockStatus(data, isSubscribed),
      });
    }

    const data = await Music.find({ moodCategory: category });

    return res.status(200).json({
      success: true,
      type: "music",
      data: attachLockStatus(data, isSubscribed),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/**
 * @route GET /api/media/individual/:id
 */
const getIndividualMedia = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid media ID format." });
    }

    const patient = await Patient.findById(req.user.id).select("isSubscribed");
    const isSubscribed = patient?.isSubscribed || false;

    let media = await Meditation.findById(id);
    let type = "Meditation";

    if (!media) {
      media = await Music.findById(id);
      type = "Music";
    }

    if (!media) {
      return res.status(404).json({ message: "Media not found" });
    }

    let durationStr = null;

    if (media.audioUrl) {
      try {
        const response = await axios.get(media.audioUrl, {
          responseType: "arraybuffer",
        });

        const metadata = await mm.parseBuffer(response.data);
        const minutes = Math.ceil((metadata.format.duration || 0) / 60);
        durationStr = `${minutes} min`;
      } catch {}
    }

    const obj = media.toObject();

    return res.status(200).json({
      success: true,
      media: {
        ...obj,
        duration: durationStr,
        mediaType: type,
        isLockedForUser: obj.isLocked && !isSubscribed,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/**
 * @route GET /api/media/search
 */
const searchContent = asyncHandler(async (req, res) => {
  try {
    const tag = req.query.tag?.toLowerCase();
    const keyword = req.query.keyword?.toLowerCase();
    const regex = keyword ? new RegExp(keyword, "i") : null;

    const patient = await Patient.findById(req.user.id).select("isSubscribed");
    const isSubscribed = patient?.isSubscribed || false;

    if (!tag || tag === "all") {
      const moodCategories = ["calm", "stress relief", "focus", "sleep", "anxiety"];
      const musicByCategory = {};

      for (const mood of moodCategories) {
        const filter = {
          moodCategory: mood,
          ...(regex && {
            $or: [
              { title: regex },
              { moodCategory: regex },
              { tags: { $in: [regex] } },
            ],
          }),
        };

        const music = await Music.find(filter).limit(3);
        musicByCategory[mood] = attachLockStatus(music, isSubscribed);
      }

      const meditations = await Meditation.find(regex
        ? {
            $or: [
              { title: regex },
              { moodCategory: regex },
              { tags: { $in: [regex] } },
            ],
          }
        : {}
      ).limit(3);

      return res.status(200).json({
        success: true,
        type: "all",
        data: {
          musicByCategory,
          meditations: attachLockStatus(meditations, isSubscribed),
        },
      });
    }

    if (tag === "meditation") {
      const meditations = await Meditation.find();
      return res.status(200).json({
        success: true,
        type: "meditation",
        data: attachLockStatus(meditations, isSubscribed),
      });
    }

    const music = await Music.find({ moodCategory: tag });

    return res.status(200).json({
      success: true,
      type: "music",
      data: attachLockStatus(music, isSubscribed),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = {
  getRecommendations,
  filterByCategory,
  getIndividualMedia,
  searchContent,
};
