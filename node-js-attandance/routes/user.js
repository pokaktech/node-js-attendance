const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/user");
const Employee = require("../models/employees"); 
const crypto = require("crypto");
const axios = require('axios');
const jwt=require("jsonwebtoken")
const nodemailer = require("nodemailer");
const twilio = require('twilio');
const twilioClient = twilio('AC10ed20dae4ea30f63276d2da75666f02', '075099c149eadcc8ba0ec28e2bd6aba6');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// Route for user registration
router.post("/register", async (req, res) => {
    try {
        const { username, email, password, ConfirmPassword, Designation } = req.body;
        
        // Check if password and confirm password match
        if (password !== ConfirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        const hashPassword = await bcrypt.hash(ConfirmPassword, 10);

        // Check if the email is already registered
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        // Create a new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            ConfirmPassword:hashPassword,
            Designation
        });

        // Save the user to the database
        await newUser.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;

        // Generate a random 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000);

        // Save the OTP to the user's document in the database
        await User.findOneAndUpdate({ email }, {
            $set: {
                passwordResetOTP: otp,
                passwordResetOTPIssuedAt: Date.now() // Record when the OTP was issued
            }
        });

        // Send the OTP via SMS using Twilio
        await twilioClient.messages.create({
            body: `Your OTP for password reset is: ${otp}`,
            to: '+916238519397', // Replace with the user's phone number
            from: '+13132283991' // Your Twilio phone number
        });

        res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).json({ message: "Failed to send OTP" });
    }
});
// Assuming you have a global array to store blacklisted tokens
const blacklistedTokens = [];

router.post("/logout", (req, res) => {
    // Retrieve the token from the request
    const token = req.headers.authorization;

    // Add the token to the blacklist
    blacklistedTokens.push(token);

    // Respond with a success message
    res.status(200).json({ message: "Logout successful" });
});

// Middleware to check if the token is blacklisted
const checkTokenBlacklist = (req, res, next) => {
    // Retrieve the token from the request
    const token = req.headers.authorization;

    // Check if the token is in the blacklist
    if (blacklistedTokens.includes(token)) {
        return res.status(401).json({ message: "Token is blacklisted" });
    }

   
    next();
};

const isAdminAuthenticated = (req, res, next) => {
    // Check if the user is authenticated and is an admin
    if (req.user && req.user.isAdmin) {
        // User is an admin, proceed to the next middleware or route handler
        next();
    } else {
        // User is not an admin, respond with an unauthorized status
        res.status(401).json({ message: "Unauthorized" });
    }
};


router.post("/admin-logout", isAdminAuthenticated, (req, res) => {
    try {
        
        req.user = null;

        
        
        res.status(200).json({ message: "Admin logout successful" });
    } catch (error) {
        console.error("Error during admin logout:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get("/protected-route", checkTokenBlacklist, (req, res) => {
    res.status(200).json({ message: "Protected route accessed successfully" });
});

router.post("/reset-password", async (req, res) => {
    try {
        const { email, otp: otpString, newPassword, confirmPassword } = req.body;
        const otp = parseInt(otpString);
        console.log(otp);
        
        // Find the user by email
        const user = await User.findOne({ email });
        console.log(user);
        // Check if user exists
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        
       
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

       
        user.password = hashedPassword;
        user.otp = otp;
        user.passwordResetOTPIssuedAt = Date.now();
        await user.save();

        res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ message: "Failed to reset password" });
    }
});

router.post('/admin-login', async (req, res) => {
    try {
        const { email, password } = req.body;

    
        const user = await Employee.findOne({ email });
       console.log(user);
      
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or not an admin' });
        }

       
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(isMatch);
        console.log(password,user.password)
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        // If authentication succeeds, return a success response
        res.status(200).json({ message: 'Admin login successful', user, isAdmin: true });
    } catch (error) {
        console.error('Error during admin login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Check if the user with the given email exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
  
      // Compare the provided password with the hashed password stored in the database
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
  
      // If email and password are correct, create a JWT token
      const token = jwt.sign({ userId: user._id }, "your_secret_key");
  
      res.status(200).json({ token });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });


module.exports = router;
