require('dotenv').config();
const express = require('express');
const errorHandler = require('./middlewares/errorHandler');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const app = express();
const morgan = require("morgan");
const {connection} = require('./config/dbConfig');
connection();
app.use(cors({
    origin: true,
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use('/api/auth',require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/counselors', require('./routes/counselorRoutes'));
app.use('/api/onboarding', require('./routes/onboardingRoutes'));
app.use('/api/meditation',require('./routes/meditationRoutes'));
app.use('/api/music',require('./routes/musicRoutes'));
app.use('/api/media',require('./routes/mediaRoutes'));
app.use(errorHandler);
const port = process.env.PORT || 5000;

app.listen(port , () => {
    console.log(`Server is running on port ${port}`);
})