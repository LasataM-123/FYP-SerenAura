const cron = require('node-cron');
const Patient = require('../models/patientModel');
const Mood = require('../models/moodModel');
const { sendNotification } = require('../service/notificationService');

const initMoodCron = (io) => {
  // Runs every day at 8:00 PM
  cron.schedule('0 20 * * *', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const patients = await Patient.find({ notificationsEnabled: true });

      for (const patient of patients) {
        const entry = await Mood.findOne({
          patientId: patient._id,
          entryDate: { $gte: today }
        });

        if (!entry) {

          await sendNotification(io, patient._id, 'Patient', {
            type: 'MOOD_REMINDER',
            title: 'Mood Check-in',
            message: "Hi! You haven't logged your mood today."
          });
        }
      }
    } catch (err) {
      console.error("Cron Job Error:", err);
    }
  });
};

module.exports = initMoodCron;