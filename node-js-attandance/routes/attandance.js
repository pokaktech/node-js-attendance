const express = require("express");
const router = express.Router();
const {Attendance} = require("../models/employees");
const { Employee } = require("../models/employees");


router.post("/attendance", async (req, res) => {
    try {
        const { employeeName } = req.body; 
        const currentTime = new Date();

        const employee = await Employee.findOne({ Name: employeeName });

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        const formattedTime = `${currentTime.getHours()}:${String(currentTime.getMinutes()).padStart(2, '0')}:${String(currentTime.getSeconds()).padStart(2, '0')}`;

        const newAttendance = new Attendance({
            Name: employee.Name,
            userId: employee._id,
            checkInTime: formattedTime
        });

        await newAttendance.save();

        res.json(newAttendance);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.put("/attendance/:id", async (req, res) => {
    try {
        const attendanceId = req.params.id;
        const currentTime = new Date();

        // Find attendance record by ID
        const attendanceRecord = await Attendance.findById(attendanceId);

        if (!attendanceRecord) {
            return res.status(404).json({ message: "Attendance record not found" });
        }

     
        const formattedTime = `${currentTime.getHours()}:${String(currentTime.getMinutes())}:${String(currentTime.getSeconds())}`;
        attendanceRecord.checkOutTime = formattedTime;

        
        const checkInTimeString = attendanceRecord.checkInTime;
        const checkOutTimeString = attendanceRecord.checkOutTime;
        console.log(checkInTimeString,checkOutTimeString);
        if (!isValidTimeFormat(checkInTimeString) || !isValidTimeFormat(checkOutTimeString)) {
            return res.status(400).json({ message: "Invalid checkInTime or checkOutTime format" });
        }
      
        // Calculate working hours
        const workingHours = calculateWorkingHours(checkInTimeString, checkOutTimeString);

        // Assign the calculated working hours to the attendance record
        attendanceRecord.WorkingHours = workingHours;

        // Save the updated attendance record
        await attendanceRecord.save();

        res.json(attendanceRecord);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
function isValidTimeFormat(timeString) {
    return /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.test(timeString);
}


function isValidTimeString(timeString) {
    return /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.test(timeString);
}


function calculateWorkingHours(checkInTimeString, checkOutTimeString) {
    const checkInTime = parseTimeString(checkInTimeString);
    const checkOutTime = parseTimeString(checkOutTimeString);
    const timeDifference = checkOutTime - checkInTime;

   
    const hours = Math.floor(timeDifference / (1000 * 60 * 60));
    const remainingTime = timeDifference % (1000 * 60 * 60);
    const minutes = Math.floor(remainingTime / (1000 * 60));
    const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

  
    const formattedWorkingHours = `${hours} hr ${minutes} minutes ${seconds} seconds`;

    return formattedWorkingHours;
}


function parseTimeString(timeString) {
    const [hours, minutes, seconds] = timeString.split(":").map(Number);
    return hours * 3600000 + minutes * 60000 + seconds * 1000;
}
router.get("/attendance", async (req, res) => {
    try {
        const attendanceRecords = await Attendance.find();
        res.json(attendanceRecords);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


router.get("/attendance/:id", async (req, res) => {
    try {
        const attendanceId = req.params.id;
        const attendanceRecord = await Attendance.findById(attendanceId);

        if (!attendanceRecord) {
            return res.status(404).json({ message: "Attendance record not found" });
        }

        res.json(attendanceRecord);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


router.delete("/attendance/:id", async (req, res) => {
    try {
        const attendanceId = req.params.id;
        const deletedAttendance = await Attendance.findByIdAndDelete(attendanceId);

        if (!deletedAttendance) {
            return res.status(404).json({ message: "Attendance record not found" });
        }

        res.json({ message: "Attendance record deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


module.exports = router;
