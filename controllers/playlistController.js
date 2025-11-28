const asyncHandler = require('express-async-handler');
const Patient = require('../models/patientModel');
const PlaylistJunction = require('../models/playlistJunctionModel');
const Playlist = require('../models/playlistModel');
const axios = require('axios');
const mm = require('music-metadata'); 


/**
 * @route   POST /api/playlist/create
 * @desc    Create a new playlist for a patient
 * @access  Private (patient only)
 */
const createPlaylist = asyncHandler(async (req, res) => {
  try {
    const { title } = req.body;
    const patientId = req.user.id;

    // Check if patientId and title are provided
    if (!patientId || !title || !title.trim()) {
      return res.status(400).json({ message: "Playlist title is required" });
    }

    // Find patient
    const patient = await Patient.findById(patientId).populate("playlists");
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Check if a playlist with the same title already exists for this patient
    const titleExists = patient.playlists.some(
      (pl) => pl.title.toLowerCase() === title.trim().toLowerCase()
    );
    if (titleExists) {
      return res.status(400).json({ message: "Playlist title already exists" });
    }

    // Create playlist
    const playlist = await Playlist.create({ patientId, title: title.trim() });

    // Add to patient's playlist array
    patient.playlists.push(playlist._id);
    await patient.save();

    res.status(201).json({ message: "Playlist created successfully", playlist });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: e.message });
  }
});


/**
 * @route   GET /api/playlist
 * @desc    Get all playlists for a specific patient 
 * @access  Private (patient only)
 */
const getUserPlaylists = asyncHandler(async (req, res) => {
  try{
    const patientId = req.user.id;

    //Fetch playlists, most recent first
    const playlists = await Playlist.find({ patientId })
      .sort({ createdAt: -1 }) 
      .lean();

    if (!playlists.length) {
      return res.status(200).json({ playlists: [] });
    }

    const playlistData = await Promise.all(
      playlists.map(async (playlist) => {
        //Find first media for thumbnail
        const firstItem = await PlaylistJunction.findOne({ playlistId: playlist._id })
          .populate({
            path: "mediaId",
            select: "imageUrl",
          })
          .lean();

        //Count total media items in this playlist
        const totalVideos = await PlaylistJunction.countDocuments({ playlistId: playlist._id });

        return {
          _id: playlist._id,
          title: playlist.title,
          imageUrl: firstItem?.mediaId?.imageUrl || null,
          totalVideos, 
          createdAt: playlist.createdAt,
        };
      })
    );

    return res.status(200).json({ playlists: playlistData });

  }catch(e){
    return res.status(500).json({message:e.message});
  }
  
});


/**
 * @route   GET /api/playlist/get/:id
 * @desc    Get single playlist details with all media
 * @access  Private (patient only)
 */
const getPlaylistById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const playlistItems = await PlaylistJunction.find({ playlistId: id })
      .populate({
        path: "mediaId",
        select: "title description imageUrl audioUrl by moodCategory",
      })
      .populate({
        path: "playlistId",
        select: "title",
      })
      .lean();

    if (!playlistItems.length) {
      const playlist = await Playlist.findById(id);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }

      return res.status(200).json({
        playlist: {
          _id: playlist._id,
          title: playlist.title,
          imageUrl: null,
        },
        media: [],
      });
    }

    const playlist = playlistItems[0].playlistId;

    const firstMediaWithImage = playlistItems.find(
      (item) => item.mediaId && item.mediaId.imageUrl
    );
    const playlistImage = firstMediaWithImage
      ? firstMediaWithImage.mediaId.imageUrl
      : null;

    // ---- Add duration for each media item ----
    const mediaWithDuration = await Promise.all(
      playlistItems.map(async (item) => {
        let durationStr = null;

        if (item.mediaId?.audioUrl) {
          try {
            const response = await axios.get(item.mediaId.audioUrl, { responseType: "arraybuffer" });
            const metadata = await mm.parseBuffer(response.data);
            const durationSec = metadata.format.duration || 0;
            const minutes = Math.ceil(durationSec / 60);
            durationStr = `${minutes} min`;
          } catch (err) {
            console.error("Duration error:", err.message);
          }
        }

        return {
          _id: item._id,
          mediaType: item.mediaType,
          media: {
            ...item.mediaId,
          },
          duration: durationStr,
        };
      })
    );

    return res.status(200).json({
      playlist: {
        _id: playlist._id,
        title: playlist.title,
        imageUrl: playlistImage,
      },
      media: mediaWithDuration,
    });

  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});


/**
 * @route   POST /api/playlist/add/:playlistId
 * @desc    Add media to playlist (Music or Meditation)
 * @access  Private (patient only)
 */
const addMediaToPlaylist = asyncHandler(async (req, res) => {
  try{
    const { playlistId } = req.params;
    const { mediaType, mediaId } = req.body;

    if (!mediaType || !mediaId) {
      return res.status(400).json({ message: "Media type and ID are required" });
    }

    const validTypes = ["Music", "Meditation"];
    if (!validTypes.includes(mediaType)) {
      return res.status(400).json({ message: "Invalid media type" });
    }

    const exists = await PlaylistJunction.findOne({ playlistId, mediaType, mediaId });
    if (exists) {
      return res.status(400).json({ message: "Item already in playlist" });
    }

    const added = await PlaylistJunction.create({ playlistId, mediaType, mediaId });

    res.status(201).json({ message: "Media added to playlist", added });
  }catch(e){
    return res.status(500).json({message:e.message});
  }
  
});

/**
 * @route   DELETE /api/playlist/remove/:playlistId/:junctionId
 * @desc    Remove a media item from playlist
 * @access  Private (patient only)
 */
const removeMediaFromPlaylist = asyncHandler(async (req, res) => {
  try{
    const { playlistId, junctionId } = req.params;

    const deleted = await PlaylistJunction.findOneAndDelete({
      _id: junctionId,
      playlistId,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Item not found in playlist" });
    }

    res.status(200).json({ success: true, message: "Media removed from playlist" });

  }catch(e){
    return res.status(500).json({message:e.message});
  }
  
});

/**
 * @route   DELETE /api/playlist/delete/:id
 * @desc    Delete an entire playlist (and its junction entries)
 * @access  Private (patient only)
 */
const deletePlaylist = asyncHandler(async (req, res) => {
  try{
    const { id } = req.params;
    const patientId = req.user.id;

    const playlist = await Playlist.findOne({ _id: id, patientId });
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found or unauthorized" });
    }

    // Remove playlist references from patient
    await Patient.findByIdAndUpdate(patientId, {
      $pull: { playlists: id },
    });

    // Delete playlist and all its media links
    await PlaylistJunction.deleteMany({ playlistId: id });
    await playlist.deleteOne();

    res.status(200).json({success:true, message: "Playlist deleted successfully" });
  }catch(e){
    return res.status(500).json({message:e.message});
  }
 
});

/**
 * @route  POST /api/playlist/check/:mediaId
 * @desc   Check if the media exists in the playlist
 * @access Private (patient only)
 */
const checkMediaInPlaylist = asyncHandler(async (req, res) => {
  const patientId = req.user.id;
  const { mediaId } = req.params;

  if (!mediaId) {
    return res.status(400).json({ message: "Media ID is required" });
  }

  // Find all playlists of the current user
  const playlists = await Playlist.find({ patientId }).select("_id");

  if (!playlists.length) {
    return res.status(200).json({ exists: false });
  }

  // Check if the media exists in any of these playlists
  const found = await PlaylistJunction.findOne({
    playlistId: { $in: playlists.map((p) => p._id) },
    mediaId,
  });
  const exists = !!found;
  res.status(200).json({ exists });
});

module.exports = {addMediaToPlaylist, createPlaylist, deletePlaylist, removeMediaFromPlaylist, getPlaylistById, getUserPlaylists, checkMediaInPlaylist}