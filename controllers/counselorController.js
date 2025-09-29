const Counselor = require('../models/counselorModel');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');

const deleteUploadedFile = async (file) => {
    if (!file || !file.path) return;
    try {
        const publicId = file.filename || file.path.split('/').pop().split('.')[0]; // Extract public ID
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error("Error deleting uploaded file from Cloudinary:", error);
    }
};


//@ROUTE /create
//@DESC Create counselor account
//@ACCESS Public
const createCounselor=asyncHandler(async(req, res) => {
    try{
        const { name, email, password, dateOfBirth, experience, speciality } = req.body;
        if(!name || !email || !password || !dateOfBirth || !experience || !speciality){
             await deleteUploadedFile(req.file);
            return res.status(400).json({ error: "Please fill all fields" });
        }
        const existingPatient = await Counselor.findOne({ email });
        if(existingPatient){
            res.status(400).json({ message: 'Patient already exists' });
        }
        // Regex: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special character
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

        if (!passwordRegex.test(password)) {
        return res.status(400).json({
            message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        });
        }
         if (!req.file) {
            return res.status(400).json({ error: "Profile image is required" });
        }

        const profileUrl = req.file.path;

        const hashedPassword = await bcrypt.hash(password, 10);
        const counselor = await Counselor.create({
            name,
            email,
            password: hashedPassword,
            dateOfBirth,
            experience,
            speciality,
            profileUrl
        });
        res.status(201).json({counselor ,message:"Counselor created successfully"});
    }catch(e){
        res.status(500).json({ message: e.message });
    }
});
module.exports = { createCounselor };