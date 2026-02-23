const userModel = require("../models/userModel");

// Register Student
const registerStudent = async (req, res) => {
    try {
        const { name, email, studentRollNumber, parentsEmail, face, department } = req.body;

        if (!name || !email || !studentRollNumber || !parentsEmail || !face || !department) {
            return res.status(404).json({ message: "All fields are required" })
        }

        // Check if student already exists
        let existing = await userModel.findOne({ $or: [{ email }, { studentRollNumber }] });
        if (existing) return res.status(400).json({ message: 'Student already exists' });

        // Create student
        const student = new userModel({
            name,
            email,
            studentRollNumber,
            parentsEmail,
            face,
            department,
            role: 'student'
        });

        await student.save();
        return res.status(201).json({ message: 'Student registered successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
};


module.exports = {
    registerStudent
}