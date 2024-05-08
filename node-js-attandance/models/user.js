const mongoose = require("mongoose");

// Define the user schema
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true // username is required
    },
    password: {
        type: String,
        required: true // password is required
    },
    isAdmin: {
        type: Boolean,
        default: false // Default value is false for regular users
    },
    email: {
        type: String,
        required: true, // email is required
        unique: true // email should be unique
    },
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee' // Reference to the Employee model
    },
    otp:{
        type:Number
    },
    newPassword:{
        type:String
    },
    passwordResetOTPIssuedAt:{
        type:Date,
    },
    confirmPassword:{
        type:String
    },
    Designation: {
        type: String,
        required: true // Designation is required
    },
    ConfirmPassword: {
        type: String,
        required: true // ConfirmPassword is required
    },
    passwordChangedAt:Date,
    passwordResetToken:String,
    passwordResetTokenExpires:Date
});

// Create a model from the user schema
const User = mongoose.model('User', userSchema);

module.exports = User;
