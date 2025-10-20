const asyncHandler = require('express-async-handler');
const Patient = require('../models/patientModel');
const PlaylistJunction = require('../models/playlistJunctionModel');
const Playlist = require('../models/playlistModel');
/**
 * @route   POST /api/playlist/create
 * @desc    Create a new playlist for a patient
 * @access  Private
 */
const createPlaylist = asyncHandler(async (req, res) => {
  const { title } = req.body;
  const patientId = req.user.id;

  if (!patientId || !title) {
    return res.status(400).json({ message: "Patient ID and title are required" });
  }

  const patient = await Patient.findById(patientId);
  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }

  // Create playlist
  const playlist = await Playlist.create({ patientId, title });

  // Add to patient's playlist array
  patient.playlists.push(playlist._id);
  await patient.save();

  res.status(201).json({ message: "Playlist created successfully", playlist });
});

/**
 * @route   GET /api/playlist
 * @desc    Get all playlists for a specific patient (with one preview image)
 * @access  Private
 */
const getUserPlaylists = asyncHandler(async (req, res) => {
  const patientId  = req.user.id;

  const playlists = await Playlist.find({ patientId }).lean();

  if (!playlists.length) {
    return res.status(200).json({ playlists: [] });
  }

  const playlistData = await Promise.all(
    playlists.map(async (playlist) => {
      const firstItem = await PlaylistJunction.findOne({ playlistId: playlist._id })
        .populate({
          path: "mediaId",
          select: "imageUrl",
        })
        .lean();

      return {
        _id: playlist._id,
        title: playlist.title,
        imageUrl: firstItem?.mediaId?.imageUrl || null,
      };
    })
  );

  res.status(200).json({ playlists: playlistData });
});

/**
 * @route   GET /api/playlist/get/:id
 * @desc    Get single playlist details with all media
 * @access  Private
 */
const getPlaylistById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const playlistItems = await PlaylistJunction.find({ playlistId: id })
    .populate({
      path: "mediaId",
      select: "title description imageUrl audioUrl by moodCategory",
    })
    .populate({
      path: "playlistId",
      select: "title",
    });

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

  res.status(200).json({
    playlist: {
      _id: playlist._id,
      title: playlist.title,
      imageUrl: playlistImage,
    },
    media: playlistItems.map((item) => ({
      _id: item._id,
      mediaType: item.mediaType,
      media: item.mediaId,
    })),
  });
});

/**
 * @route   POST /api/playlist/add/:playlistId
 * @desc    Add media to playlist (Music or Meditation)
 * @access  Private
 */
const addMediaToPlaylist = asyncHandler(async (req, res) => {
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
});

/**
 * @route   DELETE /api/playlist/remove/:playlistId/:junctionId
 * @desc    Remove a media item from playlist
 * @access  Private
 */
const removeMediaFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, junctionId } = req.params;

  const deleted = await PlaylistJunction.findOneAndDelete({
    _id: junctionId,
    playlistId,
  });

  if (!deleted) {
    return res.status(404).json({ message: "Item not found in playlist" });
  }

  res.status(200).json({ message: "Media removed from playlist" });
});

/**
 * @route   DELETE /api/playlist/delete/:id
 * @desc    Delete an entire playlist (and its junction entries)
 * @access  Private
 */
const deletePlaylist = asyncHandler(async (req, res) => {
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

  res.status(200).json({ message: "Playlist deleted successfully" });
});

module.exports = {addMediaToPlaylist, createPlaylist, deletePlaylist, removeMediaFromPlaylist, getPlaylistById, getUserPlaylists}