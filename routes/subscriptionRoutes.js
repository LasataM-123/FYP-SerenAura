const express = require("express");
const { tokenHandler } = require("../middlewares/tokenHandler");
const { validPatient } = require("../middlewares/validPatient");
const { subscribePatient, renewSubscription, cancelSubscription } = require("../controllers/subscriptionController");
const router = express.Router();

router.post("/", tokenHandler, validPatient, subscribePatient);

router.post('/renew', tokenHandler, validPatient, renewSubscription);

router.put('/cancel', tokenHandler, validPatient, cancelSubscription);

module.exports = router;