const mongoose = require('mongoose')
const playlistSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
    },
    title: {
      type: String,
      required: true,

    },
},{
    timestamps: true
});

module.exports = mongoose.model("Playlist", playlistSchema);
