const Patient = require('../models/patientModel');
const Counselor = require('../models/counselorModel');

const sendNotification = async (io, userId, userType, data) => {
  try {

    const Model = userType === 'Counselor' ? Counselor : Patient;
    const user = await Model.findById(userId);

    // If user has notifications disabled, stop here and do nothing
    if (!user || !user.notificationsEnabled) {
      console.log(`Notification blocked: ${userId} has notifications turned OFF.`);
      return;
    }

    console.log(`Sending notification to ${userId}: ${data.title}`);

    io.to(userId.toString()).emit('new_notification', {
      title: data.title,
      message: data.message,
      type: data.type,
      createdAt: new Date(),
    });

  } catch (error) {
    console.error("Error in notification service:", error);
  }
};

module.exports = { sendNotification };