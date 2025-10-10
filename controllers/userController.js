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

//@ROUTE POST /register
//@DESC Register patient
//@ACCESS Public
const register = asyncHandler(async (req, res) => {
  try {
    const { name, dateOfBirth, email, password } = req.body;

    // Check all fields are provided
    if (!name || !dateOfBirth || !email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    // Validate date format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateOfBirth)) {
      return res.status(400).json({ message: "Date of Birth must be in YYYY-MM-DD format" });
    }

    // Split into parts
    const [yearStr, monthStr, dayStr] = dateOfBirth.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    // Check month
    if (month < 1 || month > 12) {
      return res.status(400).json({ message: "Month must be between 01 and 12" });
    }

    // Days per month (handle leap year for February)
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

    // Check if user already exists
    const existing = await Patient.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate password
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    //  Generate OTP
    const otp = generateOTP();

    //  Create OTP token (user info not saved yet)
    const otpToken = jwt.sign(
      { email, otp, name, dateOfBirth, passwordHash },
      JWT_SECRET,
      { expiresIn: `${OTP_EXPIRY}s` }
    );

    // Send OTP email
    await sendOTPEmail(email, otp);

    //  Respond with OTP token
    res.json({ otpToken, message: "OTP sent to email. Please verify." });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});



//@ROUTE POST /verify-otp
//@DESC Verify OTP and create account
//@ACCESS Public
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
    res.status(400).json({ message: "OTP expired or invalid" });
  }
});

//@ROUTE POST /resend-otp/:otpToken
//@DESC Resend OTP
//@ACCESS Public
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

//@route DELETE /users/delete-account
//@desc Delete unverified account after OTP expiry
//@access Public
const deleteAccount =asyncHandler( async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

   await Patient.findOneAndDelete({ email: decoded.email });


    return res.json({ message: "Account deleted due to OTP expiry" });
  } catch (err) {
    return res.status(400).json({ message: "Invalid token" });
  }
});

//@route POST /users/forgot-password
//@desc Enter email of user to send OTP code
//@access public
const forgotPassword = asyncHandler(async(req,res)=>{
  try{
    const {email} = req.body;
    if(!email){
      return res.status(400).json({message:"Please enter your email"});
    }
    let user = await Patient.findOne({email});
    if(!user){
      user = await Counselor.findOne({email});
    }
    if(!user) return res.status(400).json({message:"Please enter a valid email of your SerenAura account"});
    const otp = generateOTP();

    // Put user info in token 
    const otpToken = jwt.sign(
      { email, otp },
      JWT_SECRET,
      { expiresIn: `${OTP_EXPIRY}s` }
    );

    await sendOTPEmail(email, otp);
    res.json({ otpToken, message: "OTP sent to email. Please verify." });

  }catch(err){
    return res.status(400).json({message:err.message});
  }
})

//@route POST /users/verify
//@desc Verify OTP code for password reset
//@access public
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
    return res.status(400).json({message:err.message});
  }
});

//@route POST /users/reset-password
//@desc Reset password after OTP verification
//@access public
const resetPassword = asyncHandler(async(req,res)=>{
  try{
    const { email, newPassword, confirmPassword } = req.body;
    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Please fill all fields" });
    }
    if(newPassword !== confirmPassword){
      return res.status(400).json({message:"Passwords do not match"});
    }
    const user = await Patient.findOne({ email });
    if (!user) {
     user = await Counselor.findOne({ email });
    }
    if(!user) return res.status(400).json({message:"User not found"});

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"});
    }
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ success: "Password reset successful" });
  }catch(err){
    return res.status(400).json({message:err.message});
  }
});

// @route /users/add-dob
// @desc Add date of birth for patients registered via Google
// @access private
const addDOB = asyncHandler(async (req, res) => {
  try{
    const { dateOfBirth } = req.body;
    if(!dateOfBirth){
      return res.status(400).json({message:"Please provide your date of birth"});
    }
    // Validate date format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateOfBirth)) {
      return res.status(400).json({ message: "Date of Birth must be in YYYY-MM-DD format" });
    }

    // Split into parts
    const [yearStr, monthStr, dayStr] = dateOfBirth.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    // Check month
    if (month < 1 || month > 12) {
      return res.status(400).json({ message: "Month must be between 01 and 12" });
    }

    // Days per month (handle leap year for February)
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
    const patient = await Patient.findById(req.user.id);
    if(!patient) return res.status(404).json({message:"Patient not found"});
    patient.dateOfBirth = dateOfBirth;
    await patient.save();
    return res.status(200).json({success:"Date of birth added successfully", patient});
  }catch(err){
    return res.status(400).json({message:err.message});
  }
});

// @route /users/auth/google
// @desc Login/Register with Google OAuth
// @access Public
const googleAuth = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  try{
    if(!idToken){
      return res.status(400).json({message:"Missing id token"});
    }
    const {data:googleData} = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    )

    //Check if the user exists otherwise create a new one
    let user = await Patient.findOne({email:googleData.email});
    let isNewUser = false;
    if(!user){
      user = await Patient.create({
        name: googleData.name,
        email: googleData.email,
        profileUrl: googleData.picture
      });
      isNewUser = true;
    }
     const { accessToken, refreshToken } = generateTokens(
      user._id,
      user.email,
      "patient"
    );

    res.json({
      message: "OTP verified and account created successfully",
      accessToken,
      refreshToken,
      userId: user._id,
      role: "patient",
      isNewUser
    });

  }catch(err){
    return res.status(400).json({message:err.message})
  }
});
module.exports = {
  loginController,
  register,
  verifyOTPAndCreate,
  resendOTP,
  refreshTokenController,
  deleteAccount,
  forgotPassword,
  verifyOTP,
  resetPassword,
  addDOB,
  googleAuth
};

