const mongoose = require('mongoose');

const onboardingSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
    },
    responses:[
        {
            question:{
                type: String,
            },
            answer:{
                type: String,
            }
        }
    ]
});

module.exports = mongoose.model('Onboarding', onboardingSchema);