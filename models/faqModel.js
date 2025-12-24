const mongoose = require("mongoose");

const supportQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },

    answer: {
      type: String,
      default: null, 
    },

    askedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isAnswered: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupportQuestion", supportQuestionSchema);
