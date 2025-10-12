const asyncHandler = require('express-async-handler');
const Meditation = require('../models/meditationModel');

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

//@route POST /meditation/create
//@desc Add new meditation
//@access public
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
    console.error('Error creating meditation:', err);
    res.status(400).json({ message: err.message });
  }
});

module.exports = { createMeditation };
