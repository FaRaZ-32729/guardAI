const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");

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

// LOGIN ADMIN
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Find admin only
        const admin = await userModel.findOne({ email, role: 'admin' });

        if (!admin) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate JWT
        const token = jwt.sign(
            { _id: admin._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Save token in HTTP-only cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: false, // true in production (HTTPS)
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(200).json({
            message: "Login successful",
            user: admin
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

// logout user 
const logoutUser = async (req, res) => {
    try {
        res.clearCookie("token", { httpOnly: true, sameSite: "none", path: "/", secure: true });
        return res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        console.error("Error in logout:", error);
        return res.status(500).json({ success: false, message: "Logout failed" });
    }
};

const me = async (req, res) => {
    try {
        return res.status(200).json({
            message: "Welcome",
            user: req.user
        });
    } catch (error) {
        console.log("error while fetching authanticated user");
        return res.status(500).json({ message: "Server Error" });
    }
};

module.exports = {
    registerAdmin,
    login,
    me,
    logoutUser
}