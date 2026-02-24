const express = require("express");
const { registerStudent, getAllStudents, getSingleStudent, updateStudent, deleteStudent } = require("../controllers/userController");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post(
    "/register",
    upload.single("face"),
    registerStudent
);
router.get("/all", getAllStudents);
router.get("/single/:id", getSingleStudent);
router.put("/update/:id", upload.single("face"), updateStudent);
router.delete("/delete/:id", deleteStudent);


module.exports = router;