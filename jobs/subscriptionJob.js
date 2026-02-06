const cron = require("node-cron");
const Subscription = require("../models/subscriptionModel");
const Patient = require("../models/patientModel");

/**
 * Expire subscriptions whose endDate has passed
 */
const expireSubscriptions = async () => {
  try {
    const now = new Date();

    const expiredSubs = await Subscription.find({
      status: "active",
      endDate: { $lt: now },
    });

    if (!expiredSubs.length) {
      console.log("No subscriptions to expire");
      return;
    }

    for (const sub of expiredSubs) {
      // Mark subscription as expired
      sub.status = "expired";
      await sub.save();

      // Check if patient has any other active subscription
      const stillActive = await Subscription.findOne({
        patientId: sub.patientId,
        status: "active",
        endDate: { $gte: now },
      });

      if (!stillActive) {
        await Patient.findByIdAndUpdate(sub.patientId, {
          isSubscribed: false,
          subscriptionType: null,
        });
      }
    }

    console.log(`Expired ${expiredSubs.length} subscriptions`);
  } catch (error) {
    console.error("expireSubscriptions error:", error);
  }
};

/**
 * Run every day at 12:00 AM Nepal time
 */
cron.schedule(
  "0 0 * * *",
  async () => {
    try {
      await expireSubscriptions();
    } catch (error) {
      console.error("Subscription expiry cron failed:", error);
    }
  },
  {
    timezone: "Asia/Kathmandu",
  }
);

module.exports = expireSubscriptions;
