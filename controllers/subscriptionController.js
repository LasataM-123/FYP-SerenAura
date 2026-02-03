const Subscription = require("../models/subscriptionModel");
const Patient = require("../models/patientModel");
const Transaction = require("../models/transactionModel");
const { verifyKhaltiPidx } = require("../service/khaltiService");

/**
 * @route  POST /api/subscribe
 * @desc   Subscribe a patient
 * @access Private (patient only)
 */
const subscribePatient = async (req, res) => {
  try {
    const { pidx, subscriptionType } = req.body;
    const patientId = req.user.id;

    const payment = await verifyKhaltiPidx(pidx);

    if (payment.status !== "Completed") {
      return res.status(400).json({ message: "Payment not completed" });
    }

    const used = await Transaction.findOne({ khaltiIdx: payment.idx });
    if (used) {
      return res.status(400).json({ message: "Payment already used" });
    }

    const activeSub = await Subscription.findOne({
      patientId,
      status: "active",
    });
    if (activeSub) {
      return res.status(400).json({ message: "Already subscribed" });
    }

    const startDate = new Date();
    const endDate = new Date(startDate);

    if (subscriptionType === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (subscriptionType === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      return res.status(400).json({ message: "Invalid subscription type" });
    }

    const subscription = await Subscription.create({
      patientId,
      subscriptionType,
      startDate,
      endDate,
      status: "active",
    });

    await Patient.findByIdAndUpdate(patientId, {
      isSubscribed: true,
      subscriptionType,
    });

    await Transaction.create({
      type: "INCOME",
      amount: payment.amount / 100,
      category: "subscription",
      patientId,
      khaltiIdx: payment.idx,
      description: `${subscriptionType} subscription`,
    });

    res.status(200).json({
      message: "Subscription activated successfully",
      subscription,
    });
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).json({ message: "Subscription failed" });
  }
};

/**
 * @route  POST /api/subscribe/renew
 * @desc   Renew a patient's subscription
 * @access Private (patient only)
 */
const renewSubscription = async (req, res) => {
  try {
    const { pidx, subscriptionType } = req.body;
    const patientId = req.user.id;

    const payment = await verifyKhaltiPidx(pidx);

    if (payment.status !== "Completed") {
      return res.status(400).json({ message: "Payment not completed" });
    }

    const usedTxn = await Transaction.findOne({ khaltiIdx: payment.idx });
    if (usedTxn) {
      return res.status(400).json({ message: "Payment already used" });
    }

    const lastSub = await Subscription.findOne({ patientId })
      .sort({ endDate: -1 });

    if (!lastSub) {
      return res.status(400).json({ message: "No previous subscription found" });
    }

    const startDate =
      lastSub.endDate > new Date() ? lastSub.endDate : new Date();

    const endDate = new Date(startDate);

    if (subscriptionType === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (subscriptionType === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      return res.status(400).json({ message: "Invalid subscription type" });
    }

    const subscription = await Subscription.create({
      patientId,
      subscriptionType,
      startDate,
      endDate,
      status: "active",
    });

    await Patient.findByIdAndUpdate(patientId, {
      isSubscribed: true,
      subscriptionType,
    });

    await Transaction.create({
      type: "INCOME",
      amount: payment.amount / 100,
      category: "subscription",
      patientId,
      khaltiIdx: payment.idx,
      description: `Renewed ${subscriptionType} subscription`,
    });

    res.status(200).json({
      message: "Subscription renewed successfully",
      subscription,
    });
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).json({ message: "Subscription renewal failed" });
  }
};

/**
 * @route  PUT /api/subscribe/cancel
 * @desc   Cancel a patient's subscription
 * @access Private (patient only)
 */
const cancelSubscription = async (req, res) => {
  try {
    const patientId = req.user.id;

    const activeSub = await Subscription.findOne({
      patientId,
      status: "active",
    });

    if (!activeSub) {
      return res.status(400).json({ message: "No active subscription found" });
    }

    activeSub.status = "cancelled";
    await activeSub.save();

    res.status(200).json({
      message: "Subscription cancelled. Access remains until expiry date.",
      subscription: activeSub,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Cancellation failed" });
  }
};

module.exports = { subscribePatient, renewSubscription, cancelSubscription };