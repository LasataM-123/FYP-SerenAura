const crypto = require("crypto");
const axios = require("axios");

// --- CONFIGURATION ---
const ESEWA_TEST_PID = "EPAYTEST";
const ESEWA_TEST_SECRET = "8gBm/:&EnhH.1/q";
const ESEWA_STATUS_URL = "https://rc-epay.esewa.com.np/api/epay/transaction/status";
const ESEWA_FORM_URL = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";

const getEsewaConfig = (amount, transactionUuid) => {
  // Signature format: "total_amount,transaction_uuid,product_code"
  const signatureString = `total_amount=${amount},transaction_uuid=${transactionUuid},product_code=${ESEWA_TEST_PID}`;
  
  const hash = crypto.createHmac("sha256", ESEWA_TEST_SECRET)
    .update(signatureString)
    .digest("base64");

  return {
    amount,
    product_code: ESEWA_TEST_PID,
    signature: hash,
    uuid: transactionUuid,
    esewa_url: ESEWA_FORM_URL
  };
};

const verifyPaymentStatus = async (pid, amount) => {
  try {
    const response = await axios.get(ESEWA_STATUS_URL, {
      params: {
        product_code: ESEWA_TEST_PID,
        total_amount: amount,
        transaction_uuid: pid,
      },
    });
    
    // eSewa V2 returns "COMPLETE" for success
    return response.data.status === "COMPLETE";
  } catch (error) {
    console.error("eSewa Verify Error:", error.message);
    return false;
  }
};

module.exports = { getEsewaConfig, verifyPaymentStatus };