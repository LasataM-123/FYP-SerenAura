const asyncHandler = require('express-async-handler');
const Meditation = require('../models/meditationModel');
const mongoose = require('mongoose');


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

/**
 * @route  POST /meditation/create
 * @desc   Add new meditation
 * @access Public
 */
const createMeditation = asyncHandler(async (req, res) => {
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

    const meditation = await Meditation.create({
      title,
      description,
      by,
      moodCategory,
      imageUrl,
      audioUrl,
      isLocked,
    });

    if (!meditation) {
       await Promise.allSettled([
    deleteUploadedImage(imageUrl),
    deleteUploadedAudio(audioUrl)
  ]);
      return res.status(400).json({ message: 'Error while creating meditation' });
    }

    res.status(201).json({
      message: 'Meditation added successfully',
      meditation,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route  PUT /api/mediotation/update/:meditationId
 * @desc   Update meditation
 * @access Public
 */
const updateMeditation = asyncHandler(async(req,res)=>{
    try{

        const {meditationId} = req.params;
        if (!mongoose.Types.ObjectId.isValid(meditationId)) {
          return res.status(400).json({message: "Invalid meditation ID format." });
        }
         const updateFields = { ...req.body };
        const imageFile = req.files?.image?.[0];
        const audioFile = req.files?.audio?.[0];
        //If new image file is uploaded, delete the old and update field
        if(imageFile){
         const meditation = await Meditation.findById(meditationId);
          if (meditation?.imageUrl) {
            await deleteUploadedImage(meditation.imageUrl);
          }
          updateFields.imageUrl = imageFile.path || imageFile.secure_url;
        }
        
        // If new audio uploaded, delete old and update field
        if (audioFile) {
          const meditation = meditation || await Meditation.findById(meditationId);
          if (meditation?.audioUrl) await deleteUploadedAudio(meditation.audioUrl);
          updateFields.audioUrl = audioFile.path || audioFile.secure_url;
        }
        const updatedMeditation = await Meditation.findByIdAndUpdate(meditationId,{$set:updateFields},{new:true} );
        if(!updatedMeditation){
            return res.status(404).json({message:"Meditation not found"});
        }
         res.status(200).json({
          message: 'Meditation updated successfully',
          music: updatedMeditation,
        });
    }catch(err){
        res.status(500).json({ message: err.message });
    }
})

module.exports = { createMeditation, updateMeditation };
