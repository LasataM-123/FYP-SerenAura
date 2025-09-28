require('dotenv').config();
const express = require('express');
const errorHandler = require('./middlewares/errorHandler');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const app = express();
const morgan = require("morgan");
app.use(morgan("dev"));
const port = process.env.PORT || 5000;
connectDB();

app.listen(port , () => {
    console.log(`Server is running on port ${port}`);
})