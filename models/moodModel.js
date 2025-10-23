const mongoose = require('mongoose');

const moodSchema = new mongoose.Schema({
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Patient", 
    required: true 
},
  entryDate: { 
    type: Date, 
    required: true 
},
  mood: { 
    type: String,
    required: true 
},
  journal: { 
    type: String,
},
  feeling: { 
    type: String,
}
},{
    timestamps: true
});

module.exports = mongoose.model("Mood",moodSchema);