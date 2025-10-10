import mongoose from "mongoose";

const favouriteSchema = new mongoose.Schema({
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
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Favourite", favouriteSchema);
