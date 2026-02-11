// service/emailService.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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
    console.log("Invoice email sent to:", userEmail);
    return true;
  } catch (error) {
    console.error("Invoice Email Error:", error);
    return false;
  }
};

const sendCancelSubscriptionEmail = async (userEmail, planType, endDate) => {
  try {
    const mailOptions = {
      from: `"SerenAura Support" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: "💔 Subscription Cancellation Confirmation",
      html: `
        <div style="font-family: Arial, sans-serif; background:#f5f5f5; padding:30px;">
          <div style="max-width:520px; margin:auto; background:#ffffff; padding:30px; border-radius:12px;">
            
            <h2 style="color:#553434; margin-bottom:10px;">
              Subscription Cancelled
            </h2>

            <p>Hello,</p>
            <p>
              We're sorry to see you go. This email confirms that your 
              <strong>${planType}</strong> subscription has been cancelled.
            </p>

            <hr style="margin:20px 0;" />

            <p style="font-size:14px; color:#666;">
              <strong>Note:</strong> You will continue to have access to your plan benefits until 
              <strong>${endDate}</strong>. No further charges will be made.
            </p>

            <p style="font-size:14px; color:#666;">
              If you change your mind, you can resubscribe anytime from the app settings.
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
    console.log("Cancel subscription email sent to:", userEmail);
    return true;
  } catch (error) {
    console.error("Cancel Subscription Email Error:", error);
    return false;
  }
};

const sendSubscriptionExpiredEmail = async (userEmail, planType) => {
  try {
    const mailOptions = {
      from: `"SerenAura Support" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: "⚠️ Your SerenAura Subscription Has Expired",
      html: `
        <div style="font-family: Arial, sans-serif; background:#f5f5f5; padding:30px;">
          <div style="max-width:520px; margin:auto; background:#ffffff; padding:30px; border-radius:12px;">
            
            <h2 style="color:#553434; margin-bottom:10px;">
              Subscription Expired
            </h2>

            <p>Hello,</p>
            <p>
              Your <strong>${planType}</strong> subscription has expired as of today.
            </p>

            <div style="background:#fff3cd; border:1px solid #ffeeba; color:#856404; padding:15px; border-radius:5px; margin: 20px 0;">
              You have lost access to premium features. Please renew your subscription to continue enjoying SerenAura without interruptions.
            </div>

            <p style="margin-top:30px;">
              Hope to see you back soon,<br/>
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
    console.log("Subscription expired email sent to:", userEmail);
    return true;
  } catch (error) {
    console.error("Subscription Expired Email Error:", error);
    return false;
  }
};

module.exports = { sendInvoiceEmail, sendCancelSubscriptionEmail, sendSubscriptionExpiredEmail };
