const sendNotification = async (io, userId, userType, data) => {
  try {
    // 1. Log for debugging
    console.log(`Sending notification to ${userId}: ${data.title}`);

    // 2. Emit to the room named after the userId
    // This MUST match the room the user joined in RootLayout
    io.to(userId.toString()).emit('new_notification', {
      title: data.title,
      message: data.message,
      type: data.type, // e.g., 'MOOD_REMINDER'
      createdAt: new Date(),
    });

    // 3. Optional: Save to database here if you have a Notification model
    // await Notification.create({ recipient: userId, ...data });

  } catch (error) {
    console.error("Error in notification service:", error);
  }
};

module.exports = { sendNotification };