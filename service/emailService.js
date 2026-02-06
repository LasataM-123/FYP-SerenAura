// service/emailService.js
const nodemailer = require("nodemailer");

// 1️⃣ Setup Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 2️⃣ Send Invoice Email (HTML only)
const sendInvoiceEmail = async (userEmail, planType, amount, uuid) => {
  try {
    const mailOptions = {
      from: `"SerenAura Support" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: "🧾 SerenAura Subscription Invoice",
      html: `
        <div style="font-family: Arial, sans-serif; background:#f5f5f5; padding:30px;">
          <div style="max-width:520px; margin:auto; background:#ffffff; padding:30px; border-radius:12px;">
            
            <h2 style="color:#553434; margin-bottom:10px;">
              Payment Successful 🎉
            </h2>

            <p>Hello,</p>
            <p>
              Thank you for subscribing to the 
              <strong>${planType}</strong> plan on SerenAura.
            </p>

            <hr style="margin:20px 0;" />

            <p><strong>Transaction ID:</strong> ${uuid}</p>
            <p><strong>Amount Paid:</strong> NPR ${amount}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>

            <hr style="margin:20px 0;" />

            <p style="font-size:14px; color:#666;">
              Your subscription is now active.  
              You can view your invoice anytime inside the app.
            </p>

            <p style="margin-top:30px;">
              Best regards,<br/>
              <strong>SerenAura Team</strong>
            </p>

            <p style="font-size:12px; color:#999; margin-top:30px;">
              &copy; ${new Date().getFullYear()} SerenAura
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Invoice email sent to:", userEmail);
    return true;
  } catch (error) {
    console.error("❌ Invoice Email Error:", error);
    return false;
  }
};

module.exports = { sendInvoiceEmail };
