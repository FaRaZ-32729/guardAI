const express = require("express");
const { registerStudent } = require("../controllers/userController");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post(
    "/register",
    upload.array("face", 5),
    registerStudent
);

module.exports = router;