const cron = require("node-cron");
const Subscription = require("../models/subscriptionModel");
const Patient = require("../models/patientModel");

const expireSubscriptions = async () => {
  const now = new Date();

  const expiredSubs = await Subscription.find({
    status: "active",
    endDate: { $lt: now },
  });

  if (!expiredSubs.length) return;

  for (const sub of expiredSubs) {
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
};

cron.schedule("0 0 * * *", expireSubscriptions);

module.exports = expireSubscriptions;
