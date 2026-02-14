const Patient = require('../models/patientModel');
const Counselor = require('../models/counselorModel');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const axios = require('axios');

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
    <h1 style="color: #553434; font-size: 28px; margin-bottom: 10px;">
      Welcome to SerenAura!
    </h1>
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

/**
 * @route  POST /api/auth/login
 * @desc   Login user
 * @access Public
 */
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
    if (user.role === "patient" && !user.verified) {
      return res.status(400).json({ message: "Please verify your email first." });
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
      name: user.name,
      userId: user._id,
      role,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route  POST /api/auth/register
 * @desc   Register patient
 * @access Public
 */
const register = asyncHandler(async (req, res) => {
  try {
    const { name, dateOfBirth, email, password } = req.body;

    /* ---------------- REQUIRED FIELDS ---------------- */
    if (!name || !dateOfBirth || !email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    /* ---------------- DATE OF BIRTH VALIDATION ---------------- */
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateOfBirth)) {
      return res
        .status(400)
        .json({ message: "Date of Birth must be in YYYY-MM-DD format" });
    }

    const [yearStr, monthStr, dayStr] = dateOfBirth.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    if (month < 1 || month > 12) {
      return res
        .status(400)
        .json({ message: "Month must be between 01 and 12" });
    }

    const daysInMonth = [
      31,
      (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28,
      31,
      30,
      31,
      30,
      31,
      31,
      30,
      31,
      30,
      31,
    ];

    if (day < 1 || day > daysInMonth[month - 1]) {
      return res.status(400).json({
        message: `Day must be between 01 and ${daysInMonth[month - 1]} for month ${monthStr}`,
      });
    }


    // Basic email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Must be Gmail
    const gmailRegex = /^[a-zA-Z0-9](\.?[a-zA-Z0-9]){4,}@gmail\.com$/;
    if (!gmailRegex.test(email)) {
      return res.status(400).json({
        message: "Only valid Gmail addresses are allowed",
      });
    }

    // Prevent + aliasing (optional but strong)
    if (email.includes("+")) {
      return res.status(400).json({
        message: "Gmail aliases using '+' are not allowed",
      });
    }

    /* ---------------- EXISTING USER CHECK ---------------- */
    const existing = await Patient.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    /* ---------------- PASSWORD VALIDATION ---------------- */
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character",
      });
    }

    /* ---------------- HASH PASSWORD ---------------- */
    const passwordHash = await bcrypt.hash(password, 10);

    /* ---------------- GENERATE OTP ---------------- */
    const otp = generateOTP();

    const otpToken = jwt.sign(
      {
        email,
        otp,
        name,
        dateOfBirth,
        passwordHash,
      },
      JWT_SECRET,
      { expiresIn: `${OTP_EXPIRY}s` }
    );

    /* ---------------- SEND OTP EMAIL ---------------- */
    await sendOTPEmail(email, otp);

    /* ---------------- RESPONSE ---------------- */
    res.status(200).json({
      message: "OTP sent to your Gmail. Please verify.",
      otpToken,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


/**
 * @route  POST /api/auth/verify-otp
 * @desc   Verify OTP and create account
 * @access Public
 */
const verifyOTPAndCreate = asyncHandler(async (req, res) => {
  const { otp, otpToken } = req.body;

  try {
    if (!otp || !otpToken) {
      return res.status(400).json({ message: "Please enter the OTP first" });
    }
    const decoded = jwt.verify(otpToken, JWT_SECRET);

    if (decoded.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Create patient in DB only now
    const patient = await Patient.create({
      name: decoded.name,
      dateOfBirth: decoded.dateOfBirth,
      email: decoded.email,
      password: decoded.passwordHash,
      verified: true,
    });

    // Generate access/refresh tokens
    const { accessToken, refreshToken } = generateTokens(
      patient._id,
      decoded.email,
      "patient"
    );

    res.json({
      message: "OTP verified and account created successfully",
      accessToken,
      refreshToken,
      userId: patient._id,
      name: patient.name,
      role: "patient",
    });
  } catch (err) {
   return res.status(500).json({ message: "Server error", error: err.message });
  }
});

/**
 * @route  POST /api/auth/resend-otp
 * @desc   Resend OTP
 * @access Public
 */
const resendOTP = asyncHandler(async (req, res) => {
  const { otpToken } = req.body;

  try {
    if (!otpToken) {
      return res.status(400).json({ message: "No OTP token provided" });
    }
    // Decode the old token to get the email
    const decoded = jwt.verify(otpToken, JWT_SECRET);
    const email = decoded.email;

    const patient = await Patient.findOne({ email });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Generate new OTP + token
    const otp = generateOTP();
    const newOtpToken = jwt.sign({ email, otp }, JWT_SECRET, {
      expiresIn: `${OTP_EXPIRY}s`,
    });

    await sendOTPEmail(email, otp);

    res.json({ otpToken: newOtpToken, message: "New OTP sent to email" });
  } catch (err) {
    return res.status(500).json({ message: "Invalid or expired OTP token" });
  }
});

/**
 * @route  POST /api/auth/refresh
 * @desc   Refresh access token using refresh token
 * @access Public
 */
//
const refreshTokenController = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: "No refresh token" });

  jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid refresh token" });
    const accessToken = jwt.sign(
      { id: decoded.id, email: decoded.email, role: decoded.role },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ accessToken });
  });
});

/**
 * @route  POST /api/auth/verify
 * @desc   Verify OTP code for password reset
 * @access Public
 */

const verifyOTP = asyncHandler(async(req,res)=>{
  const { otp, otpToken } = req.body;
  try{
    if(!otp || !otpToken){
      return res.status(400).json({message:"Please enter the OTP first"});
    }
    const decoded = jwt.verify(otpToken, JWT_SECRET);
    if (decoded.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    res.json({ message: "OTP verified. You may now reset your password.", email: decoded.email });
  }catch(err){
    return res.status(500).json({message:err.message});
  }
});

/**
 * @route   POST /api/auth/google
 * @desc    Login/Register with Google OAuth
 * @access  Public
 */
const googleAuth = asyncHandler(async (req, res) => {
  const { idToken, accessToken } = req.body;

  try {
    if (!idToken && !accessToken) {
      return res.status(400).json({ message: "Missing Google token" });
    }

    let googleData;

    if (idToken) {
      const response = await axios.get(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
      );
      googleData = response.data;
    } 
    else if (accessToken) {
      const response = await axios.get(
        `https://www.googleapis.com/oauth2/v3/userinfo`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      googleData = response.data;
    }

    // Check if we got valid email
    if (!googleData || !googleData.email) {
      return res.status(400).json({ message: "Invalid Google Token" });
    }

    let user = await Patient.findOne({ email: googleData.email });
    let isNewUser = false;

    if (!user) {
      // Creating user WITHOUT password or DOB (as you requested).
      user = await Patient.create({
        name: googleData.name,
        email: googleData.email,
        profileUrl: googleData.picture,
        verified: true 
      });
      isNewUser = true;
    }

    const { accessToken: newAccessToken, refreshToken } = generateTokens(
      user._id,
      user.email,
      "patient"
    );

    res.json({
      message: "Google login successful",
      accessToken: newAccessToken,
      refreshToken,
      userId: user._id,
      role: "patient",
      isNewUser
    });

  } catch (err) {
    console.error("Google Auth Backend Error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = {
  loginController,
  register,
  verifyOTPAndCreate,
  resendOTP,
  refreshTokenController,
  verifyOTP,
  googleAuth
};
