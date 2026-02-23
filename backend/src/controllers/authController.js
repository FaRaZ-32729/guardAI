const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');

// Register Admin
const registerAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(404).json({ message: "All fields are required" });
        }

        // Check if admin already exists
        let existing = await userModel.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Admin already exists' });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create admin
        const admin = new userModel({
            name,
            email,
            password: hashedPassword,
            role: 'admin'
        });

        await admin.save();
        return res.status(201).json({ message: 'Admin registered successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    registerAdmin
}