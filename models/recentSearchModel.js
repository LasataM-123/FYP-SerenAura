const mongoose = require('mongoose');

const recentSearchSchema = new mongoose.Schema({
    patientId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient'
    },
    entryDate:{
        type: Date,
        required:true
    },
    content:{
        type: String,
        required: true
    }
},{
    timestamp: true
})

module.exports = mongoose.model("RecentSearch",recentSearchSchema);