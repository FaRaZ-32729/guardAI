const express = require("express");
const authRoute = require("./authRoute")
const userRoute = require("./userRoute")

const router = express.Router();


router.use("/auth", authRoute)
router.use("/sutdent", userRoute)


module.exports = router;