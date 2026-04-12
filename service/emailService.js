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
      from: `"SerenAura" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: "🧾 SerenAura Subscription Invoice",
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 40px 0;">
          <div style="max-width: 500px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-align: center;">
            <h1 style="color: #553434; font-size: 28px; margin-bottom: 10px;">
              Payment Successful 🎉
            </h1>
            <p style="color: #555; font-size: 16px; margin-bottom: 20px;">
              Thank you for subscribing to the <strong>${planType}</strong> plan on SerenAura.
            </p>
            
            <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left; color: #555; font-size: 15px; line-height: 1.6;">
              <p style="margin: 0;"><strong>Transaction ID:</strong> ${uuid}</p>
              <p style="margin: 0;"><strong>Amount Paid:</strong> NPR ${amount}</p>
              <p style="margin: 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>

            <p style="color: #555; font-size: 14px;">
              Your subscription is now active. You can view your invoice anytime inside the app.
            </p>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              Best regards,<br/><strong>SerenAura Team</strong>
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 10px;">
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
      from: `"SerenAura" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: "💔 Subscription Cancellation Confirmation",
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 40px 0;">
          <div style="max-width: 500px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-align: center;">
            <h1 style="color: #553434; font-size: 28px; margin-bottom: 10px;">
              Subscription Cancelled
            </h1>
            <p style="color: #555; font-size: 16px; margin-bottom: 20px;">
              We're sorry to see you go. This email confirms that your <strong>${planType}</strong> subscription has been cancelled.
            </p>
            
            <div style="background-color: #fdf2f2; border-left: 4px solid #e74c3c; padding: 15px; border-radius: 4px; margin: 20px 0; text-align: left; color: #555; font-size: 14px; line-height: 1.5;">
              <strong>Note:</strong> You will continue to have access to your plan benefits until <strong>${endDate}</strong>. No further charges will be made.
            </div>

            <p style="color: #555; font-size: 14px;">
              If you change your mind, you can resubscribe anytime from the app settings.
            </p>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              Best regards,<br/><strong>SerenAura Team</strong>
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 10px;">
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
      from: `"SerenAura" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: "⚠️ Your SerenAura Subscription Has Expired",
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 40px 0;">
          <div style="max-width: 500px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-align: center;">
            <h1 style="color: #553434; font-size: 28px; margin-bottom: 10px;">
              Subscription Expired
            </h1>
            <p style="color: #555; font-size: 16px; margin-bottom: 20px;">
              Hello, your <strong>${planType}</strong> subscription has expired as of today.
            </p>
            
            <div style="background-color: #fff3cd; color: #856404; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 15px; line-height: 1.5;">
              You have lost access to premium features. Please renew your subscription to continue enjoying SerenAura without interruptions.
            </div>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              Hope to see you back soon,<br/><strong>SerenAura Team</strong>
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 10px;">
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

const sendResubscribeEmail = async (email, planType, endDate) => {
  try {
    const mailOptions = {
      from: `"SerenAura" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🎉 Your SerenAura Subscription is Active Again!",
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 40px 0;">
          <div style="max-width: 500px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-align: center;">
            
            <h1 style="color: #553434; font-size: 28px; margin-bottom: 10px;">
              Welcome Back! 🎉
            </h1>

            <p style="color: #555; font-size: 16px; margin-bottom: 20px;">
              You have successfully resubscribed to the <strong>${planType}</strong> plan on SerenAura.
            </p>
            
            <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left; color: #555; font-size: 15px; line-height: 1.6;">
              <p style="margin: 0;"><strong>Status:</strong> Active ✅</p>
              <p style="margin: 0;"><strong>Plan:</strong> ${planType}</p>
              <p style="margin: 0;"><strong>Valid Until:</strong> ${endDate}</p>
            </div>

            <p style="color: #555; font-size: 14px;">
              Your premium access has been restored without any interruption. Enjoy all features again!
            </p>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              Best regards,<br/><strong>SerenAura Team</strong>
            </p>

            <p style="color: #999; font-size: 12px; margin-top: 10px;">
              &copy; ${new Date().getFullYear()} SerenAura
            </p>

          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Resubscribe email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending resubscribe email:", error);
    return false;
  }
};

module.exports = { sendInvoiceEmail, sendCancelSubscriptionEmail, sendSubscriptionExpiredEmail, sendResubscribeEmail };