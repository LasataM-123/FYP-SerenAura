const express = require("express");
const { tokenHandler } = require("../middlewares/tokenHandler");
const { validPatient } = require("../middlewares/validPatient");
const { subscribePatient, renewSubscription, cancelSubscription, initiatePayment } = require("../controllers/subscriptionController");
const router = express.Router();

router.post("/subscribe", tokenHandler, validPatient, subscribePatient);

router.post('/renew', tokenHandler, validPatient, renewSubscription);

router.put('/cancel', tokenHandler, validPatient, cancelSubscription);

router.post('/initiate', tokenHandler, validPatient, initiatePayment)

module.exports = router;