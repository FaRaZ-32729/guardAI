const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        unique: true
    },
    password: {
        type: String
    },
    studentRollNumber: {
        type: String,
        trim: true
    },
    parentsEmail: {
        type: String,
        lowercase: true,
        trim: true
    },
    face: [
        {
            type: String // store image URLs
        }
    ],
    department: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ['admin', 'student'],
        required: true,
        default: 'student'
    }
}, { timestamps: true });

// Pre-save hook to enforce role-based required fields
userSchema.pre('save', function (next) {
    if (this.role === 'admin') {
        if (!this.name || !this.email || !this.password) {
            return next(new Error('Admin must have name, email, and password'));
        }
        // Remove fields that admin should not have
        this.studentRollNumber = undefined;
        this.parentsEmail = undefined;
        this.face = undefined;
        this.department = undefined;
    } else if (this.role === 'student') {
        if (!this.name || !this.email || !this.studentRollNumber || !this.parentsEmail || !this.face || !this.department) {
            return next(new Error('Student must have all fields except password'));
        }
        // Remove password if present for student
        this.password = undefined;
    }
    next();
});

const userModel = mongoose.model('User', userSchema);

module.exports = userModel;