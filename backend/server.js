const express = require("express");
require("dotenv").config();
const dbConfig = require("./src/config/dbConfig");
const centralRoute = require("./src/routes/centralRoute");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { startCameraCaptureService } = require("./src/service/cameraCaptureService");


dbConfig();
const port = process.env.PORT || 5051;
const app = express();

// Middlewares
const allowedOrigins = [
    "http://localhost:5173"
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));


app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use('/captures', express.static(path.join(__dirname, 'public', 'captures')));



// Routes
app.use("/api", centralRoute)

// startCameraCaptureService();
 // Load face recognition models
    await initFaceModels();
    
    // Start camera service
    startCameraCaptureService();

app.get("/", (req, res) => {
    res.send("Hellow FaRaZ to IOTFIY-LuckyOne");
});





// Start server
app.listen(port, () => {
    console.log(`AI-Guard Server is running on port : ${port}`);
})