const asyncHandler = require('express-async-handler');
const Patient = require('../models/patientModel');
const Favourite = require('../models/favouriteModel');

//@route POST /api/favourite/add
//@desc add media to favourites
//@access private
const addFavourite = asyncHandler(async(req, res)=>{
    try{
        const {mediaId, mediaType} = req.body;
        if(!mediaId || !mediaType){
            return res.status(400).json({message:"Media Id and media type are required."});
        }
        const patientId = req.user.id;
        const patient = await Patient.findById(patientId);
        if(!patient){
            return res.status(404).json({message:"Patient not found."});
        }
        const newFavourite = await Favourite.create({
            patientId,
            mediaId,
            mediaType
        })
        if(!newFavourite){
            return res.status(400).json({message:"Error in adding favourite"})
        }
        patient.favourites.push(newFavourite._id);
        await patient.save();
        return res.status(201).json({success:true, newFavourite});
    }catch(err){
        return res.status(500).json({message:err.message});
    }
})

// GET /api/favourite/get
// Get all favourite media for the logged-in patient
const getFavourites = asyncHandler(async (req, res) => {
  try {
    const patientId = req.user.id;

    const favourites = await Favourite.find({ patientId })
      .populate({
        path: "mediaId",
        select: "title description imageUrl audioUrl by moodCategory",
      })
      .lean();

    // If user has no favourites
    if (!favourites.length) {
      return res.status(200).json({ count: 0, favourites: [] });
    }

    // Format data
    const formatted = favourites.map((fav) => ({
      _id: fav._id,
      mediaType: fav.mediaType,
      media: fav.mediaId,
    }));

    res.status(200).json({
      count: formatted.length,
      favourites: formatted,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// DELETE /api/favourite/remove/:id
// Remove a favourite media by ID
const removeFavourite = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const patientId = req.user.id;

    // Check if favourite exists
    const favourite = await Favourite.findOne({ _id: id, patientId });
    if (!favourite) {
      return res.status(404).json({ message: "Favourite not found." });
    }

    // Delete from Favourite collection
    await Favourite.deleteOne({ _id: id, patientId });

    // Also remove from patient’s favourites array to keep data in sync
    await Patient.findByIdAndUpdate(patientId, {
      $pull: { favourites: id },
    });

    res.status(200).json({
      success: true,
      message: "Removed from favourites successfully.",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route  GET /api/favourite/check/:mediaId
 * @desc   Check if the item is in favourite or not
 * @access Private
 */
const checkFavourite = asyncHandler(async (req, res) => {
  try {
    const { mediaId } = req.params;
    const patientId = req.user?.id;

    if (!patientId) {
      return res.status(401).json({ message: "User not authenticated." });
    }

    const favourite = await Favourite.findOne({ patientId, mediaId });
    const isFavourite = !!favourite;
    res.status(200).json({ isFavourite });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



module.exports = {addFavourite, getFavourites, removeFavourite, checkFavourite}