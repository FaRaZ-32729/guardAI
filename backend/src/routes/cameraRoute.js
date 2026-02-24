const express = require("express");
const { registerCam, getAllCam, getSingleCam, updateCam, deleteCam } = require("../controllers/cameraController");
const router = express.Router();


router.post("/add", registerCam);
router.get("/all", getAllCam);
router.get("/single/:id", getSingleCam);
router.put("/update/:id", updateCam);
router.delete("/delete/:id", deleteCam);

module.exports = router