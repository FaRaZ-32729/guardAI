const express = require("express");
const { registerStudent } = require("../controllers/userController");

const router = express.Router();

router.post("/register", registerStudent);

module.exports = router;