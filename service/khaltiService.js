const axios = require("axios");

const verifyKhaltiPidx = async (pidx) => {
  const response = await axios.post(
    "https://a.khalti.com/api/v2/epayment/lookup/",
    { pidx },
    {
      headers: {
        Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
      },
    }
  );

  return response.data;
};

module.exports = { verifyKhaltiPidx };
