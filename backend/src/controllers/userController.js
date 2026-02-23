const userModel = require("../models/userModel");

// Register Student

const registerStudent = async (req, res) => {
    try {
        const { name, email, studentRollNumber, parentsEmail, department } = req.body;

        // Basic validation
        if (!name || !email || !studentRollNumber || !parentsEmail || !department) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Validate uploaded images
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "At least one face image is required" });
        }

        // Check duplicate
        const existing = await userModel.findOne({
            $or: [{ email }, { studentRollNumber }]
        });

        if (existing) {
            return res.status(400).json({ message: "Student already exists" });
        }

        // Convert files to URLs
        const faceUrls = req.files.map(file => {
            return `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;
        });

        // Create student
        const student = new userModel({
            name,
            email,
            studentRollNumber,
            parentsEmail,
            face: faceUrls,
            department,
            role: "student"
        });

        await student.save();

        return res.status(201).json({
            message: "Student registered successfully",
            student
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message || "Server error" });
    }
};


module.exports = {
    registerStudent
}