const mongoose = require('mongoose')
const playlistJunctionSchema = new mongoose.Schema({
  mediaType: {
    type: String,
    required: true,
    enum: ["Meditation", "Music"], 
  },
  mediaId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "mediaType", 
  },
  playlistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Playlist",
  },
},{
    timestamps:true
});

module.exports = mongoose.model("PlaylistJunction", playlistJunctionSchema);
