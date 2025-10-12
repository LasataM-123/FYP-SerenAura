const asyncHandler = require('express-async-handler');
const Music = require('../models/musicModel');
const cloudinary = require('../config/cloudinaryConfig');
const moodCategoryMap = require('../utils/moodCategoryMap');

const extractPublicId = (fileUrl) => {
  if (!fileUrl) return null;
  try {
    // Split at '/upload/' and take what's after it
    const afterUpload = fileUrl.split('/upload/')[1];
    if (!afterUpload) return null;
    // Remove version part (like v1728656012/)
    const parts = afterUpload.split('/');
    // Remove version if it exists
    const versionRegex = /^v\d+$/;
    if (versionRegex.test(parts[0])) parts.shift();
    // Remove file extension from last part
    const last = parts.pop();
    const noExt = last.split('.')[0];
    parts.push(noExt);
    return parts.join('/');
  } catch (err) {
    console.error('Error extracting public ID:', err);
    return null;
  }
};

const deleteUploadedImage = async (fileUrl) => {
  const publicId = extractPublicId(fileUrl);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
  }
};

const deleteUploadedAudio = async (fileUrl) => {
  const publicId = extractPublicId(fileUrl);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
  } catch (error) {
    console.error('Error deleting audio from Cloudinary:', error);
  }
};

//@route POST /api/music/create
//@desc Add new music
//@access public
const createMusic = asyncHandler(async (req, res) => {
  try {
    const { title, description, by, moodCategory, isLocked } = req.body;
    const imageFile = req.files?.image?.[0];
    const audioFile = req.files?.audio?.[0];

    const imageUrl = imageFile?.path || imageFile?.secure_url;
    const audioUrl = audioFile?.path || audioFile?.secure_url;

    if (!title || !description || !by || !moodCategory) {
     await Promise.allSettled([
    deleteUploadedImage(imageUrl),
    deleteUploadedAudio(audioUrl)
  ]);
      return res.status(400).json({ message: 'Please fill all fields' });
    }
    if (!imageUrl || !audioUrl) {
      await Promise.allSettled([
    deleteUploadedImage(imageUrl),
    deleteUploadedAudio(audioUrl)
  ]);
      return res.status(400).json({ message: 'Image and audio are required' });
    }
    const music = await Music.create({
      title,
      description,
      by,
      moodCategory,
      imageUrl,
      audioUrl,
      isLocked,
    });

    if (!music) {
     await Promise.allSettled([
    deleteUploadedImage(imageUrl),
    deleteUploadedAudio(audioUrl)
  ]);
      return res.status(400).json({ message: 'Error while adding music' });
    }

    res.status(201).json({
      message: 'Music added successfully',
      music,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//@route /api/music/update/:musicId
//@desc update music
//@access public
const updateMusic = asyncHandler(async(req,res)=>{
    try{

        const {musicId} = req.params;
         const updateFields = { ...req.body };
        const imageFile = req.files?.image?.[0];
        const audioFile = req.files?.audio?.[0];
        //If new image file is uploaded, delete the old and update field
        if(imageFile){
         const music = await Music.findById(musicId);
          if (music?.imageUrl) {
            await deleteUploadedImage(music.imageUrl);
          }
          updateFields.imageUrl = imageFile.path || imageFile.secure_url;
        }
        
        // If new audio uploaded, delete old and update field
        if (audioFile) {
          const music = music || await Music.findById(musicId);
          if (music?.audioUrl) await deleteUploadedAudio(music.audioUrl);
          updateFields.audioUrl = audioFile.path || audioFile.secure_url;
        }
        const updatedMusic = await Music.findByIdAndUpdate(musicId,{$set:updateFields},{new:true} );
        if(!updatedMusic){
            return res.status(404).json({message:"Music not found"});
        }
         res.status(200).json({
          message: 'Music updated successfully',
          music: updatedMusic,
        });
    }catch(err){
        res.status(400).json({ message: err.message });
    }
})

// @route POST /api/music/recommend-by-mood
// @desc Get recommended music by mood
// @access Public
const recommendMusicByMood = asyncHandler(async (req, res) => {
  const { mood } = req.body;

  if (!mood) {
    return res.status(400).json({ message: 'Mood is required' });
  }

  // Find categories mapped to this mood
  const categories = moodCategoryMap[mood.toLowerCase()];

  if (!categories) {
    return res.status(404).json({ message: 'No mapping found for this mood' });
  }

  // Find all music where moodCategory matches one of those
  const recommendedMusic = await Music.find({ moodCategory: { $in: categories } });

  if (recommendedMusic.length === 0) {
    return res.status(404).json({ message: 'No music found for this mood' });
  }

  res.status(200).json({
    mood,
    categories,
    count: recommendedMusic.length,
    music: recommendedMusic,
  });
});

module.exports = { createMusic, updateMusic };
