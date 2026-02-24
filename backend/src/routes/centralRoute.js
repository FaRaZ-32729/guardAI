const express = require("express");
const authRoute = require("./authRoute")
const userRoute = require("./userRoute")
const camRoute = require("./cameraRoute")

const router = express.Router();


router.use("/auth", authRoute);
router.use("/student", userRoute);
router.use("/camera", camRoute);


module.exports = router;