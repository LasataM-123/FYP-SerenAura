const asyncHandler = require('express-async-handler');
const Music = require('../models/musicModel');
const Onboarding = require('../models/onboardingModel');
const Meditation = require('../models/meditationModel')
const moodCategoryMap = require('../utils/moodCategoryMap');
const axios = require('axios');
const mm = require('music-metadata'); 

//Helper function to get random N items
function getRandomItems(arr,n){
  if(!arr || arr.length === 0) return [];
  const shuffled = [...arr].sort(()=> 0.5 - Math.random());
  return shuffled.slice(0,n);
}

//Extract categories from onboarding
function getCategoriesFromOnboarding(responses){
  const categories = [];
  responses.forEach(({question,answer})=>{
    if(!question || !answer) return;
    if (/what brings you here today/i.test(question)) {
      if (/stress/i.test(answer)) categories.push('stress relief');
      if (/sleep/i.test(answer)) categories.push('sleep');
      if (/focus/i.test(answer)) categories.push('focus');
      if (/happy/i.test(answer)) categories.push('calm');
    }
    if (/when do you need relaxation/i.test(question)) {
      if (/anxious/i.test(answer)) categories.push('anxiety');
      if (/after stress/i.test(answer)) categories.push('calm');
      if (/work|study/i.test(answer)) categories.push('focus');
      if (/bed/i.test(answer)) categories.push('sleep');
    }
  });
  return [...new Set(categories)];
}

//@route GET /api/media/get-recommendations
//@desc get personalized recommendations
//@access public
const getRecommendations = asyncHandler(async(req,res)=>{
  try{
    const mood = req.query.mood?.replace(/"/g, '').toLowerCase();
    const userId = req.user.id;
    let source = 'random' ;
    let categories = [];
  
    //Mood-based
    if(mood && moodCategoryMap[mood]) {
      categories = moodCategoryMap[mood];
      source = 'mood';
  
      const recommendations = {};
      for(const category of categories){
        const music = await Music.find({moodCategory: category});
        recommendations[category] = {
        title: `${category} Music`,
        data: getRandomItems(music, 3),
      };
      }
      
    return res.status(200).json({ success: true, source, recommendations });
    }

    //onboarding-based
    if(userId){
      const onboarding = await Onboarding.findOne({userId});
      if(onboarding){
        categories = getCategoriesFromOnboarding(onboarding.responses);
        if(categories.length > 0) {
          source = 'onboarding';
          const recommendations = {};

          for (const category of categories) {
            const musics = await Music.find({ moodCategory: category });
            recommendations[category] = {
              title: `${category} Music`,
              data: getRandomItems(musics, 3),
            };
          }
          return res.status(200).json({ success: true, source, recommendations });

        }
      }
    }
    // random fallback
    const randomMeditations = await Meditation.aggregate([{ $sample: { size: 3 } }]);
  const randomMusic = await Music.aggregate([{ $sample: { size: 3 } }]);

  res.status(200).json({
    success: true,
    source,
    recommendations: {
      Meditation: {
        title: 'Meditation Recommendations',
        data: randomMeditations,
      },
      Music: {
        title: 'Music Recommendations',
        data: randomMusic,
      },
    },
  });
  }catch(err){
    return res.status(400).json({error: err.message});
  }
})

//@route GET /api/media/filter
//@desc filter music or meditation by category
//@access public
const filterByCategory = asyncHandler(async (req, res) => {
  try {
    const category = req.query.category?.toLowerCase();

    if (!category) {
      return res.status(400).json({ message: 'Category is required' });
    }

    let data;
    let type = category; // default type same as category

    // --- Handle 'all' special case ---
    if (category === 'all') {
      const moodCategories = ['calm', 'stress relief', 'focus', 'sleep', 'anxiety'];
      const musicByCategory = {};

      for (const mood of moodCategories) {
        const music = await Music.find({ moodCategory: mood }).limit(3);
        musicByCategory[mood] = music;
      }

      const meditations = await Meditation.find().limit(3);

      return res.status(200).json({
        success: true,
        type: 'all',
        data: { musicByCategory, meditations },
      });
    }

    // --- Handle 'meditation' category ---
    if (category === 'meditation') {
      data = await Meditation.find();
      type = 'meditation';
    } else {
      // --- Handle other music categories ---
      data = await Music.find({ moodCategory: category });
      type = 'music';
    }

    return res.status(200).json({
      success: true,
      type,
      data,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});


//@route GET /api/media/individual/:id
//@desc get music or meditation by id
//@access public
const getIndividualMedia = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Id is required" });
    }

    // Fetch from Meditation first, then Music
    let media = await Meditation.findById(id);
    if (!media) {
      media = await Music.findById(id);
    }

    if (!media) {
      return res.status(404).json({ message: "Media not found" });
    }

    // Get audio duration if audioUrl exists
    let durationStr = null;
    if (media.audioUrl) {
      try {
        const response = await axios.get(media.audioUrl, { responseType: "arraybuffer" });
        const metadata = await mm.parseBuffer(response.data);
        const durationSec = metadata.format.duration || 0;

        // Convert to minutes only, round up
        const minutes = Math.ceil(durationSec / 60);
        durationStr = `${minutes} min`;
      } catch (err) {
        console.error("Failed to get audio duration:", err.message);
      }
    }

    return res.status(200).json({
      success: true,
      media: {
        ...media.toObject(),
        duration: durationStr, // "X min"
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

const searchContent = asyncHandler(async (req, res) => {
  try {
    const tag = req.query.tag?.toLowerCase();
    const keyword = req.query.keyword?.toLowerCase();
    const regex = keyword ? new RegExp(keyword, "i") : null;

    // ============= CASE 1: TAG === ALL OR NOT PROVIDED =============
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

        // limit to 3 like your previous logic
        const music = await Music.find(filter).limit(3);
        musicByCategory[mood] = music;
      }

      // Meditations filtered by keyword (if provided)
      const meditationFilter = regex
        ? {
            $or: [
              { title: regex },
              { moodCategory: regex },
              { tags: { $in: [regex] } },
            ],
          }
        : {};

      const meditations = await Meditation.find(meditationFilter).limit(3);

      return res.status(200).json({
        success: true,
        type: "all",
        data: {
          musicByCategory,
          meditations,
        },
      });
    }

    // ============= CASE 2: TAG === MEDITATION =============
    if (tag === "meditation") {
      const meditationFilter = regex
        ? {
            $or: [
              { title: regex },
              { moodCategory: regex },
              { tags: { $in: [regex] } },
            ],
          }
        : {};

      const meditations = await Meditation.find(meditationFilter);

      return res.status(200).json({
        success: true,
        type: "meditation",
        data: meditations,
      });
    }

    // ============= CASE 3: TAG IS MUSIC MOOD CATEGORY =============
    const musicFilter = {
      moodCategory: tag,
      ...(regex && {
        $or: [
          { title: regex },
          { moodCategory: regex },
          { tags: { $in: [regex] } },
        ],
      }),
    };

    const music = await Music.find(musicFilter);

    return res.status(200).json({
      success: true,
      type: "music",
      data: music,
    });
  } catch (err) {
    console.error("Search error:", err);
    return res.status(500).json({ error: err.message });
  }
});


module.exports = { getRecommendations, filterByCategory, getIndividualMedia, searchContent};
