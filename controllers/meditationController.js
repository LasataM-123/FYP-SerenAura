const asyncHandler = require('express-async-handler');
const Meditation = require('../models/meditationModel');

const deleteUploadedFile = async (file) => {
    if (!file || !file.path) return;
    try {
        const publicId = file.filename || file.path.split('/').pop().split('.')[0]; // Extract public ID
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error("Error deleting uploaded file from Cloudinary:", error);
    }
};

//@route /meditation/create
//@desc Add new meditation
//@access public
const createMeditation = asyncHandler(async (req, res) => {
    try{

        const { title, description, by, moodCategory, isLocked } = req.body;
      
        const imageFile = req.files?.image?.[0];
        const audioFile = req.files?.audio?.[0];
      
        const imageUrl = imageFile?.path || imageFile?.secure_url;
        const audioUrl = audioFile?.path || audioFile?.secure_url;
      
        if (!title || !description || !by || !moodCategory) {
          if (imageUrl) await deleteUploadedFile(imageUrl);
          if (audioUrl) await deleteUploadedFile(audioUrl);
          return res.status(400).json({ message: "Please fill all fields" });
        }
      
        if (!imageUrl || !audioUrl) {
          return res.status(400).json({ message: "Image and audio are required" });
        }
        const meditation = await Meditation.create({
          title,
          description,
          by,
          moodCategory,
          imageUrl,
          audioUrl,
          isLocked
        });
        if(!meditation){
            return res.status(400).json({message:"Error while creating meditation"});
        }
        return res.status(201).json({message:"Meditation added successfully",meditation});
    }catch(err){
        return res.status(400).json({message: err.message});
    }

});

module.exports = {createMeditation};