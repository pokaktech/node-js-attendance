const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const session = require('express-session');
const { Employee } = require('./models/employees');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const attandance=require('./routes/attandance');
const employee=require('./routes/employees');
const user=require('./routes/user');
const report =require('./routes/employeereport');

const app = express();
app.use(express.json());
app.use(cors());
app.use("",report);
app.use("",user);
app.use("",employee);
app.use("",attandance);

const mongoURI = "mongodb://localhost:27017/User";

const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

mongoose.connect(mongoURI, options)
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    });


let globalReq;
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

app.use((req, res, next) => {
  
    globalReq = req;

    if (req.session && req.session.userId) {
        Employee.findByIdAndUpdate(req.session.userId, { lastActivity: Date.now() })
            .then(employee => {
                if (employee) {
                    console.log('Last activity updated for user:', employee._id);
                } else {
                    console.log('Employee not found for user:', req.session.userId);
                }
            })
            .catch(error => console.error('Error updating last activity:', error));
    }
    next();
});

// Function to check for idle sessions and logout
function checkIdleSessions() {
    const idleThreshold = 15 * 60 * 1000; 

    if (globalReq && globalReq.sessionStore && globalReq.sessionStore.sessions) {
        Object.keys(globalReq.sessionStore.sessions).forEach(sessionId => {
            const session = JSON.parse(globalReq.sessionStore.sessions[sessionId]);
            const lastActivity = session.lastActivity || 0;

            if (Date.now() - lastActivity > idleThreshold) {
                delete session.userId;
                console.log(`User ${session.userId} is idle. Logged out.`);
            }
        });
    }
}

app.post("/employee-login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const employee = await Employee.findOne({ email });
        if (!employee) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

      
        const isPasswordValid = await bcrypt.compare(password, employee.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        req.session.userId = employee._id;

        const token = jwt.sign({ userId: employee._id }, 'your_secret_key', { expiresIn: '1h' });

        const { _id, username, Name, Position, Department } = employee;
        res.status(200).json({ 
            message: "Login successful",
            employee: { _id, username, Name, Position, Department },
            token: token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


app.post("/employee-logout", (req, res) => {
    console.log(req.session.userId);
    delete req.session.userId;
    res.status(200).json({ message: "Logout successful" });
});


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    const idleCheckInterval = 5 * 60 * 1000; 
    console.log(idleCheckInterval);
    setInterval(checkIdleSessions, idleCheckInterval);
});
