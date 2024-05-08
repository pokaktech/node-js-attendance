const express = require("express");
const router = express.Router();
const { Employee, Attendance } = require("../models/employees");


function calculateTotalWorkingHours(attendanceRecords) {
    let totalWorkingHours = 0;
    for (const record of attendanceRecords) {
        if (record.checkInTime && record.checkOutTime) {
            const checkIn = getTimeFromString(record.checkInTime);
            const checkOut = getTimeFromString(record.checkOutTime);
            const diff = (checkOut - checkIn) / (1000 * 60 * 60); 
            totalWorkingHours += diff;
        }
    }
    return totalWorkingHours;
}

// Function to convert time string to Date object
function getTimeFromString(timeString) {
    const [hours, minutes, seconds] = timeString.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds), 0);
    return date;
}

router.get("/monthly-report", async (req, res) => {
    try {
        const { Name } = req.query;
        const currentDate = new Date();
        const month = currentDate.getMonth() + 1; 
        const year = currentDate.getFullYear();

        const employee = await Employee.findOne({ Name });
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        // Count check-ins and check-outs for the current month
        const checkInCount = await Attendance.countDocuments({ Name, checkInTime: { $exists: true }});
        const checkOutCount = await Attendance.countDocuments({ Name, checkOutTime: { $exists: true } });

        // Calculate total days in the month
        const totalDays = new Date(year, month, 0).getDate();

        // Calculate percentages
        const checkInPercentage = (checkInCount / (totalDays * 2)) * 100; // Assuming 2 check-ins per day
        const checkOutPercentage = (checkOutCount / (totalDays * 2)) * 100; // Assuming 2 check-outs per day
        const workPercentage = (checkInPercentage + checkOutPercentage) / 2; // Average of check-in and check-out percentages

        // Prepare the monthly report
        const monthlyReport = {
            username: employee.username,
            Position: employee.Position,
            Department: employee.Department,
            Name: Name,
            email: employee.email,
            month: month,
            year: year,
            checkInCount: checkInCount,
            checkOutCount: checkOutCount,
            checkInPercentage: checkInPercentage.toFixed(2) + "%",
            checkOutPercentage: checkOutPercentage.toFixed(2) + "%",
            workPercentage: workPercentage.toFixed(2) + "%",
           
        };

        res.status(200).json({ monthlyReport });
    } catch (error) {
        console.error("Error generating monthly report:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get("/weekly-report", async (req, res) => {
    try {
        const { Name } = req.query;
        const currentDate = new Date();
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay());
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + (6 - currentDate.getDay()));

        
        const employee = await Employee.findOne({ Name });
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

       
        const checkInCount = await Attendance.countDocuments({ Name, checkInTime: { $exists: true }, createdAt: { $gte: startDate, $lte: endDate } });
        const checkOutCount = await Attendance.countDocuments({ Name, checkOutTime: { $exists: true }, createdAt: { $gte: startDate, $lte: endDate } });

        const totalDays = 7;

     
        const checkInPercentage = (checkInCount / totalDays) * 100;
        const checkOutPercentage = (checkOutCount / totalDays) * 100;

      
        const weeklyReport = {
            username: employee.username,
            Position: employee.Position,
            Department: employee.Department,
            Name: Name,
            email: employee.email,
            week: startDate,
            year: endDate.getFullYear(),
            checkInCount: checkInCount,
            checkOutCount: checkOutCount,
            checkInPercentage: checkInPercentage.toFixed(2) + "%",
            checkOutPercentage: checkOutPercentage.toFixed(2) + "%"
          
        };

        res.status(200).json({ weeklyReport });
    } catch (error) {
        console.error("Error generating weekly report:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


module.exports = router;
