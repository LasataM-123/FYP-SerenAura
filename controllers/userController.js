const Patient = require('../models/patientModel');
const Counselor = require('../models/counselorModel'); // you missed this import in your snippet
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");

const OTP_EXPIRY = 5 * 60; 
const JWT_SECRET = process.env.JWT_SECRET_KEY;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET_KEY;

// --- Helper: send email ---
const sendOTPEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  await transporter.sendMail({
    from: `"SerenAura" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🔒 Verify your email for SerenAura",
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 40px 0;">
        <div style="max-width: 500px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-align: center;">
          <h1 style="color: #553434; font-size: 28px; margin-bottom: 10px;">Welcome to SerenAura!</h1>
          <p style="color: #555; font-size: 16px; margin-bottom: 30px;">
            Thank you for signing up. Use the OTP below to verify your email:
          </p>
          <div style="font-size: 32px; font-weight: bold; color: #74CEE2; margin: 20px 0; letter-spacing: 4px; background-color: #f0f8ff; padding: 15px 0; border-radius: 8px;">
            ${otp}
          </div>
          <p style="color: #555; font-size: 14px;">
            This OTP will expire in <strong>5 minutes</strong>.
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            If you did not create an account, you can safely ignore this email.
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 10px;">
            &copy; ${new Date().getFullYear()} SerenAura
          </p>
        </div>
      </div>
    `,
  });
};

// --- Helper: generate OTP ---
const generateOTP = () =>
  Math.floor(1000 + Math.random() * 9000).toString();

// --- Helper: generate tokens ---
const generateTokens = (userId, email, role) => {
  const accessToken = jwt.sign(
    { id: userId, email, role },
    JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { id: userId, email, role },
    JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

// @route POST /login
// @desc Login user
// @access Public
const loginController = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    // Check Patient first
    let user = await Patient.findOne({ email });
    let role = "patient";

    // If not found in Patient, check Counselor
    if (!user) {
      user = await Counselor.findOne({ email });
      role = "counselor";
    }

    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    // If patient, check verified
    if (role === "patient" && !user.verified) {
      return res.status(403).json({ message: "Please verify your email first." });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid)
      return res.status(400).json({ message: "Invalid email or password" });

    // Issue tokens
    const { accessToken, refreshToken } = generateTokens(user._id, user.email, role);

    res.json({
      message: "Logged in successfully!",
      accessToken,
      refreshToken,
      userId: user._id,
      role,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

//@ROUTE POST /register
//@DESC Register patient
//@ACCESS Public
const register = asyncHandler(async (req, res) => {
  try {
    const { name, dateOfBirth, email, password } = req.body;
    if (!name || !dateOfBirth || !email || !password) {
      return res.status(400).json({ error: "Please fill all fields" });
    }

    const existing = await Patient.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = generateOTP();

    // Create unverified patient
    const newPatient = await Patient.create({
      name,
      dateOfBirth,
      email,
      password: passwordHash,
      verified: false,
    });

    // JWT with OTP (stateless, no DB for OTP)
    const otpToken = jwt.sign({ email, otp }, JWT_SECRET, {
      expiresIn: `${OTP_EXPIRY}s`,
    });

    await sendOTPEmail(email, otp);

    res.json({ otpToken, message: "OTP sent to email. Please verify." });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

//@ROUTE POST /verify-otp
//@DESC Verify OTP
//@ACCESS Public
const verifyOTP = asyncHandler(async (req, res) => {
  const { otp, otpToken } = req.body;

  try {
    const decoded = jwt.verify(otpToken, JWT_SECRET);

    if (decoded.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Mark patient verified
    const patient = await Patient.findOneAndUpdate(
      { email: decoded.email },
      { verified: true },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return tokens after verification
    const { accessToken, refreshToken } = generateTokens(patient._id, decoded.email, "patient");

    res.json({
      message: "OTP verified successfully",
      accessToken,
      refreshToken,
      userId: patient._id,
      role: "patient",
    });
  } catch (err) {
    res.status(400).json({ message: "OTP expired or invalid" });
  }
});

//@ROUTE GET /resend-otp/:otpToken
//@DESC Resend OTP
//@ACCESS Public
const resendOTP = asyncHandler(async (req, res) => {
  const { otpToken } = req.params;

  try {
    // Decode the old token to get the email
    const decoded = jwt.verify(otpToken, JWT_SECRET);
    const email = decoded.email;

    const patient = await Patient.findOne({ email });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    if (patient.verified) {
      return res.status(400).json({ message: "Patient already verified" });
    }

    // Generate new OTP + token
    const otp = generateOTP();
    const newOtpToken = jwt.sign({ email, otp }, JWT_SECRET, {
      expiresIn: `${OTP_EXPIRY}s`,
    });

    await sendOTPEmail(email, otp);

    res.json({ otpToken: newOtpToken, message: "New OTP sent to email" });
  } catch (err) {
    return res.status(400).json({ message: "Invalid or expired OTP token" });
  }
});

//@ROUTE POST /refresh
//@DESC Refresh access token using refresh token
//@ACCESS Public
const refreshTokenController = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: "No refresh token" });

  jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid refresh token" });

    const accessToken = jwt.sign(
      { userId: decoded.id, email: decoded.email, role: decoded.role },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ accessToken });
  });
});

module.exports = {
  loginController,
  register,
  verifyOTP,
  resendOTP,
  refreshTokenController,
};
