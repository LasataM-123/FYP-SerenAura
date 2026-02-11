const Subscription = require("../models/subscriptionModel");
const Patient = require("../models/patientModel");
const Transaction = require("../models/transactionModel");
const { getEsewaConfig, verifyPaymentStatus } = require("../service/esewaService");
const { sendInvoiceEmail, sendCancelSubscriptionEmail } = require("../service/emailService");

/**
 * @route  POST /api/subscription/initiate
 * @desc   Initiate Payment (Get Signature)
 * @access Private (Patient Only)
 */
const initiatePayment = async (req, res) => {
  try {
    const { subscriptionType } = req.body;
    const patientId = req.user.id;

    let amount = 0;
    if (subscriptionType === "monthly") amount = 700;
    else if (subscriptionType === "yearly") amount = 5000; 
    else return res.status(400).json({ message: "Invalid subscription type" });

    // Generate unique Transaction UUID
    const pid = `${patientId}_${subscriptionType}_${Date.now()}`;

    // Get V2 Config
    const config = getEsewaConfig(amount, pid);

    res.status(200).json({
      success: true,
      ...config, // returns amount, uuid, signature, product_code
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not initiate payment" });
  }
};

/**
 * @route  POST /api/subscription/subscribe
 * @desc   Verify & Activate Subscription
 * @access Private (Patient Only)
 */
const subscribePatient = async (req, res) => {
  try {
    const { pid, subscriptionType } = req.body;
    const patientId = req.user.id;

    let amount = 0;
    if (subscriptionType === "monthly") amount = 700;
    else if (subscriptionType === "yearly") amount = 5000;
    else return res.status(400).json({ message: "Invalid subscription type" });

    const isValid = await verifyPaymentStatus(pid, amount);
    if (!isValid) {
      return res.status(400).json({ message: "Payment verification failed or pending" });
    }

    // Using your 'esewaId' field from TransactionSchema
    const usedTxn = await Transaction.findOne({ esewaId: pid });
    if (usedTxn) {
      return res.status(400).json({ message: "Payment already processed" });
    }

    const activeSub = await Subscription.findOne({
      patientId,
      status: "active",
    });

    if (activeSub) {
      return res.status(400).json({ message: "User already has an active subscription" });
    }

    const startDate = new Date();
    const endDate = new Date(startDate);

    if (subscriptionType === "monthly") endDate.setMonth(endDate.getMonth() + 1);
    else endDate.setFullYear(endDate.getFullYear() + 1);

    const subscription = await Subscription.create({
      patientId,
      subscriptionType, // 'monthly' or 'yearly'
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
      amount,
      category: "subscription",
      patientId,
      esewaId: pid, 
      description: `${subscriptionType} subscription activation`,
      timestamp: new Date()
    });
    const patient = await Patient.findById(patientId);
    
    if (patient && patient.email) {
       sendInvoiceEmail(patient.email, subscriptionType, amount, pid)
         .catch(err => console.log("Failed to send email in background", err));
    }

    res.status(200).json({
      message: "Subscription activated successfully",
      subscription,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Subscription activation failed" });
  }
};

/**
 * @route  POST /api/subscription/renew
 * @desc   Renew Subscription
 * @access Private (Patient Only)
 */
const renewSubscription = async (req, res) => {
  try {
    const { pid, subscriptionType } = req.body;
    const patientId = req.user.id;

    let amount = 0;
    if (subscriptionType === "monthly") amount = 700;
    else if (subscriptionType === "yearly") amount = 5000;
    else return res.status(400).json({ message: "Invalid subscription type" });

    // Verify Payment
    const isValid = await verifyPaymentStatus(pid, amount);
    if (!isValid) return res.status(400).json({ message: "Payment invalid" });

    // Check Duplicate Transaction
    const usedTxn = await Transaction.findOne({ esewaId: pid });
    if (usedTxn) return res.status(400).json({ message: "Payment already used" });

    // Get previous subscription
    const lastSub = await Subscription.findOne({ patientId }).sort({ endDate: -1 });
    
    // Calculate dates
    const startDate = (lastSub && lastSub.endDate > new Date()) ? lastSub.endDate : new Date();
    const endDate = new Date(startDate);
    
    if (subscriptionType === "monthly") endDate.setMonth(endDate.getMonth() + 1);
    else endDate.setFullYear(endDate.getFullYear() + 1);

    // Create new subscription record
    const subscription = await Subscription.create({
      patientId,
      subscriptionType,
      startDate,
      endDate,
      status: "active",
    });

    // Update Patient
    await Patient.findByIdAndUpdate(patientId, {
      isSubscribed: true,
      subscriptionType
    });

    // Record Transaction
    await Transaction.create({
      type: "INCOME",
      amount,
      category: "subscription",
      patientId,
      esewaId: pid,
      description: `Renewed ${subscriptionType} subscription`,
    });

    res.status(200).json({
      message: "Subscription renewed successfully",
      subscription,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Renewal failed" });
  }
};

/**
 * @route  PUT /api/subscription/cancel
 * @desc   Cancel Subscription
 * @access Private (Patient Only)
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

    const user = await Patient.findById(patientId);
    if (!user) {
        return res.status(404).json({ message: "Patient not found" });
    }

    // 3. Update subscription status
    activeSub.status = "cancelled";
    await activeSub.save();

    const formattedEndDate = new Date(activeSub.endDate).toDateString(); 
 
    await sendCancelSubscriptionEmail(
        user.email, 
        activeSub.subscriptionType, 
        formattedEndDate
    );

    res.status(200).json({
      message: "Subscription cancelled. Confirmation email sent.",
      subscription: activeSub,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Cancellation failed" });
  }
};

/**
 * @route GET /api/subscription/status
 * @desc Get current subscription status
 * @access Private (Patient Only)
 */
const getSubscriptionStatus = async (req, res) => {
  try {
    const patientId = req.user.id;
    const activeSub = await Subscription.findOne({
      patientId,
      status: "active",
    });
    if (!activeSub) {
      return res.status(200).json({ isSubscribed: false, subscriptionType: null, endDate: null });
    }

    res.status(200).json({
      isSubscribed: true,
      subscriptionType: activeSub.subscriptionType,
      endDate: activeSub.endDate,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not fetch subscription status" });
  }
};

module.exports = {
  initiatePayment,
  subscribePatient,
  renewSubscription,
  cancelSubscription,
  getSubscriptionStatus
};