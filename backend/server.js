const express = require("express");
const dotenv = require("dotenv");
const dbConnection = require("./src/config/dbConnection");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const http = require("http");


dotenv.config();
dbConnection();
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



// Routes


app.get("/", (req, res) => {
    res.send("Hellow FaRaZ to IOTFIY-LuckyOne");
});





// Start server
app.listen(port, () => {
    console.log(`Express & WebSocket is running on port : ${port}`);
})