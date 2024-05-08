const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const attendanceSchema = new mongoose.Schema({
    Name: {
        type: String,
        ref: 'Employee'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    },
    checkInTime: {
        type: String,
        validate: {
            validator: function(v) {
               
                return /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.test(v);
            },
            message: props => `${props.value} is not a valid time for check in`
        }
    },
    checkOutTime: {
        type: String, 
        validate: {
            validator: function(v) {
               
                return /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.test(v);
            },
            message: props => `${props.value} is not a valid time for check out`
        }
    },
    WorkingHours: {
        type:String,
    }
}, { timestamps: true }); // Enable timestamps to automatically record createdAt and updatedAt fields

const Attendance = mongoose.model("Attendance", attendanceSchema);

const employeeSchema = new mongoose.Schema({
    Name: {
        type: String,
    },
    Department: {
        type: String,
    },
    Position: {
        type: String,
    },
    Salary: {
        type: String,
    },
    JoiningDate: {
        type: String
    },
    Project: {
        type: String
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    email:{
        type:String
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    attendance: [attendanceSchema],
    lastActivity: {
        type: Date,
        default: Date.now
    }
});

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = { Employee, Attendance };
